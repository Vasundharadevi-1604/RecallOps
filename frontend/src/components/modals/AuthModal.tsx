import React, { useState, useEffect, useRef } from 'react';
import { Mail, KeyRound, ArrowRight, CheckCircle2, AlertCircle, RefreshCw, X, Shield, Lock } from 'lucide-react';
import { api } from '../../api/client';
import type { User } from '../../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (token: string, user: User) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [step, setStep] = useState<'EMAIL' | 'OTP'>('EMAIL');
  const [email, setEmail] = useState('');
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

  if (!isOpen) return null;

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('Please enter a valid work email address.');
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
      setError(err?.message || 'Failed to send verification email');
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

    // Auto-advance
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit if all 6 filled
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
      const res = await api.verifyOtp(email.trim().toLowerCase(), code);
      localStorage.setItem('recallops_auth_token', res.token);
      onSuccess(res.token, res.user);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Invalid verification code');
    } finally {
      setIsLoading(false);
    }
  };

  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white border border-purple-100 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-purple-100 flex items-center justify-between bg-purple-50/50">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-purple-100 text-purple-700">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">RecallOps SRE War Room</h3>
              <p className="text-xs text-purple-900/60">Email OTP On-Call Authentication</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-purple-100/50 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {step === 'EMAIL' ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Engineer or Responder Work Email
                </label>
                <div className="relative">
                  <Mail className="h-4 w-4 absolute left-3 top-3 text-purple-400" />
                  <input
                    type="email"
                    required
                    placeholder="e.g. srestart@company.io or oncall@recallops.io"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-purple-50/40 border border-purple-100 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-purple-600 focus:bg-white focus:ring-2 focus:ring-purple-500/10 transition"
                    autoFocus
                  />
                </div>
                <p className="text-[11px] text-purple-900/60 mt-1.5">
                  We will send a 6-digit one-time code to authenticate your on-call role.
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
                    <span>Send Verification Code</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="text-center space-y-1.5 pb-1">
                <div className="inline-flex items-center justify-center p-2 rounded-full bg-purple-100 text-purple-600 mb-1">
                  <Mail className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">Check Your Email</h3>
                <p className="text-xs text-slate-500">
                  Enter the 6-digit verification code sent to
                </p>
                <p className="text-xs font-mono font-bold text-purple-700 bg-purple-50 py-1 px-3 rounded-lg inline-block border border-purple-100">
                  {email}
                </p>
                <p className="text-[11px] text-slate-400">
                  Please check your inbox (or spam) and enter the code below:
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
                    <span>Verify & Enter War Room</span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setStep('EMAIL');
                    setOtp(['', '', '', '', '', '']);
                    setError(null);
                  }}
                  className="hover:text-purple-700 transition"
                >
                  ← Change Email
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
      </div>
    </div>
  );
};
