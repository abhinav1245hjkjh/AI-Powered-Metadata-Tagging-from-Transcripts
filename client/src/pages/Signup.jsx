import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Mail, Lock, User, ArrowRight, Loader2, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

const Signup = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      toast.error('Please fill in all required fields.');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match. Please verify.');
      return;
    }

    setIsSubmitting(true);
    const res = await register(name.trim(), email.trim(), password);
    setIsSubmitting(false);

    if (res.success) {
      navigate('/', { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F7F9] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center px-4">
        
        {/* Left Pane: MetaScript AI Overview */}
        <div className="lg:col-span-6 space-y-6 text-left">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#3157D5] flex items-center justify-center text-white shadow-saas flex-shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-lg text-[#172033] tracking-tight">
                MetaMind AI
              </span>
              <span className="ml-2 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[#EEF3FF] text-[#3157D5] border border-[#C7D7FE]">
                Enterprise Edition
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#172033] tracking-tight leading-tight">
              Create your metadata workspace
            </h1>
            <p className="text-sm text-[#667085] leading-relaxed">
              MetaMind AI converts unstructured transcript content into structured, searchable, and actionable metadata using NLP and Generative AI.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-start gap-2.5 text-xs text-[#344054]">
              <CheckCircle2 className="w-4 h-4 text-[#15803D] mt-0.5 flex-shrink-0" />
              <span><strong>Deterministic Schema:</strong> Synchronized REST & JSON data contracts</span>
            </div>
            <div className="flex items-start gap-2.5 text-xs text-[#344054]">
              <CheckCircle2 className="w-4 h-4 text-[#15803D] mt-0.5 flex-shrink-0" />
              <span><strong>10 Domain Classifications:</strong> BART zero-shot categorization</span>
            </div>
            <div className="flex items-start gap-2.5 text-xs text-[#344054]">
              <CheckCircle2 className="w-4 h-4 text-[#15803D] mt-0.5 flex-shrink-0" />
              <span><strong>Instant Structured Exports:</strong> Complete JSON and flattened CSV</span>
            </div>
          </div>
        </div>

        {/* Right Pane: Registration Form */}
        <div className="lg:col-span-6">
          <div className="saas-card p-6 sm:p-8 space-y-5 bg-white border border-[#E4E7EC] shadow-saas">
            <div>
              <h2 className="text-lg font-bold text-[#172033] tracking-tight">Create Account</h2>
              <p className="text-xs text-[#667085] mt-0.5">
                Join MetaMind AI to begin extracting transcript intelligence
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#344054] mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#98A2B3] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Cognizant AI Evaluator"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-lg bg-white border border-[#D0D5DD] text-[#172033] placeholder-[#98A2B3] text-xs sm:text-sm focus:outline-none focus:border-[#3157D5] focus:ring-1 focus:ring-[#3157D5] transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#344054] mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#98A2B3] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@cognizant.com"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-lg bg-white border border-[#D0D5DD] text-[#172033] placeholder-[#98A2B3] text-xs sm:text-sm focus:outline-none focus:border-[#3157D5] focus:ring-1 focus:ring-[#3157D5] transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#344054] mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#98A2B3] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full pl-9 pr-10 py-2.5 rounded-lg bg-white border border-[#D0D5DD] text-[#172033] placeholder-[#98A2B3] text-xs sm:text-sm focus:outline-none focus:border-[#3157D5] focus:ring-1 focus:ring-[#3157D5] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#98A2B3] hover:text-[#172033] cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#344054] mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#98A2B3] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-lg bg-white border border-[#D0D5DD] text-[#172033] placeholder-[#98A2B3] text-xs sm:text-sm focus:outline-none focus:border-[#3157D5] focus:ring-1 focus:ring-[#3157D5] transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-11 px-4 rounded-lg bg-[#3157D5] hover:bg-[#2446B8] disabled:bg-[#E4E7EC] disabled:text-[#98A2B3] text-white font-semibold text-xs sm:text-sm transition-all shadow-saas flex items-center justify-center gap-2 mt-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <>
                    <span>Create Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="pt-3 text-center text-xs text-[#667085] border-t border-[#EAECF0]">
              Already have an account?{' '}
              <Link
                to="/login"
                className="text-[#3157D5] hover:text-[#2446B8] font-semibold transition-colors"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
