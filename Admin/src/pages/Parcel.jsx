import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Save,
  MapPin,
  PlusCircle,
  Star,
  Clock,
  Printer,
  CheckCircle2,
} from "lucide-react";
import { toast } from "react-toastify";
import { publicRequest } from "../requestMethods";
import {
  STAGES,
  formatCurrency,
  formatDateTime,
  getStageMeta,
  resolveStage,
} from "../utils/helpers";
import { useAuth } from "../context/AuthContext";

const Parcel = () => {
  const { id } = useParams();
  const { adminUser } = useAuth();
  const [parcel, setParcel] = useState(null);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [checkpoint, setCheckpoint] = useState({
    stage: "in_transit",
    location: "",
    description: "",
  });
  const [addingCp, setAddingCp] = useState(false);

  const loadParcel = useCallback(async () => {
    setLoading(true);
    try {
      const res = await publicRequest.get(`/parcels/find/${id}`);
      const p = res.data;
      setParcel(p);
      setForm({
        from: p.from || "",
        to: p.to || "",
        sendername: p.sendername || "",
        recipientname: p.recipientname || "",
        senderemail: p.senderemail || "",
        recipientemail: p.recipientemail || "",
        weight: p.weight ?? 0,
        cost: p.cost ?? 0,
        serviceTier: p.serviceTier || "standard",
        parcelType: p.parcelType || "standard",
        paymentStatus: p.paymentStatus || "paid",
        assignedDriver: p.assignedDriver || "Unassigned",
        currentLocation: p.currentLocation || p.from || "",
        date: p.date || "",
        estimatedDelivery: p.estimatedDelivery || "",
        note: p.note || "",
        stage: resolveStage(p),
      });
      setCheckpoint((prev) => ({
        ...prev,
        stage: resolveStage(p),
        location: p.currentLocation || p.from || "",
      }));
    } catch {
      toast.error("Failed to load parcel.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadParcel();
  }, [loadParcel]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await publicRequest.put(`/parcels/${parcel._id}`, {
        ...form,
        weight: Number(form.weight),
        cost: Number(form.cost),
        updatedBy: adminUser?.fullname || "Admin",
      });
      setParcel(res.data);
      toast.success("Parcel updated successfully!");
    } catch {
      toast.error("Failed to update parcel.");
    } finally {
      setSaving(false);
    }
  };

  const handleQuickStage = async (targetStage) => {
    try {
      const res = await publicRequest.post(`/parcels/${parcel._id}/timeline`, {
        stage: targetStage,
        location:
          targetStage === "delivered"
            ? parcel.to
            : form.currentLocation || parcel.currentLocation || parcel.from,
        description: `Quick status update to ${getStageMeta(targetStage).label}.`,
        updatedBy: adminUser?.fullname || "Admin",
      });
      setParcel(res.data);
      setForm((prev) => ({ ...prev, stage: targetStage }));
      toast.success(`Parcel moved to ${getStageMeta(targetStage).label}!`);
    } catch {
      toast.error("Failed to update stage.");
    }
  };

  const handleAddCheckpoint = async (e) => {
    e.preventDefault();
    if (!checkpoint.location.trim() || !checkpoint.description.trim()) {
      return toast.warning("Enter location and event description.");
    }
    setAddingCp(true);
    try {
      const res = await publicRequest.post(`/parcels/${parcel._id}/timeline`, {
        ...checkpoint,
        updatedBy: adminUser?.fullname || "Admin",
      });
      setParcel(res.data);
      setForm((prev) => ({
        ...prev,
        stage: res.data.stage,
        currentLocation: res.data.currentLocation,
      }));
      setCheckpoint((prev) => ({ ...prev, description: "" }));
      toast.success("Tracking checkpoint logged!");
    } catch {
      toast.error("Failed to add checkpoint.");
    } finally {
      setAddingCp(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-card p-12 text-center text-slate-500">
        Loading parcel workspace...
      </div>
    );
  }

  if (!parcel) {
    return (
      <div className="admin-card p-12 text-center text-slate-500">
        Parcel not found.
      </div>
    );
  }

  const currentStage = resolveStage(parcel);
  const meta = getStageMeta(currentStage);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 no-print">
        <div>
          <Link
            to="/parcels"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-amber-500 mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Parcels
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-mono text-2xl sm:text-3xl font-extrabold">
              {parcel.trackingNumber || parcel._id}
            </h1>
            <span
              className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold border ${meta.badge}`}
            >
              {meta.label}
            </span>
          </div>
        </div>

        <button onClick={() => window.print()} className="btn-secondary">
          <Printer className="w-4 h-4" />
          Print Summary
        </button>
      </div>

      {/* Quick Stage Bar */}
      <div className="admin-card p-4 space-y-2.5 no-print">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
          One-Click Stage Dispatch
        </p>
        <div className="flex flex-wrap gap-2">
          {STAGES.map((st) => (
            <button
              key={st.key}
              type="button"
              onClick={() => handleQuickStage(st.key)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition ${
                currentStage === st.key
                  ? "bg-amber-400 text-slate-950 border-amber-400 shadow"
                  : "border-slate-200 dark:border-slate-800 hover:border-amber-400/50"
              }`}
            >
              {currentStage === st.key && (
                <CheckCircle2 className="w-3.5 h-3.5 inline mr-1.5" />
              )}
              {st.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 printable-area">
        {/* Editable Details Form */}
        <form
          onSubmit={handleUpdate}
          className="lg:col-span-7 admin-card p-6 space-y-4"
        >
          <h2 className="font-display font-bold text-base">
            Shipment Details
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { name: "from", label: "Origin (From)" },
              { name: "to", label: "Destination (To)" },
              { name: "sendername", label: "Sender Name" },
              { name: "recipientname", label: "Recipient Name" },
              { name: "senderemail", label: "Sender Email", type: "email" },
              {
                name: "recipientemail",
                label: "Recipient Email",
                type: "email",
              },
              { name: "currentLocation", label: "Current Hub / Location" },
              { name: "assignedDriver", label: "Assigned Driver" },
              { name: "weight", label: "Weight (kg)", type: "number" },
              { name: "cost", label: "Cost ($)", type: "number" },
              { name: "date", label: "Ship Date", type: "date" },
              {
                name: "estimatedDelivery",
                label: "Estimated Delivery",
                type: "date",
              },
            ].map((field) => (
              <div key={field.name}>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  {field.label}
                </label>
                <input
                  type={field.type || "text"}
                  step={field.type === "number" ? "0.01" : undefined}
                  value={form[field.name] ?? ""}
                  onChange={(e) =>
                    setForm({ ...form, [field.name]: e.target.value })
                  }
                  className="admin-input"
                />
              </div>
            ))}

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">
                Service Tier
              </label>
              <select
                value={form.serviceTier || "standard"}
                onChange={(e) =>
                  setForm({ ...form, serviceTier: e.target.value })
                }
                className="admin-input"
              >
                <option value="economy">Economy</option>
                <option value="standard">Standard</option>
                <option value="express">Express</option>
                <option value="overnight">Overnight</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">
                Payment Status
              </label>
              <select
                value={form.paymentStatus || "paid"}
                onChange={(e) =>
                  setForm({ ...form, paymentStatus: e.target.value })
                }
                className="admin-input"
              >
                <option value="paid">Paid</option>
                <option value="unpaid">Unpaid / COD</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">
              Note
            </label>
            <textarea
              rows={3}
              value={form.note || ""}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              className="admin-input"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="btn-primary w-full no-print"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving Changes..." : "Save Parcel Updates"}
          </button>
        </form>

        {/* Right Side: Add Checkpoint, Customer Feedback & Timeline */}
        <div className="lg:col-span-5 space-y-6">
          {/* Add Live Checkpoint */}
          <form
            onSubmit={handleAddCheckpoint}
            className="admin-card p-6 space-y-4 no-print"
          >
            <h2 className="font-display font-bold text-base flex items-center gap-2">
              <PlusCircle className="w-4 h-4 text-amber-500" />
              Log Live Tracking Checkpoint
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Stage
                </label>
                <select
                  value={checkpoint.stage}
                  onChange={(e) =>
                    setCheckpoint({ ...checkpoint, stage: e.target.value })
                  }
                  className="admin-input"
                >
                  {STAGES.map((s) => (
                    <option key={s.key} value={s.key}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Hub / City Location
                </label>
                <input
                  type="text"
                  required
                  placeholder="Denver Hub, CO"
                  value={checkpoint.location}
                  onChange={(e) =>
                    setCheckpoint({ ...checkpoint, location: e.target.value })
                  }
                  className="admin-input"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">
                Scan Description
              </label>
              <input
                type="text"
                required
                placeholder="Departed regional sorting facility on express linehaul"
                value={checkpoint.description}
                onChange={(e) =>
                  setCheckpoint({ ...checkpoint, description: e.target.value })
                }
                className="admin-input"
              />
            </div>
            <button
              type="submit"
              disabled={addingCp}
              className="btn-primary w-full"
            >
              {addingCp ? "Logging..." : "Add Checkpoint Event"}
            </button>
          </form>

          {/* Customer Feedback Card */}
          <div className="admin-card p-6 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-bold text-base">
                Customer Feedback
              </h2>
              <span className="font-mono text-sm font-bold text-amber-500">
                {formatCurrency(parcel.cost)}
              </span>
            </div>
            {parcel.rating || parcel.feedback ? (
              <div className="space-y-2">
                {parcel.rating && (
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star
                        key={n}
                        className={`w-4 h-4 ${
                          n <= parcel.rating
                            ? "fill-amber-400 text-amber-400"
                            : "text-slate-600"
                        }`}
                      />
                    ))}
                    <span className="text-xs font-mono ml-1 text-slate-400">
                      {parcel.rating}/5
                    </span>
                  </div>
                )}
                <p className="text-sm text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-950/60 p-3 rounded-xl">
                  {parcel.feedback || "No written comment provided."}
                </p>
              </div>
            ) : (
              <p className="text-xs text-slate-500">
                Customer hasn&apos;t submitted a delivery review yet.
              </p>
            )}
          </div>

          {/* Timeline */}
          <div className="admin-card p-6 space-y-4">
            <h2 className="font-display font-bold text-base">
              Tracking History ({(parcel.trackingHistory || []).length})
            </h2>
            <ol className="relative border-l-2 border-slate-200 dark:border-slate-800 ml-2 space-y-4">
              {[...(parcel.trackingHistory || [])]
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                .map((ev, idx) => (
                  <li key={ev._id || idx} className="ml-5">
                    <span className="absolute -left-[7px] w-3 h-3 rounded-full bg-amber-400 ring-4 ring-white dark:ring-slate-900" />
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-bold">
                        {getStageMeta(ev.stage).label}
                      </span>
                      <span className="text-slate-500 font-mono flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDateTime(ev.timestamp)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                      {ev.description}
                    </p>
                    <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-amber-500" />
                      {ev.location} • {ev.updatedBy}
                    </p>
                  </li>
                ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Parcel;
