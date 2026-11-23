import { useEffect, useState } from "react";
import { Save, DollarSign, Building2, Bell } from "lucide-react";
import { toast } from "react-toastify";
import { publicRequest } from "../requestMethods";
import { useAuth } from "../context/AuthContext";

const Settings = () => {
  const { adminUser } = useAuth();
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await publicRequest.get("/settings");
        setSettings(res.data);
      } catch {
        toast.error("Failed to load settings.");
      }
    };
    load();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await publicRequest.put("/settings", {
        ...settings,
        updatedBy: adminUser?.fullname || "Admin",
      });
      setSettings(res.data);
      toast.success("Platform & pricing settings saved!");
    } catch {
      toast.error("Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  if (!settings) {
    return (
      <div className="admin-card p-10 text-center text-slate-500">
        Loading system settings...
      </div>
    );
  }

  const updatePricing = (key, value) => {
    setSettings((prev) => ({
      ...prev,
      pricing: { ...prev.pricing, [key]: Number(value) },
    }));
  };

  const updateMultiplier = (tier, value) => {
    setSettings((prev) => ({
      ...prev,
      pricing: {
        ...prev.pricing,
        tierMultipliers: {
          ...prev.pricing.tierMultipliers,
          [tier]: Number(value),
        },
      },
    }));
  };

  return (
    <form onSubmit={handleSave} className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-amber-500">
            Configuration
          </span>
          <h1 className="font-display text-3xl font-extrabold mt-0.5">
            Pricing & Platform Settings
          </h1>
          <p className="text-sm text-slate-500">
            Pricing updates immediately apply to the Customer Rate Calculator &
            Booking quotes.
          </p>
        </div>
        <button type="submit" disabled={saving} className="btn-primary px-6">
          <Save className="w-4 h-4" />
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {/* Company Info */}
      <div className="admin-card p-6 space-y-4">
        <h2 className="font-display font-bold text-base flex items-center gap-2">
          <Building2 className="w-4 h-4 text-amber-500" />
          Organization Details
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">
              Company Name
            </label>
            <input
              value={settings.companyName || ""}
              onChange={(e) =>
                setSettings({ ...settings, companyName: e.target.value })
              }
              className="admin-input"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">
              Support Email
            </label>
            <input
              type="email"
              value={settings.supportEmail || ""}
              onChange={(e) =>
                setSettings({ ...settings, supportEmail: e.target.value })
              }
              className="admin-input"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">
              Support Phone
            </label>
            <input
              value={settings.supportPhone || ""}
              onChange={(e) =>
                setSettings({ ...settings, supportPhone: e.target.value })
              }
              className="admin-input"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">
              Currency Code
            </label>
            <input
              value={settings.currency || "USD"}
              onChange={(e) =>
                setSettings({ ...settings, currency: e.target.value })
              }
              className="admin-input font-mono"
            />
          </div>
        </div>
      </div>

      {/* Pricing Rules */}
      <div className="admin-card p-6 space-y-5">
        <h2 className="font-display font-bold text-base flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-amber-500" />
          Shipping Rate Engine
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">
              Base Fee ($)
            </label>
            <input
              type="number"
              step="0.5"
              value={settings.pricing?.baseFee ?? 8}
              onChange={(e) => updatePricing("baseFee", e.target.value)}
              className="admin-input font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">
              Per-Kg Rate ($)
            </label>
            <input
              type="number"
              step="0.25"
              value={settings.pricing?.perKgRate ?? 3.5}
              onChange={(e) => updatePricing("perKgRate", e.target.value)}
              className="admin-input font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">
              Insurance Rate (%)
            </label>
            <input
              type="number"
              step="0.5"
              value={settings.pricing?.insuranceRatePercent ?? 2}
              onChange={(e) =>
                updatePricing("insuranceRatePercent", e.target.value)
              }
              className="admin-input font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">
              Fragile Surcharge ($)
            </label>
            <input
              type="number"
              step="0.5"
              value={settings.pricing?.fragileSurcharge ?? 6}
              onChange={(e) =>
                updatePricing("fragileSurcharge", e.target.value)
              }
              className="admin-input font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">
              Perishable Surcharge ($)
            </label>
            <input
              type="number"
              step="0.5"
              value={settings.pricing?.perishableSurcharge ?? 8}
              onChange={(e) =>
                updatePricing("perishableSurcharge", e.target.value)
              }
              className="admin-input font-mono"
            />
          </div>
        </div>

        <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
          <p className="text-xs font-bold uppercase text-slate-500 mb-3">
            Service Tier Multipliers
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {["economy", "standard", "express", "overnight"].map((tier) => (
              <div key={tier}>
                <label className="block text-xs font-semibold capitalize text-slate-500 mb-1">
                  {tier} (×)
                </label>
                <input
                  type="number"
                  step="0.05"
                  value={settings.pricing?.tierMultipliers?.[tier] ?? 1}
                  onChange={(e) => updateMultiplier(tier, e.target.value)}
                  className="admin-input font-mono"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="admin-card p-6 space-y-3">
        <h2 className="font-display font-bold text-base flex items-center gap-2">
          <Bell className="w-4 h-4 text-amber-500" />
          Notification Automation
        </h2>
        {[
          { key: "emailOnCreate", label: "Send email notifications when a parcel is created" },
          { key: "emailOnDeliver", label: "Send confirmation email when a parcel is delivered" },
          { key: "smsAlerts", label: "Enable SMS courier milestone alerts" },
        ].map((item) => (
          <label
            key={item.key}
            className="flex items-center justify-between p-3 rounded-xl bg-slate-100/70 dark:bg-slate-950/60 cursor-pointer text-sm"
          >
            <span>{item.label}</span>
            <input
              type="checkbox"
              checked={Boolean(settings.notifications?.[item.key])}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  notifications: {
                    ...settings.notifications,
                    [item.key]: e.target.checked,
                  },
                })
              }
              className="w-4 h-4 accent-amber-400"
            />
          </label>
        ))}
      </div>
    </form>
  );
};

export default Settings;
