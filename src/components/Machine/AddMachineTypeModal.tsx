import React, { useState } from "react";

interface Props {
   open: boolean;
   onClose: () => void;
   onCreate: (name: string) => Promise<void>;
}

/**
 * Small modal for creating a MachineType.
 * Uses the app's design language (rounded-2xl, subtle borders, blue primary).
 */
const AddMachineTypeModal: React.FC<Props> = ({ open, onClose, onCreate }) => {
   const [name, setName] = useState("");
   const [submitting, setSubmitting] = useState(false);
   const [error, setError] = useState<string | null>(null);

   if (!open) return null;

   const handleSubmit = (e?: React.FormEvent) => {
      e?.preventDefault();
      if (!name.trim()) {
         setError("Name is required");
         return;
      }
      setError(null);
      setSubmitting(true);
      return onCreate(name.trim())
         .then(() => {
            setName("");
            onClose();
         })
         .catch((err) => {
            // minimal error handling

            console.error(err);
            setError("Failed to create machine type");
         })
         .finally(() => setSubmitting(false));
   };

   return (
      <div
         role="dialog"
         aria-modal="true"
         aria-label="Add machine type"
         className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
         {/* Backdrop */}
         <div
            className="absolute inset-0 bg-black/30"
            onClick={() => {
               if (!submitting) onClose();
            }}
         />

         {/* Modal */}
         <div className="relative max-w-md w-full bg-white border border-slate-200 rounded-2xl shadow-lg p-6 z-10">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">New Machine Type</h3>
            <p className="text-sm text-slate-500 mb-4">Create a new machine type. This will be available when creating machines.</p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
               <div>
                  <label htmlFor="type-name" className="block text-xs font-medium mb-1 text-slate-600">
                     Name
                  </label>
                  <input
                     id="type-name"
                     value={name}
                     onChange={(e) => setName(e.target.value)}
                     className="w-full h-11 px-3 text-sm rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[rgba(96,165,250,0.25)] focus:ring-offset-1 hover:border-slate-300 transition"
                     placeholder="e.g. CNC"
                     disabled={submitting}
                  />
                  {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
               </div>

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

export default AddMachineTypeModal;
