export const STAGES = [
  {
    key: "pending",
    label: "Pending",
    color: "#f59e0b",
    badge:
      "bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/30",
  },
  {
    key: "picked_up",
    label: "Picked Up",
    color: "#0ea5e9",
    badge: "bg-sky-500/15 text-sky-600 dark:text-sky-300 border-sky-500/30",
  },
  {
    key: "in_transit",
    label: "In Transit",
    color: "#6366f1",
    badge:
      "bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 border-indigo-500/30",
  },
  {
    key: "out_for_delivery",
    label: "Out for Delivery",
    color: "#a855f7",
    badge:
      "bg-purple-500/15 text-purple-600 dark:text-purple-300 border-purple-500/30",
  },
  {
    key: "delivered",
    label: "Delivered",
    color: "#10b981",
    badge:
      "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/30",
  },
  {
    key: "delayed",
    label: "Delayed",
    color: "#f97316",
    badge:
      "bg-orange-500/15 text-orange-600 dark:text-orange-300 border-orange-500/30",
  },
  {
    key: "cancelled",
    label: "Cancelled",
    color: "#f43f5e",
    badge: "bg-rose-500/15 text-rose-600 dark:text-rose-300 border-rose-500/30",
  },
];

export function resolveStage(parcel) {
  if (!parcel) return "pending";
  if (parcel.stage) return parcel.stage;
  return Number(parcel.status) >= 2 ? "delivered" : "pending";
}

export function getStageMeta(stageOrParcel) {
  const key =
    typeof stageOrParcel === "string"
      ? stageOrParcel
      : resolveStage(stageOrParcel);
  return STAGES.find((s) => s.key === key) || STAGES[0];
}

export function formatCurrency(amount) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(amount) || 0);
}

export function formatDateTime(val) {
  if (!val) return "—";
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return String(val);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function downloadCsv(filename, rows) {
  if (!rows || rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const esc = (v) =>
    `"${(v === null || v === undefined ? "" : String(v)).replace(/"/g, '""')}"`;
  const csv = [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => esc(r[h])).join(",")),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadJson(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
