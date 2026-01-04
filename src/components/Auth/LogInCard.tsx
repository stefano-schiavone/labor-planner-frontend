import React, { useState } from "react";
import ForgotPassword from "./ForgotPassword";

const GoogleIcon: React.FC = () => <span className="w-4 h-4 flex items-center justify-center">G</span>;
const FacebookIcon: React.FC = () => <span className="w-4 h-4 flex items-center justify-center">f</span>;

interface LogInCardProps {
   onSubmit?: (email: string, password: string) => void;
}

const LogInCard: React.FC<LogInCardProps> = ({ onSubmit }) => {
   const [open, setOpen] = useState<boolean>(false);
   const [email, setEmail] = useState("");
   const [password, setPassword] = useState("");

   const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();

      // Frontend validation
      if (!email || !/\S+@\S+\.\S+/.test(email)) {
         alert("Invalid email"); // Frontend error
         return;
      }

      if (!password) {
         alert("Invalid password"); // Frontend error
         return;
      }

      if (onSubmit) onSubmit(email, password);
   };

   return (
      <div
         className="max-w-md w-full bg-white border border-slate-200 rounded-2xl shadow-lg p-6"
         role="region"
         aria-labelledby="signin-title"
      >
         <h1 id="signin-title" className="text-2xl font-semibold text-slate-900 text-center mb-6">
            Log in
         </h1>

         <form onSubmit={handleSubmit} className="flex flex-col gap-4 mb-6" noValidate>
            <div>
               <label htmlFor="email" className="block text-xs font-medium mb-1 text-slate-600">
                  Email
               </label>
               <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-11 px-3 text-sm rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[rgba(96,165,250,0.25)] focus:ring-offset-1 hover:border-slate-300 transition"
               />
            </div>

            <div>
               <div className="flex justify-between items-center mb-1">
                  <label htmlFor="password" className="text-xs font-medium text-slate-600">
                     Password
                  </label>
                  <button
                     type="button"
                     onClick={() => setOpen(true)}
                     className="text-xs font-medium text-[#2563EB] hover: underline"
                  >
                     Forgot?
                  </button>
               </div>
               <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-11 px-3 text-sm rounded-lg border border-slate-200 bg-white text-slate-900 focus: outline-none focus:ring-2 focus:ring-[rgba(96,165,250,0.25)] focus:ring-offset-1 hover:border-slate-300 transition"
               />
            </div>

            <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
               <input
                  type="checkbox"
                  className="w-4 h-4 rounded-sm border border-slate-300 bg-white accent-[#2563EB] focus: outline-none focus:ring-2 focus:ring-[rgba(96,165,250,0.25)] focus:ring-offset-1 transition"
               />
               Remember me
            </label>

            <ForgotPassword open={open} handleClose={() => setOpen(false)} />

            <button
               type="submit"
               className="h-11 rounded-lg w-full bg-[#2563EB] text-white font-medium text-sm shadow hover:bg-[#1f4fd6] active:bg-[#1844b8] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#60A5FA] focus-visible:ring-offset-1 transition"
            >
               Log in
            </button>
         </form>

         <div className="flex items-center text-slate-300 mb-4">
            <div className="flex-1 h-px bg-slate-200"></div>
            <span className="px-3 text-sm text-slate-400">or</span>
            <div className="flex-1 h-px bg-slate-200"></div>
         </div>

         <div className="flex flex-col gap-3">
            <button
               type="button"
               className="h-11 flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-800 hover:bg-slate-50 transition"
            >
               <GoogleIcon /> Sign in with Google
            </button>
            <button
               type="button"
               className="h-11 flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-800 hover: bg-slate-50 transition"
            >
               <FacebookIcon /> Sign in with Facebook
            </button>
         </div>
      </div>
   );
};

export default LogInCard;
