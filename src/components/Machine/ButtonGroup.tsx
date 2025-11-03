import React from "react";

interface ButtonGroupProps {
   onAdd?: () => void;
   onDelete?: () => void;
   onSort?: () => void;
}

const ButtonGroup: React.FC<ButtonGroupProps> = ({ onAdd, onDelete, onSort }) => {
   return (
      <div
         role="toolbar"
         aria-label="Actions"
         className="
        flex items-center gap-2
        bg-white
        border border-slate-200
        rounded-xl
        px-3 py-2
        shadow-sm
        w-auto
      "
      >
         {/* Add - subtle outlined primary (clarity + deference) */}
         <button
            onClick={onAdd}
            className="
          inline-flex items-center justify-center
          px-3 py-1.5
          text-sm font-medium
          rounded-lg
          text-[#2563EB]
          bg-[rgba(37,99,235,0.06)]
          border border-[rgba(37,99,235,0.12)]
          hover:bg-[rgba(37,99,235,0.10)]
          focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[rgba(96,165,250,0.25)]
          transition-colors duration-150
        "
            aria-label="Add"
            title="Add"
         >
            Add
         </button>

         {/* Delete - destructive */}
         <button
            onClick={onDelete}
            className="
          inline-flex items-center justify-center
          px-3 py-1.5
          text-sm font-medium
          rounded-lg
          bg-white
          text-red-600
          border border-red-100
          hover:bg-red-50
          focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-red-300
          transition-colors duration-150
        "
            aria-label="Delete"
            title="Delete"
         >
            Delete
         </button>

         {/* Sort - filled primary */}
         <button
            onClick={onSort}
            className="
          inline-flex items-center justify-center
          px-3 py-1.5
          text-sm font-medium
          rounded-lg
          text-white
          bg-[#2563EB]
          hover:bg-[#1F4FD6]
          active:bg-[#173fb3]
          focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[#60A5FA]
          transition-colors duration-150
        "
            aria-label="Sort"
            title="Sort"
         >
            Sort
         </button>
      </div>
   );
};

export default ButtonGroup;
