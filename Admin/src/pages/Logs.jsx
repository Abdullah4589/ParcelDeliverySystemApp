import { useCallback, useEffect, useState } from "react";
import { ScrollText, RefreshCw, Search } from "lucide-react";
import { publicRequest } from "../requestMethods";
import { formatDateTime } from "../utils/helpers";

const SEVERITY_BADGE = {
  info: "bg-sky-500/15 text-sky-500",
  success: "bg-emerald-500/15 text-emerald-500",
  warning: "bg-amber-500/15 text-amber-500",
  error: "bg-rose-500/15 text-rose-500",
};

const Logs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("all");
  const [severity, setSeverity] = useState("all");
  const [search, setSearch] = useState("");

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await publicRequest.get("/logs", {
        params: { category, severity, limit: 200 },
      });
      setLogs(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [category, severity]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const filtered = logs.filter((l) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return [l.action, l.actor, l.details, l.targetId]
      .join(" ")
      .toLowerCase()
      .includes(q);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-amber-500">
            Security & Compliance
          </span>
          <h1 className="font-display text-3xl font-extrabold mt-0.5">
            System Audit Logs
          </h1>
        </div>
        <button onClick={loadLogs} className="btn-secondary">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      <div className="admin-card p-4 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter logs by action, actor, tracking code..."
            className="admin-input pl-10"
          />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="admin-input md:w-44"
        >
          <option value="all">All Categories</option>
          <option value="parcel">Parcel</option>
          <option value="user">User</option>
          <option value="auth">Auth</option>
          <option value="settings">Settings</option>
          <option value="system">System</option>
        </select>
        <select
          value={severity}
          onChange={(e) => setSeverity(e.target.value)}
          className="admin-input md:w-40"
        >
          <option value="all">All Severities</option>
          <option value="info">Info</option>
          <option value="success">Success</option>
          <option value="warning">Warning</option>
          <option value="error">Error</option>
        </select>
      </div>

      <div className="admin-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 dark:bg-slate-950/70 border-b border-slate-200 dark:border-slate-800 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-5 py-3.5">Timestamp</th>
                <th className="px-5 py-3.5">Action</th>
                <th className="px-5 py-3.5">Category</th>
                <th className="px-5 py-3.5">Actor</th>
                <th className="px-5 py-3.5">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-slate-500">
                    Loading audit trail...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-slate-500">
                    <ScrollText className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    No audit events logged yet.
                  </td>
                </tr>
              ) : (
                filtered.map((log) => (
                  <tr
                    key={log._id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40"
                  >
                    <td className="px-5 py-3.5 font-mono text-xs text-slate-500 whitespace-nowrap">
                      {formatDateTime(log.createdAt)}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded-md font-mono text-[11px] font-bold ${
                          SEVERITY_BADGE[log.severity] || SEVERITY_BADGE.info
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs uppercase font-semibold text-slate-500">
                      {log.category}
                    </td>
                    <td className="px-5 py-3.5 text-xs font-semibold">
                      {log.actor}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-600 dark:text-slate-300">
                      {log.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Logs;
