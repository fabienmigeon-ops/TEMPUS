import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { HistoricalEvent, ZoomLevel } from './types';
import { MONTHS, ZOOM_LEVELS, centuryOf, eventDateLabel, stepYear, yearLabel } from './types';
import './timeline.css';

const START_YEAR = -3100;
const END_YEAR = new Date().getFullYear();
const SLOT_WIDTH = 136;
const YEARS = Array.from({ length: END_YEAR - START_YEAR }, (_, i) => {
  const y = START_YEAR + i; return y >= 0 ? y + 1 : y;
});
function formatPeriod(year: number, month: number, day: number, zoom: ZoomLevel): string {
  if (zoom === 'century') return `${centuryOf(year)}e siècle ${year < 0 ? 'av. J.-C.' : ''}`;
  if (zoom === 'year') return yearLabel(year);
  return `${zoom === 'day' ? day + ' ' : ''}${MONTHS[month-1]} ${yearLabel(year)}`;
}
function moveDate(year: number, month: number, day: number, zoom: ZoomLevel, offset: number) {
  if (zoom === 'century' || zoom === 'year') return { year: stepYear(year, offset * (zoom === 'century' ? 100 : 1)), month, day };
  const date = new Date(0); date.setUTCFullYear(year < 0 ? year + 1 : year, month-1, day);
  if (zoom === 'month') date.setUTCMonth(date.getUTCMonth()+offset); else date.setUTCDate(date.getUTCDate()+offset);
  const y = date.getUTCFullYear();
  return { year: y <= 0 ? y-1 : y, month: date.getUTCMonth()+1, day: date.getUTCDate() };
}
export interface TimelineProps { events: HistoricalEvent[]; onSelectEvent?: (event: HistoricalEvent) => void; }
export function Timeline({ events, onSelectEvent }: TimelineProps) {
  const [zoom,setZoom] = useState<ZoomLevel>('year');
  const [year,setYear] = useState(1789);
  const [month,setMonth] = useState(7);
  const [day,setDay] = useState(14);
  const [selected,setSelected] = useState<HistoricalEvent | null>(null);
  const [drawer,setDrawer] = useState(false);
  const [page,setPage] = useState<string | null>(null);
  const [jump,setJump] = useState(false);
  const [inputYear,setInputYear] = useState('1789');
  const [era,setEra] = useState('CE');
  const [disabled,setDisabled] = useState<string[]>(() => { try { return JSON.parse(localStorage.getItem('tempus.categories') || '[]'); } catch { return []; } });
  const rail = useRef<HTMLDivElement>(null);
  const pinch = useRef<{distance:number;zoom:ZoomLevel}|null>(null);
  const activeEvents = useMemo(() => events.filter(e => !disabled.includes(e.category)),[events,disabled]);
  const categories = useMemo(() => Array.from(new Set(events.map(e => e.category))),[events]);
  const move = useCallback((offset:number) => {
    const next = moveDate(year,month,day,zoom,offset);
    if (next.year < START_YEAR || next.year > END_YEAR) return;
    setYear(next.year); setMonth(next.month); setDay(next.day);
  },[year,month,day,zoom]);
  const visible = useMemo(() => Array.from({length:13},(_,i) => moveDate(year,month,day,zoom,i-6)).filter(d => d.year >= START_YEAR && d.year <= END_YEAR),[year,month,day,zoom]);
  const filtered = useCallback((date:{year:number;month:number;day:number}) => activeEvents.filter(e => {
    if (zoom === 'century') return e.year < 0 === (date.year < 0) && centuryOf(e.year) === centuryOf(date.year);
    if (e.year !== date.year) return false;
    if (zoom === 'year') return true;
    if (e.month !== date.month) return false;
    return zoom === 'month' || e.day === date.day;
  }),[activeEvents,zoom]);
  const setScale = (value:ZoomLevel) => setZoom(value);
  useEffect(() => { localStorage.setItem('tempus.categories',JSON.stringify(disabled)); },[disabled]);
  useEffect(() => {
    const handler=(e:KeyboardEvent) => { if(e.key==='Escape'){setDrawer(false);setSelected(null);setJump(false);} };
    window.addEventListener('keydown',handler); return () => window.removeEventListener('keydown',handler);
  },[]);
  const openEvent = (event:HistoricalEvent) => { setSelected(event); onSelectEvent?.(event); try { const history: string[] = JSON.parse(localStorage.getItem('tempus.history') || '[]'); localStorage.setItem('tempus.history',JSON.stringify([event.id,...history.filter(id=>id!==event.id)].slice(0,100))); } catch { /* storage unavailable */ } };
  const [favorites,setFavorites] = useState<string[]>(() => { try { return JSON.parse(localStorage.getItem('tempus.favorites') || '[]'); } catch { return []; } });
  const toggleFavorite = (id:string) => { const next = favorites.includes(id) ? favorites.filter(x=>x!==id) : [...favorites,id]; setFavorites(next); localStorage.setItem('tempus.favorites',JSON.stringify(next)); };
  const touchDistance=(e:React.TouchEvent)=>Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);
  return <div className="sites-app">
    <header className="sites-mast"><button aria-label="Ouvrir le menu" onClick={()=>setDrawer(true)}>☰</button><strong className="sites-wordmark">Tempus</strong><span className="sites-period">{formatPeriod(year,month,day,zoom)}</span></header>
    <main ref={rail} className="sites-rail" aria-label="Frise historique" onWheel={e=>{if(e.ctrlKey)return; move(Math.sign(e.deltaY || e.deltaX));}} onTouchStart={e=>{if(e.touches.length===2)pinch.current={distance:touchDistance(e),zoom};}} onTouchMove={e=>{if(e.touches.length!==2||!pinch.current)return; const ratio=touchDistance(e)/pinch.current.distance; const index=ZOOM_LEVELS.indexOf(pinch.current.zoom); if(ratio>1.2 || ratio<0.82){setScale(ZOOM_LEVELS[Math.max(0,Math.min(3,index+(ratio>1?1:-1)))]);pinch.current=null;}}} onTouchEnd={()=>{pinch.current=null;}}>
      <div className="sites-track">
        {visible.map((date,i) => <div key={i} className="sites-slot">
          <time>{formatPeriod(date.year,date.month,date.day,zoom)}</time>
          <div className="sites-points">{filtered(date).map((event,index)=><button key={event.id} className={`sites-point ${index%2?'below':'above'}`} style={{'--dot':event.color,'--offset':`${42+(index%4)*18}px`} as React.CSSProperties} title={event.title} aria-label={`${eventDateLabel(event)} — ${event.title}`} onClick={()=>openEvent(event)}><span className="sites-dot"/><span className="sites-point-title">{event.title}</span></button>)}</div>
        </div>)}
      </div>
      <div className="sites-axis"/>
      <button className="sites-step sites-prev" aria-label="Période précédente" onClick={()=>move(-1)}>‹</button><button className="sites-step sites-next" aria-label="Période suivante" onClick={()=>move(1)}>›</button>
    </main>
    <footer className="sites-controls"><select aria-label="Échelle de la frise" value={zoom} onChange={e=>setScale(e.target.value as ZoomLevel)}>{ZOOM_LEVELS.map((value,i)=><option key={value} value={value}>{['Siècles','Années','Mois','Jours'][i]}</option>)}</select><button onClick={()=>setJump(true)}>Aller à une année</button></footer>
    {jump && <div className="sites-backdrop" role="presentation" onClick={()=>setJump(false)}><section className="sites-modal" role="dialog" aria-modal="true" aria-label="Aller à une année" onClick={e=>e.stopPropagation()}><button className="sites-close" onClick={()=>setJump(false)}>×</button><h2>Aller à une année</h2><form onSubmit={e=>{e.preventDefault(); const n=Number(inputYear)*(era==='BCE'?-1:1);if(n>=START_YEAR&&n<=END_YEAR&&n!==0){setYear(n);setJump(false);}}}><label>Année<input type="number" min="1" max={era==='BCE'?-START_YEAR:END_YEAR} value={inputYear} onChange={e=>setInputYear(e.target.value)} required/></label><label>Ère<select value={era} onChange={e=>setEra(e.target.value)}><option value="CE">Après J.-C.</option><option value="BCE">Avant J.-C.</option></select></label><button type="submit">Afficher</button></form></section></div>}
    {selected && <div className="sites-backdrop" onClick={()=>setSelected(null)}><article className="sites-modal sites-event-sheet" role="dialog" aria-modal="true" aria-label={selected.title} onClick={e=>e.stopPropagation()}><button className="sites-close" onClick={()=>setSelected(null)}>×</button><time>{eventDateLabel(selected)}</time><h2>{selected.title}</h2><p className="sites-category" style={{color:selected.color}}>{selected.category}</p>{selected.place&&<strong>{selected.place}</strong>}<p>{selected.description}</p><button onClick={()=>toggleFavorite(selected.id)}>{favorites.includes(selected.id)?'★ Retirer des favoris':'☆ Ajouter aux favoris'}</button></article></div>}
    {drawer && <div className="sites-backdrop" onClick={()=>{setDrawer(false);setPage(null);}}><aside className="sites-drawer" role="dialog" aria-modal="true" aria-label="Menu principal" onClick={e=>e.stopPropagation()}><header><strong className="sites-wordmark">Tempus</strong><button onClick={()=>{setDrawer(false);setPage(null);}}>×</button></header>{page ? <><button onClick={()=>setPage(null)}>‹ Menu principal</button><h2>{page}</h2>{page==='Catégories historiques' ? categories.map(category=><label key={category} className="sites-check"><input type="checkbox" checked={!disabled.includes(category)} onChange={e=>setDisabled(current=>e.target.checked?current.filter(c=>c!==category):[...current,category])}/>{category}</label>) : page==='Rechercher' ? <input type="search" placeholder="Recherche à venir avec Supabase" disabled/> : (page==='Mes favoris'||page==='Historique') ? events.filter(e=>page==='Mes favoris'?favorites.includes(e.id):JSON.parse(localStorage.getItem('tempus.history')||'[]').includes(e.id)).map(e=><button key={e.id} onClick={()=>{setDrawer(false);openEvent(e);}}>{e.title}</button>) : <p>Fonctionnalité à venir.</p>}</> : <nav><h2>Navigation</h2>{['Frise chronologique','Rechercher','Mes favoris','Historique'].map(name=><button key={name} onClick={()=>name==='Frise chronologique'?setDrawer(false):setPage(name)}>{name}</button>)}<h2>Personnalisation</h2>{['Catégories historiques','Apparence','Paramètres'].map(name=><button key={name} onClick={()=>setPage(name)}>{name}</button>)}</nav>}</aside></div>}
  </div>;
}
