import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Calculator, PackagePlus } from "lucide-react";
import { toast } from "react-toastify";
import { publicRequest } from "../requestMethods";

const NewParcel = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [quoting, setQuoting] = useState(false);

  const [inputs, setInputs] = useState({
    from: "",
    to: "",
    sendername: "",
    recipientname: "",
    senderemail: "",
    recipientemail: "",
    senderphone: "",
    recipientphone: "",
    weight: 2,
    parcelType: "standard",
    serviceTier: "standard",
    cost: "",
    paymentStatus: "paid",
    paymentMethod: "card",
    assignedDriver: "Marcus Cole",
    date: new Date().toISOString().split("T")[0],
    estimatedDelivery: "",
    note: "",
  });

  const handleChange = (e) => {
    setInputs((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAutoQuote = async () => {
    setQuoting(true);
    try {
      const res = await publicRequest.post("/parcels/quote", {
        weight: inputs.weight,
        parcelType: inputs.parcelType,
        serviceTier: inputs.serviceTier,
      });
      setInputs((prev) => ({
        ...prev,
        cost: res.data.total,
        estimatedDelivery: res.data.estimatedDelivery,
      }));
      toast.info(`Calculated rate: $${res.data.total}`);
    } catch {
      toast.error("Could not calculate quote.");
    } finally {
      setQuoting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await publicRequest.post("/parcels", {
        ...inputs,
        weight: Number(inputs.weight),
        cost: inputs.cost ? Number(inputs.cost) : 0,
      });
      toast.success(
        `Shipment created! Tracking ID: ${res.data.trackingNumber}`
      );
      navigate(`/parcel/${res.data._id}`);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to create parcel."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <Link
          to="/parcels"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-amber-500 mb-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Parcels
        </Link>
        <h1 className="font-display text-3xl font-extrabold">
          Create New Shipment
        </h1>
        <p className="text-sm text-slate-500">
          Register a parcel manually — generates tracking ID and queues
          notification emails.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="admin-card p-6 sm:p-8 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">
              Origin (From) *
            </label>
            <input
              name="from"
              required
              placeholder="New York, NY"
              value={inputs.from}
              onChange={handleChange}
              className="admin-input"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">
              Destination (To) *
            </label>
            <input
              name="to"
              required
              placeholder="Chicago, IL"
              value={inputs.to}
              onChange={handleChange}
              className="admin-input"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">
              Sender Name *
            </label>
            <input
              name="sendername"
              required
              placeholder="Alex Rivera"
              value={inputs.sendername}
              onChange={handleChange}
              className="admin-input"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">
              Recipient Name *
            </label>
            <input
              name="recipientname"
              required
              placeholder="Maya Chen"
              value={inputs.recipientname}
              onChange={handleChange}
              className="admin-input"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">
              Sender Email *
            </label>
            <input
              type="email"
              name="senderemail"
              required
              placeholder="sender@example.com"
              value={inputs.senderemail}
              onChange={handleChange}
              className="admin-input"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">
              Recipient Email *
            </label>
            <input
              type="email"
              name="recipientemail"
              required
              placeholder="recipient@example.com"
              value={inputs.recipientemail}
              onChange={handleChange}
              className="admin-input"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">
              Sender Phone
            </label>
            <input
              name="senderphone"
              placeholder="+1 555-0100"
              value={inputs.senderphone}
              onChange={handleChange}
              className="admin-input"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">
              Recipient Phone
            </label>
            <input
              name="recipientphone"
              placeholder="+1 555-0199"
              value={inputs.recipientphone}
              onChange={handleChange}
              className="admin-input"
            />
          </div>
        </div>

        <hr className="border-slate-200 dark:border-slate-800" />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">
              Weight (kg) *
            </label>
            <input
              type="number"
              step="0.1"
              min="0.1"
              required
              name="weight"
              value={inputs.weight}
              onChange={handleChange}
              className="admin-input font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">
              Service Tier
            </label>
            <select
              name="serviceTier"
              value={inputs.serviceTier}
              onChange={handleChange}
              className="admin-input"
            >
              <option value="economy">Economy Ground</option>
              <option value="standard">Standard Tracked</option>
              <option value="express">Express Air</option>
              <option value="overnight">Overnight Priority</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">
              Parcel Type
            </label>
            <select
              name="parcelType"
              value={inputs.parcelType}
              onChange={handleChange}
              className="admin-input"
            >
              <option value="document">Document</option>
              <option value="standard">Standard</option>
              <option value="fragile">Fragile</option>
              <option value="electronics">Electronics</option>
              <option value="perishable">Perishable</option>
              <option value="oversized">Oversized</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">
              Shipping Cost ($)
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                step="0.01"
                name="cost"
                placeholder="Auto"
                value={inputs.cost}
                onChange={handleChange}
                className="admin-input font-mono"
              />
              <button
                type="button"
                onClick={handleAutoQuote}
                disabled={quoting}
                className="btn-secondary px-3 shrink-0"
                title="Calculate based on pricing settings"
              >
                <Calculator className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">
              Payment Status
            </label>
            <select
              name="paymentStatus"
              value={inputs.paymentStatus}
              onChange={handleChange}
              className="admin-input"
            >
              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid / COD</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">
              Assigned Driver
            </label>
            <input
              name="assignedDriver"
              value={inputs.assignedDriver}
              onChange={handleChange}
              className="admin-input"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">
              Ship Date
            </label>
            <input
              type="date"
              name="date"
              value={inputs.date}
              onChange={handleChange}
              className="admin-input"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">
              Estimated Delivery (ETA)
            </label>
            <input
              type="date"
              name="estimatedDelivery"
              value={inputs.estimatedDelivery}
              onChange={handleChange}
              className="admin-input"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5">
            Handling Note
          </label>
          <textarea
            rows={3}
            name="note"
            placeholder="Perishable goods / Fragile instructions..."
            value={inputs.note}
            onChange={handleChange}
            className="admin-input"
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Link to="/parcels" className="btn-secondary">
            Cancel
          </Link>
          <button type="submit" disabled={submitting} className="btn-primary px-6">
            <PackagePlus className="w-4 h-4" />
            {submitting ? "Creating..." : "Create Parcel"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewParcel;
