import React, { useEffect, useState } from 'react';
import { db } from '../services/db';
import { AppEvent } from '../types';

const EventsWidget: React.FC = () => {
  const [events, setEvents] = useState<AppEvent[]>([]);

  useEffect(() => {
    const load = async () => {
      const allEvents = await db.getEvents();
      // Filter past events and sort by date nearest first
      const today = new Date().toISOString().split('T')[0];
      const upcoming = allEvents
        .filter(e => e.date >= today)
        .sort((a, b) => a.date.localeCompare(b.date));
      setEvents(upcoming.slice(0, 3)); // Show top 3
    };
    load();
  }, []);

  if (events.length === 0) return null;

  return (
    <div className="bg-white dark:bg-gray-800 border-t-4 border-brand-red shadow-sm">
      <div className="p-4 border-b border-gray-100 dark:border-gray-700">
        <h3 className="font-bold text-lg font-serif dark:text-white">Upcoming Events</h3>
      </div>
      <div className="divide-y divide-gray-100 dark:divide-gray-700">
        {events.map(event => {
          const dateObj = new Date(event.date);
          const month = dateObj.toLocaleString('default', { month: 'short' });
          const day = dateObj.getDate();

          return (
            <div key={event.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 flex gap-4 transition-colors">
              <div className="flex-shrink-0 flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-700 w-12 h-14 rounded border dark:border-gray-600">
                <span className="text-xs uppercase font-bold text-red-600">{month}</span>
                <span className="text-xl font-bold text-gray-900 dark:text-white leading-none">{day}</span>
              </div>
              <div>
                <h4 className="font-bold text-sm text-gray-900 dark:text-white leading-tight mb-1">
                  {event.title}
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  {event.location} • {event.time}
                </p>
                {event.linkUrl && (
                  <a 
                    href={event.linkUrl} 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-xs font-bold text-brand-red uppercase hover:underline"
                  >
                    Details →
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default EventsWidget;