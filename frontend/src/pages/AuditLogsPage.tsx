import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { 
  History, 
  Search, 
  ShieldCheck, 
  User, 
  Tag, 
  Calendar,
  Code
} from 'lucide-react';

export const AuditLogsPage: React.FC = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const data = await api.admin.getAuditEvents({
        action: actionFilter || undefined,
        entity_type: entityFilter || undefined,
      });
      setEvents(data);
    } catch (err) {
      console.error('Failed to fetch audit events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, [actionFilter, entityFilter]);

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Immutable Audit & Event Logs</h1>
        <p className="text-xs text-slate-500 mt-1">
          Cryptographically traceable, append-only chronological record of all administrative and workflow actions
        </p>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap gap-3">
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            placeholder="Filter by action keyword (e.g. LOGIN, STATE_CHANGE, DOCUMENT)..."
            className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 font-medium"
          >
            <option value="">All Entities</option>
            <option value="Application">Application</option>
            <option value="Document">Document</option>
            <option value="Deficiency">Deficiency</option>
            <option value="User">User / Authentication</option>
            <option value="System">System</option>
          </select>
        </div>
      </div>

      {/* Audit Events Timeline / List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Event Log Entries ({events.length})
          </span>
          <span className="text-[10px] text-slate-400 font-mono">Append-Only Event Store</span>
        </div>

        <div className="divide-y divide-slate-100">
          {loading ? (
            <div className="p-8 text-center text-slate-400 text-xs animate-pulse">Loading audit trail...</div>
          ) : events.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">No audit events match the filter.</div>
          ) : (
            events.map((ev) => (
              <div key={ev.id} className="p-4 hover:bg-slate-50/60 transition space-y-2 text-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-mono font-bold text-[10px] border border-blue-200">
                      {ev.action}
                    </span>
                    <span className="text-slate-400 font-semibold">&bull;</span>
                    <span className="font-semibold text-slate-800">{ev.entity_type}</span>
                    <span className="font-mono text-slate-400 text-[11px] truncate max-w-[120px]">
                      #{ev.entity_id}
                    </span>
                  </div>

                  <span className="text-[11px] text-slate-400 font-mono">
                    {new Date(ev.created_at).toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center space-x-3 text-[11px] text-slate-500">
                  <span className="flex items-center space-x-1">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <strong>{ev.actor_email || 'System Process'}</strong>
                  </span>
                  <span>Role: <strong>{ev.actor_role || 'AUTOMATED'}</strong></span>
                  <span className="font-mono text-slate-400">CorrID: {ev.correlation_id.substring(0, 8)}...</span>
                </div>

                {ev.notes && <p className="text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100">{ev.notes}</p>}

                {/* State snapshots */}
                {(ev.before_state_json || ev.after_state_json) && (
                  <div className="pt-1 flex flex-wrap gap-2 text-[10px] font-mono">
                    {ev.before_state_json && (
                      <span className="text-slate-500">
                        Before: {JSON.stringify(ev.before_state_json)}
                      </span>
                    )}
                    {ev.after_state_json && (
                      <span className="text-blue-600">
                        After: {JSON.stringify(ev.after_state_json)}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
