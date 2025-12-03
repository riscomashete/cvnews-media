import React from 'react';

const About: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl">
      <h1 className="text-4xl font-serif font-bold mb-8 dark:text-white">About CVNEWS MEDIA CC</h1>
      <div className="prose dark:prose-invert max-w-none">
        <p className="text-xl leading-relaxed text-gray-600 dark:text-gray-300 mb-8">
          CVNEWS MEDIA CC is a premier Namibian SME media company dedicated to telling the stories that matter.
          We bridge the gap between small businesses and the wider economy through insightful journalism and digital storytelling.
        </p>
        
        <div className="grid md:grid-cols-2 gap-12 my-12">
          <div className="bg-gray-50 dark:bg-gray-800 p-8 border-l-4 border-brand-red">
            <h2 className="text-2xl font-bold mb-4 dark:text-white">Our Mission</h2>
            <p className="text-gray-700 dark:text-gray-300">
              To empower Namibian entrepreneurs by providing a platform for visibility, connection, and growth through high-quality media content.
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 p-8 border-l-4 border-black dark:border-white">
            <h2 className="text-2xl font-bold mb-4 dark:text-white">Our Vision</h2>
            <p className="text-gray-700 dark:text-gray-300">
              To be the leading digital voice for the SME sector in Southern Africa, fostering a culture of innovation and economic resilience.
            </p>
          </div>
        </div>

        <h3 className="text-2xl font-bold mb-4 dark:text-white">Our Services</h3>
        <ul className="list-disc pl-5 space-y-2 text-gray-700 dark:text-gray-300">
          <li>Digital Advertising & Marketing</li>
          <li>Corporate Profiling</li>
          <li>Event Coverage</li>
          <li>Social Media Management</li>
        </ul>
      </div>
    </div>
  );
};

export default About;