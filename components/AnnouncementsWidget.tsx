import React, { useEffect, useState } from 'react';
import { db } from '../services/db';
import { Advertisement } from '../types';

const AnnouncementsWidget: React.FC = () => {
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const fetchAds = async () => {
      const allAds = await db.getAds();
      const activeAds = allAds.filter(a => a.active);
      setAds(activeAds);
    };
    fetchAds();
  }, []);

  useEffect(() => {
    if (ads.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % ads.length);
    }, 5000); // Rotate every 5 seconds
    return () => clearInterval(interval);
  }, [ads]);

  if (ads.length === 0) return null;

  const currentAd = ads[currentIndex];

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700">
        <h3 className="font-bold text-sm uppercase tracking-wider text-gray-900 dark:text-white">Announcements</h3>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-brand-red animate-pulse"></span>
          <span className="text-xs text-brand-red font-bold">LIVE</span>
        </span>
      </div>
      
      <div className="relative overflow-hidden bg-gray-100 dark:bg-gray-900 min-h-[250px] flex items-center justify-center group">
         {/* Render Ad Content */}
         {currentAd.type === 'image' ? (
           <img 
             src={currentAd.mediaUrl} 
             alt={currentAd.title} 
             className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105" 
           />
         ) : (
             <div className="aspect-video w-full bg-black">
                <iframe 
                  src={currentAd.mediaUrl.replace('watch?v=', 'embed/')} 
                  title={currentAd.title} 
                  className="w-full h-full"
                  allowFullScreen
                />
             </div>
         )}
      </div>
      
      <div className="p-4">
        <h4 className="font-bold text-lg leading-tight mb-2 dark:text-white line-clamp-2">{currentAd.title}</h4>
        <div className="text-xs text-gray-400 mb-4">{new Date(currentAd.createdAt).toLocaleDateString()}</div>
        
        {currentAd.linkUrl && (
          <a 
            href={currentAd.linkUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="block w-full text-center bg-black dark:bg-white dark:text-black text-white text-xs font-bold px-4 py-3 uppercase hover:bg-brand-red hover:text-white dark:hover:bg-gray-200 transition-colors"
          >
            Learn More
          </a>
        )}
      </div>

      {/* Dots indicator */}
      {ads.length > 1 && (
        <div className="flex justify-center gap-1 pb-4">
          {ads.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentIndex ? 'w-6 bg-brand-red' : 'w-1.5 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400'}`}
              aria-label={`View announcement ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default AnnouncementsWidget;