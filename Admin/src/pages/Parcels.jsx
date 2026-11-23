import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  Plus,
  Download,
  Trash2,
  Edit3,
  Copy,
  CheckSquare,
} from "lucide-react";
import { toast } from "react-toastify";
import { publicRequest } from "../requestMethods";
import {
  STAGES,
  downloadCsv,
  formatCurrency,
  getStageMeta,
  resolveStage,
} from "../utils/helpers";
import { useAuth } from "../context/AuthContext";

const Parcels = () => {
  const { adminUser } = useAuth();
  const [parcels, setParcels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [tierFilter, setTierFilter] = useState("all");
  const [selected, setSelected] = useState([]);
  const [bulkStage, setBulkStage] = useState("in_transit");
  const [bulkUpdating, setBulkUpdating] = useState(false);

  const loadParcels = async () => {
    setLoading(true);
    try {
      const res = await publicRequest.get("/parcels");
      setParcels(res.data || []);
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch parcels.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadParcels();
  }, []);

  const filtered = useMemo(() => {
    return parcels.filter((p) => {
      if (stageFilter !== "all" && resolveStage(p) !== stageFilter)
        return false;
      if (tierFilter !== "all" && (p.serviceTier || "standard") !== tierFilter)
        return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const hay = [
          p.trackingNumber,
          p._id,
          p.from,
          p.to,
          p.sendername,
          p.recipientname,
          p.senderemail,
          p.recipientemail,
          p.assignedDriver,
        ]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [parcels, search, stageFilter, tierFilter]);

  const toggleSelect = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selected.length === filtered.length) {
      setSelected([]);
    } else {
      setSelected(filtered.map((p) => p._id));
    }
  };

  const handleBulkUpdate = async () => {
    if (selected.length === 0) return;
    setBulkUpdating(true);
    try {
      await publicRequest.post("/parcels/bulk-status", {
        ids: selected,
        stage: bulkStage,
        actor: adminUser?.fullname || "Admin",
      });
      toast.success(`Updated ${selected.length} parcel(s) to ${bulkStage}.`);
      setSelected([]);
      await loadParcels();
    } catch {
      toast.error("Bulk update failed.");
    } finally {
      setBulkUpdating(false);
    }
  };

  const handleDelete = async (id, tracking) => {
    if (!window.confirm(`Delete parcel ${tracking}? This cannot be undone.`))
      return;
    try {
      await publicRequest.delete(`/parcels/${id}`);
      setParcels((prev) => prev.filter((p) => p._id !== id));
      setSelected((prev) => prev.filter((item) => item !== id));
      toast.success("Parcel deleted.");
    } catch {
      toast.error("Failed to delete parcel.");
    }
  };

  const handleExport = () => {
    if (!filtered.length) return toast.info("No parcels to export.");
    downloadCsv(
      `sendit-admin-parcels-${new Date().toISOString().split("T")[0]}.csv`,
      filtered.map((p) => ({
        TrackingNumber: p.trackingNumber || p._id,
        From: p.from,
        To: p.to,
        Sender: p.sendername,
        SenderEmail: p.senderemail,
        Recipient: p.recipientname,
        RecipientEmail: p.recipientemail,
        WeightKg: p.weight,
        ServiceTier: p.serviceTier || "standard",
        CostUSD: p.cost,
        PaymentStatus: p.paymentStatus || "paid",
        Stage: resolveStage(p),
        Driver: p.assignedDriver || "Unassigned",
        Date: p.date || "",
        ETA: p.estimatedDelivery || "",
      }))
    );
    toast.success("CSV exported!");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-amber-500">
            Shipment Dispatch
          </span>
          <h1 className="font-display text-3xl font-extrabold mt-0.5">
            All Parcels ({filtered.length})
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button onClick={handleExport} className="btn-secondary">
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <Link to="/newparcel" className="btn-primary">
            <Plus className="w-4 h-4" /> New Parcel
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="admin-card p-4 space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tracking code, route, sender, recipient, driver..."
              className="admin-input pl-10"
            />
          </div>
          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className="admin-input md:w-44"
          >
            <option value="all">All Service Tiers</option>
            <option value="economy">Economy</option>
            <option value="standard">Standard</option>
            <option value="express">Express</option>
            <option value="overnight">Overnight</option>
          </select>
        </div>

        {/* Stage Pills */}
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setStageFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              stageFilter === "all"
                ? "bg-amber-400 text-slate-950"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
            }`}
          >
            All ({parcels.length})
          </button>
          {STAGES.map((st) => {
            const count = parcels.filter(
              (p) => resolveStage(p) === st.key
            ).length;
            return (
              <button
                key={st.key}
                onClick={() => setStageFilter(st.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  stageFilter === st.key
                    ? "bg-amber-400 text-slate-950"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                }`}
              >
                {st.label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Bulk Action Bar */}
      {selected.length > 0 && (
        <div className="admin-card p-3.5 border-amber-400/50 bg-amber-400/10 flex flex-wrap items-center justify-between gap-3">
          <span className="text-sm font-semibold flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-amber-500" />
            {selected.length} parcel(s) selected
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={bulkStage}
              onChange={(e) => setBulkStage(e.target.value)}
              className="admin-input py-1.5 w-44 text-xs"
            >
              {STAGES.map((s) => (
                <option key={s.key} value={s.key}>
                  Move to: {s.label}
                </option>
              ))}
            </select>
            <button
              onClick={handleBulkUpdate}
              disabled={bulkUpdating}
              className="btn-primary py-1.5 text-xs"
            >
              {bulkUpdating ? "Updating..." : "Apply Bulk Status"}
            </button>
            <button
              onClick={() => setSelected([])}
              className="btn-secondary py-1.5 text-xs"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Data Table */}
      <div className="admin-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 dark:bg-slate-950/70 border-b border-slate-200 dark:border-slate-800 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3.5 w-10">
                  <input
                    type="checkbox"
                    checked={
                      filtered.length > 0 &&
                      selected.length === filtered.length
                    }
                    onChange={toggleSelectAll}
                    className="accent-amber-400 w-4 h-4"
                  />
                </th>
                <th className="px-4 py-3.5">Tracking ID</th>
                <th className="px-4 py-3.5">Route</th>
                <th className="px-4 py-3.5">Sender / Recipient</th>
                <th className="px-4 py-3.5">Tier / Weight</th>
                <th className="px-4 py-3.5">Driver</th>
                <th className="px-4 py-3.5">Cost</th>
                <th className="px-4 py-3.5">Stage</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80">
              {loading ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-10 text-center text-slate-500"
                  >
                    Loading parcels...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-10 text-center text-slate-500"
                  >
                    No parcels match your criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => {
                  const code = p.trackingNumber || p._id;
                  const meta = getStageMeta(resolveStage(p));
                  return (
                    <tr
                      key={p._id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition"
                    >
                      <td className="px-4 py-3.5">
                        <input
                          type="checkbox"
                          checked={selected.includes(p._id)}
                          onChange={() => toggleSelect(p._id)}
                          className="accent-amber-400 w-4 h-4"
                        />
                      </td>
                      <td className="px-4 py-3.5 font-mono text-xs font-bold">
                        <div className="flex items-center gap-1.5">
                          <Link
                            to={`/parcel/${p._id}`}
                            className="text-amber-500 hover:underline"
                          >
                            {code}
                          </Link>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(code);
                              toast.success("Copied!");
                            }}
                            className="text-slate-400 hover:text-amber-400"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                        <span className="text-[11px] text-slate-500 font-normal">
                          ETA: {p.estimatedDelivery || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-xs">
                        <p className="font-semibold">{p.from}</p>
                        <p className="text-slate-500">→ {p.to}</p>
                      </td>
                      <td className="px-4 py-3.5 text-xs">
                        <p className="font-medium">{p.sendername}</p>
                        <p className="text-slate-500">To: {p.recipientname}</p>
                      </td>
                      <td className="px-4 py-3.5 text-xs capitalize">
                        <span className="font-semibold">
                          {p.serviceTier || "standard"}
                        </span>
                        <p className="text-slate-500">{p.weight} kg</p>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-500">
                        {p.assignedDriver || "Unassigned"}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-xs font-bold">
                        {formatCurrency(p.cost)}
                        <span className="block text-[10px] font-sans uppercase text-slate-500">
                          {p.paymentStatus || "paid"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${meta.badge}`}
                        >
                          {meta.label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <Link
                            to={`/parcel/${p._id}`}
                            className="p-2 rounded-lg bg-sky-500/10 text-sky-500 hover:bg-sky-500/20"
                            title="Edit & Track"
                          >
                            <Edit3 className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleDelete(p._id, code)}
                            className="p-2 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500/20"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Parcels;
