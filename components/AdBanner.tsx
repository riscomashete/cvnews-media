
import React, { useEffect, useState } from 'react';
import { db } from '../services/db';
import { Advertisement } from '../types';

const AdBanner: React.FC<{ placement?: 'header' | 'sidebar' | 'content' }> = ({ placement = 'header' }) => {
  const [ad, setAd] = useState<Advertisement | null>(null);

  useEffect(() => {
    const fetchAds = async () => {
      const allAds = await db.getAds();
      const activeAds = allAds.filter(a => a.active);
      
      if (activeAds.length > 0) {
        // Pick a random ad
        const randomAd = activeAds[Math.floor(Math.random() * activeAds.length)];
        setAd(randomAd);
      }
    };
    fetchAds();
  }, []);

  if (!ad) return null;

  return (
    <div className={`w-full my-6 flex justify-center ${placement === 'content' ? 'py-8' : ''}`}>
      {ad.linkUrl ? (
        <a href={ad.linkUrl} target="_blank" rel="noopener noreferrer" className="block max-w-full">
          <AdContent ad={ad} />
        </a>
      ) : (
        <div className="max-w-full">
          <AdContent ad={ad} />
        </div>
      )}
    </div>
  );
};

const AdContent: React.FC<{ ad: Advertisement }> = ({ ad }) => {
  if (ad.type === 'video') {
    // Basic embed support for YouTube/Vimeo if URL is valid
    // For simplicity, we assume generic iframe or video tag if raw URL
    return (
      <div className="relative aspect-video w-full max-w-3xl bg-black">
        <iframe 
          src={ad.mediaUrl.replace('watch?v=', 'embed/')} 
          title={ad.title} 
          className="w-full h-full"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <img 
      src={ad.mediaUrl} 
      alt={ad.title} 
      className="max-w-full h-auto object-contain shadow-md border border-gray-200 dark:border-gray-700 max-h-[300px]"
      loading="lazy"
    />
  );
};

export default AdBanner;
