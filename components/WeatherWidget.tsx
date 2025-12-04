
import React, { useEffect, useState } from 'react';

// Open-Meteo is a free weather API that requires no key.
// Katima Mulilo Coords: 17.50° S, 24.28° E
const API_URL = "https://api.open-meteo.com/v1/forecast?latitude=-17.5&longitude=24.2833&current_weather=true&daily=temperature_2m_max,temperature_2m_min&timezone=Africa%2FWindhoek";

const WeatherWidget: React.FC = () => {
  const [weather, setWeather] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(API_URL)
      .then(res => res.json())
      .then(data => {
        setWeather(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Weather fetch failed", err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-4 bg-blue-50 dark:bg-gray-800 animate-pulse h-24"></div>;
  if (!weather || !weather.current_weather) return null;

  const current = weather.current_weather;
  const isHot = current.temperature > 25;
  const isNight = current.is_day === 0;

  return (
    <div className="bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-lg overflow-hidden border-t-4 border-yellow-400">
      <div className="p-4 flex items-center justify-between">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest opacity-80">Katima Mulilo</h3>
          <div className="text-4xl font-bold font-sans mt-1">
            {Math.round(current.temperature)}°C
          </div>
          <p className="text-xs mt-1 opacity-90">
             Wind: {current.windspeed} km/h
          </p>
        </div>
        <div className="text-5xl">
          {isNight ? '🌙' : (isHot ? '☀️' : '⛅')}
        </div>
      </div>
      <div className="bg-blue-800 bg-opacity-30 px-4 py-2 flex justify-between text-xs">
         <span>Low: {weather.daily?.temperature_2m_min[0]}°</span>
         <span>High: {weather.daily?.temperature_2m_max[0]}°</span>
      </div>
    </div>
  );
};

export default WeatherWidget;
