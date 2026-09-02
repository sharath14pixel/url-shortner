import React, { useEffect, useState } from 'react';
import { BarChart2, Calendar, MousePointerClick, ShieldCheck, ShieldAlert, X, ExternalLink, RefreshCw, Loader2 } from 'lucide-react';
import { getStats } from '../api/urlApi';

export const StatsCard = ({ shortCode, onClose }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStats = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getStats(shortCode);
      if (data.success) {
        setStats(data.stats);
      } else {
        setError(data.error || 'Failed to load stats.');
      }
    } catch (err) {
      setError(err.message || 'Error fetching stats.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (shortCode) {
      fetchStats();
    }
  }, [shortCode]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BarChart2 className="w-5 h-5" />
            <h3 className="modal-title">Link Analytics</h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <button onClick={fetchStats} className="icon-btn" title="Refresh analytics">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={onClose} className="icon-btn" title="Close modal">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            <Loader2 className="animate-spin w-6 h-6 mx-auto mb-2" />
            <span>Fetching real-time click metrics...</span>
          </div>
        ) : error ? (
          <div className="error-banner">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : stats ? (
          <div>
            <div className="stat-card">
              <MousePointerClick className="w-6 h-6" />
              <div>
                <span className="stat-value">{stats.clicks}</span>
                <span className="stat-label">Total Clicks</span>
              </div>
            </div>

            <div className="stat-card">
              <Calendar className="w-6 h-6" />
              <div>
                <span className="stat-value" style={{ fontSize: '1.05rem' }}>
                  {new Date(stats.createdAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </span>
                <span className="stat-label">Creation Date</span>
              </div>
            </div>

            <div className="stats-details-list">
              <div className="detail-item">
                <span className="detail-label">Short Code</span>
                <span className="detail-value">{stats.shortCode}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Short URL</span>
                <a
                  href={stats.shortUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="detail-value"
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  {stats.shortUrl} <ExternalLink className="w-3.5 h-3.5 inline" />
                </a>
              </div>
              <div className="detail-item">
                <span className="detail-label">Security Scan</span>
                <span className="detail-value" style={{ color: stats.isFlagged ? '#e11d48' : '#10b981' }}>
                  {stats.isFlagged ? 'Flagged Anomaly' : 'Clean & Verified'}
                </span>
              </div>
              <div className="detail-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.25rem' }}>
                <span className="detail-label">Destination URL</span>
                <span className="detail-value" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {stats.originalUrl}
                </span>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
