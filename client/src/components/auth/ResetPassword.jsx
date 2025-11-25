// client/src/components/auth/ResetPassword.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Loader,
  ShoppingCart,
  Shield,
  Check,
} from "lucide-react";
import axios from "axios";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    new: false,
    confirm: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  const email = sessionStorage.getItem("resetEmail");
  const resetToken = sessionStorage.getItem("resetToken");

  useEffect(() => {
    if (!email || !resetToken) {
      navigate("/forgot-password");
    }
  }, [email, resetToken, navigate]);

  // Password strength checker
  useEffect(() => {
    const password = formData.newPassword;
    let strength = 0;

    if (password.length >= 6) strength++;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    setPasswordStrength(strength);
  }, [formData.newPassword]);

  const getPasswordStrengthColor = () => {
    if (passwordStrength <= 1) return "bg-red-500";
    if (passwordStrength <= 2) return "bg-orange-500";
    if (passwordStrength <= 3) return "bg-yellow-500";
    if (passwordStrength <= 4) return "bg-blue-500";
    return "bg-green-500";
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength <= 1) return "Weak";
    if (passwordStrength <= 2) return "Fair";
    if (passwordStrength <= 3) return "Good";
    if (passwordStrength <= 4) return "Strong";
    return "Very Strong";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validation
    if (formData.newPassword.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);

    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/auth/reset-password`, {
        email,
        resetToken,
        newPassword: formData.newPassword,
      });

      setSuccess(true);
      sessionStorage.removeItem("resetEmail");
      sessionStorage.removeItem("resetToken");

      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to reset password. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!email || !resetToken) {
    return null;
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Brand Section (Hidden on mobile) */}
      <div className="hidden lg:flex lg:flex-1 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
        </div>

        <div className="relative z-10 flex flex-col justify-between p-8 xl:p-12 text-white">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 xl:w-12 xl:h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 xl:w-6 xl:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl xl:text-2xl font-bold">BillTrack Pro</h1>
              <p className="text-blue-200 text-xs xl:text-sm">
                Billing Made Simple
              </p>
            </div>
          </div>

          <div className="space-y-6 max-w-lg">
            <div>
              <h2 className="text-3xl xl:text-4xl font-bold mb-4">
                Create New Password
                <br />
                <span className="text-blue-200">Stay Secure</span>
              </h2>
              <p className="text-blue-100 text-base xl:text-lg leading-relaxed">
                Choose a strong password to keep your account safe and secure.
              </p>
            </div>

            <div className="space-y-3 xl:space-y-4">
              {[
                "At least 6 characters",
                "Mix of letters and numbers",
                "Include special characters",
                "Avoid common passwords",
              ].map((feature, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className="w-5 h-5 xl:w-6 xl:h-6 bg-green-400 rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 xl:w-4 xl:h-4 text-white" />
                  </div>
                  <span className="text-sm xl:text-base text-blue-100">
                    {feature}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="text-blue-200 text-xs xl:text-sm">
            <p>© 2025 BillTrack Pro. All rights reserved.</p>
          </div>
        </div>

        <div className="absolute top-20 right-20 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-40 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl" />
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8 p-2">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl mb-4">
              <ShoppingCart className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">BillTrack Pro</h1>
            <p className="text-gray-600 text-sm mt-1">Billing Made Simple</p>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 sm:p-8 lg:p-10">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                <Lock className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                Reset Password
              </h2>
              <p className="text-gray-600 text-sm sm:text-base">
                Create a strong password for your account
              </p>
            </div>

            {/* Success Message */}
            {success && (
              <div className="mb-6 bg-green-50 border-l-4 border-green-500 rounded-lg p-4">
                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div className="ml-3 flex-1">
                    <p className="text-sm text-green-800 font-medium">
                      Password reset successfully!
                    </p>
                    <p className="text-xs text-green-700 mt-1">
                      Redirecting to login page...
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-6 bg-red-50 border-l-4 border-red-500 rounded-lg p-4">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <div className="ml-3 flex-1">
                    <p className="text-sm text-red-800 font-medium">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* New Password */}
              <div>
                <label
                  htmlFor="newPassword"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="newPassword"
                    name="newPassword"
                    type={showPasswords.new ? "text" : "password"}
                    required
                    disabled={isLoading || success}
                    className="appearance-none block w-full pl-12 pr-12 py-3.5 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 text-sm sm:text-base disabled:bg-gray-100"
                    placeholder="Enter new password"
                    value={formData.newPassword}
                    onChange={(e) =>
                      setFormData({ ...formData, newPassword: e.target.value })
                    }
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowPasswords({
                        ...showPasswords,
                        new: !showPasswords.new,
                      })
                    }
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showPasswords.new ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {formData.newPassword && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-gray-700">
                        Password Strength:
                      </span>
                      <span
                        className={`text-xs font-semibold ${
                          passwordStrength <= 2
                            ? "text-red-600"
                            : passwordStrength <= 3
                            ? "text-yellow-600"
                            : "text-green-600"
                        }`}
                      >
                        {getPasswordStrengthText()}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${getPasswordStrengthColor()}`}
                        style={{ width: `${(passwordStrength / 5) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showPasswords.confirm ? "text" : "password"}
                    required
                    disabled={isLoading || success}
                    className="appearance-none block w-full pl-12 pr-12 py-3.5 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 text-sm sm:text-base disabled:bg-gray-100"
                    placeholder="Confirm new password"
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        confirmPassword: e.target.value,
                      })
                    }
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowPasswords({
                        ...showPasswords,
                        confirm: !showPasswords.confirm,
                      })
                    }
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showPasswords.confirm ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>

                {/* Password Match Indicator */}
                {formData.confirmPassword && (
                  <div className="mt-2">
                    {formData.newPassword === formData.confirmPassword ? (
                      <div className="flex items-center text-green-600">
                        <Check className="w-4 h-4 mr-1" />
                        <span className="text-xs font-medium">
                          Passwords match
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center text-red-600">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        <span className="text-xs font-medium">
                          Passwords do not match
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Password Requirements */}
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs font-semibold text-gray-700 mb-2">
                  Password Requirements:
                </p>
                <ul className="space-y-1">
                  <li
                    className={`text-xs flex items-center ${
                      formData.newPassword.length >= 6
                        ? "text-green-600"
                        : "text-gray-500"
                    }`}
                  >
                    <span className="mr-2">
                      {formData.newPassword.length >= 6 ? "✓" : "○"}
                    </span>
                    At least 6 characters
                  </li>
                  <li
                    className={`text-xs flex items-center ${
                      /[A-Z]/.test(formData.newPassword) &&
                      /[a-z]/.test(formData.newPassword)
                        ? "text-green-600"
                        : "text-gray-500"
                    }`}
                  >
                    <span className="mr-2">
                      {/[A-Z]/.test(formData.newPassword) &&
                      /[a-z]/.test(formData.newPassword)
                        ? "✓"
                        : "○"}
                    </span>
                    Mix of uppercase and lowercase letters
                  </li>
                  <li
                    className={`text-xs flex items-center ${
                      /\d/.test(formData.newPassword)
                        ? "text-green-600"
                        : "text-gray-500"
                    }`}
                  >
                    <span className="mr-2">
                      {/\d/.test(formData.newPassword) ? "✓" : "○"}
                    </span>
                    At least one number
                  </li>
                  <li
                    className={`text-xs flex items-center ${
                      /[^A-Za-z0-9]/.test(formData.newPassword)
                        ? "text-green-600"
                        : "text-gray-500"
                    }`}
                  >
                    <span className="mr-2">
                      {/[^A-Za-z0-9]/.test(formData.newPassword) ? "✓" : "○"}
                    </span>
                    Special character (recommended)
                  </li>
                </ul>
              </div>

              <button
                type="submit"
                disabled={
                  isLoading ||
                  success ||
                  formData.newPassword !== formData.confirmPassword ||
                  formData.newPassword.length < 6
                }
                className="group relative w-full flex items-center justify-center py-3.5 px-4 border border-transparent text-sm sm:text-base font-semibold rounded-xl text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0"
              >
                {isLoading ? (
                  <>
                    <Loader className="animate-spin h-5 w-5 mr-2" />
                    Resetting Password...
                  </>
                ) : success ? (
                  <>
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Password Reset Successfully
                  </>
                ) : (
                  <>
                    <Shield className="h-5 w-5 mr-2" />
                    Reset Password
                  </>
                )}
              </button>
            </form>

            {/* Help Text */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Remember your password?{" "}
                <Link
                  to="/login"
                  className="font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </div>

          {/* Mobile Footer */}
          <div className="lg:hidden mt-6 text-center text-sm text-gray-500">
            <p>© 2025 BillTrack Pro. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
