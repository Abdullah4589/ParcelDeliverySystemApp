import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, KeyRound, Copy, UserPlus } from "lucide-react";
import { toast } from "react-toastify";
import { publicRequest } from "../requestMethods";

const generatePassword = (length = 12) => {
  const lower = "abcdefghijklmnopqrstuvwxyz";
  const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const nums = "0123456789";
  const special = "!@#$%^&*";
  const all = lower + upper + nums + special;
  let pass =
    lower[Math.floor(Math.random() * lower.length)] +
    upper[Math.floor(Math.random() * upper.length)] +
    nums[Math.floor(Math.random() * nums.length)] +
    special[Math.floor(Math.random() * special.length)];
  for (let i = pass.length; i < length; i++) {
    pass += all[Math.floor(Math.random() * all.length)];
  }
  return pass
    .split("")
    .sort(() => 0.5 - Math.random())
    .join("");
};

const NewUsers = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [inputs, setInputs] = useState({
    fullname: "",
    email: "",
    phone: "",
    age: "",
    country: "",
    address: "",
    role: "user",
    password: generatePassword(12),
  });

  const handleChange = (e) => {
    setInputs((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await publicRequest.post("/auth/register", inputs);
      toast.success(
        `Registered ${inputs.fullname} (${inputs.role})! Welcome email queued.`
      );
      navigate("/users");
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to register user."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <Link
          to="/users"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-amber-500 mb-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Users
        </Link>
        <h1 className="font-display text-3xl font-extrabold">
          Register New User / Driver
        </h1>
        <p className="text-sm text-slate-500">
          Create a customer, courier driver, or administrator account.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="admin-card p-6 sm:p-8 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">
              Full Name *
            </label>
            <input
              name="fullname"
              required
              placeholder="James Doe"
              value={inputs.fullname}
              onChange={handleChange}
              className="admin-input"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">
              Email Address *
            </label>
            <input
              type="email"
              name="email"
              required
              placeholder="jamesdoe@example.com"
              value={inputs.email}
              onChange={handleChange}
              className="admin-input"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">
              Phone Number
            </label>
            <input
              name="phone"
              placeholder="+1 555-0192"
              value={inputs.phone}
              onChange={handleChange}
              className="admin-input"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">
              Account Role *
            </label>
            <select
              name="role"
              value={inputs.role}
              onChange={handleChange}
              className="admin-input"
            >
              <option value="user">Customer (User)</option>
              <option value="driver">Courier Driver</option>
              <option value="admin">Administrator</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">
              Age
            </label>
            <input
              type="number"
              name="age"
              placeholder="30"
              value={inputs.age}
              onChange={handleChange}
              className="admin-input"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">
              Country
            </label>
            <input
              name="country"
              placeholder="United States"
              value={inputs.country}
              onChange={handleChange}
              className="admin-input"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5">
            Address
          </label>
          <input
            name="address"
            placeholder="500 Market St, San Francisco, CA"
            value={inputs.address}
            onChange={handleChange}
            className="admin-input"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5">
            Temporary Password *
          </label>
          <div className="flex gap-2">
            <input
              name="password"
              required
              value={inputs.password}
              onChange={handleChange}
              className="admin-input font-mono"
            />
            <button
              type="button"
              onClick={() =>
                setInputs((prev) => ({
                  ...prev,
                  password: generatePassword(12),
                }))
              }
              className="btn-secondary shrink-0"
              title="Generate random password"
            >
              <KeyRound className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(inputs.password);
                toast.success("Password copied!");
              }}
              className="btn-secondary shrink-0"
              title="Copy password"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Link to="/users" className="btn-secondary">
            Cancel
          </Link>
          <button type="submit" disabled={submitting} className="btn-primary px-6">
            <UserPlus className="w-4 h-4" />
            {submitting ? "Creating..." : "Create Account"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewUsers;
