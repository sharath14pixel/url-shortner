import React, { useState } from 'react';
import { ShortenForm } from '../components/ShortenForm';
import { ResultCard } from '../components/ResultCard';
import { Zap, ShieldCheck, Database, Cpu } from 'lucide-react';

export const Home = ({ onViewStats }) => {
  const [latestResult, setLatestResult] = useState(null);

  return (
    <div className="home-page">
      <section className="hero-section">
        <h1 className="hero-title">
          Shorten. Share. Track.
        </h1>
        <p className="hero-subtitle" style={{ marginBottom: '2rem' }}>
          Transform long, unwieldy URLs into clean, shareable links — powered by Base62 encoding.
        </p>
      </section>

      <ShortenForm onUrlShortened={(data) => setLatestResult(data)} />

      {latestResult && (
        <ResultCard result={latestResult} onViewStats={onViewStats} />
      )}

    </div>
  );
};
