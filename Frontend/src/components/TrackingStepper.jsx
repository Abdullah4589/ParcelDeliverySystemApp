import {
  ClipboardCheck,
  PackageCheck,
  Truck,
  Navigation,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  MapPin,
  Clock,
} from "lucide-react";
import {
  MAIN_STEPS,
  getStageMeta,
  resolveStage,
  formatDateTime,
} from "../utils/parcelHelpers";

const STEP_ICONS = [
  ClipboardCheck,
  PackageCheck,
  Truck,
  Navigation,
  CheckCircle2,
];

export const StageBadge = ({ parcel, stage }) => {
  const meta = getStageMeta(stage || parcel);
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${meta.badgeClass}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${meta.dotClass}`} />
      {meta.short}
    </span>
  );
};

export const TrackingStepper = ({ parcel }) => {
  const stage = resolveStage(parcel);
  const meta = getStageMeta(stage);
  const currentStep = meta.step;

  return (
    <div className="space-y-4">
      {stage === "delayed" && (
        <div className="flex items-center gap-3 p-3.5 rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-600 dark:text-orange-300 text-sm">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <div>
            <span className="font-semibold">Transit Delay Reported:</span> Your
            parcel experienced a temporary hub delay and is being prioritized for
            the next dispatch.
          </div>
        </div>
      )}

      {stage === "cancelled" && (
        <div className="flex items-center gap-3 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-sm">
          <XCircle className="w-5 h-5 shrink-0" />
          <div>
            <span className="font-semibold">Shipment Cancelled:</span> This
            shipment order has been cancelled.
          </div>
        </div>
      )}

      <div className="relative pt-2 pb-1">
        <div className="hidden sm:block absolute top-7 left-8 right-8 h-1 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 transition-all duration-500"
            style={{
              width:
                currentStep < 0
                  ? "0%"
                  : `${Math.min(100, (currentStep / (MAIN_STEPS.length - 1)) * 100)}%`,
            }}
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 relative z-10">
          {MAIN_STEPS.map((s, idx) => {
            const Icon = STEP_ICONS[idx];
            const completed = currentStep >= idx;
            const active = currentStep === idx && stage !== "cancelled";

            return (
              <div
                key={s.key}
                className="flex flex-col items-center text-center gap-2"
              >
                <div
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center border-2 transition-all ${
                    completed
                      ? "bg-amber-400 border-amber-400 text-slate-950 shadow-lg shadow-amber-500/25"
                      : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400"
                  } ${active ? "ring-4 ring-amber-400/25 scale-105" : ""}`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span
                  className={`text-xs font-semibold ${
                    completed
                      ? "text-slate-900 dark:text-white"
                      : "text-slate-400 dark:text-slate-500"
                  }`}
                >
                  {s.short}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export const TrackingTimeline = ({ history = [] }) => {
  const sorted = [...history].sort(
    (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
  );

  if (sorted.length === 0) {
    return (
      <p className="text-sm text-slate-500 dark:text-slate-400 py-4">
        No tracking checkpoints recorded yet.
      </p>
    );
  }

  return (
    <ol className="relative border-l-2 border-slate-200 dark:border-slate-800 ml-3 space-y-6 py-1">
      {sorted.map((ev, index) => {
        const meta = getStageMeta(ev.stage);
        const isLatest = index === 0;
        return (
          <li key={ev._id || index} className="ml-6">
            <span
              className={`absolute -left-[9px] flex h-4 w-4 items-center justify-center rounded-full ring-4 ring-white dark:ring-slate-900 ${
                isLatest ? meta.dotClass : "bg-slate-400 dark:bg-slate-600"
              }`}
            />
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-900 dark:text-white">
                  {meta.label}
                </span>
                {isLatest && (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-400/20 text-amber-600 dark:text-amber-300">
                    Latest
                  </span>
                )}
              </div>
              <span className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 font-mono">
                <Clock className="w-3.5 h-3.5" />
                {formatDateTime(ev.timestamp)}
              </span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
              {ev.description}
            </p>
            <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
              <span className="inline-flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-amber-500" />
                {ev.location}
              </span>
              {ev.updatedBy && <span>• Logged by {ev.updatedBy}</span>}
            </div>
          </li>
        );
      })}
    </ol>
  );
};
