import React from 'react';
import type { ApplicationStatus } from '../../types';
import { 
  FileEdit, 
  Send, 
  Search, 
  AlertTriangle, 
  RefreshCw, 
  Clock, 
  CheckCircle, 
  XCircle, 
  ShieldAlert,
  Award
} from 'lucide-react';

interface Props {
  status: ApplicationStatus | string;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<Props> = ({ status, size = 'md' }) => {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-medium',
    lg: 'text-sm px-3.5 py-1.5 gap-2 font-semibold',
  };

  switch (status) {
    case 'DRAFT':
      return (
        <span className={`inline-flex items-center rounded-full bg-slate-100 text-slate-700 border border-slate-300 ${sizeClasses[size]}`}>
          <FileEdit className="w-3.5 h-3.5 text-slate-500" />
          Draft
        </span>
      );
    case 'SUBMITTED':
      return (
        <span className={`inline-flex items-center rounded-full bg-blue-50 text-blue-700 border border-blue-200 ${sizeClasses[size]}`}>
          <Send className="w-3.5 h-3.5 text-blue-600" />
          Submitted
        </span>
      );
    case 'COMPLETENESS_CHECK':
      return (
        <span className={`inline-flex items-center rounded-full bg-cyan-50 text-cyan-800 border border-cyan-200 ${sizeClasses[size]}`}>
          <Search className="w-3.5 h-3.5 text-cyan-600" />
          Completeness Check
        </span>
      );
    case 'RETURNED_FOR_CORRECTION':
      return (
        <span className={`inline-flex items-center rounded-full bg-rose-50 text-rose-700 border border-rose-300 font-semibold animate-pulse ${sizeClasses[size]}`}>
          <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
          Deficiency Issued
        </span>
      );
    case 'RESUBMITTED':
      return (
        <span className={`inline-flex items-center rounded-full bg-purple-50 text-purple-700 border border-purple-200 ${sizeClasses[size]}`}>
          <RefreshCw className="w-3.5 h-3.5 text-purple-600" />
          Resubmitted
        </span>
      );
    case 'PENDING_REVIEW':
      return (
        <span className={`inline-flex items-center rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 ${sizeClasses[size]}`}>
          <Clock className="w-3.5 h-3.5 text-indigo-600" />
          Pending Reviewer
        </span>
      );
    case 'UNDER_REVIEW':
      return (
        <span className={`inline-flex items-center rounded-full bg-amber-50 text-amber-800 border border-amber-300 ${sizeClasses[size]}`}>
          <Clock className="w-3.5 h-3.5 text-amber-600" />
          Under Scrutiny
        </span>
      );
    case 'REVIEW_COMPLETED':
      return (
        <span className={`inline-flex items-center rounded-full bg-teal-50 text-teal-800 border border-teal-200 ${sizeClasses[size]}`}>
          <CheckCircle className="w-3.5 h-3.5 text-teal-600" />
          Review Completed
        </span>
      );
    case 'PENDING_FINAL_DECISION':
      return (
        <span className={`inline-flex items-center rounded-full bg-violet-50 text-violet-800 border border-violet-300 ${sizeClasses[size]}`}>
          <ShieldAlert className="w-3.5 h-3.5 text-violet-600" />
          Pending Approving Board
        </span>
      );
    case 'APPROVED':
      return (
        <span className={`inline-flex items-center rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold ${sizeClasses[size]}`}>
          <Award className="w-3.5 h-3.5 text-emerald-600" />
          Approved
        </span>
      );
    case 'REJECTED':
      return (
        <span className={`inline-flex items-center rounded-full bg-red-100 text-red-800 border border-red-300 ${sizeClasses[size]}`}>
          <XCircle className="w-3.5 h-3.5 text-red-600" />
          Rejected
        </span>
      );
    default:
      return (
        <span className={`inline-flex items-center rounded-full bg-gray-100 text-gray-700 border border-gray-300 ${sizeClasses[size]}`}>
          {status}
        </span>
      );
  }
};
