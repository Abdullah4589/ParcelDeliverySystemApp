import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Search,
  Download,
  ExternalLink,
  PlusCircle,
} from "lucide-react";
import { toast } from "react-toastify";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { StageBadge } from "../components/TrackingStepper";
import { publicRequest } from "../requestMethods";
import {
  exportToCsv,
  formatCurrency,
  resolveStage,
} from "../utils/parcelHelpers";

const Parcels = () => {
  const { currentUser } = useSelector((state) => state.user);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = 8;

  useEffect(() => {
    const getParcels = async () => {
      if (!currentUser?.email) return;
      setLoading(true);
      try {
        const res = await publicRequest.post("/parcels/me", {
          email: currentUser.email,
        });
        setData(res.data || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    getParcels();
  }, [currentUser?.email]);

  const filtered = useMemo(() => {
    return data.filter((p) => {
      if (stageFilter !== "all" && resolveStage(p) !== stageFilter)
        return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const text = [
          p.trackingNumber,
          p.from,
          p.to,
          p.sendername,
          p.recipientname,
          p.note,
        ]
          .join(" ")
          .toLowerCase();
        if (!text.includes(q)) return false;
      }
      return true;
    });
  }, [data, search, stageFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const handleExport = () => {
    if (filtered.length === 0) {
      toast.info("No parcels to export.");
      return;
    }
    exportToCsv(
      `sendit-parcels-${new Date().toISOString().split("T")[0]}.csv`,
      filtered.map((p) => ({
        TrackingNumber: p.trackingNumber || p._id,
        From: p.from,
        To: p.to,
        Sender: p.sendername,
        Recipient: p.recipientname,
        WeightKg: p.weight,
        Tier: p.serviceTier || "standard",
        CostUSD: p.cost,
        Stage: resolveStage(p),
        Date: p.date || "",
        ETA: p.estimatedDelivery || "",
        Note: p.note || "",
      }))
    );
    toast.success("Exported parcel history to CSV!");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link
              to="/myparcels"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-amber-500 mb-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
            </Link>
            <h1 className="font-display text-3xl font-extrabold">
              All My Parcels
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Complete searchable ledger for {currentUser?.fullname} (
              {filtered.length} records)
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <button onClick={handleExport} className="btn-secondary">
              <Download className="w-4 h-4" />
              Export CSV
            </button>
            <Link to="/book" className="btn-primary">
              <PlusCircle className="w-4 h-4" />
              New Shipment
            </Link>
          </div>
        </div>

        <div className="glass-card p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by tracking number, origin, destination, recipient..."
              className="input-field pl-10"
            />
          </div>
          <select
            value={stageFilter}
            onChange={(e) => {
              setStageFilter(e.target.value);
              setPage(1);
            }}
            className="input-field sm:w-48"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="picked_up">Picked Up</option>
            <option value="in_transit">In Transit</option>
            <option value="out_for_delivery">Out for Delivery</option>
            <option value="delivered">Delivered</option>
            <option value="delayed">Delayed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-3.5 font-semibold">Tracking ID</th>
                  <th className="px-5 py-3.5 font-semibold">Route</th>
                  <th className="px-5 py-3.5 font-semibold">Recipient</th>
                  <th className="px-5 py-3.5 font-semibold">Tier / Weight</th>
                  <th className="px-5 py-3.5 font-semibold">Date / ETA</th>
                  <th className="px-5 py-3.5 font-semibold">Cost</th>
                  <th className="px-5 py-3.5 font-semibold">Status</th>
                  <th className="px-5 py-3.5 font-semibold text-right">View</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80">
                {loading ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-5 py-10 text-center text-slate-500"
                    >
                      Loading parcels...
                    </td>
                  </tr>
                ) : paginated.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-5 py-10 text-center text-slate-500"
                    >
                      No matching parcels found.
                    </td>
                  </tr>
                ) : (
                  paginated.map((p) => (
                    <tr
                      key={p._id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition"
                    >
                      <td className="px-5 py-4 font-mono font-semibold text-xs">
                        {p.trackingNumber || p._id.slice(-8)}
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-medium">{p.from}</span>
                        <span className="text-amber-500 mx-1.5">→</span>
                        <span className="font-medium">{p.to}</span>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-medium">{p.recipientname}</p>
                        <p className="text-xs text-slate-500">
                          {p.recipientemail}
                        </p>
                      </td>
                      <td className="px-5 py-4 capitalize text-xs">
                        <span className="font-semibold">
                          {p.serviceTier || "standard"}
                        </span>
                        <span className="text-slate-500 block">
                          {p.weight} kg
                        </span>
                      </td>
                      <td className="px-5 py-4 font-mono text-xs text-slate-500">
                        <div>{p.date || "—"}</div>
                        <div className="text-emerald-500">
                          ETA: {p.estimatedDelivery || "—"}
                        </div>
                      </td>
                      <td className="px-5 py-4 font-mono font-bold">
                        {formatCurrency(p.cost)}
                      </td>
                      <td className="px-5 py-4">
                        <StageBadge parcel={p} />
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Link
                          to={`/parcel/${p._id}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-amber-500 hover:underline"
                        >
                          Details <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="px-5 py-3.5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
              <span>
                Page {page} of {totalPages} ({filtered.length} parcels)
              </span>
              <div className="flex gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="btn-secondary py-1.5 px-3 text-xs disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="btn-secondary py-1.5 px-3 text-xs disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Parcels;
