import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  Search,
  MapPin,
  Package,
  Calendar,
  Truck,
  Share2,
  ArrowRight,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";
import { toast } from "react-toastify";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import {
  StageBadge,
  TrackingStepper,
  TrackingTimeline,
} from "../components/TrackingStepper";
import { publicRequest } from "../requestMethods";
import { formatCurrency } from "../utils/parcelHelpers";

const TrackParcel = () => {
  const { code } = useParams();
  const navigate = useNavigate();
  const [query, setQuery] = useState(code || "");
  const [parcel, setParcel] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchTracking = async (trackCode) => {
    if (!trackCode?.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await publicRequest.get(
        `/parcels/track/${encodeURIComponent(trackCode.trim())}`
      );
      setParcel(res.data);
    } catch (err) {
      setParcel(null);
      setError(
        err.response?.data?.message ||
          `We couldn't find a shipment matching "${trackCode}".`
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (code) {
      setQuery(code);
      fetchTracking(code);
    }
  }, [code]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    navigate(`/track/${encodeURIComponent(query.trim())}`);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Tracking link copied to clipboard!");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Search Header */}
        <div className="glass-card p-6 sm:p-8 space-y-5">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-500">
              Live Satellite & Hub Telemetry
            </span>
            <h1 className="font-display text-3xl font-extrabold">
              Track Your Shipment
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Enter your SendIT tracking number (e.g.{" "}
              <span className="font-mono text-amber-500">SND-2026-AX94K2</span>)
              or parcel ID to see live checkpoints.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="flex flex-col sm:flex-row gap-3"
          >
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter tracking number..."
                className="input-field pl-10 font-mono"
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary px-6">
              {loading ? "Searching..." : "Track Now"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        {error && (
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {parcel && (
          <div className="space-y-6">
            {/* Summary + Stepper */}
            <div className="glass-card p-6 sm:p-8 space-y-6">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
                    Tracking Number
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    <h2 className="font-mono text-2xl font-bold text-slate-900 dark:text-white">
                      {parcel.trackingNumber || parcel._id}
                    </h2>
                    <StageBadge parcel={parcel} />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button onClick={handleCopyLink} className="btn-secondary">
                    <Share2 className="w-4 h-4" />
                    Share Link
                  </button>
                  <Link to={`/parcel/${parcel._id}`} className="btn-primary">
                    Full Details
                  </Link>
                </div>
              </div>

              <TrackingStepper parcel={parcel} />

              {/* Key Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                <div className="p-4 rounded-xl bg-slate-100/80 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                  <p className="text-xs text-slate-500 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-amber-500" />
                    Current Location
                  </p>
                  <p className="font-semibold text-sm mt-1">
                    {parcel.currentLocation || parcel.from}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-slate-100/80 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                  <p className="text-xs text-slate-500 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                    Est. Delivery
                  </p>
                  <p className="font-mono font-semibold text-sm mt-1">
                    {parcel.estimatedDelivery || "—"}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-slate-100/80 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                  <p className="text-xs text-slate-500 flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5 text-sky-500" />
                    Weight / Tier
                  </p>
                  <p className="font-semibold text-sm mt-1 capitalize">
                    {parcel.weight} kg • {parcel.serviceTier || "standard"}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-slate-100/80 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                  <p className="text-xs text-slate-500 flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-indigo-500" />
                    Assigned Courier
                  </p>
                  <p className="font-semibold text-sm mt-1">
                    {parcel.assignedDriver || "Pending Dispatch"}
                  </p>
                </div>
              </div>
            </div>

            {/* Route + Timeline */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-4 glass-card p-6 space-y-4 h-fit">
                <h3 className="font-display font-bold text-base">
                  Route & Package Info
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-950/60">
                    <p className="text-[11px] uppercase text-slate-500 font-bold">
                      Origin
                    </p>
                    <p className="font-semibold">{parcel.from}</p>
                    <p className="text-xs text-slate-500">{parcel.sendername}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-950/60">
                    <p className="text-[11px] uppercase text-slate-500 font-bold">
                      Destination
                    </p>
                    <p className="font-semibold">{parcel.to}</p>
                    <p className="text-xs text-slate-500">
                      {parcel.recipientname}
                    </p>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
                    <span className="text-slate-500">Parcel Type</span>
                    <span className="font-medium capitalize">
                      {parcel.parcelType || "Standard"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Declared Cost</span>
                    <span className="font-mono font-semibold">
                      {formatCurrency(parcel.cost)}
                    </span>
                  </div>
                  {parcel.insurance?.enabled && (
                    <div className="flex items-center gap-2 text-xs text-emerald-500 bg-emerald-500/10 p-2.5 rounded-lg">
                      <ShieldCheck className="w-4 h-4 shrink-0" />
                      Insured up to {formatCurrency(parcel.insurance.declaredValue)}
                    </div>
                  )}
                </div>
              </div>

              <div className="lg:col-span-8 glass-card p-6 space-y-4">
                <h3 className="font-display font-bold text-base">
                  Shipment Checkpoint History
                </h3>
                <TrackingTimeline history={parcel.trackingHistory} />
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default TrackParcel;
