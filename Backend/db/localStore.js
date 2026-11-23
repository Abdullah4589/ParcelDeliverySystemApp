const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const DATA_DIR = path.join(__dirname, "../data");
const DB_FILE = path.join(DATA_DIR, "local-db.json");

function generateObjectId() {
  return crypto.randomBytes(12).toString("hex");
}

function generateTrackingNumber() {
  const year = new Date().getFullYear();
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let suffix = "";
  for (let i = 0; i < 6; i++) {
    suffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `SND-${year}-${suffix}`;
}

function loadStore() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, "utf8");
      const parsed = JSON.parse(raw);
      return {
        users: parsed.users || [],
        parcels: parsed.parcels || [],
        activitylogs: parsed.activitylogs || [],
        settings: parsed.settings || [],
      };
    }
  } catch (err) {
    console.warn("Could not read local-db.json, starting fresh:", err.message);
  }
  return { users: [], parcels: [], activitylogs: [], settings: [] };
}

let state = loadStore();

function persistStore() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2), "utf8");
  } catch (err) {
    console.error("Failed to persist local-db.json:", err.message);
  }
}

function getByPath(obj, dotPath) {
  return dotPath.split(".").reduce((acc, k) => (acc == null ? undefined : acc[k]), obj);
}

function matchesQuery(doc, query = {}) {
  if (!query || Object.keys(query).length === 0) return true;
  for (const [key, cond] of Object.entries(query)) {
    if (key === "$or" && Array.isArray(cond)) {
      if (!cond.some((sub) => matchesQuery(doc, sub))) return false;
      continue;
    }
    if (key === "$and" && Array.isArray(cond)) {
      if (!cond.every((sub) => matchesQuery(doc, sub))) return false;
      continue;
    }
    const val = getByPath(doc, key);
    if (cond instanceof RegExp) {
      if (!cond.test(String(val ?? ""))) return false;
    } else if (cond && typeof cond === "object" && !Array.isArray(cond)) {
      if (cond.$regex !== undefined) {
        const re =
          cond.$regex instanceof RegExp
            ? cond.$regex
            : new RegExp(cond.$regex, cond.$options || "");
        if (!re.test(String(val ?? ""))) return false;
      } else if (Array.isArray(cond.$in)) {
        if (!cond.$in.map(String).includes(String(val))) return false;
      } else {
        if (JSON.stringify(val) !== JSON.stringify(cond)) return false;
      }
    } else {
      if (String(val) !== String(cond)) return false;
    }
  }
  return true;
}

function applyUpdate(doc, update) {
  const next = JSON.parse(JSON.stringify(doc));
  const hasOperator = Object.keys(update).some((k) => k.startsWith("$"));

  if (!hasOperator) {
    Object.assign(next, update);
  } else {
    if (update.$set) {
      for (const [k, v] of Object.entries(update.$set)) {
        next[k] = v;
      }
    }
    if (update.$setOnInsert) {
      // handled on insert only
    }
    if (update.$push) {
      for (const [k, v] of Object.entries(update.$push)) {
        if (!Array.isArray(next[k])) next[k] = [];
        const item =
          v && typeof v === "object" && !v._id
            ? { _id: generateObjectId(), ...v }
            : v;
        next[k].push(item);
      }
    }
    if (update.$pull) {
      for (const [k, criteria] of Object.entries(update.$pull)) {
        if (Array.isArray(next[k])) {
          next[k] = next[k].filter((item) => !matchesQuery(item, criteria));
        }
      }
    }
  }
  next.updatedAt = new Date().toISOString();
  return next;
}

function wrapDoc(collectionName, rawDoc, applyDefaults) {
  if (!rawDoc) return null;
  const clone = JSON.parse(JSON.stringify(rawDoc));
  Object.defineProperty(clone, "_doc", {
    get() {
      return clone;
    },
    enumerable: false,
  });
  Object.defineProperty(clone, "save", {
    value: async function () {
      const now = new Date().toISOString();
      const toSave = JSON.parse(JSON.stringify(clone));
      if (!toSave._id) toSave._id = generateObjectId();
      if (!toSave.createdAt) toSave.createdAt = now;
      toSave.updatedAt = now;
      const prepared = applyDefaults ? applyDefaults(toSave) : toSave;
      const list = state[collectionName];
      const idx = list.findIndex((item) => String(item._id) === String(prepared._id));
      if (idx >= 0) list[idx] = prepared;
      else list.push(prepared);
      persistStore();
      return wrapDoc(collectionName, prepared, applyDefaults);
    },
    enumerable: false,
  });
  return clone;
}

function makeQuery(execFn) {
  let sortSpec = null;
  let limitCount = null;
  let selectFields = null;

  const q = {
    sort(spec) {
      sortSpec = spec;
      return q;
    },
    limit(n) {
      limitCount = n;
      return q;
    },
    select(fields) {
      selectFields = fields;
      return q;
    },
    async exec() {
      let result = await execFn();
      const applySelect = (doc) => {
        if (!doc || !selectFields) return doc;
        const copy = JSON.parse(JSON.stringify(doc));
        if (typeof selectFields === "string" && selectFields.includes("-password")) {
          delete copy.password;
        }
        return copy;
      };

      if (Array.isArray(result)) {
        let arr = [...result];
        if (sortSpec) {
          const [field, dir] = Object.entries(sortSpec)[0];
          arr.sort((a, b) => {
            const av = a[field] ?? "";
            const bv = b[field] ?? "";
            if (av === bv) return 0;
            return (av > bv ? 1 : -1) * (dir >= 0 ? 1 : -1);
          });
        }
        if (limitCount !== null) {
          arr = arr.slice(0, limitCount);
        }
        return arr.map(applySelect);
      }
      return applySelect(result);
    },
    then(resolve, reject) {
      return q.exec().then(resolve, reject);
    },
  };
  return q;
}

function createLocalModel(collectionName, applyDefaults) {
  function Model(doc = {}) {
    return wrapDoc(collectionName, doc, applyDefaults);
  }

  Model.find = (query = {}) =>
    makeQuery(async () =>
      state[collectionName]
        .filter((doc) => matchesQuery(doc, query))
        .map((doc) => wrapDoc(collectionName, doc, applyDefaults))
    );

  Model.findOne = (query = {}) =>
    makeQuery(async () => {
      const found = state[collectionName].find((doc) => matchesQuery(doc, query));
      return found ? wrapDoc(collectionName, found, applyDefaults) : null;
    });

  Model.findById = (id) =>
    makeQuery(async () => {
      const found = state[collectionName].find((doc) => String(doc._id) === String(id));
      return found ? wrapDoc(collectionName, found, applyDefaults) : null;
    });

  Model.create = async (doc) => {
    const instance = Model(doc);
    return instance.save();
  };

  Model.insertMany = async (docs) => {
    const saved = [];
    for (const d of docs) {
      saved.push(await Model.create(d));
    }
    return saved;
  };

  Model.countDocuments = async (query = {}) =>
    state[collectionName].filter((doc) => matchesQuery(doc, query)).length;

  Model.findByIdAndUpdate = (id, update) =>
    makeQuery(async () => {
      const list = state[collectionName];
      const idx = list.findIndex((doc) => String(doc._id) === String(id));
      if (idx < 0) return null;
      list[idx] = applyUpdate(list[idx], update);
      persistStore();
      return wrapDoc(collectionName, list[idx], applyDefaults);
    });

  Model.findOneAndUpdate = (query, update, opts = {}) =>
    makeQuery(async () => {
      const list = state[collectionName];
      const idx = list.findIndex((doc) => matchesQuery(doc, query));
      if (idx >= 0) {
        list[idx] = applyUpdate(list[idx], update);
        persistStore();
        return wrapDoc(collectionName, list[idx], applyDefaults);
      }
      if (opts.upsert) {
        const base = {
          ...query,
          ...(update.$setOnInsert || {}),
          ...(update.$set || {}),
        };
        if (!Object.keys(update).some((k) => k.startsWith("$"))) {
          Object.assign(base, update);
        }
        return Model.create(base);
      }
      return null;
    });

  Model.updateMany = async (query, update) => {
    let modifiedCount = 0;
    const list = state[collectionName];
    for (let i = 0; i < list.length; i++) {
      if (matchesQuery(list[i], query)) {
        list[i] = applyUpdate(list[i], update);
        modifiedCount++;
      }
    }
    if (modifiedCount > 0) persistStore();
    return { modifiedCount };
  };

  Model.findByIdAndDelete = async (id) => {
    const list = state[collectionName];
    const idx = list.findIndex((doc) => String(doc._id) === String(id));
    if (idx < 0) return null;
    const [removed] = list.splice(idx, 1);
    persistStore();
    return removed;
  };

  return Model;
}

const defaultParcel = (p) => {
  const doc = { ...p };
  if (!doc.trackingNumber) doc.trackingNumber = generateTrackingNumber();
  if (!doc.currentLocation) doc.currentLocation = doc.from || "";
  if (!doc.date) doc.date = new Date().toISOString().split("T")[0];
  if (!doc.serviceTier) doc.serviceTier = "standard";
  if (!doc.parcelType) doc.parcelType = "standard";
  if (!doc.paymentStatus) doc.paymentStatus = "paid";
  if (!doc.paymentMethod) doc.paymentMethod = "card";
  if (!doc.assignedDriver) doc.assignedDriver = "Unassigned";
  if (!doc.stage) doc.stage = "pending";
  if (doc.status === undefined) doc.status = 0;
  if (!doc.estimatedDelivery) {
    const daysByTier = { overnight: 1, express: 2, standard: 4, economy: 7 };
    const eta = new Date(doc.date || Date.now());
    eta.setDate(eta.getDate() + (daysByTier[doc.serviceTier] || 4));
    doc.estimatedDelivery = eta.toISOString().split("T")[0];
  }
  if (!Array.isArray(doc.trackingHistory) || doc.trackingHistory.length === 0) {
    doc.trackingHistory = [
      {
        _id: generateObjectId(),
        stage: doc.stage || "pending",
        location: doc.from || "Origin Hub",
        description: "Shipment order created and label generated.",
        updatedBy: "SendIT Dispatch",
        timestamp: new Date().toISOString(),
      },
    ];
  } else {
    doc.trackingHistory = doc.trackingHistory.map((ev) => ({
      _id: ev._id || generateObjectId(),
      ...ev,
    }));
  }
  return doc;
};

const defaultUser = (u) => {
  const doc = { ...u };
  if (doc.email) doc.email = doc.email.trim().toLowerCase();
  if (!doc.role) doc.role = "user";
  if (doc.isActive === undefined) doc.isActive = true;
  if (doc.status === undefined) doc.status = 0;
  if (!Array.isArray(doc.savedAddresses)) doc.savedAddresses = [];
  else {
    doc.savedAddresses = doc.savedAddresses.map((a) => ({
      _id: a._id || generateObjectId(),
      ...a,
    }));
  }
  return doc;
};

const defaultSettings = (s) => ({
  key: "global",
  companyName: "SendIT Logistics",
  supportEmail: "support@sendit.io",
  supportPhone: "+1 (800) 555-0199",
  currency: "USD",
  currencySymbol: "$",
  pricing: {
    baseFee: 8,
    perKgRate: 3.5,
    fragileSurcharge: 6,
    perishableSurcharge: 8,
    insuranceRatePercent: 2,
    tierMultipliers: {
      economy: 0.85,
      standard: 1.0,
      express: 1.55,
      overnight: 2.25,
    },
    ...(s.pricing || {}),
  },
  notifications: {
    emailOnCreate: true,
    emailOnDeliver: true,
    smsAlerts: false,
    ...(s.notifications || {}),
  },
  maintenanceMode: false,
  ...s,
});

const LocalModels = {
  User: createLocalModel("users", defaultUser),
  Parcel: createLocalModel("parcels", defaultParcel),
  ActivityLog: createLocalModel("activitylogs", (l) => ({
    category: "system",
    severity: "info",
    actor: "System",
    ...l,
  })),
  Settings: createLocalModel("settings", defaultSettings),
};

module.exports = { LocalModels };
