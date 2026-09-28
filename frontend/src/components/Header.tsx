import React from 'react';
import { Shield, Sparkles, Database, Brain, Activity, Plus, RefreshCw, LogIn, LogOut, User as UserIcon } from 'lucide-react';
import type { HealthStatus, User } from '../types';

interface HeaderProps {
  health: HealthStatus | null;
  onSeedDemo: () => void;
  onNewIncident: () => void;
  isSeeding: boolean;
  user: User | null;
  onOpenAuth: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  health,
  onSeedDemo,
  onNewIncident,
  isSeeding,
  user,
  onOpenAuth,
  onLogout
}) => {
  return (
    <header className="border-b border-purple-100/90 bg-white/90 backdrop-blur sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-purple-500 flex items-center justify-center shadow-lg shadow-purple-500/20 text-white">
            <Brain className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg tracking-tight text-slate-900">RecallOps</span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 font-semibold tracking-wide">
                Memory-Powered SRE
              </span>
            </div>
            <p className="text-xs text-slate-500">Incident Response with Hindsight Operational Memory</p>
          </div>
        </div>

        {/* Integration Status Badges */}
        <div className="hidden md:flex items-center space-x-2.5">
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-purple-50/60 border border-purple-100 text-xs">
            <Activity className="h-3.5 w-3.5 text-emerald-600" />
            <span className="text-slate-600">API:</span>
            <span className="text-emerald-700 font-semibold">Online</span>
          </div>

          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-purple-50/60 border border-purple-100 text-xs">
            <Database className="h-3.5 w-3.5 text-indigo-600" />
            <span className="text-slate-600">SQLite:</span>
            <span className="text-indigo-700 font-semibold">Connected</span>
          </div>

          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-purple-50/60 border border-purple-100 text-xs">
            <Brain className="h-3.5 w-3.5 text-purple-600" />
            <span className="text-slate-600">Hindsight:</span>
            <span className={health?.integrations?.hindsight ? "text-purple-700 font-semibold" : "text-amber-700 font-semibold"}>
              {health?.integrations?.hindsight ? "Connected" : "Local Store Active"}
            </span>
          </div>

          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-purple-50/60 border border-purple-100 text-xs">
            <Sparkles className="h-3.5 w-3.5 text-violet-600" />
            <span className="text-slate-600">AI:</span>
            <span className={health?.integrations?.groq ? "text-violet-700 font-semibold" : "text-slate-600 font-semibold"}>
              {health?.integrations?.groq ? "Groq (Live)" : "Deterministic (Safe)"}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2.5">
          <button
            onClick={onSeedDemo}
            disabled={isSeeding}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100/80 text-purple-700 border border-purple-200 text-xs font-semibold transition disabled:opacity-50"
            title="Reset or seed demo incidents and memories"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isSeeding ? 'animate-spin text-purple-600' : 'text-purple-500'}`} />
            <span>{isSeeding ? 'Seeding...' : 'Seed Demo'}</span>
          </button>

          <button
            onClick={onNewIncident}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-semibold shadow-md shadow-purple-500/20 transition"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Incident</span>
          </button>

          {/* User Profile / OTP Authentication */}
          <div className="h-6 w-[1px] bg-purple-200 mx-1 hidden sm:block" />

          {user ? (
            <div className="flex items-center space-x-2 bg-purple-50/80 border border-purple-200/80 rounded-xl px-2.5 py-1 shadow-sm">
              <div className="h-6 w-6 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-[11px] font-bold text-white shadow-sm">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="hidden xl:flex flex-col text-left">
                <span className="text-xs font-semibold text-slate-800 leading-none">{user.name}</span>
                <span className="text-[10px] text-purple-600 font-mono leading-none mt-0.5">{user.role}</span>
              </div>
              <button
                onClick={onLogout}
                className="p-1 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition"
                title={`Signed in as ${user.email}. Click to sign out.`}
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-purple-100 hover:bg-purple-200 text-purple-800 border border-purple-200 text-xs font-semibold transition shadow-sm"
              title="Authenticate with email OTP"
            >
              <LogIn className="h-3.5 w-3.5" />
              <span>Sign In (OTP)</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
