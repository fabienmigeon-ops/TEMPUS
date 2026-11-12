import React,{useCallback,useEffect,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {Timeline} from './sites/Timeline';
import type {HistoricalEvent,ZoomLevel,HistoricalMedia} from './sites/types';
import './style.css';

type ApiEvent={id:number|string;year:number;month?:number|null;day?:number|null;title:string;description?:string|null;category?:string|null;color?:string|null;place?:string|null;media?:HistoricalMedia[]};
const api=import.meta.env.VITE_SUPABASE_URL;
const anon=import.meta.env.VITE_SUPABASE_ANON_KEY;
function normalize(e:ApiEvent):HistoricalEvent{
  return {id:String(e.id),year:e.year,month:e.month??undefined,day:e.day??undefined,title:e.title,description:e.description||'',category:e.category||'Autre',color:e.color||'#C5A46D',place:e.place||undefined,media:e.media||[]};
}
function App(){
 const [period,setPeriod]=useState<{zoom:ZoomLevel;year:number;month:number;day:number}>({zoom:'year',year:1789,month:7,day:14});
 const [events,setEvents]=useState<HistoricalEvent[]>([]);
 const [loading,setLoading]=useState(false);
 const [error,setError]=useState('');
 const onPeriodChange=useCallback((zoom:ZoomLevel,date:{year:number;month:number;day:number})=>setPeriod(p=>p.zoom===zoom&&p.year===date.year&&p.month===date.month&&p.day===date.day?p:{zoom,...date}),[]);
 useEffect(()=>{
  if(!api||!anon){setError('Connexion Supabase non configurée');return;}
  const controller=new AbortController();
  const timer=window.setTimeout(()=>{
   setLoading(true);setError('');
   const params=new URLSearchParams({zoom:period.zoom,year:String(period.year),month:String(period.month),day:String(period.day)});
   fetch(api+'/functions/v1/tempus-timeline-v1?'+params,{headers:{apikey:anon,Authorization:'Bearer '+anon},signal:controller.signal})
    .then(async r=>{if(!r.ok)throw Error('API Supabase : '+r.status);return r.json();})
    .then(d=>{if(!controller.signal.aborted)setEvents(Array.isArray(d.events)?d.events.map(normalize):[]);})
    .catch(e=>{if(!controller.signal.aborted){setError('Les événements ne peuvent pas être chargés pour le moment.');console.error(e);}})
    .finally(()=>{if(!controller.signal.aborted)setLoading(false);});
  },180);
  return ()=>{window.clearTimeout(timer);controller.abort();};
 },[period]);
 return <Timeline events={events} onPeriodChange={onPeriodChange} loading={loading} error={error}/>;
}
createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);
