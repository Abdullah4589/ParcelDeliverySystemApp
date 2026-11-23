import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area,
} from "recharts";
import { Download, Star, Weight, TrendingUp, DollarSign } from "lucide-react";
import { toast } from "react-toastify";
import { publicRequest } from "../requestMethods";
import { downloadCsv, formatCurrency } from "../utils/helpers";

const Analytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await publicRequest.get("/analytics");
        setData(res.data);
      } catch {
        toast.error("Failed to load analytics.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const kpis = data?.kpis || {};
  const tierChart = Object.entries(data?.tierStats || {}).map(
    ([tier, stats]) => ({
      tier: tier.toUpperCase(),
      shipments: stats.count,
      revenue: stats.revenue,
    })
  );

  const exportReport = () => {
    if (!tierChart.length) return;
    downloadCsv(
      `sendit-analytics-report-${new Date().toISOString().split("T")[0]}.csv`,
      tierChart
    );
    toast.success("Analytics report exported!");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-amber-500">
            Business Intelligence
          </span>
          <h1 className="font-display text-3xl font-extrabold mt-0.5">
            Analytics & Reports
          </h1>
        </div>
        <button onClick={exportReport} className="btn-primary">
          <Download className="w-4 h-4" />
          Export Tier Report CSV
        </button>
      </div>

      {/* Top Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Collected Revenue",
            value: formatCurrency(kpis.paidRevenue || 0),
            sub: `Of ${formatCurrency(kpis.totalRevenue || 0)} billed`,
            icon: DollarSign,
            accent: "bg-emerald-500/15 text-emerald-500",
          },
          {
            label: "Delivery Success Rate",
            value: `${kpis.deliveryRate ?? 0}%`,
            sub: `${kpis.deliveredParcels ?? 0} of ${kpis.totalParcels ?? 0} delivered`,
            icon: TrendingUp,
            accent: "bg-amber-500/15 text-amber-500",
          },
          {
            label: "Total Cargo Weight",
            value: `${kpis.totalWeight ?? 0} kg`,
            sub: "Cumulative shipped volume",
            icon: Weight,
            accent: "bg-sky-500/15 text-sky-500",
          },
          {
            label: "Customer Satisfaction",
            value: kpis.ratingCount ? `${kpis.avgRating} / 5` : "No ratings",
            sub: `Based on ${kpis.ratingCount ?? 0} review(s)`,
            icon: Star,
            accent: "bg-purple-500/15 text-purple-500",
          },
        ].map((card) => (
          <div key={card.label} className="admin-card p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">
                {card.label}
              </span>
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center ${card.accent}`}
              >
                <card.icon className="w-4 h-4" />
              </div>
            </div>
            <p className="font-display text-2xl font-extrabold">
              {loading ? "—" : card.value}
            </p>
            <p className="text-xs text-slate-500">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="admin-card p-6 space-y-4">
          <h2 className="font-display font-bold text-base">
            Revenue by Service Tier ($)
          </h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tierChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.25} />
                <XAxis dataKey="tier" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    border: "1px solid #334155",
                    borderRadius: "12px",
                    color: "#f8fafc",
                  }}
                />
                <Bar dataKey="revenue" fill="#f59e0b" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="admin-card p-6 space-y-4">
          <h2 className="font-display font-bold text-base">
            Monthly Revenue Trajectory ($)
          </h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.monthlyTrend || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.25} />
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
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Role Breakdown & Top Routes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="admin-card p-6 space-y-4">
          <h2 className="font-display font-bold text-base">
            Top Shipping Routes
          </h2>
          <div className="space-y-3">
            {(data?.topRoutes || []).map((r, i) => (
              <div
                key={r.route}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-100/80 dark:bg-slate-950/60"
              >
                <span className="text-sm font-medium">
                  <span className="font-mono text-amber-500 mr-2">
                    #{i + 1}
                  </span>
                  {r.route}
                </span>
                <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-amber-400/15 text-amber-500">
                  {r.count} shipment(s)
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="admin-card p-6 space-y-4">
          <h2 className="font-display font-bold text-base">
            User Role Distribution
          </h2>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Customers", value: data?.roleBreakdown?.user ?? 0, color: "text-sky-500" },
              { label: "Drivers", value: data?.roleBreakdown?.driver ?? 0, color: "text-amber-500" },
              { label: "Admins", value: data?.roleBreakdown?.admin ?? 0, color: "text-emerald-500" },
            ].map((r) => (
              <div
                key={r.label}
                className="p-5 rounded-xl bg-slate-100/80 dark:bg-slate-950/60 text-center"
              >
                <p className={`font-display text-3xl font-extrabold ${r.color}`}>
                  {r.value}
                </p>
                <p className="text-xs text-slate-500 mt-1 font-semibold">
                  {r.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
