// client/src/components/auth/VerifyOTP.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Loader,
  ShoppingCart,
  RefreshCw,
  Shield,
} from "lucide-react";
import axios from "axios";

const VerifyOTP = () => {
  const navigate = useNavigate();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [timer, setTimer] = useState(300); // 5 minutes in seconds
  const inputRefs = useRef([]);

  const email = sessionStorage.getItem("resetEmail");

  useEffect(() => {
    if (!email) {
      navigate("/forgot-password");
      return;
    }

    // Timer countdown
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [email, navigate]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleChange = (index, value) => {
    if (value.length > 1) {
      // Handle paste
      const pastedData = value.slice(0, 6).split("");
      const newOtp = [...otp];
      pastedData.forEach((char, i) => {
        if (index + i < 6) {
          newOtp[index + i] = char;
        }
      });
      setOtp(newOtp);

      // Focus last filled input or last input
      const lastIndex = Math.min(index + pastedData.length, 5);
      inputRefs.current[lastIndex]?.focus();
      return;
    }

    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const otpString = otp.join("");

    if (otpString.length !== 6) {
      setError("Please enter all 6 digits");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/auth/verify-otp`,
        {
          email,
          otp: otpString,
        }
      );

      setSuccess(true);
      sessionStorage.setItem("resetToken", response.data.resetToken);

      setTimeout(() => {
        navigate("/reset-password");
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Invalid OTP. Please try again.");
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    setError("");

    try {
      await axios.post(
        `${process.env.REACT_APP_API_URL}/auth/forgot-password`,
        { email }
      );

      setTimer(300); // Reset timer
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
      alert("New OTP sent to your email!");
    } catch (err) {
      setError("Failed to resend OTP. Please try again.");
    } finally {
      setResendLoading(false);
    }
  };

  if (!email) {
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
                Verify Your Identity
                <br />
                <span className="text-blue-200">Securely</span>
              </h2>
              <p className="text-blue-100 text-base xl:text-lg leading-relaxed">
                Enter the 6-digit code we sent to your email address to continue
                with your password reset.
              </p>
            </div>

            <div className="space-y-3 xl:space-y-4">
              {[
                "Code expires in 5 minutes",
                "One-time use only",
                "Secure verification process",
                "Can resend if needed",
              ].map((feature, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className="w-5 h-5 xl:w-6 xl:h-6 bg-green-400 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-3 h-3 xl:w-4 xl:h-4 text-white" />
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
            {/* Back Button */}
            <Link
              to="/forgot-password"
              className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Link>

            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                <Shield className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                Verify OTP
              </h2>
              <p className="text-gray-600 text-sm sm:text-base mb-2">
                Enter the 6-digit code sent to
              </p>
              <p className="text-blue-600 font-semibold text-sm sm:text-base">
                {email}
              </p>
            </div>

            {/* Timer */}
            <div className="mb-6 text-center">
              <div
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${
                  timer > 60
                    ? "bg-green-100 text-green-700"
                    : timer > 0
                    ? "bg-amber-100 text-amber-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="font-semibold text-sm">
                  {timer > 0 ? formatTime(timer) : "Expired"}
                </span>
              </div>
            </div>

            {/* Success Message */}
            {success && (
              <div className="mb-6 bg-green-50 border-l-4 border-green-500 rounded-lg p-4">
                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div className="ml-3 flex-1">
                    <p className="text-sm text-green-800 font-medium">
                      OTP verified successfully!
                    </p>
                    <p className="text-xs text-green-700 mt-1">
                      Redirecting to reset password...
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

            {/* OTP Input Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3 text-center">
                  Enter OTP Code
                </label>
                <div className="flex gap-2 justify-center">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => (inputRefs.current[index] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      disabled={isLoading || success || timer === 0}
                      className="w-12 h-12 sm:w-14 sm:h-14 text-center text-xl sm:text-2xl font-bold border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                      autoComplete="off"
                    />
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={
                  isLoading ||
                  success ||
                  timer === 0 ||
                  otp.join("").length !== 6
                }
                className="group relative w-full flex items-center justify-center py-3.5 px-4 border border-transparent text-sm sm:text-base font-semibold rounded-xl text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0"
              >
                {isLoading ? (
                  <>
                    <Loader className="animate-spin h-5 w-5 mr-2" />
                    Verifying...
                  </>
                ) : success ? (
                  <>
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Verified Successfully
                  </>
                ) : (
                  <>
                    <Shield className="h-5 w-5 mr-2" />
                    Verify OTP
                  </>
                )}
              </button>
            </form>

            {/* Resend OTP */}
            <div className="mt-6 text-center">
              {timer === 0 ? (
                <button
                  onClick={handleResend}
                  disabled={resendLoading}
                  className="inline-flex items-center text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors disabled:opacity-50"
                >
                  <RefreshCw
                    className={`w-4 h-4 mr-2 ${
                      resendLoading ? "animate-spin" : ""
                    }`}
                  />
                  {resendLoading ? "Sending..." : "Resend OTP"}
                </button>
              ) : (
                <p className="text-sm text-gray-600">
                  Didn't receive the code?{" "}
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resendLoading || timer > 240}
                    className="font-semibold text-blue-600 hover:text-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {resendLoading ? "Sending..." : "Resend"}
                  </button>
                </p>
              )}
            </div>

            {/* Help Text */}
            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500">
                Check your spam folder if you don't see the email
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

export default VerifyOTP;
