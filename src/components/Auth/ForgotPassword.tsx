import React, { useState } from "react";

interface ForgotPasswordProps {
  open: boolean;
  handleClose: () => void;
}

const ForgotPassword: React.FC<ForgotPasswordProps> = ({
  open,
  handleClose,
}) => {
  const [email, setEmail] = useState("");

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    console.log("Password reset email sent to:", email);
    handleClose();
    setEmail("");
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-50 w-[90%] max-w-md rounded-lg shadow-lg border border-gray-200">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="px-6 pt-6 pb-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">
              Reset password
            </h2>
          </div>

          {/* Content */}
          <div className="px-6 py-5 flex flex-col gap-4">
            <p className="text-sm text-gray-600">
              Enter your account’s email address, and we’ll send you a link to
              reset your password.
            </p>

            <div>
              <label
                htmlFor="email"
                className="block text-xs font-medium text-gray-600 mb-2"
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                autoFocus
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-10 px-3 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 border border-gray-200 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-md text-sm font-medium text-white bg-gradient-to-b from-brand-400 to-brand-500 border border-brand-500 shadow-inner hover:from-brand-500 hover:to-brand-600 transition"
            >
              Continue
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
