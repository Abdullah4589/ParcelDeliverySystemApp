import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import {
  FileText,
  Download,
  Printer,
  DollarSign,
  CheckCircle2,
  Clock,
  Receipt,
  X,
} from "lucide-react";
import { toast } from "react-toastify";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { publicRequest } from "../requestMethods";
import { exportToCsv, formatCurrency } from "../utils/parcelHelpers";

const Statements = () => {
  const { currentUser } = useSelector((state) => state.user);
  const [parcels, setParcels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  useEffect(() => {
    const load = async () => {
      if (!currentUser?.email) return;
      setLoading(true);
      try {
        const res = await publicRequest.post("/parcels/me", {
          email: currentUser.email,
          filter: "sent",
        });
        setParcels(res.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [currentUser?.email]);

  const totals = useMemo(() => {
    let paid = 0;
    let unpaid = 0;
    let refunded = 0;
    for (const p of parcels) {
      const c = Number(p.cost) || 0;
      if (p.paymentStatus === "unpaid") unpaid += c;
      else if (p.paymentStatus === "refunded") refunded += c;
      else paid += c;
    }
    const avg = parcels.length ? (paid + unpaid) / parcels.length : 0;
    return { paid, unpaid, refunded, avg };
  }, [parcels]);

  const handleExport = () => {
    if (!parcels.length) return toast.info("No statements to export.");
    exportToCsv(
      `sendit-statement-${new Date().toISOString().split("T")[0]}.csv`,
      parcels.map((p) => ({
        InvoiceRef: `INV-${(p.trackingNumber || p._id).slice(-6)}`,
        TrackingNumber: p.trackingNumber || p._id,
        Date: p.date || "",
        Route: `${p.from} -> ${p.to}`,
        ServiceTier: p.serviceTier || "standard",
        PaymentMethod: p.paymentMethod || "card",
        PaymentStatus: p.paymentStatus || "paid",
        AmountUSD: p.cost,
      }))
    );
    toast.success("Statement CSV downloaded!");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-amber-500">
              Billing & Invoices
            </span>
            <h1 className="font-display text-3xl font-extrabold mt-0.5">
              Shipping Statements
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Download receipts and review your shipping expenses.
            </p>
          </div>
          <button onClick={handleExport} className="btn-primary">
            <Download className="w-4 h-4" />
            Export Statement CSV
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="glass-card p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Total Paid</p>
              <p className="font-display text-2xl font-extrabold">
                {formatCurrency(totals.paid)}
              </p>
            </div>
          </div>
          <div className="glass-card p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Pending / COD</p>
              <p className="font-display text-2xl font-extrabold">
                {formatCurrency(totals.unpaid)}
              </p>
            </div>
          </div>
          <div className="glass-card p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-sky-500/15 text-sky-500 flex items-center justify-center">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Avg. Cost / Parcel</p>
              <p className="font-display text-2xl font-extrabold">
                {formatCurrency(totals.avg)}
              </p>
            </div>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-3.5 font-semibold">Invoice #</th>
                  <th className="px-5 py-3.5 font-semibold">Date</th>
                  <th className="px-5 py-3.5 font-semibold">Shipment</th>
                  <th className="px-5 py-3.5 font-semibold">Method</th>
                  <th className="px-5 py-3.5 font-semibold">Payment</th>
                  <th className="px-5 py-3.5 font-semibold">Amount</th>
                  <th className="px-5 py-3.5 font-semibold text-right">
                    Receipt
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-10 text-center text-slate-500">
                      Loading statements...
                    </td>
                  </tr>
                ) : parcels.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-10 text-center text-slate-500">
                      No billing records found yet.
                    </td>
                  </tr>
                ) : (
                  parcels.map((p) => {
                    const invNo = `INV-${(p.trackingNumber || p._id).slice(-6)}`;
                    const ps = p.paymentStatus || "paid";
                    return (
                      <tr
                        key={p._id}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/40"
                      >
                        <td className="px-5 py-4 font-mono font-bold text-xs">
                          {invNo}
                        </td>
                        <td className="px-5 py-4 font-mono text-xs text-slate-500">
                          {p.date || "—"}
                        </td>
                        <td className="px-5 py-4">
                          <p className="font-medium">
                            {p.from} → {p.to}
                          </p>
                          <p className="text-xs font-mono text-slate-500">
                            {p.trackingNumber || p._id}
                          </p>
                        </td>
                        <td className="px-5 py-4 uppercase text-xs font-semibold text-slate-500">
                          {p.paymentMethod || "card"}
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                              ps === "paid"
                                ? "bg-emerald-500/15 text-emerald-500"
                                : ps === "refunded"
                                ? "bg-rose-500/15 text-rose-500"
                                : "bg-amber-500/15 text-amber-500"
                            }`}
                          >
                            {ps}
                          </span>
                        </td>
                        <td className="px-5 py-4 font-mono font-bold">
                          {formatCurrency(p.cost)}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            onClick={() => setSelectedReceipt(p)}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-amber-500 hover:underline"
                          >
                            <Receipt className="w-3.5 h-3.5" />
                            View Receipt
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
      <Footer />

      {/* Printable Receipt Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white text-slate-900 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 bg-slate-900 text-white no-print">
              <span className="text-sm font-bold flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-400" />
                Payment Receipt
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-400 text-slate-950 text-xs font-bold"
                >
                  <Printer className="w-3.5 h-3.5" /> Print
                </button>
                <button
                  onClick={() => setSelectedReceipt(null)}
                  className="p-1.5 rounded-lg hover:bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="printable-area p-6 space-y-5">
              <div className="flex justify-between items-start border-b border-slate-200 pb-4">
                <div>
                  <h2 className="text-xl font-black">
                    SEND<span className="text-amber-500">IT</span> LOGISTICS
                  </h2>
                  <p className="text-xs text-slate-500">
                    Official Shipping Tax Receipt
                  </p>
                </div>
                <div className="text-right font-mono text-xs">
                  <p className="font-bold">
                    INV-
                    {(
                      selectedReceipt.trackingNumber || selectedReceipt._id
                    ).slice(-6)}
                  </p>
                  <p className="text-slate-500">{selectedReceipt.date}</p>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Billed To</span>
                  <span className="font-semibold">
                    {selectedReceipt.sendername}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tracking Number</span>
                  <span className="font-mono font-semibold">
                    {selectedReceipt.trackingNumber || selectedReceipt._id}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Route</span>
                  <span className="font-semibold">
                    {selectedReceipt.from} → {selectedReceipt.to}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Service Tier / Weight</span>
                  <span className="capitalize">
                    {selectedReceipt.serviceTier || "standard"} •{" "}
                    {selectedReceipt.weight} kg
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Payment Method</span>
                  <span className="uppercase font-semibold">
                    {selectedReceipt.paymentMethod || "card"} (
                    {selectedReceipt.paymentStatus || "paid"})
                  </span>
                </div>
              </div>

              <div className="border-t-2 border-slate-900 pt-4 flex justify-between items-center">
                <span className="font-bold text-base">Total Charged</span>
                <span className="font-mono text-2xl font-black">
                  {formatCurrency(selectedReceipt.cost)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Statements;
