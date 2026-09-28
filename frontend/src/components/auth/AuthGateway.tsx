import React, { useState, useEffect, useRef } from 'react';
import {
  Brain,
  Shield,
  Mail,
  User as UserIcon,
  Briefcase,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Lock,
  Sparkles,
  Zap,
  Activity
} from 'lucide-react';
import { api } from '../../api/client';
import type { User } from '../../types';

interface AuthGatewayProps {
  onAuthenticated: (token: string, user: User) => void;
}

export const AuthGateway: React.FC<AuthGatewayProps> = ({ onAuthenticated }) => {
  const [mode, setMode] = useState<'SIGN_IN' | 'SIGN_UP'>('SIGN_IN');
  const [step, setStep] = useState<'INPUT' | 'OTP'>('INPUT');

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('SRE Commander');

  // OTP State
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    let timer: any;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setError('Please enter a valid work email address.');
      return;
    }
    if (mode === 'SIGN_UP' && !name.trim()) {
      setError('Please enter your full name for SRE incident identification.');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      await api.sendOtp(cleanEmail);
      setStep('OTP');
      setCountdown(30);
      setTimeout(() => inputRefs.current[0]?.focus(), 150);
    } catch (err: any) {
      setError(err?.message || 'Failed to dispatch verification code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    setError(null);

    // Auto-advance focus
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 filled
    if (digit && index === 5) {
      const fullCode = newOtp.join('');
      if (fullCode.length === 6) {
        verifyCode(fullCode);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const newOtp = [...otp];
    for (let i = 0; i < pasted.length; i++) {
      newOtp[i] = pasted[i] || '';
    }
    setOtp(newOtp);
    if (pasted.length === 6) {
      verifyCode(pasted);
    }
  };

  const verifyCode = async (codeToVerify?: string) => {
    const code = codeToVerify || otp.join('');
    if (code.length !== 6) {
      setError('Please enter the complete 6-digit code.');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const res = await api.verifyOtp(
        email.trim().toLowerCase(),
        code,
        mode === 'SIGN_UP' ? name.trim() : undefined,
        mode === 'SIGN_UP' ? role : undefined
      );

      localStorage.setItem('recallops_auth_token', res.token);
      onAuthenticated(res.token, res.user);
    } catch (err: any) {
      setError(err?.message || 'Invalid verification code');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8f5fc] via-[#ffffff] to-[#f3edf9] flex flex-col items-center justify-center p-4 selection:bg-purple-200 selection:text-purple-900">
      {/* Background Glow Blobs */}
      <div className="fixed top-12 left-1/4 w-96 h-96 bg-purple-200/40 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-12 right-1/4 w-96 h-96 bg-indigo-200/40 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-purple-500 shadow-xl shadow-purple-500/25 mb-3 text-white">
            <Brain className="h-7 w-7" />
          </div>
          <div className="flex items-center justify-center space-x-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">RecallOps</h1>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-200 font-semibold tracking-wide">
              SRE War Room
            </span>
          </div>
          <p className="text-xs text-purple-900/60 mt-1 max-w-xs mx-auto">
            Operational Memory & Intelligent Incident Response Platform
          </p>
        </div>

        {/* Card Box */}
        <div className="bg-white border border-purple-100/90 rounded-2xl shadow-xl shadow-purple-500/5 p-6 sm:p-7 backdrop-blur-xl">
          {/* Mode Switcher Tabs (Sign In vs Sign Up) */}
          {step === 'INPUT' && (
            <div className="flex items-center p-1 bg-purple-50/80 rounded-xl mb-5 border border-purple-100">
              <button
                type="button"
                onClick={() => {
                  setMode('SIGN_IN');
                  setError(null);
                }}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
                  mode === 'SIGN_IN'
                    ? 'bg-white text-purple-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('SIGN_UP');
                  setError(null);
                }}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
                  mode === 'SIGN_UP'
                    ? 'bg-white text-purple-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Sign Up (New Responder)
              </button>
            </div>
          )}

          {/* Error Notice */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {step === 'INPUT' ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              {mode === 'SIGN_UP' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Full Name *
                    </label>
                    <div className="relative">
                      <UserIcon className="h-4 w-4 absolute left-3 top-2.5 text-purple-400" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. Alex Mercer"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-xs bg-purple-50/40 border border-purple-100 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-purple-500 focus:bg-white focus:ring-2 focus:ring-purple-500/10 transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      On-Call Role *
                    </label>
                    <div className="relative">
                      <Briefcase className="h-4 w-4 absolute left-3 top-2.5 text-purple-400" />
                      <select
                        value={role}
                        onChange={e => setRole(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-xs bg-purple-50/40 border border-purple-100 rounded-xl text-slate-800 focus:outline-none focus:border-purple-500 focus:bg-white focus:ring-2 focus:ring-purple-500/10 transition"
                      >
                        <option value="SRE Commander">SRE Commander</option>
                        <option value="On-Call Responder">On-Call Responder</option>
                        <option value="DevOps Lead">DevOps Lead</option>
                        <option value="Platform Architect">Platform Architect</option>
                        <option value="Incident Commander">Incident Commander</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Work Email Address *
                </label>
                <div className="relative">
                  <Mail className="h-4 w-4 absolute left-3 top-2.5 text-purple-400" />
                  <input
                    type="email"
                    required
                    placeholder="e.g. oncall.lead@company.io"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-purple-50/40 border border-purple-100 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-purple-500 focus:bg-white focus:ring-2 focus:ring-purple-500/10 transition"
                  />
                </div>
                <p className="text-[11px] text-purple-900/60 mt-1.5 flex items-center space-x-1">
                  <Shield className="h-3 w-3 text-purple-500" />
                  <span>We send a single-use 6-digit OTP code to verify your mail.</span>
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading || !email.trim()}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center justify-center space-x-2 transition shadow-md shadow-purple-500/20"
              >
                {isLoading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <span>{mode === 'SIGN_UP' ? 'Create Account & Send OTP' : 'Send Verification OTP'}</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="text-center space-y-1.5 pb-1">
                <div className="inline-flex items-center justify-center p-2.5 rounded-full bg-purple-100 text-purple-600 mb-1">
                  <Mail className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">Check Your Email</h3>
                <p className="text-xs text-slate-500">
                  We sent a 6-digit verification code to
                </p>
                <p className="text-xs font-mono font-bold text-purple-700 bg-purple-50 py-1 px-3 rounded-lg inline-block border border-purple-100">
                  {email}
                </p>
                <p className="text-[11px] text-slate-400">
                  Please check your inbox (or spam) and enter the 6-digit OTP code:
                </p>
              </div>

              {/* 6 Digit Inputs */}
              <div className="flex justify-center space-x-2" onPaste={handlePaste}>
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={el => (inputRefs.current[idx] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleOtpChange(idx, e.target.value)}
                    onKeyDown={e => handleKeyDown(idx, e)}
                    className="w-10 h-12 text-center text-lg font-mono font-bold bg-purple-50/40 border border-purple-200 rounded-xl text-slate-800 focus:outline-none focus:border-purple-600 focus:bg-white focus:ring-2 focus:ring-purple-500/20 transition"
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={() => verifyCode()}
                disabled={isLoading || otp.join('').length !== 6}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center justify-center space-x-2 transition shadow-md shadow-purple-500/20"
              >
                {isLoading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Verify & Access War Room</span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setStep('INPUT');
                    setOtp(['', '', '', '', '', '']);
                    setError(null);
                  }}
                  className="hover:text-purple-700 transition"
                >
                  ← Edit details
                </button>

                {countdown > 0 ? (
                  <span className="text-slate-400">Resend code in {countdown}s</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSendOtp()}
                    className="text-purple-600 hover:text-purple-800 font-semibold transition"
                  >
                    Resend Code
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Feature Badges Footer */}
        <div className="mt-6 grid grid-cols-3 gap-2 text-center text-[11px] text-purple-900/60">
          <div className="p-2 rounded-xl bg-white/70 border border-purple-100 shadow-sm flex flex-col items-center">
            <Shield className="h-4 w-4 text-purple-600 mb-1" />
            <span className="font-medium text-slate-700">Human Approval</span>
            <span>Safety Gates</span>
          </div>
          <div className="p-2 rounded-xl bg-white/70 border border-purple-100 shadow-sm flex flex-col items-center">
            <Brain className="h-4 w-4 text-purple-600 mb-1" />
            <span className="font-medium text-slate-700">Hindsight Memory</span>
            <span>Past Outages</span>
          </div>
          <div className="p-2 rounded-xl bg-white/70 border border-purple-100 shadow-sm flex flex-col items-center">
            <Zap className="h-4 w-4 text-purple-600 mb-1" />
            <span className="font-medium text-slate-700">Rapid MTTR</span>
            <span>Fast Triage</span>
          </div>
        </div>
      </div>
    </div>
  );
};
