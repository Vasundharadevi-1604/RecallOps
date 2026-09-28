import React, { useState } from 'react';
import {
  Clock,
  Plus,
  AlertTriangle,
  UploadCloud,
  Wrench,
  Stethoscope,
  BookOpen,
  MessageSquare,
  CheckCircle2
} from 'lucide-react';
import type { TimelineEvent } from '../../types';

interface TimelineTabProps {
  timeline: TimelineEvent[];
  onAddEvent: () => void;
}

const eventTypeIcons: Record<string, React.ReactNode> = {
  INCIDENT_CREATED: <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />,
  ALERT: <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />,
  DEPLOYMENT: <UploadCloud className="h-3.5 w-3.5 text-blue-500" />,
  INFRA_CHANGE: <Wrench className="h-3.5 w-3.5 text-purple-600" />,
  DIAGNOSIS: <Stethoscope className="h-3.5 w-3.5 text-violet-600" />,
  RUNBOOK: <BookOpen className="h-3.5 w-3.5 text-emerald-600" />,
  HUMAN_FEEDBACK: <MessageSquare className="h-3.5 w-3.5 text-purple-500" />,
  STATUS_CHANGED: <Clock className="h-3.5 w-3.5 text-indigo-500" />,
  POSTMORTEM_CREATED: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
};

export const TimelineTab: React.FC<TimelineTabProps> = ({ timeline, onAddEvent }) => {
  const [filterType, setFilterType] = useState('ALL');

  const filtered = timeline.filter(t => {
    if (filterType !== 'ALL' && t.event_type !== filterType) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-purple-100">
        <div className="flex items-center space-x-2 text-xs">
          <span className="text-slate-500 font-semibold">Filter Type:</span>
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="bg-white border border-purple-100 rounded-lg px-2.5 py-1 text-slate-700 focus:outline-none focus:border-purple-500 shadow-sm"
          >
            <option value="ALL">All Events ({timeline.length})</option>
            <option value="ALERT">Alerts</option>
            <option value="DEPLOYMENT">Deployments</option>
            <option value="INFRA_CHANGE">Infra Changes</option>
            <option value="DIAGNOSIS">Diagnosis</option>
            <option value="STATUS_CHANGED">Status Changes</option>
          </select>
        </div>

        <button
          onClick={onAddEvent}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-sm transition"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Add Timeline Event</span>
        </button>
      </div>

      <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-purple-200">
        {filtered.map((item, idx) => (
          <div key={item.id || idx} className="relative group">
            {/* Timeline bullet icon */}
            <div className="absolute -left-6 mt-1 h-5 w-5 rounded-full bg-white border border-purple-200 flex items-center justify-center shadow-sm">
              {eventTypeIcons[item.event_type] || <Clock className="h-3 w-3 text-purple-400" />}
            </div>

            <div className="p-3.5 rounded-2xl bg-white border border-purple-100/90 group-hover:border-purple-300 transition shadow-sm space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-mono font-bold text-purple-700">{item.event_type}</span>
                <span className="text-slate-400 font-mono text-[10px]">
                  {new Date(item.occurred_at).toLocaleString()}
                </span>
              </div>

              <p className="text-xs text-slate-800 leading-relaxed font-medium">{item.description}</p>

              {item.metadata && Object.keys(item.metadata).length > 0 && (
                <div className="mt-1.5 pt-1.5 border-t border-purple-50 text-[10px] font-mono text-slate-500 bg-purple-50/40 p-1.5 rounded-lg">
                  {JSON.stringify(item.metadata)}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
