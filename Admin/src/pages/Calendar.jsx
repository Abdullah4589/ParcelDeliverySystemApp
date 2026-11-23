import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, CalendarDays, Package } from "lucide-react";
import { publicRequest } from "../requestMethods";
import { getStageMeta, resolveStage } from "../utils/helpers";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const Calendar = () => {
  const [parcels, setParcels] = useState([]);
  const [viewDate, setViewDate] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState(
    () => new Date().toISOString().split("T")[0]
  );

  useEffect(() => {
    const load = async () => {
      try {
        const res = await publicRequest.get("/parcels");
        setParcels(res.data || []);
      } catch (err) {
        console.error(err);
      }
    };
    load();
  }, []);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const eventsByDate = useMemo(() => {
    const map = {};
    for (const p of parcels) {
      const add = (dateStr, kind) => {
        if (!dateStr) return;
        const key = String(dateStr).slice(0, 10);
        if (!map[key]) map[key] = [];
        map[key].push({ parcel: p, kind });
      };
      add(p.date, "Pickup");
      if (p.estimatedDelivery && p.estimatedDelivery !== p.date) {
        add(p.estimatedDelivery, "ETA");
      }
    }
    return map;
  }, [parcels]);

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const iso = `${year}-${String(month + 1).padStart(2, "0")}-${String(
      d
    ).padStart(2, "0")}`;
    cells.push({ day: d, iso });
  }

  const selectedEvents = eventsByDate[selectedDay] || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-amber-500">
            Dispatch Schedule
          </span>
          <h1 className="font-display text-3xl font-extrabold mt-0.5">
            Delivery & Pickup Calendar
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewDate(new Date(year, month - 1, 1))}
            className="btn-secondary p-2.5"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-display font-bold text-sm min-w-[150px] text-center">
            {viewDate.toLocaleString("en-US", {
              month: "long",
              year: "numeric",
            })}
          </span>
          <button
            onClick={() => setViewDate(new Date(year, month + 1, 1))}
            className="btn-secondary p-2.5"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Calendar Grid */}
        <div className="lg:col-span-8 admin-card p-5">
          <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-bold uppercase text-slate-500">
            {DAYS.map((d) => (
              <div key={d} className="py-1">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {cells.map((cell, idx) => {
              if (!cell) return <div key={`empty-${idx}`} className="h-24" />;
              const items = eventsByDate[cell.iso] || [];
              const isSelected = selectedDay === cell.iso;
              return (
                <button
                  key={cell.iso}
                  onClick={() => setSelectedDay(cell.iso)}
                  className={`h-24 p-2 rounded-xl border text-left flex flex-col justify-between transition overflow-hidden ${
                    isSelected
                      ? "border-amber-400 bg-amber-400/15 ring-2 ring-amber-400/20"
                      : "border-slate-200 dark:border-slate-800 hover:border-slate-400 bg-slate-50/50 dark:bg-slate-950/50"
                  }`}
                >
                  <span className="text-xs font-mono font-bold">
                    {cell.day}
                  </span>
                  <div className="space-y-1 w-full">
                    {items.slice(0, 2).map((ev, i) => (
                      <div
                        key={i}
                        className={`text-[10px] font-semibold px-1.5 py-0.5 rounded truncate ${
                          ev.kind === "ETA"
                            ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-300"
                            : "bg-amber-500/20 text-amber-700 dark:text-amber-300"
                        }`}
                      >
                        {ev.kind}: {ev.parcel.to.split(",")[0]}
                      </div>
                    ))}
                    {items.length > 2 && (
                      <div className="text-[10px] text-slate-500 font-semibold">
                        +{items.length - 2} more
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Day Queue */}
        <div className="lg:col-span-4 admin-card p-6 space-y-4 h-fit">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <h2 className="font-display font-bold text-base flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-amber-500" />
              {selectedDay}
            </h2>
            <span className="text-xs font-mono text-slate-500">
              {selectedEvents.length} item(s)
            </span>
          </div>

          {selectedEvents.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500 space-y-2">
              <Package className="w-8 h-8 mx-auto opacity-40" />
              <p>No pickups or deliveries scheduled for this date.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {selectedEvents.map((ev, idx) => {
                const meta = getStageMeta(resolveStage(ev.parcel));
                return (
                  <Link
                    key={`${ev.parcel._id}-${idx}`}
                    to={`/parcel/${ev.parcel._id}`}
                    className="block p-3.5 rounded-xl bg-slate-100/80 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 hover:border-amber-400 transition space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                          ev.kind === "ETA"
                            ? "bg-emerald-500/15 text-emerald-500"
                            : "bg-amber-500/15 text-amber-500"
                        }`}
                      >
                        {ev.kind}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${meta.badge}`}
                      >
                        {meta.label}
                      </span>
                    </div>
                    <p className="font-mono text-xs font-bold">
                      {ev.parcel.trackingNumber || ev.parcel._id}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      {ev.parcel.from} → {ev.parcel.to}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Recipient: {ev.parcel.recipientname}
                    </p>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Calendar;
