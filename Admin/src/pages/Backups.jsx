import { useEffect, useState } from "react";
import {
  DatabaseBackup,
  Download,
  FileSpreadsheet,
  Activity,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { toast } from "react-toastify";
import { publicRequest } from "../requestMethods";
import { downloadCsv, downloadJson } from "../utils/helpers";

const Backups = () => {
  const [health, setHealth] = useState(null);
  const [exporting, setExporting] = useState(false);

  const checkHealth = async () => {
    try {
      const res = await publicRequest.get("/health");
      setHealth(res.data);
    } catch {
      setHealth({ status: "error", dbState: "disconnected" });
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  const handleFullBackup = async () => {
    setExporting(true);
    try {
      const res = await publicRequest.get("/backup/export");
      downloadJson(
        `sendit-full-backup-${new Date().toISOString().split("T")[0]}.json`,
        res.data
      );
      toast.success("Full JSON database backup downloaded!");
    } catch {
      toast.error("Failed to generate backup.");
    } finally {
      setExporting(false);
    }
  };

  const handleExportCollection = async (type) => {
    try {
      const res = await publicRequest.get(`/${type}`);
      const rows = res.data || [];
      if (!rows.length) return toast.info(`No ${type} to export.`);
      downloadCsv(
        `sendit-${type}-${new Date().toISOString().split("T")[0]}.csv`,
        rows.map((r) => {
          const flat = { ...r };
          delete flat.trackingHistory;
          delete flat.savedAddresses;
          delete flat.dimensions;
          delete flat.insurance;
          return flat;
        })
      );
      toast.success(`Exported ${rows.length} ${type} records!`);
    } catch {
      toast.error(`Failed to export ${type}.`);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <span className="text-xs font-bold uppercase tracking-widest text-amber-500">
          Data Resilience
        </span>
        <h1 className="font-display text-3xl font-extrabold mt-0.5">
          Backups & System Health
        </h1>
        <p className="text-sm text-slate-500">
          Export full JSON snapshots, individual CSV tables, and verify backend
          database connectivity.
        </p>
      </div>

      {/* Health Card */}
      <div className="admin-card p-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
              health?.dbState === "connected"
                ? "bg-emerald-500/15 text-emerald-500"
                : "bg-rose-500/15 text-rose-500"
            }`}
          >
            {health?.dbState === "connected" ? (
              <CheckCircle2 className="w-6 h-6" />
            ) : (
              <AlertTriangle className="w-6 h-6" />
            )}
          </div>
          <div>
            <h2 className="font-display font-bold text-base flex items-center gap-2">
              <Activity className="w-4 h-4 text-amber-500" />
              API & MongoDB Status
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Service: {health?.service || "SendIT API"} • DB:{" "}
              <span className="font-mono font-bold uppercase">
                {health?.dbState || "checking..."}
              </span>
            </p>
          </div>
        </div>
        <button onClick={checkHealth} className="btn-secondary">
          Re-check Health
        </button>
      </div>

      {/* Export Options */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="admin-card p-6 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="w-11 h-11 rounded-xl bg-amber-400/15 text-amber-500 flex items-center justify-center">
              <DatabaseBackup className="w-5 h-5" />
            </div>
            <h3 className="font-display font-bold text-lg">
              Full JSON Snapshot
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Includes all parcels (with tracking timelines), users, global
              pricing settings, and recent audit logs.
            </p>
          </div>
          <button
            onClick={handleFullBackup}
            disabled={exporting}
            className="btn-primary w-full"
          >
            <Download className="w-4 h-4" />
            {exporting ? "Generating..." : "Download Full Backup"}
          </button>
        </div>

        <div className="admin-card p-6 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="w-11 h-11 rounded-xl bg-sky-500/15 text-sky-500 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h3 className="font-display font-bold text-lg">Parcels CSV</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Export every shipment record into a clean spreadsheet-ready CSV
              for accounting or external BI tools.
            </p>
          </div>
          <button
            onClick={() => handleExportCollection("parcels")}
            className="btn-secondary w-full"
          >
            <Download className="w-4 h-4" />
            Export Parcels CSV
          </button>
        </div>

        <div className="admin-card p-6 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h3 className="font-display font-bold text-lg">Users CSV</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Export registered customers, courier drivers, and administrators
              (passwords excluded for security).
            </p>
          </div>
          <button
            onClick={() => handleExportCollection("users")}
            className="btn-secondary w-full"
          >
            <Download className="w-4 h-4" />
            Export Users CSV
          </button>
        </div>
      </div>
    </div>
  );
};

export default Backups;
