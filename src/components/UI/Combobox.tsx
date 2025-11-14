import React, { useEffect, useRef, useState } from "react";

interface Option {
   value: string;
   label: string;
}

interface ComboboxProps {
   id?: string;
   options: Option[];
   value?: string;
   onChange: (value: string) => void;
   placeholder?: string;
   disabled?: boolean;
   ariaLabel?: string;
}

/**
 * Accessible, browser-consistent combobox/listbox replacement.
 * - Replaces native <select> so the popover (options panel) can be styled and positioned consistently across browsers (fixes Safari misalignment).
 * - Keyboard: ArrowDown/ArrowUp move highlight, Enter selects, Esc closes, Home/End supported.
 * - Mouse: click to open, click option to select.
 * - ARIA: role="combobox" on button, role="listbox" on the popover and role="option" on items.
 *
 * Styled to match the "Apple-like" controls in the app (rounded pill, subtle blur, chevron).
 */
const Combobox: React.FC<ComboboxProps> = ({ id, options, value, onChange, placeholder, disabled, ariaLabel }) => {
   const [open, setOpen] = useState(false);
   const [highlight, setHighlight] = useState<number>(-1);
   const containerRef = useRef<HTMLDivElement | null>(null);
   const listRef = useRef<HTMLUListElement | null>(null);

   const selectedIndex = options.findIndex((o) => o.value === value);

   useEffect(() => {
      // ensure highlight follows selected value when opening
      if (open) {
         setHighlight(selectedIndex >= 0 ? selectedIndex : 0);
      } else {
         setHighlight(-1);
      }
   }, [open, selectedIndex]);

   useEffect(() => {
      function onDocClick(e: MouseEvent) {
         if (!containerRef.current) return;
         if (!containerRef.current.contains(e.target as Node)) {
            setOpen(false);
         }
      }
      document.addEventListener("mousedown", onDocClick);
      return () => document.removeEventListener("mousedown", onDocClick);
   }, []);

   useEffect(() => {
      if (highlight >= 0 && listRef.current) {
         const el = listRef.current.children[highlight] as HTMLElement | undefined;
         el?.scrollIntoView({ block: "nearest" });
      }
   }, [highlight]);

   const toggle = () => {
      if (disabled) return;
      setOpen((s) => !s);
   };

   const handleKeyDown = (e: React.KeyboardEvent) => {
      if (disabled) return;
      switch (e.key) {
         case "ArrowDown":
            e.preventDefault();
            if (!open) {
               setOpen(true);
               return;
            }
            setHighlight((h) => (h < options.length - 1 ? h + 1 : 0));
            break;
         case "ArrowUp":
            e.preventDefault();
            if (!open) {
               setOpen(true);
               return;
            }
            setHighlight((h) => (h > 0 ? h - 1 : options.length - 1));
            break;
         case "Home":
            e.preventDefault();
            setHighlight(0);
            break;
         case "End":
            e.preventDefault();
            setHighlight(options.length - 1);
            break;
         case "Enter":
            e.preventDefault();
            if (open && highlight >= 0) {
               onChange(options[highlight].value);
               setOpen(false);
            } else {
               setOpen(true);
            }
            break;
         case "Escape":
            e.preventDefault();
            setOpen(false);
            break;
         default:
            break;
      }
   };

   const handleSelect = (i: number) => {
      onChange(options[i].value);
      setOpen(false);
   };

   const selectedLabel = options.find((o) => o.value === value)?.label ?? placeholder ?? "";

   return (
      <div ref={containerRef} className="relative" aria-hidden={disabled ? "true" : undefined}>
         <button
            id={id}
            type="button"
            aria-haspopup="listbox"
            aria-expanded={open}
            aria-label={ariaLabel ?? placeholder}
            onClick={toggle}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            className={`appearance-none w-full pr-10 pl-3 h-11 text-sm bg-white/80 backdrop-blur-sm border border-slate-200 rounded-2xl shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-[rgba(37,99,235,0.14)] transition duration-150 ease-in-out text-left capitalize ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
         >
            <span className={`block truncate ${!selectedLabel ? "text-slate-400" : "text-slate-900"}`}>{selectedLabel}</span>
         </button>

         {/* chevron */}
         <svg
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden
         >
            <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
         </svg>

         {open && (
            <ul
               ref={listRef}
               role="listbox"
               aria-label={ariaLabel ?? placeholder}
               tabIndex={-1}
               className="absolute z-50 mt-2 w-full max-h-56 overflow-auto bg-white border border-slate-200 rounded-2xl shadow-lg py-1 focus:outline-none"
            >
               {options.map((opt, i) => {
                  const isSelected = opt.value === value;
                  const isHighlighted = i === highlight;
                  return (
                     <li
                        key={opt.value}
                        role="option"
                        aria-selected={isSelected}
                        onMouseEnter={() => setHighlight(i)}
                        onMouseDown={(e) => {
                           // prevent blur before click handled
                           e.preventDefault();
                        }}
                        onClick={() => handleSelect(i)}
                        className={`px-4 py-2 capitalize text-sm cursor-pointer ${isHighlighted ? "bg-slate-100" : ""} ${isSelected ? "font-medium" : "text-slate-700"}`}
                     >
                        {opt.label}
                     </li>
                  );
               })}
            </ul>
         )}
      </div>
   );
};

export default Combobox;
