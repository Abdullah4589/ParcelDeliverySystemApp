import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  Package,
  Truck,
  Calculator,
  PlusCircle,
  FileText,
  User,
  LogOut,
  Sun,
  Moon,
  Menu,
  X,
  ChevronDown,
  LayoutDashboard,
} from "lucide-react";
import { logOut } from "../redux/userRedux";
import { useTheme } from "../context/ThemeContext";

const Navbar = () => {
  const { currentUser } = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const handleLogout = () => {
    dispatch(logOut());
    setProfileOpen(false);
    setMobileOpen(false);
    navigate("/login");
  };

  const navLinkClass = ({ isActive }) =>
    `inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition ${
      isActive
        ? "bg-amber-400/15 text-amber-500 dark:text-amber-300"
        : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white"
    }`;

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 dark:border-slate-800/90 bg-white/85 dark:bg-slate-950/85 backdrop-blur-xl no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-16 flex items-center justify-between gap-4">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/25 group-hover:scale-105 transition">
              <Package className="w-5 h-5 text-slate-950 stroke-[2.4]" />
            </div>
            <div className="leading-tight">
              <span className="font-display font-extrabold text-lg tracking-tight text-slate-900 dark:text-white">
                Send<span className="text-amber-500 dark:text-amber-400">IT</span>
              </span>
              <span className="block text-[10px] uppercase tracking-widest text-slate-500 dark:text-slate-400 font-semibold -mt-0.5">
                Global Logistics
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            <NavLink to="/track" className={navLinkClass}>
              <Truck className="w-4 h-4" />
              Track Parcel
            </NavLink>
            <a
              href="/#calculator"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white transition"
            >
              <Calculator className="w-4 h-4" />
              Rates
            </a>
            {currentUser && (
              <>
                <NavLink to="/myparcels" className={navLinkClass}>
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </NavLink>
                <NavLink to="/book" className={navLinkClass}>
                  <PlusCircle className="w-4 h-4" />
                  Ship Now
                </NavLink>
                <NavLink to="/statements" className={navLinkClass}>
                  <FileText className="w-4 h-4" />
                  Statements
                </NavLink>
              </>
            )}
          </nav>

          {/* Right controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              {theme === "dark" ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700" />
              )}
            </button>

            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setProfileOpen((v) => !v)}
                  className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 hover:border-amber-400/50 transition"
                >
                  <div className="w-7 h-7 rounded-lg bg-amber-400/20 text-amber-600 dark:text-amber-300 font-bold text-xs flex items-center justify-center uppercase">
                    {(currentUser.fullname || "U").slice(0, 2)}
                  </div>
                  <span className="hidden sm:block text-sm font-medium text-slate-800 dark:text-slate-100 max-w-[130px] truncate">
                    {currentUser.fullname}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {profileOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setProfileOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 glass-card p-1.5 shadow-xl z-50">
                      <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-800 mb-1">
                        <p className="text-sm font-semibold truncate">
                          {currentUser.fullname}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {currentUser.email}
                        </p>
                      </div>
                      <Link
                        to="/myparcels"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <LayoutDashboard className="w-4 h-4 text-amber-500" />
                        My Shipments
                      </Link>
                      <Link
                        to="/allparcels"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <Package className="w-4 h-4 text-sky-500" />
                        Parcel Table
                      </Link>
                      <Link
                        to="/statements"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <FileText className="w-4 h-4 text-emerald-500" />
                        Statements & Invoices
                      </Link>
                      <Link
                        to="/profile"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <User className="w-4 h-4 text-indigo-500" />
                        Profile & Address Book
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-3 py-2 mt-1 rounded-lg text-sm text-rose-500 hover:bg-rose-500/10"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link to="/login" className="btn-secondary py-2">
                  Sign In
                </Link>
                <Link to="/register" className="btn-primary py-2">
                  Get Started
                </Link>
              </div>
            )}

            {/* Mobile toggle */}
            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="md:hidden p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-4 space-y-1">
          <Link
            to="/track"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <Truck className="w-4 h-4 text-amber-500" /> Track Parcel
          </Link>
          {currentUser ? (
            <>
              <Link
                to="/myparcels"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <LayoutDashboard className="w-4 h-4 text-amber-500" /> Dashboard
              </Link>
              <Link
                to="/book"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <PlusCircle className="w-4 h-4 text-amber-500" /> Ship New Parcel
              </Link>
              <Link
                to="/allparcels"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <Package className="w-4 h-4 text-sky-500" /> All Parcels Table
              </Link>
              <Link
                to="/statements"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <FileText className="w-4 h-4 text-emerald-500" /> Statements
              </Link>
              <Link
                to="/profile"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <User className="w-4 h-4 text-indigo-500" /> Profile & Addresses
              </Link>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-rose-500 hover:bg-rose-500/10"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </>
          ) : (
            <div className="pt-2 flex gap-2">
              <Link
                to="/login"
                onClick={() => setMobileOpen(false)}
                className="btn-secondary flex-1"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileOpen(false)}
                className="btn-primary flex-1"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

export default Navbar;
