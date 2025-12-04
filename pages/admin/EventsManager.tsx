import React, { useEffect, useState } from 'react';
import { db } from '../../services/db';
import { AppEvent } from '../../types';

const EventsManager: React.FC = () => {
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // Form
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [desc, setDesc] = useState('');
  const [linkUrl, setLinkUrl] = useState('');

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const data = await db.getEvents();
    setEvents(data);
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this event?")) {
      await db.deleteEvent(id);
      load();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !date) return alert("Title and Date are required");

    await db.createEvent({
      title,
      date,
      time,
      location,
      description: desc,
      linkUrl
    });

    // Reset
    setTitle(''); setDate(''); setTime(''); setLocation(''); setDesc(''); setLinkUrl('');
    load();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 dark:text-white">Events Calendar</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form */}
        <div className="bg-white dark:bg-gray-800 p-6 shadow h-fit border-t-4 border-brand-red">
          <h2 className="text-xl font-bold mb-4 dark:text-white">Add New Event</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase mb-1 dark:text-gray-300">Event Title *</label>
              <input type="text" value={title} onChange={e=>setTitle(e.target.value)} className="w-full border p-2 dark:bg-gray-700 dark:text-white" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                <label className="block text-xs font-bold uppercase mb-1 dark:text-gray-300">Date *</label>
                <input type="date" value={date} onChange={e=>setDate(e.target.value)} className="w-full border p-2 dark:bg-gray-700 dark:text-white" required />
                </div>
                <div>
                <label className="block text-xs font-bold uppercase mb-1 dark:text-gray-300">Time</label>
                <input type="time" value={time} onChange={e=>setTime(e.target.value)} className="w-full border p-2 dark:bg-gray-700 dark:text-white" />
                </div>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase mb-1 dark:text-gray-300">Location</label>
              <input type="text" value={location} onChange={e=>setLocation(e.target.value)} className="w-full border p-2 dark:bg-gray-700 dark:text-white" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase mb-1 dark:text-gray-300">Description</label>
              <textarea value={desc} onChange={e=>setDesc(e.target.value)} className="w-full border p-2 dark:bg-gray-700 dark:text-white" rows={2}></textarea>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase mb-1 dark:text-gray-300">Link URL (Registration/Info)</label>
              <input type="text" value={linkUrl} onChange={e=>setLinkUrl(e.target.value)} className="w-full border p-2 dark:bg-gray-700 dark:text-white" placeholder="https://" />
            </div>
            <button type="submit" className="w-full bg-brand-red text-white py-2 font-bold uppercase hover:opacity-80">Add Event</button>
          </form>
        </div>

        {/* List */}
        <div className="lg:col-span-2">
           <div className="bg-white dark:bg-gray-800 shadow overflow-hidden">
             {events.map(ev => (
               <div key={ev.id} className="p-4 border-b dark:border-gray-700 flex items-start justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50">
                 <div className="flex gap-4">
                   <div className="bg-gray-100 dark:bg-gray-700 p-2 text-center w-16 h-16 flex flex-col items-center justify-center rounded">
                      <span className="text-xs font-bold text-red-600 uppercase">{new Date(ev.date).toLocaleString('default', { month: 'short' })}</span>
                      <span className="text-xl font-bold dark:text-white">{new Date(ev.date).getDate()}</span>
                   </div>
                   <div>
                     <h3 className="font-bold dark:text-white">{ev.title}</h3>
                     <p className="text-xs text-gray-500">{ev.location} • {ev.time}</p>
                     <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{ev.description}</p>
                     {ev.linkUrl && <a href={ev.linkUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:underline">Link</a>}
                   </div>
                 </div>
                 <button onClick={() => handleDelete(ev.id)} className="text-red-600 text-xs font-bold hover:underline">Delete</button>
               </div>
             ))}
             {events.length === 0 && <div className="p-8 text-center text-gray-500">No events found.</div>}
           </div>
        </div>
      </div>
    </div>
  );
};

export default EventsManager;