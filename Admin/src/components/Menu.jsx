import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  PlusCircle,
  Users,
  BarChart3,
  CalendarDays,
  ScrollText,
  Settings,
  DatabaseBackup,
  UserCog,
  X,
} from "lucide-react";

const NAV_GROUPS = [
  {
    title: "Operations",
    items: [
      { to: "/", label: "Overview", icon: LayoutDashboard, end: true },
      { to: "/parcels", label: "Parcels", icon: Package },
      { to: "/newparcel", label: "Create Shipment", icon: PlusCircle },
      { to: "/users", label: "Users & Fleet", icon: Users },
    ],
  },
  {
    title: "Insights & Schedule",
    items: [
      { to: "/analytics", label: "Analytics", icon: BarChart3 },
      { to: "/calendar", label: "Delivery Calendar", icon: CalendarDays },
      { to: "/logs", label: "Audit Logs", icon: ScrollText },
    ],
  },
  {
    title: "System",
    items: [
      { to: "/settings", label: "Pricing & Settings", icon: Settings },
      { to: "/backups", label: "Backups & Export", icon: DatabaseBackup },
      { to: "/profile", label: "Admin Profile", icon: UserCog },
    ],
  },
];

const Menu = ({ mobileOpen, onClose }) => {
  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
      isActive
        ? "bg-amber-400 text-slate-950 font-semibold shadow-md shadow-amber-500/20"
        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white"
    }`;

  const content = (
    <div className="flex flex-col h-full bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800/90">
      <div className="h-16 px-5 flex items-center justify-between border-b border-slate-200 dark:border-slate-800/90">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Package className="w-5 h-5 text-slate-950 stroke-[2.4]" />
          </div>
          <div className="leading-tight">
            <span className="font-display font-extrabold text-lg">
              Send<span className="text-amber-500">IT</span>
            </span>
            <span className="block text-[10px] uppercase tracking-widest text-slate-500 font-bold -mt-0.5">
              Admin Console
            </span>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-6">
        {NAV_GROUPS.map((group) => (
          <div key={group.title} className="space-y-1">
            <p className="px-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
              {group.title}
            </p>
            {group.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={onClose}
                className={linkClass}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-200 dark:border-slate-800/90">
        <div className="p-3 rounded-xl bg-amber-400/10 border border-amber-400/20 text-xs">
          <p className="font-semibold text-amber-600 dark:text-amber-300">
            SendIT Command v2.0
          </p>
          <p className="text-slate-500 dark:text-slate-400 mt-0.5">
            Live dispatch & telemetry active
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:block w-64 shrink-0 h-screen sticky top-0 no-print">
        {content}
      </aside>
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex no-print">
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm"
            onClick={onClose}
          />
          <aside className="relative w-64 max-w-[80vw] h-full z-10">
            {content}
          </aside>
        </div>
      )}
    </>
  );
};

export default Menu;
