import { Printer, X, Package } from "lucide-react";
import { formatCurrency } from "../utils/parcelHelpers";

const ShippingLabelModal = ({ parcel, onClose }) => {
  if (!parcel) return null;

  const code = parcel.trackingNumber || parcel._id;

  // Deterministic pseudo-barcode bars from tracking code
  const bars = code.split("").flatMap((ch, idx) => {
    const val = ch.charCodeAt(0);
    return [
      { w: (val % 3) + 1, dark: true, k: `${idx}-a` },
      { w: ((val >> 2) % 2) + 1, dark: false, k: `${idx}-b` },
      { w: ((val >> 3) % 3) + 1, dark: true, k: `${idx}-c` },
      { w: 1, dark: false, k: `${idx}-d` },
    ];
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-white text-slate-900 rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-900 text-white no-print">
          <span className="font-display font-semibold text-sm flex items-center gap-2">
            <Package className="w-4 h-4 text-amber-400" />
            Printable Shipping Waybill
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-400 text-slate-950 text-xs font-bold hover:bg-amber-300 transition"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Label
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="printable-area p-6 space-y-5">
          {/* Header */}
          <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
            <div>
              <div className="text-2xl font-black tracking-tight">
                SEND<span className="text-amber-500">IT</span>
              </div>
              <div className="text-[11px] uppercase tracking-widest text-slate-500 font-semibold">
                Global Express Logistics
              </div>
            </div>
            <div className="text-right">
              <span className="inline-block px-3 py-1 rounded bg-slate-900 text-white font-mono text-xs font-bold uppercase tracking-wider">
                {(parcel.serviceTier || "standard").toUpperCase()}
              </span>
              <p className="text-xs text-slate-500 mt-1">
                Ship Date: {parcel.date || "—"}
              </p>
            </div>
          </div>

          {/* Sender / Recipient Grid */}
          <div className="grid grid-cols-2 gap-4 border-b border-slate-300 pb-4">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                FROM (SENDER)
              </p>
              <p className="font-bold text-sm mt-1">{parcel.sendername}</p>
              <p className="text-xs text-slate-700 mt-0.5">{parcel.from}</p>
              <p className="text-xs text-slate-500 mt-0.5">
                {parcel.senderemail}
              </p>
              {parcel.senderphone && (
                <p className="text-xs text-slate-500">{parcel.senderphone}</p>
              )}
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border-2 border-slate-900">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                TO (RECIPIENT)
              </p>
              <p className="font-bold text-sm mt-1">{parcel.recipientname}</p>
              <p className="text-xs text-slate-800 font-medium mt-0.5">
                {parcel.to}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {parcel.recipientemail}
              </p>
              {parcel.recipientphone && (
                <p className="text-xs text-slate-500">{parcel.recipientphone}</p>
              )}
            </div>
          </div>

          {/* Specs */}
          <div className="grid grid-cols-4 gap-2 text-center border-b border-slate-300 pb-4">
            <div className="p-2 bg-slate-50 rounded">
              <p className="text-[10px] uppercase text-slate-500 font-semibold">
                Weight
              </p>
              <p className="font-mono font-bold text-sm">{parcel.weight} kg</p>
            </div>
            <div className="p-2 bg-slate-50 rounded">
              <p className="text-[10px] uppercase text-slate-500 font-semibold">
                Type
              </p>
              <p className="font-bold text-xs capitalize mt-0.5">
                {parcel.parcelType || "Standard"}
              </p>
            </div>
            <div className="p-2 bg-slate-50 rounded">
              <p className="text-[10px] uppercase text-slate-500 font-semibold">
                ETA
              </p>
              <p className="font-mono font-bold text-xs mt-0.5">
                {parcel.estimatedDelivery || "—"}
              </p>
            </div>
            <div className="p-2 bg-slate-50 rounded">
              <p className="text-[10px] uppercase text-slate-500 font-semibold">
                Total
              </p>
              <p className="font-mono font-bold text-sm">
                {formatCurrency(parcel.cost)}
              </p>
            </div>
          </div>

          {parcel.note && (
            <div className="text-xs bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              <span className="font-bold uppercase text-amber-800">
                Handling Note:{" "}
              </span>
              <span className="text-amber-950">{parcel.note}</span>
            </div>
          )}

          {/* Barcode */}
          <div className="flex flex-col items-center pt-2">
            <div className="flex items-stretch h-16 max-w-full overflow-hidden">
              {bars.map((b) => (
                <div
                  key={b.k}
                  style={{ width: `${b.w * 2}px` }}
                  className={b.dark ? "bg-slate-950" : "bg-white"}
                />
              ))}
            </div>
            <p className="font-mono font-bold tracking-[0.25em] text-sm mt-2">
              {code}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShippingLabelModal;
