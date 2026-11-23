import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Package,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { toast } from "react-toastify";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { login } from "../redux/apiCalls";
import { clearError } from "../redux/userRedux";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const { isFetching, error, errorMessage } = useSelector(
    (state) => state.user
  );
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    const res = await login(dispatch, {
      email: email.trim(),
      password,
    });
    if (res.ok) {
      toast.success(`Welcome back, ${res.data.fullname}!`);
      navigate("/myparcels");
    }
  };

  const fillDemo = () => {
    setEmail("alex@sendit.io");
    setPassword("User@123");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 glass-card overflow-hidden shadow-2xl">
          {/* Brand side */}
          <div className="hidden lg:flex flex-col justify-between p-10 bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/60 text-white border-r border-slate-800">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center">
                <Package className="w-6 h-6 stroke-[2.4]" />
              </div>
              <h2 className="font-display text-3xl font-extrabold leading-tight">
                Manage Every Parcel in One Smart Hub.
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                Track incoming and outgoing shipments, book instant pickups,
                print barcoded waybills, and download billing statements.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-300">
                <Sparkles className="w-4 h-4" />
                Demo Account Ready (after running seed)
              </div>
              <p className="text-xs text-slate-300 font-mono">
                alex@sendit.io / User@123
              </p>
              <button
                type="button"
                onClick={fillDemo}
                className="text-xs font-semibold text-amber-400 hover:underline"
              >
                Click to autofill demo credentials →
              </button>
            </div>
          </div>

          {/* Form side */}
          <div className="p-8 sm:p-10 space-y-6">
            <div>
              <h1 className="font-display text-2xl font-extrabold">
                Sign in to SendIT
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Enter your credentials to access your customer portal.
              </p>
            </div>

            {error && (
              <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs leading-relaxed">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="input-field pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="input-field pl-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isFetching}
                className="btn-primary w-full py-3"
              >
                {isFetching ? "Signing in..." : "Sign In"}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="lg:hidden text-center">
              <button
                type="button"
                onClick={fillDemo}
                className="text-xs font-semibold text-amber-500 hover:underline"
              >
                Use Demo Credentials (alex@sendit.io)
              </button>
            </div>

            <p className="text-center text-sm text-slate-500 dark:text-slate-400">
              Don&apos;t have an account?{" "}
              <Link
                to="/register"
                className="font-semibold text-amber-500 hover:underline"
              >
                Create one free
              </Link>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Login;
