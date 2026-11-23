import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Printer,
  Copy,
  Star,
  MapPin,
  Package,
  Truck,
  Calendar,
  CreditCard,
  ShieldCheck,
  XCircle,
  Send,
} from "lucide-react";
import { toast } from "react-toastify";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ShippingLabelModal from "../components/ShippingLabelModal";
import {
  StageBadge,
  TrackingStepper,
  TrackingTimeline,
} from "../components/TrackingStepper";
import { publicRequest } from "../requestMethods";
import { formatCurrency, resolveStage } from "../utils/parcelHelpers";

const Parcel = () => {
  const { id } = useParams();
  const [parcel, setParcel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showLabel, setShowLabel] = useState(false);

  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState("");
  const [savingFeedback, setSavingFeedback] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    const getParcel = async () => {
      setLoading(true);
      try {
        const res = await publicRequest.get(`/parcels/find/${id}`);
        setParcel(res.data);
        if (res.data?.feedback) setFeedback(res.data.feedback);
        if (res.data?.rating) setRating(res.data.rating);
      } catch (error) {
        console.error(error);
        toast.error("Could not load parcel details.");
      } finally {
        setLoading(false);
      }
    };
    getParcel();
  }, [id]);

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!feedback.trim()) {
      toast.warning("Please enter a short review before submitting.");
      return;
    }
    setSavingFeedback(true);
    try {
      const res = await publicRequest.post(`/parcels/${parcel._id}/feedback`, {
        feedback: feedback.trim(),
        rating,
      });
      setParcel(res.data);
      toast.success("Thank you! Your delivery feedback has been saved.");
    } catch {
      toast.error("Failed to save feedback.");
    } finally {
      setSavingFeedback(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm("Are you sure you want to cancel this shipment?"))
      return;
    setCancelling(true);
    try {
      const res = await publicRequest.put(`/parcels/${parcel._id}`, {
        stage: "cancelled",
        paymentStatus: "refunded",
        updatedBy: "Customer",
      });
      setParcel(res.data);
      toast.info("Shipment cancelled.");
    } catch {
      toast.error("Failed to cancel shipment.");
    } finally {
      setCancelling(false);
    }
  };

  const code = parcel?.trackingNumber || parcel?._id || "";
  const stage = resolveStage(parcel);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            to="/myparcels"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-amber-500"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to My Parcels
          </Link>

          {parcel && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(code);
                  toast.success("Tracking ID copied!");
                }}
                className="btn-secondary"
              >
                <Copy className="w-4 h-4" />
                Copy ID
              </button>
              <button
                onClick={() => setShowLabel(true)}
                className="btn-primary"
              >
                <Printer className="w-4 h-4" />
                Shipping Label
              </button>
              {stage === "pending" && (
                <button
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-500 text-sm font-semibold hover:bg-rose-500/20 transition"
                >
                  <XCircle className="w-4 h-4" />
                  {cancelling ? "Cancelling..." : "Cancel Order"}
                </button>
              )}
            </div>
          )}
        </div>

        {loading ? (
          <div className="glass-card p-12 text-center text-slate-500">
            Loading shipment details...
          </div>
        ) : !parcel ? (
          <div className="glass-card p-12 text-center text-slate-500">
            Parcel not found.
          </div>
        ) : (
          <>
            {/* Top Banner & Stepper */}
            <div className="glass-card p-6 sm:p-8 space-y-6">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
                    Shipment Tracking Code
                  </p>
                  <div className="flex flex-wrap items-center gap-3 mt-1">
                    <h1 className="font-mono text-2xl sm:text-3xl font-extrabold">
                      {code}
                    </h1>
                    <StageBadge parcel={parcel} />
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-xs text-slate-500">Total Paid</p>
                  <p className="font-display text-2xl font-extrabold text-amber-500">
                    {formatCurrency(parcel.cost)}
                  </p>
                  <p className="text-xs text-slate-500 capitalize">
                    {parcel.paymentStatus || "paid"} via{" "}
                    {parcel.paymentMethod || "card"}
                  </p>
                </div>
              </div>

              <TrackingStepper parcel={parcel} />

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-950/60">
                  <p className="text-xs text-slate-500 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-amber-500" /> Current Hub
                  </p>
                  <p className="font-semibold text-sm mt-1">
                    {parcel.currentLocation || parcel.from}
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-950/60">
                  <p className="text-xs text-slate-500 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-emerald-500" /> ETA
                  </p>
                  <p className="font-mono font-semibold text-sm mt-1">
                    {parcel.estimatedDelivery || parcel.date || "—"}
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-950/60">
                  <p className="text-xs text-slate-500 flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5 text-sky-500" /> Specs
                  </p>
                  <p className="font-semibold text-sm mt-1 capitalize">
                    {parcel.weight} kg • {parcel.parcelType || "standard"}
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-950/60">
                  <p className="text-xs text-slate-500 flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-indigo-500" /> Driver
                  </p>
                  <p className="font-semibold text-sm mt-1">
                    {parcel.assignedDriver || "Unassigned"}
                  </p>
                </div>
              </div>
            </div>

            {/* Details + Timeline + Feedback */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Route Details & Feedback */}
              <div className="lg:col-span-5 space-y-6">
                <div className="glass-card p-6 space-y-4">
                  <h2 className="font-display font-bold text-base">
                    Sender & Recipient
                  </h2>
                  <div className="space-y-3 text-sm">
                    <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-950/60 space-y-0.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        From
                      </span>
                      <p className="font-bold">{parcel.sendername}</p>
                      <p className="text-slate-600 dark:text-slate-300">
                        {parcel.from}
                      </p>
                      <p className="text-xs text-slate-500">
                        {parcel.senderemail}
                      </p>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-950/60 space-y-0.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        To
                      </span>
                      <p className="font-bold">{parcel.recipientname}</p>
                      <p className="text-slate-600 dark:text-slate-300">
                        {parcel.to}
                      </p>
                      <p className="text-xs text-slate-500">
                        {parcel.recipientemail}
                      </p>
                    </div>
                  </div>

                  {parcel.note && (
                    <div className="p-3.5 rounded-xl bg-amber-400/10 border border-amber-400/20 text-xs">
                      <span className="font-bold text-amber-500 uppercase">
                        Handling Note:{" "}
                      </span>
                      <span className="text-slate-700 dark:text-slate-200">
                        {parcel.note}
                      </span>
                    </div>
                  )}

                  {parcel.insurance?.enabled && (
                    <div className="flex items-center gap-2 text-xs text-emerald-500 bg-emerald-500/10 p-3 rounded-xl">
                      <ShieldCheck className="w-4 h-4 shrink-0" />
                      Insured for{" "}
                      {formatCurrency(parcel.insurance.declaredValue)} (Fee:{" "}
                      {formatCurrency(parcel.insurance.fee)})
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-200 dark:border-slate-800">
                    <span className="inline-flex items-center gap-1">
                      <CreditCard className="w-3.5 h-3.5" />
                      Service Tier
                    </span>
                    <span className="font-semibold uppercase text-amber-500">
                      {parcel.serviceTier || "standard"}
                    </span>
                  </div>
                </div>

                {/* Delivery Feedback Form */}
                <form
                  onSubmit={handleFeedbackSubmit}
                  className="glass-card p-6 space-y-4"
                >
                  <div>
                    <h2 className="font-display font-bold text-base">
                      Rate & Leave Feedback
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Share how smoothly this shipment was handled.
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setRating(star)}
                        className="p-1 transition hover:scale-110"
                      >
                        <Star
                          className={`w-6 h-6 ${
                            star <= rating
                              ? "fill-amber-400 text-amber-400"
                              : "text-slate-400 dark:text-slate-600"
                          }`}
                        />
                      </button>
                    ))}
                    <span className="ml-2 text-xs font-mono font-semibold text-slate-500">
                      {rating}/5
                    </span>
                  </div>

                  <textarea
                    rows={4}
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Write your delivery review or feedback..."
                    className="input-field"
                  />

                  <button
                    type="submit"
                    disabled={savingFeedback}
                    className="btn-primary w-full"
                  >
                    <Send className="w-4 h-4" />
                    {savingFeedback
                      ? "Saving Feedback..."
                      : parcel.feedback
                      ? "Update Feedback"
                      : "Submit Feedback"}
                  </button>
                </form>
              </div>

              {/* Right Column: Live Checkpoint History */}
              <div className="lg:col-span-7 glass-card p-6 space-y-4 h-fit">
                <div className="flex items-center justify-between">
                  <h2 className="font-display font-bold text-base">
                    Live Tracking Timeline
                  </h2>
                  <span className="text-xs font-mono text-slate-500">
                    {(parcel.trackingHistory || []).length} event(s)
                  </span>
                </div>
                <TrackingTimeline history={parcel.trackingHistory} />
              </div>
            </div>
          </>
        )}
      </main>
      <Footer />

      {showLabel && (
        <ShippingLabelModal
          parcel={parcel}
          onClose={() => setShowLabel(false)}
        />
      )}
    </div>
  );
};

export default Parcel;
