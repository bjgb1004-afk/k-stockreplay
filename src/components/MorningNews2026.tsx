import React, { useState, useEffect } from 'react';
import { BriefingView } from './BriefingView';
import { PreMarketBriefing } from '../types';

export const MorningNews2026 = () => {
  const [briefing, setBriefing] = useState<PreMarketBriefing | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const loadBriefing = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/platform/briefing', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (isMounted) setBriefing(data);
        }
      } catch (err) {
        console.error('Failed to load morning briefing in MorningNews2026:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadBriefing();
    return () => { isMounted = false; };
  }, []);

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 pb-20">
      <BriefingView briefing={briefing} loading={loading} />
    </div>
  );
};

