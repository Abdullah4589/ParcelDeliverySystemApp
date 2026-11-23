import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useLocation, useNavigate, Link } from "react-router-dom";
import {
  Package,
  MapPin,
  Shield,
  CreditCard,
  ArrowRight,
  BookUser,
  Sparkles,
  ArrowLeft,
} from "lucide-react";
import { toast } from "react-toastify";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { publicRequest } from "../requestMethods";
import { formatCurrency } from "../utils/parcelHelpers";

const TIERS = [
  { id: "economy", label: "Economy", days: "5–7 days", mult: 0.85 },
  { id: "standard", label: "Standard", days: "3–4 days", mult: 1.0 },
  { id: "express", label: "Express Air", days: "1–2 days", mult: 1.55 },
  { id: "overnight", label: "Overnight", days: "Next Day", mult: 2.25 },
];

const BookParcel = () => {
  const { currentUser } = useSelector((state) => state.user);
  const location = useLocation();
  const navigate = useNavigate();
  const prefill = location.state?.prefill || {};

  const [savedAddresses, setSavedAddresses] = useState(
    currentUser?.savedAddresses || []
  );
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    from: prefill.from || currentUser?.address || "",
    to: prefill.to || "",
    sendername: currentUser?.fullname || "",
    senderemail: currentUser?.email || "",
    senderphone: currentUser?.phone || "",
    recipientname: "",
    recipientemail: "",
    recipientphone: "",
    weight: prefill.weight || 2,
    length: prefill.length || 25,
    width: prefill.width || 20,
    height: prefill.height || 15,
    parcelType: prefill.parcelType || "standard",
    serviceTier: prefill.serviceTier || "standard",
    insuranceEnabled: Boolean(prefill.insuranceEnabled),
    declaredValue: prefill.declaredValue || 200,
    paymentMethod: "card",
    date: new Date().toISOString().split("T")[0],
    note: "",
  });

  const [quote, setQuote] = useState(null);

  // Refresh saved addresses from API
  useEffect(() => {
    const loadProfile = async () => {
      if (!currentUser?._id) return;
      try {
        const res = await publicRequest.get(`/users/${currentUser._id}`);
        if (res.data?.savedAddresses) {
          setSavedAddresses(res.data.savedAddresses);
        }
      } catch {
        // fallback to redux copy
      }
    };
    loadProfile();
  }, [currentUser?._id]);

  // Live quote calculation
  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        const res = await publicRequest.post("/parcels/quote", {
          weight: form.weight,
          length: form.length,
          width: form.width,
          height: form.height,
          parcelType: form.parcelType,
          serviceTier: form.serviceTier,
          insuranceEnabled: form.insuranceEnabled,
          declaredValue: form.declaredValue,
        });
        setQuote(res.data);
      } catch {
        // local fallback calculation
        const w = Math.max(0.1, Number(form.weight) || 1);
        const vol =
          ((Number(form.length) || 20) *
            (Number(form.width) || 15) *
            (Number(form.height) || 10)) /
          5000;
        const ch = Math.max(w, vol);
        const mult =
          TIERS.find((t) => t.id === form.serviceTier)?.mult || 1.0;
        const surcharge =
          form.parcelType === "fragile"
            ? 6
            : form.parcelType === "perishable"
            ? 8
            : form.parcelType === "electronics"
            ? 5
            : form.parcelType === "oversized"
            ? 12
            : 0;
        const ins = form.insuranceEnabled
          ? Math.max(3, Number(((Number(form.declaredValue) || 0) * 0.02).toFixed(2)))
          : 0;
        const total = Number(((8 + ch * 3.5) * mult + surcharge + ins).toFixed(2));
        setQuote({
          chargeableWeight: Number(ch.toFixed(2)),
          handlingSurcharge: surcharge,
          insuranceFee: ins,
          total,
          estimatedDelivery: "Calculated at dispatch",
        });
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [
    form.weight,
    form.length,
    form.width,
    form.height,
    form.parcelType,
    form.serviceTier,
    form.insuranceEnabled,
    form.declaredValue,
  ]);

  const applySavedAddress = (addr) => {
    setForm((prev) => ({
      ...prev,
      recipientname: addr.recipientName,
      recipientemail: addr.email || prev.recipientemail,
      recipientphone: addr.phone || prev.recipientphone,
      to: [addr.address, addr.city, addr.country].filter(Boolean).join(", "),
    }));
    toast.info(`Filled recipient from "${addr.label}"`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        from: form.from,
        to: form.to,
        sendername: form.sendername,
        senderemail: form.senderemail,
        senderphone: form.senderphone,
        recipientname: form.recipientname,
        recipientemail: form.recipientemail,
        recipientphone: form.recipientphone,
        weight: Number(form.weight),
        dimensions: {
          length: Number(form.length),
          width: Number(form.width),
          height: Number(form.height),
        },
        parcelType: form.parcelType,
        serviceTier: form.serviceTier,
        insurance: {
          enabled: form.insuranceEnabled,
          declaredValue: form.insuranceEnabled ? Number(form.declaredValue) : 0,
          fee: quote?.insuranceFee || 0,
        },
        cost: quote?.total || 15,
        paymentMethod: form.paymentMethod,
        paymentStatus: form.paymentMethod === "cod" ? "unpaid" : "paid",
        date: form.date,
        estimatedDelivery: quote?.estimatedDelivery,
        note: form.note,
      };

      const res = await publicRequest.post("/parcels", payload);
      toast.success(
        `Shipment booked! Tracking ID: ${res.data.trackingNumber}`
      );
      navigate(`/parcel/${res.data._id}`);
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Failed to book shipment. Try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Link
              to="/myparcels"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-amber-500 mb-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
            </Link>
            <h1 className="font-display text-3xl font-extrabold">
              Book a New Shipment
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Instant tracking number, live rate calculation, and printable
              shipping waybill.
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 lg:grid-cols-12 gap-6"
        >
          {/* Left Form Columns */}
          <div className="lg:col-span-8 space-y-6">
            {/* Saved Address Quick Picker */}
            {savedAddresses.length > 0 && (
              <div className="glass-card p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="font-display font-bold text-sm flex items-center gap-2">
                    <BookUser className="w-4 h-4 text-amber-500" />
                    Quick Fill from Address Book
                  </h2>
                  <Link
                    to="/profile"
                    className="text-xs text-amber-500 hover:underline"
                  >
                    Manage addresses
                  </Link>
                </div>
                <div className="flex flex-wrap gap-2">
                  {savedAddresses.map((addr) => (
                    <button
                      type="button"
                      key={addr._id}
                      onClick={() => applySavedAddress(addr)}
                      className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 hover:border-amber-400 text-left transition"
                    >
                      <p className="text-xs font-bold">{addr.label}</p>
                      <p className="text-[11px] text-slate-500">
                        {addr.recipientName} • {addr.city || addr.address}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Route & Contacts */}
            <div className="glass-card p-6 space-y-5">
              <h2 className="font-display font-bold text-base flex items-center gap-2">
                <MapPin className="w-4 h-4 text-amber-500" />
                Sender & Recipient Details
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                    Pickup Origin *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.from}
                    onChange={(e) => setForm({ ...form, from: e.target.value })}
                    placeholder="New York, NY"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                    Delivery Destination *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.to}
                    onChange={(e) => setForm({ ...form, to: e.target.value })}
                    placeholder="Chicago, IL"
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                    Sender Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.sendername}
                    onChange={(e) =>
                      setForm({ ...form, sendername: e.target.value })
                    }
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                    Recipient Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.recipientname}
                    onChange={(e) =>
                      setForm({ ...form, recipientname: e.target.value })
                    }
                    placeholder="Maya Chen"
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                    Sender Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={form.senderemail}
                    onChange={(e) =>
                      setForm({ ...form, senderemail: e.target.value })
                    }
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                    Recipient Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={form.recipientemail}
                    onChange={(e) =>
                      setForm({ ...form, recipientemail: e.target.value })
                    }
                    placeholder="recipient@example.com"
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                    Sender Phone
                  </label>
                  <input
                    type="tel"
                    value={form.senderphone}
                    onChange={(e) =>
                      setForm({ ...form, senderphone: e.target.value })
                    }
                    placeholder="+1 (555) 111-2222"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                    Recipient Phone
                  </label>
                  <input
                    type="tel"
                    value={form.recipientphone}
                    onChange={(e) =>
                      setForm({ ...form, recipientphone: e.target.value })
                    }
                    placeholder="+1 (555) 333-4444"
                    className="input-field"
                  />
                </div>
              </div>
            </div>

            {/* Package Specs & Tier */}
            <div className="glass-card p-6 space-y-5">
              <h2 className="font-display font-bold text-base flex items-center gap-2">
                <Package className="w-4 h-4 text-amber-500" />
                Package Specifications & Service Tier
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {TIERS.map((t) => (
                  <button
                    type="button"
                    key={t.id}
                    onClick={() => setForm({ ...form, serviceTier: t.id })}
                    className={`p-3.5 rounded-xl border text-left transition ${
                      form.serviceTier === t.id
                        ? "border-amber-400 bg-amber-400/15 ring-2 ring-amber-400/20"
                        : "border-slate-200 dark:border-slate-800 hover:border-slate-400"
                    }`}
                  >
                    <p className="font-display font-bold text-sm">{t.label}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {t.days}
                    </p>
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                    Weight (kg) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    required
                    value={form.weight}
                    onChange={(e) =>
                      setForm({ ...form, weight: e.target.value })
                    }
                    className="input-field font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                    Length (cm)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={form.length}
                    onChange={(e) =>
                      setForm({ ...form, length: e.target.value })
                    }
                    className="input-field font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                    Width (cm)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={form.width}
                    onChange={(e) =>
                      setForm({ ...form, width: e.target.value })
                    }
                    className="input-field font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                    Height (cm)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={form.height}
                    onChange={(e) =>
                      setForm({ ...form, height: e.target.value })
                    }
                    className="input-field font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                    Parcel Category
                  </label>
                  <select
                    value={form.parcelType}
                    onChange={(e) =>
                      setForm({ ...form, parcelType: e.target.value })
                    }
                    className="input-field"
                  >
                    <option value="document">Document / Envelope</option>
                    <option value="standard">Standard Parcel</option>
                    <option value="fragile">Fragile (+$6 handling)</option>
                    <option value="electronics">Electronics (+$5)</option>
                    <option value="perishable">Perishable (+$8)</option>
                    <option value="oversized">Oversized (+$12)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                    Pickup Date
                  </label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                  Delivery Instructions / Contents Note
                </label>
                <textarea
                  rows={3}
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                  placeholder="e.g., Fragile glassware — leave at front concierge if unavailable"
                  className="input-field"
                />
              </div>
            </div>
          </div>

          {/* Right Summary Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            <div className="glass-card p-6 space-y-5 sticky top-24">
              <h2 className="font-display font-bold text-base flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                Order Summary
              </h2>

              {/* Insurance Toggle */}
              <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="inline-flex items-center gap-2 text-sm font-medium">
                    <Shield className="w-4 h-4 text-emerald-500" />
                    Transit Insurance
                  </span>
                  <input
                    type="checkbox"
                    checked={form.insuranceEnabled}
                    onChange={(e) =>
                      setForm({ ...form, insuranceEnabled: e.target.checked })
                    }
                    className="w-4 h-4 accent-amber-400"
                  />
                </label>
                {form.insuranceEnabled && (
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">
                      Declared Value ($)
                    </label>
                    <input
                      type="number"
                      min="50"
                      value={form.declaredValue}
                      onChange={(e) =>
                        setForm({ ...form, declaredValue: e.target.value })
                      }
                      className="input-field py-1.5 font-mono"
                    />
                  </div>
                )}
              </div>

              {/* Payment Method */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5" />
                  Payment Method
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "card", label: "Credit Card" },
                    { id: "wallet", label: "SendIT Wallet" },
                    { id: "cod", label: "Cash on Delivery" },
                    { id: "invoice", label: "Corporate Invoice" },
                  ].map((pm) => (
                    <button
                      type="button"
                      key={pm.id}
                      onClick={() => setForm({ ...form, paymentMethod: pm.id })}
                      className={`px-3 py-2 rounded-xl border text-xs font-semibold transition ${
                        form.paymentMethod === pm.id
                          ? "border-amber-400 bg-amber-400/15 text-amber-600 dark:text-amber-300"
                          : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      {pm.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="border-t border-slate-200 dark:border-slate-800 pt-4 space-y-2 text-sm">
                <div className="flex justify-between text-slate-500">
                  <span>Chargeable Weight</span>
                  <span className="font-mono">
                    {quote?.chargeableWeight || form.weight} kg
                  </span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Handling Surcharge</span>
                  <span className="font-mono">
                    {formatCurrency(quote?.handlingSurcharge || 0)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Insurance Fee</span>
                  <span className="font-mono">
                    {formatCurrency(quote?.insuranceFee || 0)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Estimated Delivery</span>
                  <span className="font-mono text-emerald-500 font-semibold">
                    {quote?.estimatedDelivery || "—"}
                  </span>
                </div>
                <div className="flex justify-between items-baseline pt-3 border-t border-slate-200 dark:border-slate-800">
                  <span className="font-display font-bold text-base">
                    Total
                  </span>
                  <span className="font-display text-3xl font-extrabold text-amber-500">
                    {formatCurrency(quote?.total || 0)}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="btn-primary w-full py-3.5 text-base"
              >
                {submitting ? "Booking Shipment..." : "Confirm & Book Parcel"}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </form>
      </main>
      <Footer />
    </div>
  );
};

export default BookParcel;
