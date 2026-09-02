import React, { useState } from 'react';
import { Copy, Check, ExternalLink, BarChart3, ShieldAlert, Sparkles } from 'lucide-react';

export const ResultCard = ({ result, onViewStats }) => {
  const [copied, setCopied] = useState(false);

  if (!result) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(result.shortUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  return (
    <div className="result-card">
      <div className="result-header">
        <div className="result-title">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>Short Link Created!</span>
        </div>
        {result.isFlagged && (
          <span style={{ fontSize: '0.75rem', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <ShieldAlert className="w-3.5 h-3.5" /> Flagged Security Review
          </span>
        )}
      </div>

      <div className="short-url-box">
        <a
          href={result.shortUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="short-url-link"
        >
          {result.shortUrl}
          <ExternalLink className="w-4 h-4 opacity-60 inline ml-1.5" />
        </a>
        <button
          onClick={handleCopy}
          className={`copy-btn ${copied ? 'copied' : ''}`}
          id="copy-short-url-btn"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      <div className="original-url-row">
        <span>Destination:</span>
        <span className="truncate-text" title={result.originalUrl}>
          {result.originalUrl}
        </span>
      </div>

      <div className="result-footer">
        <button
          onClick={() => onViewStats(result.shortCode)}
          className="stats-btn"
          id="view-stats-btn"
        >
          <BarChart3 className="w-4 h-4 text-indigo-400" />
          <span>View Live Analytics</span>
        </button>
      </div>
    </div>
  );
};
