import React, { useEffect, useMemo, useState } from "react";
import Combobox from "../UI/Combobox";

interface MachineTypeOption {
   uuid: string;
   name: string;
}

interface Props {
   open: boolean;
   onClose: () => void;
   machineTypes: MachineTypeOption[];
   onCreate: (payload: {
      name: string;
      description?: string;
      duration?: string; // ISO-8601 duration like "PT60M"
      deadline?: string; // local "YYYY-MM-DDTHH:mm" -> maps to LocalDateTime on backend
      requiredMachineTypeUuid?: string;
   }) => Promise<void>;
   // ISO bounds for the selected week (exclusive end)
   weekStartISO?: string; // e.g. 2025-11-17T00:00:00.000Z
   weekEndISO?: string; // exclusive
}

/**
 * AddJobModal
 *
 * - Uses Combobox for machine type selection (consistent UI)
 * - Restricts the deadline selection to the provided week bounds (if present)
 * - Validates deadline before submit to ensure job's deadline falls within the selected week
 *
 * Important changes:
 * - The modal now sends deadline as the local datetime string coming from the input (e.g. "2025-11-17T09:30")
 *   (no toISOString/Z suffix). That maps cleanly to Spring's LocalDateTime.
 * - The modal sends duration as an ISO-8601 duration string (e.g. "PT60M") so Jackson can bind to java.time.Duration.
 * - The machine type field is sent with the property name requiredMachineTypeUuid to match the server DTO.
 */
const AddJobModal: React.FC<Props> = ({ open, onClose, machineTypes, onCreate, weekStartISO, weekEndISO }) => {
   const [name, setName] = useState("");
   const [description, setDescription] = useState("");
   const [duration, setDuration] = useState<number>(60);
   const [deadlineLocal, setDeadlineLocal] = useState<string | "">("");
   const [machineTypeUuid, setMachineTypeUuid] = useState<string | "">("");
   const [submitting, setSubmitting] = useState(false);
   const [error, setError] = useState<string | null>(null);
   const [deadlineError, setDeadlineError] = useState<string | null>(null);

   // Initialize defaults when opened
   useEffect(() => {
      if (open) {
         setName("");
         setDescription("");
         setDuration(60);
         setMachineTypeUuid(machineTypes.length > 0 ? machineTypes[0].uuid : "");
         setDeadlineLocal("");
         setError(null);
         setDeadlineError(null);
         setSubmitting(false);
      }
   }, [open, machineTypes]);

   // Convert ISO bounds to values suitable for input[type="datetime-local"]
   const { minLocal, maxLocal } = useMemo(() => {
      if (!weekStartISO || !weekEndISO) return { minLocal: undefined, maxLocal: undefined };
      try {
         const start = new Date(weekStartISO);
         const end = new Date(weekEndISO);

         const fmt = (d: Date) =>
            d.getFullYear().toString().padStart(4, "0") +
            "-" +
            (d.getMonth() + 1).toString().padStart(2, "0") +
            "-" +
            d.getDate().toString().padStart(2, "0") +
            "T" +
            d.getHours().toString().padStart(2, "0") +
            ":" +
            d.getMinutes().toString().padStart(2, "0");

         const minLocal = fmt(new Date(start.getTime()));
         // max: subtract 1 minute from exclusive end, then format
         const lastInclusive = new Date(end.getTime() - 60_000);
         const maxLocal = fmt(new Date(lastInclusive.getTime()));
         return { minLocal, maxLocal };
      } catch (err) {
         return { minLocal: undefined, maxLocal: undefined };
      }
   }, [weekStartISO, weekEndISO]);

   // Map machine types for Combobox
   const machineTypeOptions = machineTypes.map((t) => ({ value: t.uuid, label: t.name }));

   if (!open) return null;

   const validateDeadlineWithinWeek = (localValue: string) => {
      if (!localValue) return true; // deadline optional
      // Input format: "YYYY-MM-DDTHH:MM" (local)
      // Convert local string to Date (interpreted in local timezone) and compare to UTC bounds
      const local = new Date(localValue);
      const iso = local.toISOString();
      if (!weekStartISO || !weekEndISO) return true;
      return iso >= weekStartISO && iso < weekEndISO;
   };

   // Prevent selecting a date outside the bounds: onChange will only accept values inside bounds
   const handleDeadlineChange = (val: string) => {
      if (!val) {
         setDeadlineLocal("");
         setDeadlineError(null);
         return;
      }
      // Accept only values that validate; otherwise show error and do not update internal state
      if (!validateDeadlineWithinWeek(val)) {
         setDeadlineError("Deadline must fall within the selected week.");
         // Do not set deadlineLocal to invalid value — keep previous valid value
         return;
      }
      setDeadlineError(null);
      setDeadlineLocal(val);
   };

   const handleSubmit = (e?: React.FormEvent) => {
      e?.preventDefault();
      if (!name.trim()) {
         setError("Name is required");
         return;
      }
      if (!machineTypeUuid) {
         setError("Please select a machine type");
         return;
      }
      if (deadlineLocal && !validateDeadlineWithinWeek(deadlineLocal)) {
         setError("Deadline must fall within the selected week");
         return;
      }

      setSubmitting(true);
      setError(null);

      // IMPORTANT: send deadline as the local input string (no timezone 'Z') so Jackson binds to LocalDateTime
      const deadlineToSend = deadlineLocal ? deadlineLocal : undefined;
      // Send duration as ISO-8601 duration string (Duration.parse on backend)
      const durationIso = `PT${Number(duration)}M`;

      onCreate({
         name: name.trim(),
         description: description.trim() || undefined,
         duration: durationIso,
         deadline: deadlineToSend,
         requiredMachineTypeUuid: machineTypeUuid || undefined,
      })
         .then(() => {
            setName("");
            setDescription("");
            setDeadlineLocal("");
            onClose();
         })
         .catch((err) => {
            console.error(err);
            setError("Failed to create job");
         })
         .finally(() => setSubmitting(false));
   };

   return (
      <div role="dialog" aria-modal="true" aria-label="Add job" className="fixed inset-0 z-50 flex items-center justify-center p-4">
         <div className="absolute inset-0 bg-black/30" onClick={() => { if (!submitting) onClose(); }} />

         <form onSubmit={handleSubmit} className="relative max-w-lg w-full bg-white border border-slate-200 rounded-2xl shadow-lg p-6 z-10">
            <div className="flex items-center justify-between mb-4">
               <h3 className="text-lg font-semibold">Add Job</h3>
               <button type="button" onClick={() => onClose()} className="text-slate-500 hover:text-slate-700">×</button>
            </div>

            <div className="space-y-3">
               <div>
                  <label className="block text-sm text-slate-700 mb-1">Name</label>
                  <input required value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" />
               </div>

               <div>
                  <label className="block text-sm text-slate-700 mb-1">Description</label>
                  <textarea required value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" rows={3} />
               </div>

               <div className="grid grid-cols-2 gap-3">
                  <div>
                     <label className="block text-sm text-slate-700 mb-1">Duration (minutes)</label>
                     <input type="number" min={1} value={duration} onChange={(e) => setDuration(Number(e.target.value))} className="w-full px-3 py-2 border rounded-lg text-sm" />
                  </div>

                  <div>
                     <label className="block text-sm text-slate-700 mb-1">Machine Type</label>
                     <Combobox id="job-machine-type" options={machineTypeOptions} value={machineTypeUuid || undefined} onChange={(v) => setMachineTypeUuid(v)} placeholder="Select type" />
                  </div>
               </div>

               <div>
                  <label className="block text-sm text-slate-700 mb-1">Deadline</label>
                  <input
                     type="datetime-local"
                     value={deadlineLocal}
                     onChange={(e) => handleDeadlineChange(e.target.value)}
                     min={minLocal}
                     max={maxLocal}
                     className="w-full px-3 py-2 border rounded-lg text-sm"
                     placeholder={minLocal ? undefined : "Optional"}
                  />
                  {deadlineError && <p className="text-xs text-red-600 mt-1">{deadlineError}</p>}
                  {minLocal && maxLocal && (
                     <p className="text-xs text-slate-500 mt-1">
                        Deadline must be between <strong>{new Date(weekStartISO || "").toLocaleString()}</strong> and{" "}
                        <strong>{new Date(weekEndISO || "").toLocaleString()}</strong> (exclusive).
                     </p>
                  )}
               </div>
            </div>

            {error && <p className="text-xs text-red-600 mt-3">{error}</p>}

            <div className="mt-6 flex justify-end gap-3">
               <button type="button" onClick={() => onClose()} className="px-4 py-2 bg-white border rounded-lg text-sm" disabled={submitting}>
                  Cancel
               </button>
               <button type="submit" className="px-4 py-2 bg-[#2563EB] text-white rounded-lg text-sm" disabled={submitting}>
                  {submitting ? "Saving..." : "Create"}
               </button>
            </div>
         </form>
      </div>
   );
};

export default AddJobModal;
