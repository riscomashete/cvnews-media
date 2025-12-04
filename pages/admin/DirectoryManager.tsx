import React, { useEffect, useState } from 'react';
import { db } from '../../services/db';
import { Business } from '../../types';

const DirectoryManager: React.FC = () => {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);

  // Form
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [desc, setDesc] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [logoUrl, setLogoUrl] = useState('');

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const data = await db.getBusinesses();
    setBusinesses(data);
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this listing?")) {
      await db.deleteBusiness(id);
      load();
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
       const img = new Image();
       img.src = evt.target?.result as string;
       img.onload = () => {
         // Resize
         const canvas = document.createElement('canvas');
         const MAX_W = 200;
         const scale = MAX_W / img.width;
         if (scale < 1) {
             canvas.width = MAX_W;
             canvas.height = img.height * scale;
         } else {
             canvas.width = img.width;
             canvas.height = img.height;
         }
         const ctx = canvas.getContext('2d');
         ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
         setLogoUrl(canvas.toDataURL('image/png'));
       };
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !category || !email) return alert("Fill required fields");

    await db.createBusiness({
      name,
      category,
      description: desc,
      contactEmail: email,
      contactPhone: phone,
      website,
      logoUrl
    });

    // Reset
    setName(''); setCategory(''); setDesc(''); setEmail(''); setPhone(''); setWebsite(''); setLogoUrl('');
    load();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 dark:text-white">Directory Manager</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form */}
        <div className="bg-white dark:bg-gray-800 p-6 shadow h-fit border-t-4 border-brand-red">
          <h2 className="text-xl font-bold mb-4 dark:text-white">Add Business</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase mb-1 dark:text-gray-300">Business Name *</label>
              <input type="text" value={name} onChange={e=>setName(e.target.value)} className="w-full border p-2 dark:bg-gray-700 dark:text-white" required />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase mb-1 dark:text-gray-300">Category *</label>
              <input type="text" value={category} onChange={e=>setCategory(e.target.value)} className="w-full border p-2 dark:bg-gray-700 dark:text-white" required />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase mb-1 dark:text-gray-300">Logo</label>
              <input type="file" accept="image/*" onChange={handleLogoUpload} className="w-full text-xs dark:text-white" />
              {logoUrl && <img src={logoUrl} alt="Preview" className="h-12 mt-2 object-contain" />}
            </div>
            <div>
              <label className="block text-xs font-bold uppercase mb-1 dark:text-gray-300">Description</label>
              <textarea value={desc} onChange={e=>setDesc(e.target.value)} className="w-full border p-2 dark:bg-gray-700 dark:text-white" rows={3}></textarea>
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div>
                 <label className="block text-xs font-bold uppercase mb-1 dark:text-gray-300">Email *</label>
                 <input type="email" value={email} onChange={e=>setEmail(e.target.value)} className="w-full border p-2 dark:bg-gray-700 dark:text-white" required />
               </div>
               <div>
                 <label className="block text-xs font-bold uppercase mb-1 dark:text-gray-300">Phone</label>
                 <input type="text" value={phone} onChange={e=>setPhone(e.target.value)} className="w-full border p-2 dark:bg-gray-700 dark:text-white" />
               </div>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase mb-1 dark:text-gray-300">Website</label>
              <input type="text" value={website} onChange={e=>setWebsite(e.target.value)} className="w-full border p-2 dark:bg-gray-700 dark:text-white" placeholder="https://" />
            </div>
            <button type="submit" className="w-full bg-brand-red text-white py-2 font-bold uppercase hover:opacity-80">Add Listing</button>
          </form>
        </div>

        {/* List */}
        <div className="lg:col-span-2">
           <div className="bg-white dark:bg-gray-800 shadow overflow-hidden">
             {businesses.map(b => (
               <div key={b.id} className="p-4 border-b dark:border-gray-700 flex items-center justify-between">
                 <div className="flex items-center gap-4">
                   {b.logoUrl && <img src={b.logoUrl} alt={b.name} className="w-12 h-12 object-contain" />}
                   <div>
                     <h3 className="font-bold dark:text-white">{b.name}</h3>
                     <p className="text-xs text-gray-500">{b.category}</p>
                   </div>
                 </div>
                 <button onClick={() => handleDelete(b.id)} className="text-red-600 text-xs font-bold hover:underline">Delete</button>
               </div>
             ))}
             {businesses.length === 0 && <div className="p-8 text-center text-gray-500">No listings yet.</div>}
           </div>
        </div>
      </div>
    </div>
  );
};

export default DirectoryManager;