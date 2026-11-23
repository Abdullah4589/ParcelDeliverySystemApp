import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  User,
  Lock,
  BookUser,
  Plus,
  Trash2,
  Save,
  MapPin,
} from "lucide-react";
import { toast } from "react-toastify";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { publicRequest } from "../requestMethods";
import { updateUserSuccess } from "../redux/userRedux";

const Profile = () => {
  const { currentUser } = useSelector((state) => state.user);
  const dispatch = useDispatch();

  const [profile, setProfile] = useState({
    fullname: currentUser?.fullname || "",
    phone: currentUser?.phone || "",
    age: currentUser?.age || "",
    country: currentUser?.country || "",
    address: currentUser?.address || "",
  });
  const [addresses, setAddresses] = useState(currentUser?.savedAddresses || []);
  const [savingProfile, setSavingProfile] = useState(false);

  const [newAddr, setNewAddr] = useState({
    label: "",
    recipientName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    country: "",
  });
  const [addingAddr, setAddingAddr] = useState(false);

  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [savingPass, setSavingPass] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      if (!currentUser?._id) return;
      try {
        const res = await publicRequest.get(`/users/${currentUser._id}`);
        const u = res.data;
        setProfile({
          fullname: u.fullname || "",
          phone: u.phone || "",
          age: u.age || "",
          country: u.country || "",
          address: u.address || "",
        });
        setAddresses(u.savedAddresses || []);
      } catch (err) {
        console.error(err);
      }
    };
    loadUser();
  }, [currentUser?._id]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await publicRequest.put(`/users/${currentUser._id}`, profile);
      dispatch(updateUserSuccess(res.data));
      toast.success("Profile updated successfully!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    setAddingAddr(true);
    try {
      const res = await publicRequest.post(
        `/users/${currentUser._id}/addresses`,
        newAddr
      );
      setAddresses(res.data.savedAddresses || []);
      dispatch(updateUserSuccess({ savedAddresses: res.data.savedAddresses }));
      setNewAddr({
        label: "",
        recipientName: "",
        email: "",
        phone: "",
        address: "",
        city: "",
        country: "",
      });
      toast.success("Address saved to your address book!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add address.");
    } finally {
      setAddingAddr(false);
    }
  };

  const handleDeleteAddress = async (addrId) => {
    try {
      const res = await publicRequest.delete(
        `/users/${currentUser._id}/addresses/${addrId}`
      );
      setAddresses(res.data.savedAddresses || []);
      dispatch(updateUserSuccess({ savedAddresses: res.data.savedAddresses }));
      toast.info("Address removed.");
    } catch {
      toast.error("Failed to remove address.");
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwords.newPassword.length < 6) {
      return toast.error("New password must be at least 6 characters.");
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      return toast.error("New passwords do not match.");
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
      toast.success("Password changed successfully!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to change password.");
    } finally {
      setSavingPass(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-amber-500">
            Account Preferences
          </span>
          <h1 className="font-display text-3xl font-extrabold mt-0.5">
            Profile & Saved Address Book
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Keep your pickup info and frequent recipients ready for 1-click
            booking.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Profile Info & Password */}
          <div className="lg:col-span-5 space-y-6">
            <form
              onSubmit={handleSaveProfile}
              className="glass-card p-6 space-y-4"
            >
              <h2 className="font-display font-bold text-base flex items-center gap-2">
                <User className="w-4 h-4 text-amber-500" />
                Personal Information
              </h2>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Email (Account ID)
                </label>
                <input
                  type="text"
                  disabled
                  value={currentUser?.email || ""}
                  className="input-field opacity-60 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={profile.fullname}
                  onChange={(e) =>
                    setProfile({ ...profile, fullname: e.target.value })
                  }
                  className="input-field"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={profile.phone}
                    onChange={(e) =>
                      setProfile({ ...profile, phone: e.target.value })
                    }
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    Age
                  </label>
                  <input
                    type="number"
                    value={profile.age}
                    onChange={(e) =>
                      setProfile({ ...profile, age: e.target.value })
                    }
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Country
                </label>
                <input
                  type="text"
                  value={profile.country}
                  onChange={(e) =>
                    setProfile({ ...profile, country: e.target.value })
                  }
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Default Pickup Address
                </label>
                <input
                  type="text"
                  value={profile.address}
                  onChange={(e) =>
                    setProfile({ ...profile, address: e.target.value })
                  }
                  className="input-field"
                />
              </div>

              <button
                type="submit"
                disabled={savingProfile}
                className="btn-primary w-full"
              >
                <Save className="w-4 h-4" />
                {savingProfile ? "Saving..." : "Save Profile"}
              </button>
            </form>

            {/* Change Password */}
            <form
              onSubmit={handleChangePassword}
              className="glass-card p-6 space-y-4"
            >
              <h2 className="font-display font-bold text-base flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-500" />
                Security & Password
              </h2>
              <input
                type="password"
                required
                placeholder="Current password"
                value={passwords.currentPassword}
                onChange={(e) =>
                  setPasswords({
                    ...passwords,
                    currentPassword: e.target.value,
                  })
                }
                className="input-field"
              />
              <input
                type="password"
                required
                placeholder="New password (min 6 chars)"
                value={passwords.newPassword}
                onChange={(e) =>
                  setPasswords({ ...passwords, newPassword: e.target.value })
                }
                className="input-field"
              />
              <input
                type="password"
                required
                placeholder="Confirm new password"
                value={passwords.confirmPassword}
                onChange={(e) =>
                  setPasswords({
                    ...passwords,
                    confirmPassword: e.target.value,
                  })
                }
                className="input-field"
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

          {/* Address Book */}
          <div className="lg:col-span-7 space-y-6">
            <div className="glass-card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display font-bold text-base flex items-center gap-2">
                  <BookUser className="w-4 h-4 text-amber-500" />
                  Saved Recipients ({addresses.length})
                </h2>
              </div>

              {addresses.length === 0 ? (
                <p className="text-sm text-slate-500 py-4">
                  No saved addresses yet. Add frequent recipients below for
                  one-click shipping.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {addresses.map((addr) => (
                    <div
                      key={addr._id}
                      className="p-4 rounded-xl bg-slate-100/80 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex justify-between gap-2"
                    >
                      <div className="space-y-1 text-xs">
                        <span className="inline-flex items-center gap-1 font-bold text-amber-500">
                          <MapPin className="w-3.5 h-3.5" />
                          {addr.label}
                        </span>
                        <p className="font-semibold text-sm text-slate-900 dark:text-white">
                          {addr.recipientName}
                        </p>
                        <p className="text-slate-600 dark:text-slate-300">
                          {addr.address}
                          {addr.city ? `, ${addr.city}` : ""}
                          {addr.country ? `, ${addr.country}` : ""}
                        </p>
                        {addr.email && (
                          <p className="text-slate-500">{addr.email}</p>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeleteAddress(addr._id)}
                        className="p-1.5 h-fit rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10"
                        title="Delete address"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <form
              onSubmit={handleAddAddress}
              className="glass-card p-6 space-y-4"
            >
              <h3 className="font-display font-bold text-sm flex items-center gap-2">
                <Plus className="w-4 h-4 text-amber-500" />
                Add New Saved Address
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  placeholder="Label (e.g. Chicago Office) *"
                  value={newAddr.label}
                  onChange={(e) =>
                    setNewAddr({ ...newAddr, label: e.target.value })
                  }
                  className="input-field"
                />
                <input
                  type="text"
                  required
                  placeholder="Recipient Full Name *"
                  value={newAddr.recipientName}
                  onChange={(e) =>
                    setNewAddr({ ...newAddr, recipientName: e.target.value })
                  }
                  className="input-field"
                />
                <input
                  type="email"
                  placeholder="Recipient Email"
                  value={newAddr.email}
                  onChange={(e) =>
                    setNewAddr({ ...newAddr, email: e.target.value })
                  }
                  className="input-field"
                />
                <input
                  type="tel"
                  placeholder="Recipient Phone"
                  value={newAddr.phone}
                  onChange={(e) =>
                    setNewAddr({ ...newAddr, phone: e.target.value })
                  }
                  className="input-field"
                />
                <input
                  type="text"
                  required
                  placeholder="Street Address *"
                  value={newAddr.address}
                  onChange={(e) =>
                    setNewAddr({ ...newAddr, address: e.target.value })
                  }
                  className="input-field sm:col-span-2"
                />
                <input
                  type="text"
                  placeholder="City / State"
                  value={newAddr.city}
                  onChange={(e) =>
                    setNewAddr({ ...newAddr, city: e.target.value })
                  }
                  className="input-field"
                />
                <input
                  type="text"
                  placeholder="Country"
                  value={newAddr.country}
                  onChange={(e) =>
                    setNewAddr({ ...newAddr, country: e.target.value })
                  }
                  className="input-field"
                />
              </div>
              <button
                type="submit"
                disabled={addingAddr}
                className="btn-primary"
              >
                <Plus className="w-4 h-4" />
                {addingAddr ? "Saving..." : "Save to Address Book"}
              </button>
            </form>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Profile;
