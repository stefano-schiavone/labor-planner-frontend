import React, { useEffect, useMemo, useState } from "react";
import WeekPicker from "./WeekPicker";
import TimePicker from "./TimePicker";
import Combobox from "../UI/Combobox";

interface MachineTypeOption {
   uuid: string;
   name: string;
}

interface Props {
   open: boolean;
   onClose: () => void;
   machineTypes: MachineTypeOption[];
   weekStartISO?: string;
   weekEndISO?: string;
   onCreate: (payload: {
      name: string;
      jobTemplateUuid?: string;
      description: string;
      durationMinutes: number;
      deadline: string; // "YYYY-MM-DDTHH:mm" (local)
      machineTypeUuid?: string;
   }) => Promise<void>;
}

function formatDateYMD(d: Date) {
   const pad = (n: number) => String(n).padStart(2, "0");
   return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function parseYMDToLocalDate(isoLike?: string): Date | null {
   if (!isoLike) return null;
   const datePart = String(isoLike).slice(0, 10);
   const [y, m, d] = datePart.split("-").map((s) => Number(s));
   if (!y || !m || !d) return null;
   const dt = new Date(y, m - 1, d);
   dt.setHours(0, 0, 0, 0);
   return dt;
}

/**
 * AddJobModal
 *
 * - Uses Combobox for machine type selection (replaces native select)
 * - Keeps WeekPicker locked to provided weekStartISO and TimePicker for time
 * - Composes deadline as "YYYY-MM-DDTHH:mm" (local) and passes to onCreate
 * - Keeps Apple-HIG-friendly spacing/controls and the same colors as before
 */
const AddJobModal: React.FC<Props> = ({ open, onClose, machineTypes, weekStartISO, onCreate }) => {
   const [name, setName] = useState("");
   const [description, setDescription] = useState("");
   const [durationMinutes, setDurationMinutes] = useState<number>(60);
   const [machineTypeUuid, setMachineTypeUuid] = useState<string | undefined>(undefined);
   const [submitting, setSubmitting] = useState(false);

   // date & time pieces for deadline
   const [selectedDate, setSelectedDate] = useState<Date | null>(null);
   const [selectedTime, setSelectedTime] = useState<string>("09:00");

   const deadlineLocal = useMemo(() => {
      if (!selectedDate) return "";
      const ymd = formatDateYMD(selectedDate);
      const hhmm = selectedTime ? selectedTime.slice(0, 5) : "00:00";
      return `${ymd}T${hhmm}`;
   }, [selectedDate, selectedTime]);

   // prepare options for Combobox
   const machineTypeOptions = useMemo(
      () => machineTypes.map((t) => ({ value: t.uuid, label: t.name })),
      [machineTypes]
   );

   useEffect(() => {
      if (machineTypes.length > 0 && !machineTypeUuid) {
         setMachineTypeUuid(machineTypes[0].uuid);
      }
   }, [machineTypes, machineTypeUuid]);

   // reset when modal opens/closes
   const reset = () => {
      setName("");
      setDescription("");
      setDurationMinutes(60);
      setMachineTypeUuid(machineTypes[0]?.uuid);

      const pref = parseYMDToLocalDate(weekStartISO);
      if (pref) setSelectedDate(pref);
      else {
         const now = new Date();
         now.setHours(0, 0, 0, 0);
         setSelectedDate(now);
      }
      setSelectedTime("09:00");
   };

   useEffect(() => {
      if (!open) {
         reset();
      } else {
         if (!selectedDate) {
            const pref = parseYMDToLocalDate(weekStartISO);
            if (pref) setSelectedDate(pref);
            else {
               const now = new Date();
               now.setHours(0, 0, 0, 0);
               setSelectedDate(now);
            }
         }
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [open, weekStartISO]);

   const handleSubmit = async (e?: React.FormEvent) => {
      e?.preventDefault();
      if (!deadlineLocal) {
         window.alert("Please pick a date and time for the deadline.");
         return;
      }

      setSubmitting(true);
      try {
         await onCreate({
            name,
            description,
            durationMinutes: Number(durationMinutes),
            deadline: deadlineLocal,
            machineTypeUuid,
         });
      } catch (err) {
         console.error(err);
         window.alert("Failed to create job.");
      } finally {
         setSubmitting(false);
      }
   };

   if (!open) return null;

   return (
      <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center px-5 py-6">
         <div className="absolute inset-0 bg-black/28" onClick={onClose} aria-hidden />
         <form onSubmit={handleSubmit} className="relative z-10 max-w-2xl w-full bg-white rounded-3xl shadow-md border border-slate-200 p-6 md:p-8">
            <div className="flex items-start justify-between mb-4">
               <div>
                  <h3 className="text-lg font-semibold">Add Job</h3>
                  {weekStartISO && (
                     <div className="mt-1 text-xs text-slate-500">
                        Deadline must be inside{" "}
                        {(() => {
                           const start = parseYMDToLocalDate(weekStartISO);
                           if (!start) return "";
                           const end = new Date(start);
                           end.setDate(start.getDate() + 6);
                           return `${start.toLocaleDateString(undefined, {
                              weekday: "short",
                              day: "numeric",
                              month: "short",
                           })} — ${end.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })}`;
                        })()}
                     </div>
                  )}
               </div>

               <button type="button" onClick={onClose} className="text-slate-500 hover:text-slate-700 rounded-full px-2 py-1">
                  ×
               </button>
            </div>

            <div className="space-y-5">
               <div>
                  <label className="block text-sm text-slate-700 mb-1">Name</label>
                  <input required value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-3 border rounded-2xl text-sm" />
               </div>

               <div>
                  <label className="block text-sm text-slate-700 mb-1">Description</label>
                  <textarea value={description} onChange={(e) => setDescription(e.target.value || "")} className="w-full px-4 py-3 border rounded-2xl text-sm max-h-100" rows={3} />
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div>
                     <label className="block text-sm text-slate-700 mb-1">Duration (minutes)</label>
                     <input required type="number" min={1} value={durationMinutes} onChange={(e) => setDurationMinutes(Number(e.target.value))} className="w-full px-4 py-3 border rounded-2xl text-sm" />
                  </div>

                  <div>
                     <label className="block text-sm text-slate-700 mb-1">Required machine type</label>
                     <Combobox
                        id="job-machine-type"
                        options={machineTypeOptions}
                        value={machineTypeUuid ?? undefined}
                        onChange={(v) => setMachineTypeUuid(v)}
                        placeholder="Select machine type"
                        ariaLabel="Required machine type"
                     />
                  </div>
               </div>

               <div>
                  <label className="block text-sm text-slate-700 mb-2">Deadline</label>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                     <div>
                        <WeekPicker
                           fixedWeekStart={weekStartISO}
                           disableNavigation={true}
                           selected={selectedDate ?? undefined}
                           onSelect={(d) => {
                              const copy = new Date(d);
                              copy.setHours(0, 0, 0, 0);
                              setSelectedDate(copy);
                           }}
                        />
                     </div>

                     <div>
                        <div className="text-sm text-slate-600 mb-2">Time</div>
                        <TimePicker value={selectedTime} onChange={(v) => setSelectedTime(v)} ariaLabel="Deadline time" />
                        <div className="text-xs text-slate-500 mt-3">
                           Deadline: <span className="font-medium">{deadlineLocal || "Select date & time"}</span>
                        </div>
                     </div>
                  </div>
               </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
               <button type="button" onClick={onClose} className="px-4 py-2 bg-white border rounded-2xl text-sm hover:bg-slate-50" disabled={submitting}>
                  Cancel
               </button>
               <button type="submit" className="px-4 py-2 bg-sky-600 text-white rounded-2xl text-sm hover:bg-sky-700 disabled:opacity-60" disabled={submitting}>
                  {submitting ? "Saving…" : "Create"}
               </button>
            </div>
         </form>
      </div>
   );
};

export default AddJobModal;
