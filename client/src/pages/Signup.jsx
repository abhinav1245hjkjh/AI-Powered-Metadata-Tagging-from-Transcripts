import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Sparkles,
  Mail,
  Lock,
  User,
  ArrowRight,
  Loader2,
  Eye,
  EyeOff,
  AlertCircle,
  Tag,
  Layers,
  HeartHandshake,
  CheckCircle2
} from 'lucide-react';

const Signup = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Field interaction states
  const [nameTouched, setNameTouched] = useState(false);
  const [nameError, setNameError] = useState(null);

  const [emailTouched, setEmailTouched] = useState(false);
  const [emailError, setEmailError] = useState(null);

  const [passwordTouched, setPasswordTouched] = useState(false);
  const [passwordError, setPasswordError] = useState(null);

  const [confirmPasswordTouched, setConfirmPasswordTouched] = useState(false);
  const [confirmPasswordError, setConfirmPasswordError] = useState(null);

  const [regError, setRegError] = useState(null);

  const { register } = useAuth();
  const navigate = useNavigate();

  const validateEmail = (val) => {
    const trimmed = val.trim();
    if (!trimmed) {
      return 'Please enter your email address.';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      return 'Please enter a valid email address.';
    }
    return null;
  };

  const handleNameChange = (e) => {
    const val = e.target.value;
    setName(val);
    if (regError) setRegError(null);
    if (nameTouched) {
      setNameError(!val.trim() ? 'Please enter your full name.' : null);
    }
  };

  const handleNameBlur = () => {
    setNameTouched(true);
    setNameError(!name.trim() ? 'Please enter your full name.' : null);
  };

  const handleEmailChange = (e) => {
    const val = e.target.value;
    setEmail(val);
    if (regError) setRegError(null);
    if (emailTouched) {
      setEmailError(validateEmail(val));
    }
  };

  const handleEmailBlur = () => {
    setEmailTouched(true);
    setEmailError(validateEmail(email));
  };

  const handlePasswordChange = (e) => {
    const val = e.target.value;
    setPassword(val);
    if (regError) setRegError(null);
    if (passwordTouched) {
      if (!val) {
        setPasswordError('Please enter a password.');
      } else if (val.length < 6) {
        setPasswordError('Password must be at least 6 characters.');
      } else {
        setPasswordError(null);
      }
    }
    if (confirmPasswordTouched && confirmPassword) {
      setConfirmPasswordError(val !== confirmPassword ? 'Passwords do not match.' : null);
    }
  };

  const handlePasswordBlur = () => {
    setPasswordTouched(true);
    if (!password) {
      setPasswordError('Please enter a password.');
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters.');
    } else {
      setPasswordError(null);
    }
  };

  const handleConfirmPasswordChange = (e) => {
    const val = e.target.value;
    setConfirmPassword(val);
    if (regError) setRegError(null);
    if (confirmPasswordTouched) {
      setConfirmPasswordError(val !== password ? 'Passwords do not match.' : null);
    }
  };

  const handleConfirmPasswordBlur = () => {
    setConfirmPasswordTouched(true);
    setConfirmPasswordError(confirmPassword !== password ? 'Passwords do not match.' : null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setNameTouched(true);
    setEmailTouched(true);
    setPasswordTouched(true);
    setConfirmPasswordTouched(true);
    setRegError(null);

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName) {
      setNameError('Please enter your full name.');
      return;
    }
    setNameError(null);

    const emailErr = validateEmail(trimmedEmail);
    if (emailErr) {
      setEmailError(emailErr);
      return;
    }
    setEmailError(null);

    if (!password) {
      setPasswordError('Please enter a password.');
      return;
    }
    if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters.');
      return;
    }
    setPasswordError(null);

    if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match. Please verify.');
      return;
    }
    setConfirmPasswordError(null);

    setIsSubmitting(true);
    const res = await register(trimmedName, trimmedEmail, password);
    setIsSubmitting(false);

    if (res.success) {
      navigate('/dashboard', { replace: true });
    } else {
      setRegError(res.message || 'Unable to create your account. Please check your details and try again.');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center py-10 sm:py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      
      {/* Background Decorative Gradient Blobs (Extremely subtle low-opacity) */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-[#2563EB]/5 rounded-full blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#14B8A6]/5 rounded-full blur-3xl pointer-events-none translate-x-1/2 translate-y-1/2" />

      <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-center z-10">
        
        {/* LEFT COLUMN: MetaMind AI Branding & Product Capabilities */}
        <div className="lg:col-span-6 space-y-8 text-left relative">
          
          {/* Subtle Abstract Knowledge Graph Background Vector */}
          <div className="absolute -top-10 -left-10 w-full h-full opacity-[0.12] pointer-events-none z-0 overflow-hidden">
            <svg width="450" height="450" viewBox="0 0 450 450" fill="none">
              <circle cx="100" cy="100" r="8" fill="#2563EB" />
              <circle cx="280" cy="80" r="12" fill="#14B8A6" />
              <circle cx="200" cy="220" r="14" fill="#2563EB" />
              <circle cx="360" cy="260" r="10" fill="#2563EB" />
              <circle cx="90" cy="340" r="10" fill="#14B8A6" />
              <circle cx="270" cy="380" r="12" fill="#2563EB" />
              <line x1="100" y1="100" x2="280" y2="80" stroke="#2563EB" strokeWidth="2" strokeDasharray="4 4" />
              <line x1="100" y1="100" x2="200" y2="220" stroke="#2563EB" strokeWidth="2" />
              <line x1="280" y1="80" x2="200" y2="220" stroke="#14B8A6" strokeWidth="2" />
              <line x1="200" y1="220" x2="360" y2="260" stroke="#2563EB" strokeWidth="2" />
              <line x1="200" y1="220" x2="90" y2="340" stroke="#14B8A6" strokeWidth="2" strokeDasharray="4 4" />
              <line x1="360" y1="260" x2="270" y2="380" stroke="#2563EB" strokeWidth="2" />
              <line x1="90" y1="340" x2="270" y2="380" stroke="#2563EB" strokeWidth="2" />
            </svg>
          </div>

          <div className="relative z-10 space-y-6">
            
            {/* Top Brand Header */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-[#2563EB] flex items-center justify-center text-white shadow-md flex-shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <span className="font-extrabold text-2xl text-[#0F172A] tracking-tight">
                  MetaMind AI
                </span>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] tracking-wide">
                Enterprise Edition
              </span>
            </div>

            {/* Main Heading */}
            <div className="space-y-3">
              <h1 className="text-4xl sm:text-5xl font-black text-[#0F172A] tracking-tight leading-[1.1]">
                Build Your <br />
                Metadata <br />
                <span className="text-[#2563EB]">Workspace</span>
              </h1>
              <p className="text-sm sm:text-base text-[#64748B] leading-relaxed max-w-lg font-normal">
                Create your workspace and start transforming unstructured transcripts into structured, searchable metadata using AI-powered NLP.
              </p>
            </div>

            {/* 3 Product Capabilities */}
            <div className="space-y-4 pt-2">
              {/* Capability 1 */}
              <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-white/80 backdrop-blur-sm border border-[#E2E8F0] shadow-sm hover:border-[#BFDBFE] transition-all">
                <div className="w-9 h-9 rounded-full bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Tag className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#0F172A]">Topic & Keyword Extraction</h3>
                  <p className="text-xs text-[#64748B] mt-0.5 leading-normal">
                    Identify key topics, themes, and important keywords with high precision.
                  </p>
                </div>
              </div>

              {/* Capability 2 */}
              <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-white/80 backdrop-blur-sm border border-[#E2E8F0] shadow-sm hover:border-[#CCFBF1] transition-all">
                <div className="w-9 h-9 rounded-full bg-[#CCFBF1] text-[#0D9488] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#0F172A]">Named Entity Recognition</h3>
                  <p className="text-xs text-[#64748B] mt-0.5 leading-normal">
                    Detect people, organizations, locations, and other important entities.
                  </p>
                </div>
              </div>

              {/* Capability 3 */}
              <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-white/80 backdrop-blur-sm border border-[#E2E8F0] shadow-sm hover:border-[#BFDBFE] transition-all">
                <div className="w-9 h-9 rounded-full bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <HeartHandshake className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#0F172A]">Sentiment & Emotion Analysis</h3>
                  <p className="text-xs text-[#64748B] mt-0.5 leading-normal">
                    Understand sentiment shifts and emotional tone across conversations.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Create Account Card */}
        <div className="lg:col-span-6">
          <div className="bg-white border border-[#E2E8F0] shadow-xl rounded-2xl p-7 sm:p-9 space-y-6">
            
            {/* Form Title & Subtitle */}
            <div className="space-y-1 text-left">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
                Create an account
              </h2>
              <p className="text-xs sm:text-sm text-[#64748B]">
                Set up your MetaMind AI workspace to get started.
              </p>
            </div>

            {/* Registration Error Banner */}
            {regError && (
              <div
                role="alert"
                className="p-3.5 rounded-xl bg-[#FEF2F2] border border-[#FCA5A5] text-[#991B1B] text-xs flex items-start gap-2.5 transition-all duration-200"
              >
                <AlertCircle className="w-4 h-4 text-[#DC2626] flex-shrink-0 mt-0.5" />
                <span className="font-semibold leading-relaxed">{regError}</span>
              </div>
            )}

            {/* Form Fields */}
            <form onSubmit={handleSubmit} className="space-y-4 text-left" noValidate>
              
              {/* Full Name Input */}
              <div className="space-y-1.5">
                <label htmlFor="name" className="block text-xs sm:text-sm font-semibold text-[#334155]">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="name"
                    type="text"
                    required
                    disabled={isSubmitting}
                    value={name}
                    onChange={handleNameChange}
                    onBlur={handleNameBlur}
                    placeholder="Cognizant AI Evaluator"
                    autoComplete="name"
                    aria-invalid={Boolean(nameError)}
                    aria-describedby={nameError ? 'name-error' : undefined}
                    className={`w-full pl-10 pr-4 py-3 rounded-xl bg-white text-[#0F172A] placeholder-[#94A3B8] text-xs sm:text-sm transition-all duration-150 focus:outline-none ${
                      nameError
                        ? 'border border-[#FCA5A5] bg-[#FEF2F2]/50 focus:border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/20'
                        : 'border border-[#E2E8F0] hover:border-[#94A3B8] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20'
                    } disabled:bg-[#F8FAFC] disabled:text-[#64748B] disabled:cursor-not-allowed`}
                  />
                </div>
                {nameError && (
                  <p id="name-error" role="alert" className="text-xs text-[#DC2626] font-medium flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{nameError}</span>
                  </p>
                )}
              </div>

              {/* Email Address Input */}
              <div className="space-y-1.5">
                <label htmlFor="email" className="block text-xs sm:text-sm font-semibold text-[#334155]">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="email"
                    type="email"
                    required
                    disabled={isSubmitting}
                    value={email}
                    onChange={handleEmailChange}
                    onBlur={handleEmailBlur}
                    placeholder="name@cognizant.com"
                    autoComplete="email"
                    aria-invalid={Boolean(emailError)}
                    aria-describedby={emailError ? 'email-error' : undefined}
                    className={`w-full pl-10 pr-4 py-3 rounded-xl bg-white text-[#0F172A] placeholder-[#94A3B8] text-xs sm:text-sm transition-all duration-150 focus:outline-none ${
                      emailError
                        ? 'border border-[#FCA5A5] bg-[#FEF2F2]/50 focus:border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/20'
                        : 'border border-[#E2E8F0] hover:border-[#94A3B8] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20'
                    } disabled:bg-[#F8FAFC] disabled:text-[#64748B] disabled:cursor-not-allowed`}
                  />
                </div>
                {emailError && (
                  <p id="email-error" role="alert" className="text-xs text-[#DC2626] font-medium flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{emailError}</span>
                  </p>
                )}
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <label htmlFor="password" className="block text-xs sm:text-sm font-semibold text-[#334155]">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    disabled={isSubmitting}
                    value={password}
                    onChange={handlePasswordChange}
                    onBlur={handlePasswordBlur}
                    placeholder="At least 6 characters"
                    autoComplete="new-password"
                    aria-invalid={Boolean(passwordError)}
                    aria-describedby={passwordError ? 'password-error' : undefined}
                    className={`w-full pl-10 pr-11 py-3 rounded-xl bg-white text-[#0F172A] placeholder-[#94A3B8] text-xs sm:text-sm transition-all duration-150 focus:outline-none ${
                      passwordError
                        ? 'border border-[#FCA5A5] bg-[#FEF2F2]/50 focus:border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/20'
                        : 'border border-[#E2E8F0] hover:border-[#94A3B8] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20'
                    } disabled:bg-[#F8FAFC] disabled:text-[#64748B] disabled:cursor-not-allowed`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#0F172A] p-1 rounded-lg hover:bg-[#F1F5F9] transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {passwordError ? (
                  <p id="password-error" role="alert" className="text-xs text-[#DC2626] font-medium flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{passwordError}</span>
                  </p>
                ) : (
                  <p className="text-[11px] text-[#64748B] flex items-center gap-1 mt-1">
                    <CheckCircle2 className="w-3 h-3 text-[#0D9488]" />
                    <span>Must be at least 6 characters long</span>
                  </p>
                )}
              </div>

              {/* Confirm Password Input */}
              <div className="space-y-1.5">
                <label htmlFor="confirmPassword" className="block text-xs sm:text-sm font-semibold text-[#334155]">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    disabled={isSubmitting}
                    value={confirmPassword}
                    onChange={handleConfirmPasswordChange}
                    onBlur={handleConfirmPasswordBlur}
                    placeholder="Repeat password"
                    autoComplete="new-password"
                    aria-invalid={Boolean(confirmPasswordError)}
                    aria-describedby={confirmPasswordError ? 'confirm-password-error' : undefined}
                    className={`w-full pl-10 pr-11 py-3 rounded-xl bg-white text-[#0F172A] placeholder-[#94A3B8] text-xs sm:text-sm transition-all duration-150 focus:outline-none ${
                      confirmPasswordError
                        ? 'border border-[#FCA5A5] bg-[#FEF2F2]/50 focus:border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/20'
                        : 'border border-[#E2E8F0] hover:border-[#94A3B8] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20'
                    } disabled:bg-[#F8FAFC] disabled:text-[#64748B] disabled:cursor-not-allowed`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#0F172A] p-1 rounded-lg hover:bg-[#F1F5F9] transition-colors cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirmPasswordError && (
                  <p id="confirm-password-error" role="alert" className="text-xs text-[#DC2626] font-medium flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{confirmPasswordError}</span>
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-11 sm:h-12 px-4 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] active:bg-[#1E40AF] disabled:bg-[#CBD5E1] disabled:text-[#94A3B8] text-white font-bold text-xs sm:text-sm transition-all duration-150 shadow-md flex items-center justify-center gap-2 mt-2 cursor-pointer disabled:cursor-not-allowed group"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Creating account...</span>
                  </>
                ) : (
                  <>
                    <span>Create Account</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </form>

            {/* Login Link */}
            <div className="pt-2 text-center text-xs sm:text-sm text-[#64748B] border-t border-[#E2E8F0]">
              Already have an account?{' '}
              <Link
                to="/login"
                className="text-[#2563EB] hover:text-[#1D4ED8] font-bold hover:underline transition-colors cursor-pointer inline-block ml-0.5"
              >
                Sign In
              </Link>
            </div>
          </div>

          {/* Security / Informational Footer */}
          <div className="mt-4 text-center text-[11px] text-[#94A3B8] font-medium">
            Secure workspace access • AI-powered metadata intelligence
          </div>
        </div>

      </div>
    </div>
  );
};

export default Signup;
