import React, { useEffect, useState } from "react";

interface MachineTypeOption {
   uuid: string;
   name: string;
}

interface MachineStatusOption {
   uuid: string;
   name: string;
}

interface Props {
   open: boolean;
   onClose: () => void;
   machineTypes: MachineTypeOption[];
   statusOptions: MachineStatusOption[];
   onCreate: (payload: {
      name: string;
      description?: string;
      machineTypeUuid: string;
      statusOptionUuid: string;
   }) => Promise<void>;
}

/**
 * Modal to create a Machine.
 * - Select existing machine type (dropdown)
 * - Provide name, description, and status
 * - Respect app visual language used across the project
 */
const AddMachineModal: React.FC<Props> = ({ open, onClose, machineTypes, statusOptions, onCreate }) => {
   const [name, setName] = useState("");
   const [description, setDescription] = useState("");
   // Fallback to "" because if anyone tries to send the request with no machine type or status, it will
   // get blocked because MachineRequest in backend has @NotBlank
   const [typeUuid, setTypeUuid] = useState<string | "">("");
   const [statusUuid, setStatusUuid] = useState<string | "">("");
   const [submitting, setSubmitting] = useState(false);
   const [error, setError] = useState<string | null>(null);

   useEffect(() => {
      if (open) {
         // reset when opened
         setName("");
         setDescription("");
         setTypeUuid(machineTypes.length > 0 ? machineTypes[0].uuid : "");
         setStatusUuid(statusOptions.length > 0 ? statusOptions[0].uuid : "");
         setError(null);
         setSubmitting(false);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [open]);


   if (!open) return null;

   const handleSubmit = (e?: React.FormEvent) => {
      e?.preventDefault();
      if (!name.trim()) {
         setError("Name is required");
         return;
      }

      if (!typeUuid) {
         setError("Please select a machine type");
         return;
      }

      setError(null);
      setSubmitting(true);

      return onCreate({
         name: name.trim(),
         description: description.trim(),
         machineTypeUuid: typeUuid,
         statusOptionUuid: statusUuid,
      })
         .then(() => {
            setName("");
            setDescription("");
            onClose();
         })
         .catch((err) => {

            console.error(err);
            setError("Failed to create machine");
         })
         .finally(() => setSubmitting(false));
   };

   return (
      <div role="dialog" aria-modal="true" aria-label="Add machine" className="fixed inset-0 z-50 flex items-center justify-center p-4">
         <div className="absolute inset-0 bg-black/30" onClick={() => { if (!submitting) onClose(); }} />

         <div className="relative max-w-lg w-full bg-white border border-slate-200 rounded-2xl shadow-lg p-6 z-10">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">New Machine</h3>
            <p className="text-sm text-slate-500 mb-4">Create a machine and assign it to a machine type.</p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
               <div>
                  <label htmlFor="machine-name" className="block text-xs font-medium mb-1 text-slate-600">
                     Name
                  </label>
                  <input
                     id="machine-name"
                     value={name}
                     onChange={(e) => setName(e.target.value)}
                     className="w-full h-11 px-3 text-sm rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[rgba(96,165,250,0.25)] focus:ring-offset-1 hover:border-slate-300 transition"
                     placeholder="e.g. Machine 1"
                     disabled={submitting}
                  />
               </div>

               <div>
                  <label htmlFor="machine-desc" className="block text-xs font-medium mb-1 text-slate-600">
                     Description
                  </label>
                  <textarea
                     id="machine-desc"
                     value={description}
                     onChange={(e) => setDescription(e.target.value)}
                     className="w-full min-h-[64px] px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[rgba(96,165,250,0.25)] focus:ring-offset-1 hover:border-slate-300 transition"
                     placeholder="Optional description"
                     disabled={submitting}
                  />
               </div>

               <div className="grid grid-cols-2 gap-3">
                  <div>
                     <label htmlFor="machine-type" className="block text-xs font-medium mb-1 text-slate-600">
                        Type
                     </label>
                     <select
                        id="machine-type"
                        value={typeUuid}
                        onChange={(e) => setTypeUuid(e.target.value)}
                        className="w-full h-11 px-3 text-sm rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[rgba(96,165,250,0.25)] focus:ring-offset-1 hover:border-slate-300 transition"
                        disabled={submitting}
                     >
                        {machineTypes.length === 0 && <option value="">No types available</option>}
                        {machineTypes.map((t) => (
                           <option key={t.uuid} value={t.uuid}>
                              {t.name}
                           </option>
                        ))}
                     </select>
                  </div>

                  <div>
                     <label htmlFor="machine-status" className="block text-xs font-medium mb-1 text-slate-600">
                        Status
                     </label>
                     <select
                        id="machine-status"
                        value={statusUuid}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStatusUuid(e.target.value)}
                        className="w-full h-11 px-3 text-sm rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[rgba(96,165,250,0.25)] focus:ring-offset-1 hover:border-slate-300 transition capitalize"
                        disabled={submitting}
                     >
                        {statusOptions.map((s) => (
                           <option key={s.uuid} value={s.uuid}>
                              {s.name}
                           </option>
                        ))}
                     </select>
                  </div>
               </div>

               {error && <p className="text-xs text-red-600">{error}</p>}

               <div className="flex justify-end gap-3">
                  <button
                     type="button"
                     onClick={() => onClose()}
                     className="h-11 px-4 rounded-lg bg-white text-sm text-slate-700 border border-slate-200 hover:bg-slate-50 transition"
                     disabled={submitting}
                  >
                     Cancel
                  </button>
                  <button
                     type="submit"
                     onClick={handleSubmit}
                     className="h-11 px-4 rounded-lg bg-[#2563EB] text-white text-sm font-medium hover:bg-[#1f4fd6] active:bg-[#1844b8] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#60A5FA] focus-visible:ring-offset-1 transition"
                     disabled={submitting}
                  >
                     {submitting ? "Creating..." : "Create"}
                  </button>
               </div>
            </form>
         </div>
      </div>
   );
};

export default AddMachineModal;
