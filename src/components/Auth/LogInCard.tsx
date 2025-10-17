import React, { useState } from "react";
import ForgotPassword from "./ForgotPassword.tsx";

const GoogleIcon: React.FC = () => <span>G</span>;
const FacebookIcon: React.FC = () => <span>f</span>;
const SitemarkIcon: React.FC = () => <span>Logo</span>;

interface LogInCardProps {
  onSubmit?: () => void;
}

export const LogInCard: React.FC<LogInCardProps> = ({ onSubmit }) => {
  const [open, setOpen] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit) onSubmit();
  };

  return (
    <div
      className="
      max-w-sm mx-auto p-8 rounded-lg 
      bg-[var(--color-gray-50)] dark:bg-[var(--color-gray-900)] 
      border border-[var(--color-gray-200)] dark:border-[var(--color-gray-700)] 
      shadow-md shadow-[hsla(220,30%,5%,0.07)] dark:shadow-[hsla(220,30%,5%,0.7)]
      "
    >
      {/* Logo */}
      <div className="flex justify-center mb-6">
        <SitemarkIcon />
      </div>

      {/* Title */}
      <h1 className="text-3xl font-semibold text-center mb-6 text-[var(--color-gray-800)] dark:text-[var(--color-gray-50)]">
        Log In
      </h1>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 mb-6"
        noValidate
      >
        {/* Email Field */}
        <div>
          <label
            htmlFor="email"
            className="block text-xs font-medium mb-1 text-[var(--color-gray-600)] dark:text-[var(--color-gray-300)]"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            placeholder="your@email.com"
            className="
              w-full h-10 px-3 text-sm rounded-md
              border border-[var(--color-gray-300)] dark:border-[var(--color-gray-700)]
              bg-[var(--color-gray-50)] dark:bg-[var(--color-gray-800)]
              text-[var(--color-gray-800)] dark:text-[var(--color-gray-50)]
              focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-400)] focus:ring-opacity-50
              hover:border-[var(--color-gray-400)] dark:hover:border-[var(--color-gray-500)]
              transition-colors
            "
          />
        </div>

        {/* Password Field */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label
              htmlFor="password"
              className="text-xs font-medium text-[var(--color-gray-600)] dark:text-[var(--color-gray-300)]"
            >
              Password
            </label>
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="text-xs font-medium text-[var(--color-brand-500)] hover:underline"
            >
              Forgot your password?
            </button>
          </div>
          <input
            id="password"
            type="password"
            placeholder="••••••••"
            className="
              w-full h-10 px-3 text-sm rounded-md
              border border-[var(--color-gray-300)] dark:border-[var(--color-gray-700)]
              bg-[var(--color-gray-50)] dark:bg-[var(--color-gray-800)]
              text-[var(--color-gray-800)] dark:text-[var(--color-gray-50)]
              focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-400)] focus:ring-opacity-50
              hover:border-[var(--color-gray-400)] dark:hover:border-[var(--color-gray-500)]
              transition-colors
            "
          />
        </div>

        {/* Remember Me */}
        <label className="flex items-center gap-2 text-sm text-[var(--color-gray-600)] dark:text-white cursor-pointer">
          <input
            type="checkbox"
            className="
              w-4 h-4 rounded-[5px] border border-[var(--color-gray-300)] dark:border-[var(--color-gray-700)]
              bg-[var(--color-gray-100)] dark:bg-[var(--color-gray-800)]
              accent-[var(--color-brand-500)]
              focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)] focus:ring-opacity-50
              hover:border-[var(--color-brand-300)]
              transition-colors
            "
          />
          Remember me
        </label>

        {/* Forgot Password Modal */}
        <ForgotPassword open={open} handleClose={() => setOpen(false)} />

        {/* Log In Button */}
        <button
          type="submit"
          className="
            h-10 rounded-md border border-[var(--color-gray-700)]
            bg-gradient-to-b from-[var(--color-gray-700)] to-[var(--color-gray-800)]
            dark:from-[var(--color-gray-50)] dark:to-[var(--color-gray-100)]
            text-white dark:text-white text-sm font-medium
            shadow-inner
            hover:from-[var(--color-gray-600)] hover:to-[var(--color-gray-700)]
            dark:hover:from-[var(--color-gray-200)] dark:hover:to-[var(--color-gray-50)]
            active:bg-[var(--color-gray-800)] dark:active:bg-[var(--color-gray-200)]
            focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-500)] focus-visible:ring-opacity-50
            transition-all
          "
        >
          Log in
        </button>

        {/* Sign Up Link */}
        <p className="text-center text-sm text-[var(--color-gray-600)] dark:text-[var(--color-gray-300)]">
          Don’t have an account?{" "}
          <a
            href="#"
            className="
              relative font-medium text-[var(--color-brand-500)]
              w-fit dark:text-white
              before:content-[''] before:absolute before:left-0 before:bottom-0 before:h-[1px]
              before:w-full before:bg-[var(--color-gray-500)] before:opacity-30 before:transition-all
              hover:before:w-0
              focus-visible:outline focus-visible:outline-3 focus-visible:outline-[var(--color-brand-500)] focus-visible:outline-offset-1
              focus-visible:rounded-sm
            "
          >
            Sign up
          </a>
        </p>
      </form>

      {/* Divider */}
      <div className="flex items-center text-[var(--color-gray-500)] dark:text-[var(--color-gray-400)] mb-6">
        <div className="flex-1 h-px bg-[var(--color-gray-300)] dark:bg-[var(--color-gray-700)]"></div>
        <span className="px-4 text-sm text-black dark:text-white">or</span>
        <div className="flex-1 h-px bg-[var(--color-gray-300)] dark:bg-[var(--color-gray-700)]"></div>
      </div>

      {/* Social Login Buttons */}
      <div className="flex flex-col gap-3">
        <button
          type="button"
          className="
            h-10 flex items-center justify-center gap-2 rounded-md border border-[var(--color-gray-200)] dark:border-[var(--color-gray-700)]
            bg-[var(--color-gray-50)] dark:bg-[var(--color-gray-800)]
            hover:bg-[var(--color-gray-100)] dark:hover:bg-[var(--color-gray-900)]
            text-sm font-medium text-[var(--color-gray-800)] dark:text-[var(--color-gray-50)]
            transition-colors
          "
        >
          <GoogleIcon /> Sign in with Google
        </button>
        <button
          type="button"
          className="
            h-10 flex items-center justify-center gap-2 rounded-md border border-[var(--color-gray-200)] dark:border-[var(--color-gray-700)]
            bg-[var(--color-gray-50)] dark:bg-[var(--color-gray-800)]
            hover:bg-[var(--color-gray-100)] dark:hover:bg-[var(--color-gray-900)]
            text-sm font-medium text-[var(--color-gray-800)] dark:text-[var(--color-gray-50)]
            transition-colors
          "
        >
          <FacebookIcon /> Sign in with Facebook
        </button>
      </div>
    </div>
  );
};

export default LogInCard;
