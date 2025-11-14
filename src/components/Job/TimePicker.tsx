import React from "react";

interface TimePickerProps {
   value?: string;
   onChange?: (value: string) => void;
   step?: number;
   className?: string;
   ariaLabel?: string;
}

/**
 * TimePicker
 *
 * - Slightly larger touch target and clearer text size for easy tapping/reading per Apple HIG.
 * - Preserves the original color and behaviour; only spacing/typography adjusted.
 */
const TimePicker: React.FC<TimePickerProps> = ({ value = "09:00", onChange, step = 60, className = "", ariaLabel }) => {
   const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange?.(e.target.value);
   };

   return (
      <input
         type="time"
         value={value}
         step={step}
         onChange={handleChange}
         aria-label={ariaLabel ?? "Select time"}
         className={`w-full px-4 py-3 border rounded-2xl text-sm leading-6 bg-white focus:outline-none focus:ring-2 focus:ring-sky-200 ${className}`}
      />
   );
};

export default TimePicker;
