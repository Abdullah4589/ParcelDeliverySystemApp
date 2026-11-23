import { useState } from "react";
import { UserCog, Lock, Save } from "lucide-react";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";
import { publicRequest } from "../requestMethods";

const Profile = () => {
  const { adminUser, updateAdmin } = useAuth();
  const [form, setForm] = useState({
    fullname: adminUser?.fullname || "",
    phone: adminUser?.phone || "",
    country: adminUser?.country || "",
    address: adminUser?.address || "",
  });
  const [saving, setSaving] = useState(false);

  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [savingPass, setSavingPass] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await publicRequest.put(`/users/${adminUser._id}`, form);
      updateAdmin(res.data);
      toast.success("Admin profile updated!");
    } catch {
      toast.error("Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const handlePassword = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      return toast.error("Passwords do not match.");
    }
    setSavingPass(true);
    try {
      await publicRequest.put("/auth/change-password", {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
      setPasswords({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      toast.success("Password updated!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update password.");
    } finally {
      setSavingPass(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <span className="text-xs font-bold uppercase tracking-widest text-amber-500">
          Account
        </span>
        <h1 className="font-display text-3xl font-extrabold mt-0.5">
          Administrator Profile
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <form onSubmit={handleSave} className="admin-card p-6 space-y-4">
          <h2 className="font-display font-bold text-base flex items-center gap-2">
            <UserCog className="w-4 h-4 text-amber-500" />
            Account Details
          </h2>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">
              Email
            </label>
            <input
              disabled
              value={adminUser?.email || ""}
              className="admin-input opacity-60 cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">
              Full Name
            </label>
            <input
              required
              value={form.fullname}
              onChange={(e) => setForm({ ...form, fullname: e.target.value })}
              className="admin-input"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">
              Phone
            </label>
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="admin-input"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">
              Country
            </label>
            <input
              value={form.country}
              onChange={(e) => setForm({ ...form, country: e.target.value })}
              className="admin-input"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">
              Office Address
            </label>
            <input
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="admin-input"
            />
          </div>
          <button type="submit" disabled={saving} className="btn-primary w-full">
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : "Save Profile"}
          </button>
        </form>

        <form onSubmit={handlePassword} className="admin-card p-6 space-y-4 h-fit">
          <h2 className="font-display font-bold text-base flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-500" />
            Change Password
          </h2>
          <input
            type="password"
            required
            placeholder="Current Password"
            value={passwords.currentPassword}
            onChange={(e) =>
              setPasswords({ ...passwords, currentPassword: e.target.value })
            }
            className="admin-input"
          />
          <input
            type="password"
            required
            placeholder="New Password (min 6 chars)"
            value={passwords.newPassword}
            onChange={(e) =>
              setPasswords({ ...passwords, newPassword: e.target.value })
            }
            className="admin-input"
          />
          <input
            type="password"
            required
            placeholder="Confirm New Password"
            value={passwords.confirmPassword}
            onChange={(e) =>
              setPasswords({ ...passwords, confirmPassword: e.target.value })
            }
            className="admin-input"
          />
          <button
            type="submit"
            disabled={savingPass}
            className="btn-secondary w-full"
          >
            {savingPass ? "Updating..." : "Update Password"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Profile;
