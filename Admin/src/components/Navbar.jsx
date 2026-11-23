import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Menu as MenuIcon,
  Search,
  Sun,
  Moon,
  LogOut,
  Plus,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { publicRequest } from "../requestMethods";
import { toast } from "react-toastify";

const Navbar = ({ onMenuClick }) => {
  const { adminUser, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [quickTrack, setQuickTrack] = useState("");

  const handleQuickSearch = async (e) => {
    e.preventDefault();
    if (!quickTrack.trim()) return;
    try {
      const res = await publicRequest.get(
        `/parcels/track/${encodeURIComponent(quickTrack.trim())}`
      );
      setQuickTrack("");
      navigate(`/parcel/${res.data._id}`);
    } catch {
      toast.error(`No parcel found for "${quickTrack.trim()}"`);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-slate-200 dark:border-slate-800/90 bg-white/85 dark:bg-slate-950/85 backdrop-blur-xl px-4 sm:px-6 flex items-center justify-between gap-4 no-print">
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300"
        >
          <MenuIcon className="w-5 h-5" />
        </button>

        <form onSubmit={handleQuickSearch} className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={quickTrack}
            onChange={(e) => setQuickTrack(e.target.value)}
            placeholder="Quick jump by Tracking ID (e.g. SND-...)..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs sm:text-sm focus:border-amber-400 focus:outline-none font-mono"
          />
        </form>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <button
          onClick={() => navigate("/newparcel")}
          className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold text-xs transition"
        >
          <Plus className="w-4 h-4" />
          New Parcel
        </button>

        <button
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          {theme === "dark" ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4" />
          )}
        </button>

        <div className="hidden md:flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
          <div className="w-7 h-7 rounded-lg bg-amber-400/20 text-amber-500 font-bold text-xs flex items-center justify-center uppercase">
            {(adminUser?.fullname || "AD").slice(0, 2)}
          </div>
          <div className="leading-tight">
            <p className="text-xs font-semibold">{adminUser?.fullname || "Admin"}</p>
            <p className="text-[10px] text-slate-500 uppercase font-bold">
              {adminUser?.role || "admin"}
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-rose-500 hover:bg-rose-500/10 transition"
          title="Sign Out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};

export default Navbar;
