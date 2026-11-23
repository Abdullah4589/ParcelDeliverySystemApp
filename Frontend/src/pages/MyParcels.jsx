import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import {
  Package,
  Truck,
  CheckCircle2,
  DollarSign,
  PlusCircle,
  Search,
  ArrowRight,
  Copy,
  Send,
  Inbox,
  Calendar,
  Table2,
} from "lucide-react";
import { toast } from "react-toastify";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { StageBadge } from "../components/TrackingStepper";
import { publicRequest } from "../requestMethods";
import {
  formatCurrency,
  getProgressPercent,
  resolveStage,
} from "../utils/parcelHelpers";

const MyParcels = () => {
  const { currentUser } = useSelector((state) => state.user);
  const [parcels, setParcels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("all"); // all | sent | received
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("all");

  useEffect(() => {
    const fetchParcels = async () => {
      if (!currentUser?.email) return;
      setLoading(true);
      try {
        const res = await publicRequest.post("/parcels/me", {
          email: currentUser.email,
          filter: "all",
        });
        setParcels(res.data || []);
      } catch (err) {
        console.error(err);
        toast.error("Could not load your shipments.");
      } finally {
        setLoading(false);
      }
    };
    fetchParcels();
  }, [currentUser?.email]);

  const userEmail = (currentUser?.email || "").toLowerCase();

  const stats = useMemo(() => {
    const total = parcels.length;
    const delivered = parcels.filter(
      (p) => resolveStage(p) === "delivered"
    ).length;
    const active = parcels.filter((p) => {
      const s = resolveStage(p);
      return s !== "delivered" && s !== "cancelled";
    }).length;
    const spent = parcels
      .filter((p) => (p.senderemail || "").toLowerCase() === userEmail)
      .reduce((acc, p) => acc + (Number(p.cost) || 0), 0);
    return { total, delivered, active, spent };
  }, [parcels, userEmail]);

  const filtered = useMemo(() => {
    return parcels.filter((p) => {
      const isSent = (p.senderemail || "").toLowerCase() === userEmail;
      const isReceived = (p.recipientemail || "").toLowerCase() === userEmail;
      if (tab === "sent" && !isSent) return false;
      if (tab === "received" && !isReceived) return false;

      const st = resolveStage(p);
      if (stageFilter !== "all" && st !== stageFilter) return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        const hay = [
          p.trackingNumber,
          p._id,
          p.from,
          p.to,
          p.sendername,
          p.recipientname,
          p.note,
        ]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [parcels, tab, stageFilter, search, userEmail]);

  const copyTracking = (e, code) => {
    e.preventDefault();
    navigator.clipboard.writeText(code);
    toast.success(`Copied ${code}`);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-amber-500">
              Customer Portal
            </p>
            <h1 className="font-display text-3xl font-extrabold mt-0.5">
              Welcome back, {currentUser?.fullname}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Track outgoing & incoming parcels, print waybills, and manage
              deliveries.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <Link to="/allparcels" className="btn-secondary">
              <Table2 className="w-4 h-4" />
              Table View
            </Link>
            <Link to="/book" className="btn-primary">
              <PlusCircle className="w-4 h-4" />
              Book New Shipment
            </Link>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: "Total Shipments",
              value: stats.total,
              icon: Package,
              accent: "text-amber-500 bg-amber-500/15",
            },
            {
              label: "Active / In Transit",
              value: stats.active,
              icon: Truck,
              accent: "text-indigo-500 bg-indigo-500/15",
            },
            {
              label: "Delivered",
              value: stats.delivered,
              icon: CheckCircle2,
              accent: "text-emerald-500 bg-emerald-500/15",
            },
            {
              label: "Total Spent",
              value: formatCurrency(stats.spent),
              icon: DollarSign,
              accent: "text-sky-500 bg-sky-500/15",
            },
          ].map((kpi) => (
            <div key={kpi.label} className="glass-card p-5 flex items-center gap-4">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${kpi.accent}`}
              >
                <kpi.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {kpi.label}
                </p>
                <p className="font-display text-2xl font-extrabold mt-0.5">
                  {kpi.value}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Filter Bar */}
        <div className="glass-card p-4 flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          {/* Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950/70 p-1 rounded-xl">
            {[
              { id: "all", label: "All Parcels", icon: Package },
              { id: "sent", label: "Sent by Me", icon: Send },
              { id: "received", label: "Incoming", icon: Inbox },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition ${
                  tab === t.id
                    ? "bg-amber-400 text-slate-950 shadow"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <t.icon className="w-3.5 h-3.5" />
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5 flex-1 lg:max-w-xl">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tracking code, city, recipient..."
                className="input-field pl-10 py-2"
              />
            </div>
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="input-field sm:w-44 py-2"
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
        </div>

        {/* Shipment Cards */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="glass-card p-6 h-48 animate-pulse bg-slate-200/50 dark:bg-slate-800/40"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass-card p-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-400/15 text-amber-500 flex items-center justify-center mx-auto">
              <Package className="w-8 h-8" />
            </div>
            <h3 className="font-display text-xl font-bold">
              No shipments found
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              {parcels.length === 0
                ? "You haven't booked or received any parcels yet. Create your first shipment in seconds."
                : "Try adjusting your search query or status filter."}
            </p>
            <Link to="/book" className="btn-primary">
              <PlusCircle className="w-4 h-4" />
              Book Your First Parcel
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filtered.map((parcel) => {
              const code = parcel.trackingNumber || parcel._id;
              const isIncoming =
                (parcel.recipientemail || "").toLowerCase() === userEmail &&
                (parcel.senderemail || "").toLowerCase() !== userEmail;
              const pct = getProgressPercent(parcel);

              return (
                <Link
                  key={parcel._id}
                  to={`/parcel/${parcel._id}`}
                  className="glass-card p-5 hover:border-amber-400/60 hover:shadow-lg hover:shadow-amber-500/5 transition group flex flex-col justify-between gap-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-slate-900 dark:text-white">
                          {code}
                        </span>
                        <button
                          onClick={(e) => copyTracking(e, code)}
                          className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-amber-500"
                          title="Copy tracking ID"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                            isIncoming
                              ? "bg-sky-500/15 text-sky-500"
                              : "bg-slate-500/15 text-slate-500 dark:text-slate-400"
                          }`}
                        >
                          {isIncoming ? "Incoming" : "Outgoing"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {parcel.sendername} → {parcel.recipientname}
                      </p>
                    </div>
                    <StageBadge parcel={parcel} />
                  </div>

                  {/* Route Box */}
                  <div className="p-3.5 rounded-xl bg-slate-100/80 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 space-y-2.5">
                    <div className="flex items-center justify-between gap-2 text-sm">
                      <span className="font-semibold truncate">
                        {parcel.from}
                      </span>
                      <ArrowRight className="w-4 h-4 text-amber-500 shrink-0" />
                      <span className="font-semibold truncate text-right">
                        {parcel.to}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        ETA: {parcel.estimatedDelivery || parcel.date || "—"}
                      </span>
                      <span className="capitalize">
                        {parcel.weight} kg • {parcel.serviceTier || "standard"}
                      </span>
                    </div>
                    <span className="font-mono font-bold text-sm text-slate-900 dark:text-white group-hover:text-amber-500 transition">
                      {formatCurrency(parcel.cost)}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default MyParcels;
