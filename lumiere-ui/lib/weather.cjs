'use strict';
async function json(url){const r=await fetch(url,{signal:AbortSignal.timeout(15000)});if(!r.ok)throw new Error('Weather provider is unavailable. Please try again later.');return r.json();}
async function cities(city){const d=await json('https://geocoding-api.open-meteo.com/v1/search?name='+encodeURIComponent(city)+'&count=5&language=en&format=json');return (d.results||[]).map(c=>({id:c.id,name:c.name,region:c.admin1||'',country:c.country||'',latitude:c.latitude,longitude:c.longitude,timezone:c.timezone}));}
async function weather(city){
 const q=new URLSearchParams({latitude:city.latitude,longitude:city.longitude,current:'temperature_2m,relative_humidity_2m,weather_code,is_day',daily:'uv_index_max',forecast_days:'1',timezone:city.timezone||'auto'});
 const data=await json('https://api.open-meteo.com/v1/forecast?'+q);
 const m=Number(data.current.time.slice(5,7));let season=['Winter','Spring','Summer','Autumn'][Math.floor(m%12/3)];if(city.latitude<0)season={Winter:'Summer',Summer:'Winter',Spring:'Autumn',Autumn:'Spring'}[season];if(Math.abs(city.latitude)<23.5)season='Tropical region';
 return {city,temperature:data.current.temperature_2m,humidity:data.current.relative_humidity_2m,code:data.current.weather_code,isDay:!!data.current.is_day,uv:data.daily.uv_index_max[0],observedAt:data.current.time,timezone:data.timezone,season,fetchedAt:new Date().toISOString(),source:'Open-Meteo'};
}
module.exports={cities,weather};
