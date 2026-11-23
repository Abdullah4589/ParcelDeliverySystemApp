import { Link } from "react-router-dom";
import { Package, Mail, Phone, MapPin, ShieldCheck } from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2 space-y-4">
            <Link to="/" className="inline-flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center">
                <Package className="w-5 h-5 text-slate-950 stroke-[2.4]" />
              </div>
              <span className="font-display font-extrabold text-xl text-slate-900 dark:text-white">
                Send<span className="text-amber-500 dark:text-amber-400">IT</span>
              </span>
            </Link>
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md leading-relaxed">
              We understand that your parcels carry more than just items—they
              carry your trust. Real-time tracking, transparent rates, and
              insured global delivery from door to door.
            </p>
            <div className="inline-flex items-center gap-2 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full">
              <ShieldCheck className="w-4 h-4" />
              99.4% On-Time Delivery SLA • Insured Transit
            </div>
          </div>

          <div>
            <h4 className="font-display font-semibold text-sm text-slate-900 dark:text-white mb-4">
              Quick Links
            </h4>
            <ul className="space-y-2.5 text-sm text-slate-600 dark:text-slate-400">
              <li>
                <Link to="/track" className="hover:text-amber-500 transition">
                  Track a Parcel
                </Link>
              </li>
              <li>
                <a href="/#calculator" className="hover:text-amber-500 transition">
                  Shipping Rate Calculator
                </a>
              </li>
              <li>
                <Link to="/book" className="hover:text-amber-500 transition">
                  Book a Shipment
                </Link>
              </li>
              <li>
                <Link to="/myparcels" className="hover:text-amber-500 transition">
                  Customer Portal
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-display font-semibold text-sm text-slate-900 dark:text-white mb-4">
              Support
            </h4>
            <ul className="space-y-2.5 text-sm text-slate-600 dark:text-slate-400">
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-amber-500" />
                support@sendit.io
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-amber-500" />
                +1 (800) 555-0199
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-amber-500" />
                500 Market St, San Francisco, CA
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-slate-200 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <span>&copy; {new Date().getFullYear()} SendIT Logistics Inc. All rights reserved.</span>
          <span>Powered by SendIT Smart Dispatch v2.0</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
