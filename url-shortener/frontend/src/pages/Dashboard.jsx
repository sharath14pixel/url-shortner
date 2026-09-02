import React, { useEffect, useState } from 'react';
import { getAllUrls } from '../api/urlApi';
import { 
  BarChart3, 
  Copy, 
  Check, 
  ExternalLink, 
  Search, 
  Loader2, 
  ShieldAlert, 
  ShieldCheck,
  RefreshCw,
  Link2
} from 'lucide-react';

export const Dashboard = ({ onViewStats }) => {
  const [urls, setUrls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedCode, setCopiedCode] = useState(null);

  const fetchUrls = async (sort = sortBy) => {
    setLoading(true);
    setError('');
    try {
      const data = await getAllUrls(sort);
      if (data.success) {
        setUrls(data.urls || []);
      } else {
        setError(data.error || 'Failed to load links.');
      }
    } catch (err) {
      setError(err.message || 'Error connecting to server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUrls(sortBy);
  }, [sortBy]);

  const handleCopy = async (code, shortUrl) => {
    try {
      await navigator.clipboard.writeText(shortUrl);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      console.error('Copy failed', err);
    }
  };

  const filteredUrls = urls.filter((item) =>
    item.shortCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.originalUrl.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <h2 className="page-title">Links Dashboard</h2>
          <p className="page-subtitle">Manage, search, and analyze your shortened URLs.</p>
        </div>
        <button
          onClick={() => fetchUrls(sortBy)}
          className="btn-secondary"
          title="Refresh URL list"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="dashboard-controls">
        <div className="search-bar">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by short code or destination..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="sort-controls">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="sort-select"
          >
            <option value="newest">Newest First</option>
            <option value="clicks">Most Clicked</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
          <span>Loading shortened links...</span>
        </div>
      ) : error ? (
        <div className="error-banner">
          <ShieldAlert className="w-5 h-5" />
          <span>{error}</span>
        </div>
      ) : filteredUrls.length === 0 ? (
        <div className="empty-state">
          <Link2 className="w-10 h-10 text-gray-500 mb-2 opacity-50 mx-auto" />
          <h3>No links found</h3>
          <p>{searchTerm ? 'No URLs match your search query.' : 'Create your first shortened link on the Shortener tab!'}</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="url-table">
            <thead>
              <tr>
                <th>Short Code</th>
                <th>Destination URL</th>
                <th>Clicks</th>
                <th>Status</th>
                <th>Created</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUrls.map((item) => (
                <tr key={item.shortCode}>
                  <td style={{ fontWeight: 500 }}>
                    <a
                      href={item.shortUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: 'inherit', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                    >
                      {item.shortCode}
                      <ExternalLink className="w-3 h-3 opacity-60" />
                    </a>
                  </td>
                  <td style={{ maxWidth: '280px' }}>
                    <span className="truncate-text" style={{ display: 'block', color: 'var(--text-muted)' }} title={item.originalUrl}>
                      {item.originalUrl}
                    </span>
                  </td>
                  <td>
                    <span className="badge badge-emerald">
                      {item.clicks} clicks
                    </span>
                  </td>
                  <td>
                    {item.isFlagged ? (
                      <span className="badge badge-warning" title="Flagged for security review">
                        <ShieldAlert className="w-3 h-3" /> Flagged
                      </span>
                    ) : (
                      <span className="badge badge-cyan" title="Clean link">
                        <ShieldCheck className="w-3 h-3" /> Clean
                      </span>
                    )}
                  </td>
                  <td style={{ color: 'var(--text-dim)', fontSize: '0.82rem' }}>
                    {new Date(item.createdAt).toLocaleDateString()}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem' }}>
                      <button
                        onClick={() => handleCopy(item.shortCode, item.shortUrl)}
                        className="action-btn"
                        title="Copy Short URL"
                      >
                        {copiedCode === item.shortCode ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => onViewStats(item.shortCode)}
                        className="action-btn"
                        title="View Detailed Analytics"
                      >
                        <BarChart3 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
