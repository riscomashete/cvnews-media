
import React, { useEffect, useState } from 'react';

const WeatherWidget: React.FC = () => {
  const [weather, setWeather] = useState<any>(null);
  const [locationName, setLocationName] = useState<string>('Windhoek');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchWeatherData = async (lat: number, lon: number, name?: string) => {
     try {
        // Fetch Weather Data from Open-Meteo
        const weatherRes = await fetch(
           `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&daily=temperature_2m_max,temperature_2m_min&timezone=auto`
        );
        const weatherData = await weatherRes.json();
        setWeather(weatherData);

        if (name) {
           setLocationName(name);
        } else {
           // Attempt Reverse Geocoding to get City Name
           try {
              const geoRes = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`);
              const geoData = await geoRes.json();
              
              // Try different fields to find the most accurate town name
              const city = geoData.city || geoData.locality || geoData.principalSubdivision || 'Local Weather';
              setLocationName(city);
           } catch (e) {
              console.warn("Could not reverse geocode", e);
              setLocationName('Local Weather');
           }
        }
        setLoading(false);
     } catch (err) {
        console.error("Weather data fetch error:", err);
        setError(true);
        setLoading(false);
     }
  };

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          fetchWeatherData(position.coords.latitude, position.coords.longitude);
        },
        (err) => {
          console.warn("Geolocation denied/failed, using default.", err);
          // Fallback to Windhoek coordinates
          fetchWeatherData(-22.5609, 17.0658, "Windhoek");
        }
      );
    } else {
       // Browser doesn't support geolocation, Fallback to Windhoek
       fetchWeatherData(-22.5609, 17.0658, "Windhoek");
    }
  }, []);

  if (loading) return <div className="p-4 bg-blue-50 dark:bg-gray-800 animate-pulse h-28 rounded shadow-sm border-t-4 border-gray-200"></div>;
  if (error || !weather || !weather.current_weather) return null;

  const current = weather.current_weather;
  const isHot = current.temperature > 25;
  const isNight = current.is_day === 0;

  return (
    <div className="bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-lg overflow-hidden border-t-4 border-yellow-400">
      <div className="p-4 flex items-center justify-between">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest opacity-80 flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
            {locationName}
          </h3>
          <div className="text-4xl font-bold font-sans mt-1">
            {Math.round(current.temperature)}°C
          </div>
          <p className="text-xs mt-1 opacity-90">
             Wind: {current.windspeed} km/h
          </p>
        </div>
        <div className="text-5xl drop-shadow-md">
          {isNight ? '🌙' : (isHot ? '☀️' : '⛅')}
        </div>
      </div>
      <div className="bg-blue-800 bg-opacity-30 px-4 py-2 flex justify-between text-xs font-medium">
         <span>Low: {weather.daily?.temperature_2m_min[0]}°</span>
         <span>High: {weather.daily?.temperature_2m_max[0]}°</span>
      </div>
    </div>
  );
};

export default WeatherWidget;
