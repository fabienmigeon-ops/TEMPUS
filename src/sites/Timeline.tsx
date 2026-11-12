import { useEffect, useMemo, useRef, useState } from 'react';
import type { HistoricalEvent, HistoricalMedia, ZoomLevel } from './types';
import { MONTHS, ZOOM_LEVELS, centuryOf, eventDateLabel, yearLabel } from './types';
import './timeline.css';
import { VirtualRail } from './VirtualRail';

function RemoteImage({item}:{item:HistoricalMedia}) { const [failed,setFailed]=useState(false); return <figure className="sites-media"><div>{item.image_url&&!failed?<img src={item.image_url} alt={item.alt_text||item.title} loading="lazy" referrerPolicy="no-referrer" onError={()=>setFailed(true)}/>:<span>Illustration indisponible</span>}</div><figcaption>{item.caption||item.title}{item.attribution_text&&<small>{item.attribution_text}</small>}{item.source_url&&<a href={item.source_url} target="_blank" rel="noopener noreferrer">Source et droits ↗</a>}</figcaption></figure>; }
const START_YEAR = -3100;
const END_YEAR = new Date().getFullYear();
function formatPeriod(year: number, month: number, day: number, zoom: ZoomLevel): string {
  if (zoom === 'century') return `${centuryOf(year)}e siècle ${year < 0 ? 'av. J.-C.' : ''}`;
  if (zoom === 'year') return yearLabel(year);
  return `${zoom === 'day' ? day + ' ' : ''}${MONTHS[month-1]} ${yearLabel(year)}`;
}
export interface TimelineProps { events: HistoricalEvent[]; onSelectEvent?: (event: HistoricalEvent) => void; onPeriodChange?: (zoom:ZoomLevel, date:{year:number;month:number;day:number})=>void; loading?:boolean; error?:string; }
export function Timeline({ events, onSelectEvent, onPeriodChange, loading, error }: TimelineProps) {
  const [zoom,setZoom] = useState<ZoomLevel>('year');
  const [year,setYear] = useState(1789);
  const [month,setMonth] = useState(7);
  const [day,setDay] = useState(14);
  const [selected,setSelected] = useState<HistoricalEvent | null>(null);
  const [drawer,setDrawer] = useState(false);
  const [page,setPage] = useState<string | null>(null);
  const [query,setQuery] = useState('');
  const drawerTouch = useRef<{x:number;y:number}|null>(null);
  const [jump,setJump] = useState(false);
  const [inputYear,setInputYear] = useState('1789');
  const [era,setEra] = useState('CE');
  const [disabled,setDisabled] = useState<string[]>(() => { try { return JSON.parse(localStorage.getItem('tempus.categories') || '[]'); } catch { return []; } });
  const activeEvents = useMemo(() => events.filter(e => !disabled.includes(e.category)),[events,disabled]);
  const categories = useMemo(() => Array.from(new Set(events.map(e => e.category))).sort((a,b)=>a.localeCompare(b,'fr')),[events]);
  const eventById = useMemo(() => new Map(events.map(e => [e.id,e])),[events]);
  const searchResults = useMemo(() => activeEvents.filter(e => [e.title,e.description,e.place,e.category].some(value=>value?.toLocaleLowerCase('fr').includes(query.trim().toLocaleLowerCase('fr')))).slice(0,100),[activeEvents,query]);
  const setScale = (value:ZoomLevel) => setZoom(value);
  useEffect(()=>{onPeriodChange?.(zoom,{year,month,day});},[zoom,year,month,day,onPeriodChange]);
  useEffect(() => { localStorage.setItem('tempus.categories',JSON.stringify(disabled)); },[disabled]);
  useEffect(() => {
    const handler=(e:KeyboardEvent) => { if(e.key==='Escape'){setDrawer(false);setSelected(null);setJump(false);} };
    window.addEventListener('keydown',handler); return () => window.removeEventListener('keydown',handler);
  },[]);
  const openEvent = (event:HistoricalEvent) => { setSelected(event); onSelectEvent?.(event); try { const history: string[] = JSON.parse(localStorage.getItem('tempus.history') || '[]'); localStorage.setItem('tempus.history',JSON.stringify([event.id,...history.filter(id=>id!==event.id)].slice(0,100))); } catch { /* storage unavailable */ } };
  const [favorites,setFavorites] = useState<string[]>(() => { try { return JSON.parse(localStorage.getItem('tempus.favorites') || '[]'); } catch { return []; } });
  const toggleFavorite = (id:string) => { const next = favorites.includes(id) ? favorites.filter(x=>x!==id) : [...favorites,id]; setFavorites(next); localStorage.setItem('tempus.favorites',JSON.stringify(next)); };
  return <div className="sites-app">
    <header className="sites-mast"><button aria-label="Ouvrir le menu" onClick={()=>setDrawer(true)}>☰</button><strong className="sites-wordmark">Tempus</strong><span className="sites-period">{formatPeriod(year,month,day,zoom)}</span></header>
    {(loading||error)&&<div className="sites-api-status" role="status">{loading?'Chargement des événements…':error}</div>}
    <VirtualRail events={activeEvents} zoom={zoom} date={{year,month,day}} onDate={d=>{setYear(d.year);setMonth(d.month);setDay(d.day);}} onZoom={(z,d)=>{setYear(d.year);setMonth(d.month);setDay(d.day);setScale(z);}} onEvent={openEvent}/>
    <footer className="sites-controls"><select aria-label="Échelle de la frise" value={zoom} onChange={e=>setScale(e.target.value as ZoomLevel)}>{ZOOM_LEVELS.map((value,i)=><option key={value} value={value}>{['Siècles','Années','Mois','Jours'][i]}</option>)}</select><button onClick={()=>setJump(true)}>Aller à une année</button></footer>
    {jump && <div className="sites-backdrop" role="presentation" onClick={()=>setJump(false)}><section className="sites-modal" role="dialog" aria-modal="true" aria-label="Aller à une année" onClick={e=>e.stopPropagation()}><button className="sites-close" onClick={()=>setJump(false)}>×</button><h2>Aller à une année</h2><form onSubmit={e=>{e.preventDefault(); const n=Number(inputYear)*(era==='BCE'?-1:1);if(n>=START_YEAR&&n<=END_YEAR&&n!==0){setYear(n);setJump(false);}}}><label>Année<input type="number" min="1" max={era==='BCE'?-START_YEAR:END_YEAR} value={inputYear} onChange={e=>setInputYear(e.target.value)} required/></label><label>Ère<select value={era} onChange={e=>setEra(e.target.value)}><option value="CE">Après J.-C.</option><option value="BCE">Avant J.-C.</option></select></label><button type="submit">Afficher</button></form></section></div>}
    {selected && <div className="sites-backdrop" onClick={()=>setSelected(null)}><article className="sites-modal sites-event-sheet" role="dialog" aria-modal="true" aria-label={selected.title} onClick={e=>e.stopPropagation()}><button className="sites-close" onClick={()=>setSelected(null)}>×</button><time>{eventDateLabel(selected)}</time><h2>{selected.title}</h2><p className="sites-category" style={{color:selected.color}}>{selected.category}</p>{selected.place&&<strong>{selected.place}</strong>}<p>{selected.description}</p>{!!selected.media?.length&&<section className="sites-media-gallery" aria-label="Illustrations historiques"><h3>Illustrations historiques</h3>{[...selected.media].sort((a,b)=>Number(b.role_type==='hero')-Number(a.role_type==='hero')).map(item=><RemoteImage key={item.id} item={item}/>)}</section>}<button onClick={()=>toggleFavorite(selected.id)}>{favorites.includes(selected.id)?'★ Retirer des favoris':'☆ Ajouter aux favoris'}</button></article></div>}
    {drawer && <div className="sites-backdrop" onClick={()=>{setDrawer(false);setPage(null);}}><aside className="sites-drawer" role="dialog" aria-modal="true" aria-label="Menu principal" onClick={e=>e.stopPropagation()} onTouchStart={e=>{if(e.touches.length===1)drawerTouch.current={x:e.touches[0].clientX,y:e.touches[0].clientY};}} onTouchEnd={e=>{if(!drawerTouch.current)return;const dx=e.changedTouches[0].clientX-drawerTouch.current.x;const dy=e.changedTouches[0].clientY-drawerTouch.current.y;if(dx < -55 && Math.abs(dx)>Math.abs(dy)*1.5){setDrawer(false);setPage(null);}drawerTouch.current=null;}}><header><strong className="sites-wordmark">Tempus</strong><button onClick={()=>{setDrawer(false);setPage(null);}}>×</button></header>{page ? <><button onClick={()=>setPage(null)}>‹ Menu principal</button><h2>{page}</h2>{page==='Catégories historiques' ? categories.map(category=><label key={category} className="sites-check"><input type="checkbox" checked={!disabled.includes(category)} onChange={e=>setDisabled(current=>e.target.checked?current.filter(c=>c!==category):[...current,category])}/>{category}</label>) : page==='Rechercher' ? <><input type="search" aria-label="Rechercher un événement" placeholder="Rechercher un événement…" value={query} onChange={e=>setQuery(e.target.value)}/>{query.trim() ? (searchResults.length ? searchResults.map(e=><button className="sites-result" key={e.id} onClick={()=>{setDrawer(false);openEvent(e);}}><small>{eventDateLabel(e)}</small>{e.title}</button>) : <p>Aucun résultat.</p>) : <p>Entrez un mot-clé pour rechercher dans les événements disponibles.</p>}</> : (page==='Mes favoris'||page==='Historique') ? (()=>{const ids:string[]=page==='Mes favoris'?favorites:(()=>{try{return JSON.parse(localStorage.getItem('tempus.history')||'[]') as string[];}catch{return [];}})();const matches=ids.map(id=>eventById.get(id)).filter((e):e is HistoricalEvent=>Boolean(e));return matches.length ? matches.map(e=><button className="sites-result" key={e.id} onClick={()=>{setDrawer(false);openEvent(e);}}><small>{eventDateLabel(e)}</small>{e.title}</button>) : <p>Aucun événement pour le moment.</p>;})() : <p>Fonctionnalité à venir.</p>}</> : <nav><h2>Navigation</h2>{['Frise chronologique','Rechercher','Mes favoris','Historique'].map(name=><button key={name} onClick={()=>name==='Frise chronologique'?setDrawer(false):setPage(name)}>{name}</button>)}<h2>Personnalisation</h2>{['Catégories historiques','Apparence','Paramètres'].map(name=><button key={name} onClick={()=>setPage(name)}>{name}</button>)}</nav>}</aside></div>}
  </div>;
}
