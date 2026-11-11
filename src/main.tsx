import React from 'react';
import { createRoot } from 'react-dom/client';
import { Timeline } from './sites/Timeline';
import type { HistoricalEvent } from './sites/types';

/**
 * TEMPUS V0.1 — frontend-only migration.
 * Historical data will be supplied by the Supabase API in a later step.
 * Keep the collection empty rather than duplicating or inventing records.
 */
const events: HistoricalEvent[] = [];

function App() {
  return <Timeline events={events} />;
}

const root = document.getElementById('root');
if (!root) throw new Error('Élément #root introuvable');
createRoot(root).render(<React.StrictMode><App /></React.StrictMode>);
