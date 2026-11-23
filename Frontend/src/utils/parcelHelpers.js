export const STAGES = [
  {
    key: "pending",
    label: "Order Confirmed",
    short: "Pending",
    step: 0,
    badgeClass:
      "bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/30",
    dotClass: "bg-amber-400",
  },
  {
    key: "picked_up",
    label: "Picked Up",
    short: "Picked Up",
    step: 1,
    badgeClass:
      "bg-sky-500/15 text-sky-600 dark:text-sky-300 border-sky-500/30",
    dotClass: "bg-sky-400",
  },
  {
    key: "in_transit",
    label: "In Transit",
    short: "In Transit",
    step: 2,
    badgeClass:
      "bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 border-indigo-500/30",
    dotClass: "bg-indigo-400",
  },
  {
    key: "out_for_delivery",
    label: "Out for Delivery",
    short: "Out for Delivery",
    step: 3,
    badgeClass:
      "bg-purple-500/15 text-purple-600 dark:text-purple-300 border-purple-500/30",
    dotClass: "bg-purple-400",
  },
  {
    key: "delivered",
    label: "Delivered",
    short: "Delivered",
    step: 4,
    badgeClass:
      "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/30",
    dotClass: "bg-emerald-400",
  },
  {
    key: "delayed",
    label: "Delayed",
    short: "Delayed",
    step: 2,
    badgeClass:
      "bg-orange-500/15 text-orange-600 dark:text-orange-300 border-orange-500/30",
    dotClass: "bg-orange-400",
  },
  {
    key: "cancelled",
    label: "Cancelled",
    short: "Cancelled",
    step: -1,
    badgeClass:
      "bg-rose-500/15 text-rose-600 dark:text-rose-300 border-rose-500/30",
    dotClass: "bg-rose-400",
  },
];

export const MAIN_STEPS = STAGES.slice(0, 5);

export function resolveStage(parcel) {
  if (!parcel) return "pending";
  if (parcel.stage) return parcel.stage;
  if (Number(parcel.status) >= 2) return "delivered";
  return "pending";
}

export function getStageMeta(stageOrParcel) {
  const key =
    typeof stageOrParcel === "string"
      ? stageOrParcel
      : resolveStage(stageOrParcel);
  return STAGES.find((s) => s.key === key) || STAGES[0];
}

export function getProgressPercent(parcel) {
  const stage = resolveStage(parcel);
  if (stage === "cancelled") return 0;
  if (stage === "delayed") return 55;
  const meta = getStageMeta(stage);
  return Math.round(((meta.step + 1) / 5) * 100);
}

export function formatCurrency(amount) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(amount) || 0);
}

export function formatDateTime(dateValue) {
  if (!dateValue) return "—";
  const d = new Date(dateValue);
  if (Number.isNaN(d.getTime())) return String(dateValue);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function exportToCsv(filename, rows) {
  if (!rows || rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const escape = (val) => {
    const str = val === null || val === undefined ? "" : String(val);
    return `"${str.replace(/"/g, '""')}"`;
  };
  const csv = [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => escape(r[h])).join(",")),
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
