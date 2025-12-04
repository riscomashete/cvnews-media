import React, { useEffect, useState } from 'react';
import { db } from '../services/db';
import { Advertisement } from '../types';

const AnnouncementsWidget: React.FC = () => {
  const [mediaAds, setMediaAds] = useState<Advertisement[]>([]);
  const [textAds, setTextAds] = useState<Advertisement[]>([]);
  
  const [mediaIndex, setMediaIndex] = useState(0);

  useEffect(() => {
    const fetchAds = async () => {
      const allAds = await db.getAds();
      const activeAds = allAds.filter(a => a.active);
      
      setMediaAds(activeAds.filter(a => a.type !== 'announcement'));
      setTextAds(activeAds.filter(a => a.type === 'announcement'));
    };
    fetchAds();
  }, []);

  // Rotate Media Ads
  useEffect(() => {
    if (mediaAds.length <= 1) return;
    const interval = setInterval(() => {
      setMediaIndex(prev => (prev + 1) % mediaAds.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [mediaAds]);

  if (mediaAds.length === 0 && textAds.length === 0) return null;

  const currentMedia = mediaAds[mediaIndex];

  return (
    <div className="space-y-8">
      
      {/* SECTION 1: MEDIA ADVERTS (Partner Showcase) */}
      {mediaAds.length > 0 && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between p-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <h3 className="font-bold text-xs uppercase tracking-widest text-gray-900 dark:text-white">Partners</h3>
            <span className="text-[10px] text-gray-400 font-bold uppercase">Advertisement</span>
          </div>
          
          {/* Container with fixed height but allowing image to fit naturally inside */}
          <div className="relative w-full h-[300px] bg-gray-100 dark:bg-black flex items-center justify-center overflow-hidden">
            {currentMedia.type === 'video' ? (
              <iframe 
                src={currentMedia.mediaUrl?.replace('watch?v=', 'embed/')} 
                title={currentMedia.title} 
                className="w-full h-full"
                allowFullScreen
              />
            ) : (
              /* Use object-contain to ensure the WHOLE image is visible without cutting */
              <div className="w-full h-full relative">
                {/* Blurred background for aesthetic fill if ratios mismatch */}
                <div 
                   className="absolute inset-0 bg-cover bg-center blur-md opacity-20"
                   style={{ backgroundImage: `url(${currentMedia.mediaUrl})` }}
                ></div>
                
                <img 
                  src={currentMedia.mediaUrl} 
                  alt={currentMedia.title} 
                  className="w-full h-full object-contain relative z-10" 
                />
                
                {currentMedia.linkUrl && (
                  <a 
                    href={currentMedia.linkUrl}
                    target="_blank"
                    rel="noreferrer" 
                    className="absolute inset-0 z-20"
                    aria-label={currentMedia.title}
                  />
                )}
              </div>
            )}

            {/* Pagination Dots */}
            {mediaAds.length > 1 && (
              <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5 z-30 pointer-events-none">
                {mediaAds.map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-1.5 w-1.5 rounded-full shadow-sm transition-colors ${
                      idx === mediaIndex ? 'bg-brand-red' : 'bg-white'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECTION 2: ANNOUNCEMENTS (Bulletin Board) */}
      {textAds.length > 0 && (
        <div className="bg-white dark:bg-gray-800 border-t-4 border-brand-red shadow-sm">
           <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
              <h3 className="font-bold text-lg font-serif dark:text-white">Announcements</h3>
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
           </div>
           
           <div className="divide-y divide-gray-100 dark:divide-gray-700 max-h-[400px] overflow-y-auto custom-scrollbar">
              {textAds.map(ad => (
                 <div key={ad.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <h4 className="font-bold text-sm mb-2 text-gray-900 dark:text-gray-100 leading-tight">
                       {ad.title}
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed mb-3">
                       {ad.content}
                    </p>
                    <div className="flex justify-between items-center">
                       <span className="text-[10px] text-gray-400 uppercase">{new Date(ad.createdAt).toLocaleDateString()}</span>
                       {ad.linkUrl && (
                          <a 
                             href={ad.linkUrl}
                             target="_blank"
                             rel="noreferrer"
                             className="text-[10px] font-bold text-brand-red uppercase hover:underline"
                          >
                             Read More →
                          </a>
                       )}
                    </div>
                 </div>
              ))}
           </div>
        </div>
      )}

    </div>
  );
};

export default AnnouncementsWidget;