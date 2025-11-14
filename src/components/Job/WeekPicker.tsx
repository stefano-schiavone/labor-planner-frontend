import React, { useEffect, useMemo, useState } from "react";

type WeekId = `Week${number}-${number}`;

interface WeekPickerProps {
   weekId?: WeekId | string;
   fixedWeekStart?: string | Date;
   selected?: Date | null;
   onSelect?: (date: Date) => void;
   onWeekChange?: (weekId: string) => void;
   disableNavigation?: boolean;
   className?: string;
}

/**
 * WeekPicker
 *
 * - Shows Monday → Sunday tiles for the ISO week (or fixedWeekStart).
 * - Responsive: on narrow widths the days become a horizontally scrollable row so tiles
 *   can be large enough for comfortable touch targets (Apple HIG).
 * - When disableNavigation=true the component is fixed to the provided week and omits nav controls.
 */
const WeekPicker: React.FC<WeekPickerProps> = ({
   weekId,
   fixedWeekStart,
   selected = null,
   onSelect,
   onWeekChange,
   className = "",
}) => {
   function parseISOWeekId(id?: string | null): { week: number; year: number } | null {
      if (!id) return null;
      const m = /^Week(\d+)-(\d{4})$/.exec(id);
      if (!m) return null;
      return { week: Number(m[1]), year: Number(m[2]) };
   }

   function getWeekRangeISO(week: number, year: number) {
      const jan4 = new Date(Date.UTC(year, 0, 4));
      const dayOfWeekJan4 = jan4.getUTCDay() || 7;
      const thursdayOfWeek1 = new Date(jan4);
      thursdayOfWeek1.setUTCDate(jan4.getUTCDate() + (4 - dayOfWeekJan4));

      const thursdayOfRequestedWeek = new Date(thursdayOfWeek1);
      thursdayOfRequestedWeek.setUTCDate(thursdayOfWeek1.getUTCDate() + (week - 1) * 7);

      const monday = new Date(thursdayOfRequestedWeek);
      monday.setUTCDate(thursdayOfRequestedWeek.getUTCDate() - 3);
      monday.setUTCHours(0, 0, 0, 0);

      const nextMonday = new Date(monday);
      nextMonday.setUTCDate(monday.getUTCDate() + 7);
      nextMonday.setUTCHours(0, 0, 0, 0);

      return { startDate: monday, endDate: nextMonday, startISO: monday.toISOString(), endISO: nextMonday.toISOString() };
   }

   function getISOWeekIdFromDate(date: Date) {
      const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
      const day = d.getUTCDay() || 7;
      d.setUTCDate(d.getUTCDate() + 4 - day);
      const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
      const week = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
      return `Week${week}-${d.getUTCFullYear()}`;
   }

   function normalizeFixedWeekStart(input?: string | Date) {
      if (!input) return null;
      if (input instanceof Date) return input;
      const d = new Date(input as string);
      if (!isNaN(d.getTime())) return d;
      const datePart = String(input).slice(0, 10);
      const [y, m, day] = datePart.split("-").map((s) => Number(s));
      if (!y || !m || !day) return null;
      return new Date(y, m - 1, day);
   }

   const initialWeekId = (() => {
      if (weekId) return weekId;
      const fixed = normalizeFixedWeekStart(fixedWeekStart);
      if (fixed) return getISOWeekIdFromDate(fixed);
      return getISOWeekIdFromDate(new Date());
   })();

   const [internalWeekId, setInternalWeekId] = useState<string>(initialWeekId);

   useEffect(() => {
      if (weekId && weekId !== internalWeekId) {
         setInternalWeekId(weekId);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [weekId]);

   useEffect(() => {
      const fixed = normalizeFixedWeekStart(fixedWeekStart);
      if (fixed) {
         const id = getISOWeekIdFromDate(fixed);
         if (id !== internalWeekId) setInternalWeekId(id);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [fixedWeekStart]);

   const { days, weekLabel, isoWeekId } = useMemo(() => {
      const parsed = parseISOWeekId(internalWeekId);
      let startDate: Date;
      let label: string;
      let resolvedWeekId = internalWeekId;

      if (parsed) {
         const { startDate: s } = getWeekRangeISO(parsed.week, parsed.year);
         startDate = s;
         const end = new Date(s);
         end.setUTCDate(s.getUTCDate() + 6);
         label = `${s.toLocaleDateString(undefined, { day: "numeric", month: "short" })} — ${end.toLocaleDateString(
            undefined,
            { day: "numeric", month: "short" }
         )}`;
         resolvedWeekId = `Week${parsed.week}-${parsed.year}`;
      } else {
         const curId = getISOWeekIdFromDate(new Date());
         const parsedCur = parseISOWeekId(curId)!;
         const { startDate: s } = getWeekRangeISO(parsedCur.week, parsedCur.year);
         startDate = s;
         const end = new Date(s);
         end.setUTCDate(s.getUTCDate() + 6);
         label = `${s.toLocaleDateString(undefined, { day: "numeric", month: "short" })} — ${end.toLocaleDateString(
            undefined,
            { day: "numeric", month: "short" }
         )}`;
         resolvedWeekId = curId;
      }

      const arr = Array.from({ length: 7 }, (_, i) => {
         const dd = new Date(startDate);
         dd.setDate(startDate.getDate() + i);
         dd.setHours(0, 0, 0, 0);
         return dd;
      });

      return { weekStart: startDate, days: arr, weekLabel: label, isoWeekId: resolvedWeekId };
   }, [internalWeekId]);

   useEffect(() => {
      if (isoWeekId && onWeekChange) onWeekChange(isoWeekId);
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [isoWeekId]);

   const [internalSelected, setInternalSelected] = useState<Date | null>(selected ? new Date(selected) : null);
   useEffect(() => {
      if (selected) setInternalSelected(new Date(selected));
      else setInternalSelected(null);
   }, [selected]);

   const isSameDay = (a?: Date | null, b?: Date | null) => {
      if (!a || !b) return false;
      return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
   };

   const today = useMemo(() => {
      const t = new Date();
      t.setHours(0, 0, 0, 0);
      return t;
   }, []);

   function handleDayClick(d: Date) {
      if (selected === undefined) {
         setInternalSelected(d);
      }
      onSelect?.(d);
   }

   return (
      <div className={`w-full ${className}`}>
         {/* Week label for clarity */}
         <div className="mb-2 text-xs text-slate-500">{weekLabel}</div>

         {/* Responsive days: horizontal scrolling on small screens, full grid on md+ */}
         <div className="flex md:grid md:grid-cols-7 gap-3 md:gap-3 md:items-stretch">
            <div className="md:hidden flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
               {days.map((d) => {
                  const selectedDay = selected !== undefined ? selected : internalSelected;
                  const isToday = isSameDay(d, today);
                  const isSelected = selectedDay ? isSameDay(d, selectedDay) : false;

                  return (
                     <button
                        key={d.toISOString()}
                        type="button"
                        onClick={() => handleDayClick(new Date(d))}
                        aria-pressed={isSelected}
                        aria-label={`${d.toDateString()}`}
                        className={[
                           // reduced size for mobile so tiles are less dominant while still touchable
                           "flex-shrink-0 w-7 h-22 flex flex-col items-center justify-center rounded-xl border text-sm",
                           "focus:outline-none focus:ring-2 focus:ring-sky-150",
                           isSelected ? "bg-sky-600 border-sky-600 text-white" : "bg-white border-slate-200 text-slate-900",
                           isToday && !isSelected ? "ring-1 ring-slate-200" : "",
                        ].join(" ")}
                     >
                        <span className={["text-[11px]", isSelected ? "text-white opacity-95" : "text-slate-500",
                        ].join(" ")}>{d.toLocaleDateString(undefined, { weekday: "short" })}</span>
                        <span className="mt-1 font-semibold text-base">{d.getDate()}</span>
                        <span className={["text-[10px] mt-0.5", isSelected ? "text-white opacity-85" : "text-slate-400",].join(" ")}>{d.toLocaleDateString(undefined, { month: "short" })}</span>
                     </button>
                  );
               })}
            </div>

            <div className="hidden md:grid md:grid-cols-7 md:gap-3 w-full">
               {days.map((d) => {
                  const selectedDay = selected !== undefined ? selected : internalSelected;
                  const isToday = isSameDay(d, today);
                  const isSelected = selectedDay ? isSameDay(d, selectedDay) : false;

                  return (
                     <button
                        key={d.toISOString()}
                        type="button"
                        onClick={() => handleDayClick(new Date(d))}
                        aria-pressed={isSelected}
                        aria-label={d.toDateString()}
                        className={[
                           // slightly smaller padding/min-height compared to previous variant to reduce visual bulk
                           "flex flex-col items-center justify-center p-3 rounded-xl border text-sm min-h-[60px]",
                           "focus:outline-none focus:ring-2 focus:ring-sky-150",
                           isSelected ? "bg-sky-600 border-sky-600 text-white" : "bg-white border-slate-200 text-slate-900",
                           isToday && !isSelected ? "ring-1 ring-slate-200" : "",
                        ].join(" ")}
                     >
                        <span className="text-xs text-slate-500">{d.toLocaleDateString(undefined, { weekday: "short" })}</span>
                        <span className="mt-1 font-semibold text-base">{d.getDate()}</span>
                        <span className="text-[10px] text-slate-400 mt-0.5">{d.toLocaleDateString(undefined, { month: "short" })}</span>
                     </button>
                  );
               })}
            </div>
         </div>
      </div >
   );
};

export default WeekPicker;
