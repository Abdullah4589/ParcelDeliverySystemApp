import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search,
  ArrowRight,
  Zap,
  Shield,
  Globe2,
  Clock,
  Calculator,
  Package,
  Truck,
  CheckCircle2,
  Sparkles,
  Box,
} from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { publicRequest } from "../requestMethods";
import { formatCurrency } from "../utils/parcelHelpers";

const TIERS = [
  {
    id: "economy",
    name: "Economy Ground",
    eta: "5–7 business days",
    multiplier: 0.85,
    desc: "Budget-friendly shipping for non-urgent personal & retail parcels.",
    badge: "Best Value",
  },
  {
    id: "standard",
    name: "Standard Tracked",
    eta: "3–4 business days",
    multiplier: 1.0,
    desc: "Balanced speed and price with full milestone tracking included.",
    badge: "Most Popular",
  },
  {
    id: "express",
    name: "Express Air",
    eta: "1–2 business days",
    multiplier: 1.55,
    desc: "Priority air routing for time-critical documents & business freight.",
    badge: "Fast",
  },
  {
    id: "overnight",
    name: "Overnight Priority",
    eta: "Next morning by 10 AM",
    multiplier: 2.25,
    desc: "Guaranteed next-day courier delivery with direct hub handoff.",
    badge: "Fastest",
  },
];

const Home = () => {
  const navigate = useNavigate();
  const [trackingCode, setTrackingCode] = useState("");

  // Interactive Rate Calculator state
  const [calc, setCalc] = useState({
    from: "New York, NY",
    to: "Chicago, IL",
    weight: 3.5,
    length: 30,
    width: 20,
    height: 15,
    parcelType: "standard",
    serviceTier: "express",
    insuranceEnabled: false,
    declaredValue: 250,
  });
  const [quote, setQuote] = useState(null);
  const [calcLoading, setCalcLoading] = useState(false);

  const handleTrackSubmit = (e) => {
    e.preventDefault();
    if (!trackingCode.trim()) return;
    navigate(`/track/${encodeURIComponent(trackingCode.trim())}`);
  };

  const computeFallbackQuote = (c) => {
    const w = Math.max(0.1, Number(c.weight) || 1);
    const vol = ((Number(c.length) || 20) * (Number(c.width) || 15) * (Number(c.height) || 10)) / 5000;
    const chargeable = Math.max(w, vol);
    const mult = TIERS.find((t) => t.id === c.serviceTier)?.multiplier || 1;
    const surcharge =
      c.parcelType === "fragile" ? 6 : c.parcelType === "perishable" ? 8 : c.parcelType === "electronics" ? 5 : 0;
    const ins = c.insuranceEnabled ? Math.max(3, Number(((Number(c.declaredValue) || 0) * 0.02).toFixed(2))) : 0;
    const total = Number(((8 + chargeable * 3.5) * mult + surcharge + ins).toFixed(2));
    const days = { overnight: 1, express: 2, standard: 4, economy: 7 }[c.serviceTier] || 4;
    const eta = new Date();
    eta.setDate(eta.getDate() + days);
    return {
      chargeableWeight: Number(chargeable.toFixed(2)),
      baseFee: 8,
      weightCharge: Number((chargeable * 3.5).toFixed(2)),
      tierMultiplier: mult,
      handlingSurcharge: surcharge,
      insuranceFee: ins,
      total,
      transitDays: days,
      estimatedDelivery: eta.toISOString().split("T")[0],
    };
  };

  const handleCalculate = async (e) => {
    e.preventDefault();
    setCalcLoading(true);
    try {
      const res = await publicRequest.post("/parcels/quote", calc);
      setQuote(res.data);
    } catch {
      setQuote(computeFallbackQuote(calc));
    } finally {
      setCalcLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* HERO SECTION */}
      <section className="relative overflow-hidden border-b border-slate-200 dark:border-slate-800/80">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-500/15 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 relative">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-600 dark:text-amber-300 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                Next-Gen Parcel Logistics • Live Checkpoint Tracking
              </div>

              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.08]">
                Ship Smarter. <br />
                Track Every{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">
                  Single Mile.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-xl leading-relaxed">
                Fast, transparent, and fully insured parcel delivery for
                individuals and businesses. Book pickups online, print waybills
                instantly, and follow live courier scans in real time.
              </p>

              {/* Instant Tracking Box */}
              <form
                onSubmit={handleTrackSubmit}
                className="glass-card p-2 flex flex-col sm:flex-row gap-2 max-w-xl shadow-xl shadow-slate-950/10"
              >
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={trackingCode}
                    onChange={(e) => setTrackingCode(e.target.value)}
                    placeholder="Enter Tracking ID (e.g. SND-2026-AX94K2)"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-transparent text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none font-mono"
                  />
                </div>
                <button type="submit" className="btn-primary py-3 px-6 shrink-0">
                  Track Parcel
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-500 dark:text-slate-400 pt-1">
                <span>Try sample ID:</span>
                <button
                  type="button"
                  onClick={() => setTrackingCode("SND-2026-AX94K2")}
                  className="font-mono font-semibold text-amber-600 dark:text-amber-400 hover:underline"
                >
                  SND-2026-AX94K2
                </button>
                <button
                  type="button"
                  onClick={() => setTrackingCode("SND-2026-PR39V5")}
                  className="font-mono font-semibold text-amber-600 dark:text-amber-400 hover:underline"
                >
                  SND-2026-PR39V5
                </button>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-4 max-w-lg">
                <div>
                  <p className="font-display text-2xl font-extrabold text-slate-900 dark:text-white">
                    99.4%
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    On-time SLA
                  </p>
                </div>
                <div>
                  <p className="font-display text-2xl font-extrabold text-slate-900 dark:text-white">
                    180+
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Global Hubs
                  </p>
                </div>
                <div>
                  <p className="font-display text-2xl font-extrabold text-slate-900 dark:text-white">
                    24/7
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Live Dispatch
                  </p>
                </div>
              </div>
            </div>

            {/* Hero Visual Card */}
            <div className="lg:col-span-5">
              <div className="relative glass-card p-6 space-y-5 shadow-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-amber-400/15 text-amber-500 flex items-center justify-center">
                      <Truck className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Live Shipment Telemetry
                      </p>
                      <p className="font-mono font-bold text-sm">
                        SND-2026-AX94K2
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/15 text-indigo-500 dark:text-indigo-300 border border-indigo-500/30">
                    In Transit
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <p className="text-slate-500">Origin</p>
                      <p className="font-semibold text-sm">New York, NY</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-amber-500" />
                    <div className="text-right">
                      <p className="text-slate-500">Destination</p>
                      <p className="font-semibold text-sm">Chicago, IL</p>
                    </div>
                  </div>
                  <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full w-3/4 bg-gradient-to-r from-amber-400 to-emerald-400 rounded-full" />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>Cleveland Sorting Hub, OH</span>
                    <span className="font-semibold text-emerald-500">
                      Express Air • Insured
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                    <Zap className="w-4 h-4 text-amber-500 mx-auto mb-1" />
                    <p className="text-xs font-semibold">Instant Quote</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                    <Shield className="w-4 h-4 text-emerald-500 mx-auto mb-1" />
                    <p className="text-xs font-semibold">Full Coverage</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                    <Globe2 className="w-4 h-4 text-sky-500 mx-auto mb-1" />
                    <p className="text-xs font-semibold">Worldwide</p>
                  </div>
                </div>

                <Link to="/book" className="btn-primary w-full py-3">
                  Book a New Shipment
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* INTERACTIVE SHIPPING RATE CALCULATOR */}
      <section
        id="calculator"
        className="py-16 lg:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full"
      >
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-amber-500">
              Transparent Pricing
            </span>
            <h2 className="font-display text-3xl font-extrabold mt-1">
              Instant Shipping Rate Calculator
            </h2>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md">
            Calculate exact shipping costs including volumetric weight, special
            handling, and optional transit insurance before you book.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form
            onSubmit={handleCalculate}
            className="lg:col-span-8 glass-card p-6 space-y-5"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                  Origin City / Country
                </label>
                <input
                  type="text"
                  value={calc.from}
                  onChange={(e) => setCalc({ ...calc, from: e.target.value })}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                  Destination City / Country
                </label>
                <input
                  type="text"
                  value={calc.to}
                  onChange={(e) => setCalc({ ...calc, to: e.target.value })}
                  className="input-field"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                  Weight (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={calc.weight}
                  onChange={(e) => setCalc({ ...calc, weight: e.target.value })}
                  className="input-field font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                  Length (cm)
                </label>
                <input
                  type="number"
                  min="1"
                  value={calc.length}
                  onChange={(e) => setCalc({ ...calc, length: e.target.value })}
                  className="input-field font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                  Width (cm)
                </label>
                <input
                  type="number"
                  min="1"
                  value={calc.width}
                  onChange={(e) => setCalc({ ...calc, width: e.target.value })}
                  className="input-field font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                  Height (cm)
                </label>
                <input
                  type="number"
                  min="1"
                  value={calc.height}
                  onChange={(e) => setCalc({ ...calc, height: e.target.value })}
                  className="input-field font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                  Service Tier
                </label>
                <select
                  value={calc.serviceTier}
                  onChange={(e) =>
                    setCalc({ ...calc, serviceTier: e.target.value })
                  }
                  className="input-field"
                >
                  <option value="economy">Economy Ground (5–7 days)</option>
                  <option value="standard">Standard Tracked (3–4 days)</option>
                  <option value="express">Express Air (1–2 days)</option>
                  <option value="overnight">Overnight Priority (Next Day)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                  Package Type
                </label>
                <select
                  value={calc.parcelType}
                  onChange={(e) =>
                    setCalc({ ...calc, parcelType: e.target.value })
                  }
                  className="input-field"
                >
                  <option value="document">Document / Envelope</option>
                  <option value="standard">Standard Box</option>
                  <option value="fragile">Fragile (+$6 handling)</option>
                  <option value="electronics">Electronics (+$5 handling)</option>
                  <option value="perishable">Perishable (+$8 cold chain)</option>
                  <option value="oversized">Oversized (+$12 freight)</option>
                </select>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-200 dark:border-slate-800">
              <label className="inline-flex items-center gap-2.5 cursor-pointer text-sm">
                <input
                  type="checkbox"
                  checked={calc.insuranceEnabled}
                  onChange={(e) =>
                    setCalc({ ...calc, insuranceEnabled: e.target.checked })
                  }
                  className="w-4 h-4 accent-amber-400 rounded"
                />
                <span>Add Transit Insurance (2% of declared value)</span>
              </label>

              {calc.insuranceEnabled && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Value ($):</span>
                  <input
                    type="number"
                    min="50"
                    value={calc.declaredValue}
                    onChange={(e) =>
                      setCalc({ ...calc, declaredValue: e.target.value })
                    }
                    className="input-field w-28 py-1.5 font-mono"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={calcLoading}
                className="btn-primary ml-auto"
              >
                <Calculator className="w-4 h-4" />
                {calcLoading ? "Calculating..." : "Calculate Rate"}
              </button>
            </div>
          </form>

          {/* Quote Result Card */}
          <div className="lg:col-span-4 glass-card p-6 flex flex-col justify-between bg-gradient-to-b from-amber-500/10 to-transparent">
            {quote ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-500">
                    Estimated Rate
                  </span>
                  <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-500 font-semibold">
                    ETA: {quote.estimatedDelivery}
                  </span>
                </div>

                <div>
                  <p className="font-display text-4xl font-extrabold text-slate-900 dark:text-white">
                    {formatCurrency(quote.total)}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Chargeable weight: {quote.chargeableWeight} kg •{" "}
                    {quote.transitDays} day(s) transit
                  </p>
                </div>

                <div className="space-y-2 text-sm border-t border-slate-200 dark:border-slate-800 pt-4">
                  <div className="flex justify-between text-slate-600 dark:text-slate-300">
                    <span>Base + Weight Fee</span>
                    <span className="font-mono">
                      {formatCurrency(
                        (quote.baseFee + quote.weightCharge) *
                          quote.tierMultiplier
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-300">
                    <span>Special Handling</span>
                    <span className="font-mono">
                      {formatCurrency(quote.handlingSurcharge)}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-300">
                    <span>Transit Insurance</span>
                    <span className="font-mono">
                      {formatCurrency(quote.insuranceFee)}
                    </span>
                  </div>
                </div>

                <Link
                  to="/book"
                  state={{ prefill: calc, quote }}
                  className="btn-primary w-full py-3 mt-2"
                >
                  Ship with This Quote
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center py-6 space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-amber-400/15 text-amber-500 flex items-center justify-center">
                  <Box className="w-7 h-7" />
                </div>
                <h3 className="font-display font-bold text-lg">
                  Ready for Your Estimate
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs">
                  Enter your package weight, dimensions, and preferred delivery
                  tier to get an instant breakdown.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* SERVICE TIERS */}
      <section className="py-16 border-t border-slate-200 dark:border-slate-800/80 bg-slate-100/60 dark:bg-slate-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-500">
              Delivery Options
            </span>
            <h2 className="font-display text-3xl font-extrabold mt-1">
              Built for Every Urgency & Budget
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {TIERS.map((tier) => (
              <div
                key={tier.id}
                className="glass-card p-6 flex flex-col justify-between hover:border-amber-400/50 transition"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-400/15 text-amber-600 dark:text-amber-300">
                      {tier.badge}
                    </span>
                    <Clock className="w-4 h-4 text-slate-400" />
                  </div>
                  <h3 className="font-display font-bold text-lg">{tier.name}</h3>
                  <p className="text-xs font-mono text-amber-500 font-semibold mt-1">
                    {tier.eta}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-3 leading-relaxed">
                    {tier.desc}
                  </p>
                </div>
                <Link
                  to="/book"
                  state={{ prefill: { serviceTier: tier.id } }}
                  className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-amber-500 hover:text-amber-400"
                >
                  Select tier <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: Package,
              step: "01",
              title: "Book & Print Label",
              desc: "Create a shipment online in 60 seconds, save frequent recipients, and print a barcoded waybill.",
            },
            {
              icon: Truck,
              step: "02",
              title: "Doorstep Pickup & Live Scans",
              desc: "Our couriers collect your parcel and scan every hub milestone so you never lose sight.",
            },
            {
              icon: CheckCircle2,
              step: "03",
              title: "Verified Delivery & Receipt",
              desc: "Instant email confirmations, digital statements, and delivery ratings all in your dashboard.",
            },
          ].map((item) => (
            <div key={item.step} className="glass-card p-6 space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-11 h-11 rounded-xl bg-amber-400/15 text-amber-500 flex items-center justify-center">
                  <item.icon className="w-5 h-5" />
                </div>
                <span className="font-mono text-2xl font-bold text-slate-300 dark:text-slate-700">
                  {item.step}
                </span>
              </div>
              <h3 className="font-display font-bold text-lg">{item.title}</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Home;
