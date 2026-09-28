import React from 'react';
import { CheckCircle2, FileText, Plus, ShieldCheck, Sparkles } from 'lucide-react';
import type { Postmortem } from '../../types';

interface PostmortemTabProps {
  postmortem: Postmortem | null;
  onOpenModal: () => void;
  isResolved: boolean;
}

export const PostmortemTab: React.FC<PostmortemTabProps> = ({
  postmortem,
  onOpenModal,
  isResolved
}) => {
  if (!postmortem) {
    return (
      <div className="p-12 text-center border-2 border-dashed border-purple-200 rounded-2xl bg-white space-y-3">
        <div className="h-12 w-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto border border-purple-100">
          <FileText className="h-6 w-6" />
        </div>
        <h4 className="text-sm font-bold text-slate-900">No Postmortem Recorded Yet</h4>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Recording a postmortem establishes ground-truth operational memory for Hindsight and transitions the incident to RESOLVED.
        </p>
        <button
          onClick={onOpenModal}
          className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-md shadow-purple-500/20 transition"
        >
          Record Postmortem & Resolve Incident
        </button>
      </div>
    );
  }

  const factors = postmortem.contributingFactors || postmortem.contributing_factors || [];
  const preventions = postmortem.preventionActions || postmortem.prevention_actions || [];

  return (
    <div className="space-y-4">
      <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-2 text-xs text-emerald-800">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <span className="font-bold">Incident Resolved & Sealed in Hindsight Operational Memory</span>
        </div>
        <span className="text-[10px] font-mono text-emerald-700 font-semibold">
          {new Date(postmortem.created_at).toLocaleDateString()}
        </span>
      </div>

      <div className="bg-white border border-purple-100/90 rounded-2xl p-5 space-y-4 shadow-sm">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Root Cause</h4>
          <p className="text-xs text-slate-800 leading-relaxed p-3.5 rounded-xl bg-purple-50/40 border border-purple-100">
            {postmortem.rootCause || postmortem.root_cause}
          </p>
        </div>

        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Resolution</h4>
          <p className="text-xs text-slate-800 leading-relaxed p-3.5 rounded-xl bg-purple-50/40 border border-purple-100">
            {postmortem.resolution}
          </p>
        </div>

        {factors.length > 0 && (
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Contributing Factors</h4>
            <ul className="text-xs text-slate-700 space-y-1 list-disc list-inside p-3.5 rounded-xl bg-purple-50/40 border border-purple-100">
              {factors.map((f: string, i: number) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
          </div>
        )}

        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Customer Impact</h4>
          <p className="text-xs text-slate-700 p-3.5 rounded-xl bg-purple-50/40 border border-purple-100">
            {postmortem.customerImpact || postmortem.customer_impact}
          </p>
        </div>

        {preventions.length > 0 && (
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Prevention & Action Items</h4>
            <ul className="text-xs text-slate-700 space-y-1 list-disc list-inside p-3.5 rounded-xl bg-purple-50/40 border border-purple-100">
              {preventions.map((p: string, i: number) => (
                <li key={i}>{p}</li>
              ))}
            </ul>
          </div>
        )}

        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Lessons Learned</h4>
          <p className="text-xs text-slate-700 p-3.5 rounded-xl bg-purple-50/40 border border-purple-100">
            {postmortem.lessonsLearned || postmortem.lessons_learned}
          </p>
        </div>
      </div>
    </div>
  );
};
