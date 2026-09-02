import React, { useState } from 'react';
import { Link2, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { shortenUrl } from '../api/urlApi';

export const ShortenForm = ({ onUrlShortened }) => {
  const [inputUrl, setInputUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputUrl.trim()) {
      setError('Please paste or type a valid URL.');
      return;
    }

    let formattedUrl = inputUrl.trim();
    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = `https://${formattedUrl}`;
    }

    setLoading(true);
    setError('');

    try {
      const data = await shortenUrl(formattedUrl);
      if (data.success) {
        onUrlShortened(data);
        setInputUrl('');
      } else {
        setError(data.error || 'Failed to shorten URL');
      }
    } catch (err) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="shorten-card">
      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <div className="url-input-wrapper">
            <input
              type="text"
              id="url-input"
              value={inputUrl}
              onChange={(e) => {
                setInputUrl(e.target.value);
                if (error) setError('');
              }}
              placeholder="Paste your long URL here..."
              className="url-input"
              disabled={loading}
              style={{ paddingLeft: '1rem' }}
            />
          </div>
          <button
            type="submit"
            id="shorten-btn"
            disabled={loading || !inputUrl.trim()}
            className="submit-btn"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin w-4 h-4" />
                <span>Shortening...</span>
              </>
            ) : (
              <span>Shorten</span>
            )}
          </button>
        </div>
      </form>

      {error && (
        <div className="error-banner">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
