import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Timeline } from './sites/Timeline';
import type { HistoricalEvent } from './sites/types';

const API_URL = 'https://tgwmqrvcovigpmmnrjtp.supabase.co/functions/v1/tempus-events';
const PUBLIC_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJIUzI1NiIsInJlZiI6InRnd21xcnZjb3ZpZ3BtbW5yanRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQ0MDk0NTQsImV4cCI6MjEwOTk4NTQ1NH0.BnT8P5HIRJW_q_td9MFVU-0dlfVzw_-cSl70WBBN0hQ';

function App() {
  const [events, setEvents] = useState<HistoricalEvent[]>([]);
  const [error, setError] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    fetch(API_URL, {
      headers: { apikey: PUBLIC_ANON_KEY, Authorization: `Bearer ${PUBLIC_ANON_KEY}` },
      signal: controller.signal
    }).then(async response => {
      if (!response.ok) throw new Error(`Erreur API ${response.status}`);
      return response.json() as Promise<{ events: HistoricalEvent[] }>;
    }).then(result => setEvents(result.events)).catch(e => {
      if (e.name !== 'AbortError') { console.error('TEMPUS API', e); setError(true); }
    });
    return () => controller.abort();
  }, []);
  return <><Timeline events={events} />{error && <div role="status" style={{position:'fixed',bottom:70,left:12,right:12,zIndex:30,padding:12,background:'#10131B',color:'#fff',border:'1px solid #C5A46D',borderRadius:8}}>Les événements ne peuvent pas être chargés pour le moment.</div>}</>;
}

const root = document.getElementById('root');
if (!root) throw new Error('Élément #root introuvable');
createRoot(root).render(<React.StrictMode><App /></React.StrictMode>);
