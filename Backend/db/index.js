const MongooseUser = require("../models/User");
const MongooseParcel = require("../models/Parcel");
const MongooseActivityLog = require("../models/ActivityLog");
const MongooseSettings = require("../models/Settings");
const { LocalModels } = require("./localStore");

let useLocalMode = false;

function enableLocalMode() {
  useLocalMode = true;
}

function isLocalMode() {
  return useLocalMode;
}

function createModelProxy(key, mongooseModel) {
  return new Proxy(function () {}, {
    construct(_, args) {
      const Target = useLocalMode ? LocalModels[key] : mongooseModel;
      return new Target(...args);
    },
    apply(_, __, args) {
      const Target = useLocalMode ? LocalModels[key] : mongooseModel;
      return Target(...args);
    },
    get(_, prop) {
      const Target = useLocalMode ? LocalModels[key] : mongooseModel;
      const val = Target[prop];
      return typeof val === "function" ? val.bind(Target) : val;
    },
  });
}

module.exports = {
  enableLocalMode,
  isLocalMode,
  User: createModelProxy("User", MongooseUser),
  Parcel: createModelProxy("Parcel", MongooseParcel),
  ActivityLog: createModelProxy("ActivityLog", MongooseActivityLog),
  Settings: createModelProxy("Settings", MongooseSettings),
};
