import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Package,
  Users,
  Truck,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  ArrowRight,
  RefreshCw,
  MapPin,
  Star,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from "recharts";
import { publicRequest } from "../requestMethods";
import {
  STAGES,
  formatCurrency,
  getStageMeta,
  resolveStage,
} from "../utils/helpers";

const Home = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const res = await publicRequest.get("/analytics");
      setData(res.data);
    } catch (err) {
      console.error("Failed to fetch analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  const kpis = data?.kpis || {};
  const stageCounts = data?.stageCounts || {};

  const pieData = STAGES.map((s) => ({
    name: s.label,
    value: stageCounts[s.key] || 0,
    color: s.color,
  })).filter((item) => item.value > 0);

  const monthlyData = data?.monthlyTrend || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-amber-500">
            Live Operations
          </span>
          <h1 className="font-display text-3xl font-extrabold mt-0.5">
            Dashboard Overview
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Real-time shipment telemetry, revenue metrics, and fleet status.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button onClick={loadAnalytics} className="btn-secondary">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <Link to="/newparcel" className="btn-primary">
            Create Shipment
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-4">
        {[
          {
            label: "Total Revenue",
            value: formatCurrency(kpis.totalRevenue || 0),
            icon: DollarSign,
            accent: "bg-emerald-500/15 text-emerald-500",
          },
          {
            label: "Total Parcels",
            value: kpis.totalParcels ?? 0,
            icon: Package,
            accent: "bg-amber-500/15 text-amber-500",
          },
          {
            label: "Active / Transit",
            value: kpis.activeParcels ?? 0,
            icon: Truck,
            accent: "bg-indigo-500/15 text-indigo-500",
          },
          {
            label: "Delivered",
            value: kpis.deliveredParcels ?? 0,
            icon: CheckCircle2,
            accent: "bg-teal-500/15 text-teal-500",
          },
          {
            label: "Delivery Rate",
            value: `${kpis.deliveryRate ?? 0}%`,
            icon: TrendingUp,
            accent: "bg-sky-500/15 text-sky-500",
          },
          {
            label: "Total Users",
            value: kpis.totalUsers ?? 0,
            icon: Users,
            accent: "bg-purple-500/15 text-purple-500",
          },
        ].map((item) => (
          <div key={item.label} className="admin-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {item.label}
              </span>
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center ${item.accent}`}
              >
                <item.icon className="w-4 h-4" />
              </div>
            </div>
            <p className="font-display text-2xl font-extrabold">
              {loading ? "—" : item.value}
            </p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 admin-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display font-bold text-base">
                Monthly Shipments & Revenue
              </h2>
              <p className="text-xs text-slate-500">
                Volume trend across recent months
              </p>
            </div>
            <Link
              to="/analytics"
              className="text-xs font-semibold text-amber-500 hover:underline"
            >
              Full Analytics →
            </Link>
          </div>

          <div className="h-72 w-full">
            {monthlyData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-slate-500">
                No shipment data available yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#334155"
                    opacity={0.25}
                  />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      border: "1px solid #334155",
                      borderRadius: "12px",
                      color: "#f8fafc",
                    }}
                  />
                  <Bar
                    dataKey="shipments"
                    name="Total Shipments"
                    fill="#f59e0b"
                    radius={[6, 6, 0, 0]}
                  />
                  <Bar
                    dataKey="delivered"
                    name="Delivered"
                    fill="#10b981"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="lg:col-span-5 admin-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display font-bold text-base">
                Parcel Status Breakdown
              </h2>
              <p className="text-xs text-slate-500">
                Live distribution by delivery stage
              </p>
            </div>
            {kpis.ratingCount > 0 && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-400/15 text-amber-500">
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                {kpis.avgRating}/5
              </span>
            )}
          </div>

          <div className="h-56 w-full">
            {pieData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-slate-500">
                No parcels recorded yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={88}
                    paddingAngle={4}
                  >
                    {pieData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      border: "1px solid #334155",
                      borderRadius: "12px",
                      color: "#f8fafc",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            {pieData.map((entry) => (
              <div
                key={entry.name}
                className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-950/60"
              >
                <span className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  {entry.name}
                </span>
                <span className="font-mono font-bold">{entry.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row: Recent Shipments + Recent Users & Top Routes */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 admin-card overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h2 className="font-display font-bold text-base">
              Recent Shipments
            </h2>
            <Link
              to="/parcels"
              className="text-xs font-semibold text-amber-500 hover:underline"
            >
              Manage all →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100/70 dark:bg-slate-950/50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-3">Tracking ID</th>
                  <th className="px-5 py-3">Route</th>
                  <th className="px-5 py-3">Recipient</th>
                  <th className="px-5 py-3">Cost</th>
                  <th className="px-5 py-3">Stage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80">
                {(data?.recentParcels || []).map((p) => {
                  const meta = getStageMeta(resolveStage(p));
                  return (
                    <tr
                      key={p._id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40"
                    >
                      <td className="px-5 py-3.5 font-mono text-xs font-bold">
                        <Link
                          to={`/parcel/${p._id}`}
                          className="text-amber-500 hover:underline"
                        >
                          {p.trackingNumber || p._id.slice(-8)}
                        </Link>
                      </td>
                      <td className="px-5 py-3.5 text-xs">
                        {p.from} <span className="text-amber-500">→</span>{" "}
                        {p.to}
                      </td>
                      <td className="px-5 py-3.5 text-xs">{p.recipientname}</td>
                      <td className="px-5 py-3.5 font-mono text-xs font-bold">
                        {formatCurrency(p.cost)}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${meta.badge}`}
                        >
                          {meta.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {!loading && (data?.recentParcels || []).length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-5 py-8 text-center text-slate-500 text-xs"
                    >
                      No parcels found. Create your first shipment or run{" "}
                      <code>npm run seed</code> in Backend.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="admin-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-bold text-sm">Recent Users</h2>
              <Link
                to="/users"
                className="text-xs text-amber-500 hover:underline"
              >
                View all
              </Link>
            </div>
            <div className="space-y-2.5">
              {(data?.recentUsers || []).map((u) => (
                <div
                  key={u._id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-100/80 dark:bg-slate-950/60"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-amber-400/15 text-amber-500 font-bold text-xs flex items-center justify-center uppercase shrink-0">
                      {(u.fullname || "U").slice(0, 2)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold truncate">
                        {u.fullname}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">
                        {u.email}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {u.role || "user"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="admin-card p-5 space-y-3">
            <h2 className="font-display font-bold text-sm flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-amber-500" />
              Top Shipping Corridors
            </h2>
            <div className="space-y-2">
              {(data?.topRoutes || []).map((r) => (
                <div
                  key={r.route}
                  className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-100/80 dark:bg-slate-950/60"
                >
                  <span className="truncate">{r.route}</span>
                  <span className="font-mono font-bold text-amber-500 ml-2">
                    {r.count}
                  </span>
                </div>
              ))}
              {(data?.topRoutes || []).length === 0 && (
                <p className="text-xs text-slate-500">No routes yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
