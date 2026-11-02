import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import type { NotificationItem, DeadlineItem } from '../types';
import { 
  Bell, 
  CheckCheck, 
  Clock, 
  AlertTriangle, 
  ExternalLink,
  Calendar
} from 'lucide-react';

export const NotificationCenterPage: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [deadlines, setDeadlines] = useState<DeadlineItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [notifsData, deadlinesData] = await Promise.all([
        api.notifications.list(),
        api.notifications.getDeadlines(),
      ]);
      setNotifications(notifsData);
      setDeadlines(deadlinesData);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleMarkRead = async (id: string) => {
    try {
      await api.notifications.markRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
      );
    } catch (err) {
      console.error('Mark read failed:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.notifications.markAllRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read_at: new Date().toISOString() }))
      );
    } catch (err) {
      console.error('Mark all read failed:', err);
    }
  };

  return (
    <div className="p-6 sm:p-8 space-y-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Notification Center & Alerts</h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time workflow alerts, deadline warnings, and deficiency issuances
          </p>
        </div>

        <button
          onClick={handleMarkAllRead}
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
        >
          <CheckCheck className="w-4 h-4 text-slate-500" />
          <span>Mark All as Read</span>
        </button>
      </div>

      {/* Deadlines Section */}
      {deadlines.length > 0 && (
        <div className="bg-amber-50 rounded-2xl p-5 border border-amber-200 shadow-xs space-y-3">
          <div className="flex items-center space-x-2 text-amber-900 font-bold text-xs uppercase tracking-wider">
            <Calendar className="w-4 h-4 text-amber-700" />
            <span>Active Statutory Deadlines ({deadlines.length})</span>
          </div>
          <div className="space-y-2">
            {deadlines.map((dl) => (
              <div
                key={dl.id}
                className="bg-white p-3 rounded-xl border border-amber-200 flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-semibold text-slate-900">{dl.task_type.replace(/_/g, ' ')}</span>
                  <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                    Due: {new Date(dl.due_date).toLocaleString()}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      dl.is_overdue
                        ? 'bg-rose-100 text-rose-800 animate-pulse'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {dl.is_overdue ? 'OVERDUE' : `${Math.round(dl.hours_remaining)}h remaining`}
                  </span>
                  <Link
                    to={`/applications/${dl.application_id}`}
                    className="p-1 text-slate-400 hover:text-blue-600 transition"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notifications List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Notifications ({notifications.length})
          </span>
          <span className="text-[10px] text-slate-400">Chronological Alert Feed</span>
        </div>

        <div className="divide-y divide-slate-100">
          {loading ? (
            <div className="p-8 text-center text-slate-400 text-xs animate-pulse">Loading notifications...</div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">No notifications received yet.</div>
          ) : (
            notifications.map((n) => {
              const isUnread = !n.read_at;
              return (
                <div
                  key={n.id}
                  className={`p-4 transition flex items-start justify-between gap-4 ${
                    isUnread ? 'bg-blue-50/30' : 'hover:bg-slate-50/60'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div
                      className={`w-2 h-2 rounded-full mt-1.5 ${
                        isUnread ? 'bg-blue-600 ring-4 ring-blue-100' : 'bg-transparent'
                      }`}
                    />
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-xs text-slate-900">{n.title}</span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                            n.priority === 'HIGH' || n.priority === 'URGENT'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {n.priority}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">{n.message}</p>
                      <span className="text-[10px] text-slate-400 font-mono block mt-1">
                        {new Date(n.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    {n.link_url && (
                      <Link
                        to={n.link_url}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center space-x-1"
                      >
                        <span>View</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    )}
                    {isUnread && (
                      <button
                        onClick={() => handleMarkRead(n.id)}
                        className="p-1 rounded text-slate-400 hover:text-slate-600 transition"
                        title="Mark as read"
                      >
                        <CheckCheck className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
