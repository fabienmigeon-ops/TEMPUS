import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, TouchEvent, WheelEvent } from 'react';
import type { HistoricalEvent, ZoomLevel } from './types';
import { MONTHS, ZOOM_LEVELS, centuryOf, eventDateLabel, yearLabel } from './types';
import './virtual-rail.css';

const WIDTH = 156;
const RADIUS = 34;
const FIRST = -3100;
const LAST = new Date().getFullYear();
type DateParts = {year:number;month:number;day:number};
const toAstronomical = (y:number) => y < 0 ? y+1 : y;
const fromAstronomical = (y:number) => y <= 0 ? y-1 : y;
function dayNumber(y:number,m:number,d:number):number {
  const date = new Date(0);date.setUTCHours(12,0,0,0);date.setUTCFullYear(toAstronomical(y),m-1,d);return Math.floor(date.getTime()/86400000);
}
function fromDayNumber(n:number):DateParts {
  const d=new Date(n*86400000);return {year:fromAstronomical(d.getUTCFullYear()),month:d.getUTCMonth()+1,day:d.getUTCDate()};
}
function serial(date:DateParts,scale:ZoomLevel):number {
  const y=toAstronomical(date.year);
  if(scale==='century') return Math.floor(y/100);
  if(scale==='year') return y;
  if(scale==='month') return y*12+date.month-1;
  return dayNumber(date.year,date.month,date.day);
}
function dateAt(index:number,scale:ZoomLevel):DateParts {
  if(scale==='century')return {year:fromAstronomical(index*100),month:1,day:1};
  if(scale==='year')return {year:fromAstronomical(index),month:1,day:1};
  if(scale==='month'){const y=Math.floor(index/12);return {year:fromAstronomical(y),month:index-y*12+1,day:1};}
  return fromDayNumber(index);
}
function label(d:DateParts,scale:ZoomLevel):string {
  if(scale==='century'){const y=toAstronomical(d.year);const n=y<1?Math.ceil(Math.abs(y-1)/100):Math.ceil(y/100);return `${n}e siècle ${y<1?'av. J.-C.':''}`;}
  if(scale==='year')return yearLabel(d.year);
  if(scale==='month')return `${MONTHS[d.month-1]} ${yearLabel(d.year)}`;
  return `${d.day} ${MONTHS[d.month-1]}`;
}
function fraction(e:HistoricalEvent,scale:ZoomLevel):number {
  if(scale==='day')return .5;
  const month=Math.min(12,Math.max(1,e.month??7));
  const day=Math.min(31,Math.max(1,e.day??15));
  if(scale==='month')return Math.min(.95,Math.max(.05,(day-.5)/new Date(Date.UTC(2000,month,0)).getUTCDate()));
  const yearFraction=(month-1+(day-.5)/31)/12;
  if(scale==='year')return yearFraction;
  const start=Math.floor(toAstronomical(e.year)/100)*100;
  return (toAstronomical(e.year)-start+yearFraction)/100;
}
function within(e:HistoricalEvent,index:number,scale:ZoomLevel):boolean {
  return serial({year:e.year,month:e.month??1,day:e.day??1},scale)===index;
}
function clampDate(date:DateParts):DateParts {
  if(date.year<FIRST)return {year:FIRST,month:1,day:1};
  if(date.year>LAST)return {year:LAST,month:12,day:31};
  return date;
}
export interface VirtualRailProps {
  events:HistoricalEvent[];
  zoom:ZoomLevel;
  date:DateParts;
  onDate:(date:DateParts)=>void;
  onZoom:(zoom:ZoomLevel,date:DateParts)=>void;
  onEvent:(event:HistoricalEvent)=>void;
}
export function VirtualRail({events,zoom,date,onDate,onZoom,onEvent}:VirtualRailProps) {
  const viewport=useRef<HTMLDivElement>(null);
  const center=RADIUS*WIDTH;
  const anchor=serial(date,zoom);
  const anchorRef=useRef(anchor);
  const zoomRef=useRef(zoom);
  const [start,setStart]=useState(anchor);
  const touching=useRef<{distance:number;centerX:number;zoom:ZoomLevel;date:DateParts}|null>(null);
  const suppress=useRef(false);
  const bounds=useMemo(()=>[serial({year:FIRST,month:1,day:1},zoom),serial({year:LAST,month:12,day:31},zoom)] as const,[zoom]);
  const dates=useMemo(()=>Array.from({length:RADIUS*2+1},(_,i)=>start+i-RADIUS),[start]);
  const groups=useMemo(()=>{
    const map=new Map<number,HistoricalEvent[]>();
    for(const e of events){
      if(e.year<FIRST||e.year>LAST)continue;
      const index=serial({year:e.year,month:e.month??1,day:e.day??1},zoom);
      const arr=map.get(index)||[];arr.push(e);map.set(index,arr);
    }
    for(const arr of map.values())arr.sort((a,b)=>fraction(a,zoom)-fraction(b,zoom));
    return map;
  },[events,zoom]);
  const align=useCallback((index:number)=>{
    const el=viewport.current;if(!el)return;
    suppress.current=true;
    el.scrollLeft=center+(WIDTH-el.clientWidth)/2;
    anchorRef.current=index;
    setStart(index);
    requestAnimationFrame(()=>{suppress.current=false;});
  },[center]);
  useLayoutEffect(()=>{
    if(anchor!==anchorRef.current||zoom!==zoomRef.current){
      zoomRef.current=zoom;align(anchor);
    } else if(viewport.current&&viewport.current.scrollLeft===0)align(anchor);
  },[anchor,zoom,align]);
  const onScroll=()=>{
    const el=viewport.current;if(!el||suppress.current||touching.current)return;
    const offset=(el.scrollLeft-(center+(WIDTH-el.clientWidth)/2))/WIDTH;
    const steps=Math.trunc(offset);
    if(!steps)return;
    const next=Math.min(bounds[1],Math.max(bounds[0],anchorRef.current+steps));
    if(next===anchorRef.current)return;
    const delta=next-anchorRef.current;
    anchorRef.current=next;
    setStart(next);
    suppress.current=true;
    el.scrollLeft-=delta*WIDTH;
    requestAnimationFrame(()=>{suppress.current=false;});
    onDate(clampDate(dateAt(next,zoom)));
  };
  const step=(delta:number)=>{
    const next=Math.max(bounds[0],Math.min(bounds[1],anchorRef.current+delta));
    if(next===anchorRef.current)return;
    align(next);onDate(clampDate(dateAt(next,zoom)));
  };
  const touchStart=(e:TouchEvent<HTMLDivElement>)=>{
    if(e.touches.length!==2)return;
    const a=e.touches[0],b=e.touches[1];
    const x=(a.clientX+b.clientX)/2;
    const el=viewport.current;
    const offset=el?((x-el.getBoundingClientRect().left-el.clientWidth/2)/WIDTH):0;
    touching.current={distance:Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY),centerX:x,zoom,date:clampDate(dateAt(anchorRef.current+Math.round(offset),zoom))};
  };
  const touchMove=(e:TouchEvent<HTMLDivElement>)=>{
    if(!touching.current||e.touches.length!==2)return;
    e.preventDefault();
    const a=e.touches[0],b=e.touches[1];
    const ratio=Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY)/touching.current.distance;
    if(ratio>.80&&ratio<1.25)return;
    const index=ZOOM_LEVELS.indexOf(touching.current.zoom);
    const next=ZOOM_LEVELS[Math.max(0,Math.min(3,index+(ratio>1?1:-1)))];
    const target=touching.current.date;
    touching.current=null;
    if(next!==zoom)onZoom(next,target);
  };
  const wheel=(e:WheelEvent<HTMLDivElement>)=>{
    if(e.ctrlKey){e.preventDefault();const i=ZOOM_LEVELS.indexOf(zoom);const next=ZOOM_LEVELS[Math.max(0,Math.min(3,i+(e.deltaY<0?1:-1)))];if(next!==zoom)onZoom(next,date);}
    else if(Math.abs(e.deltaY)>Math.abs(e.deltaX)){e.preventDefault();viewport.current?.scrollBy({left:e.deltaY,behavior:'auto'});}
  };
  return <div className="tempus-virtual-shell">
    <div ref={viewport} className="tempus-virtual-viewport" role="region" aria-label="Frise chronologique à défilement horizontal" onScroll={onScroll} onWheel={wheel} onTouchStart={touchStart} onTouchMove={touchMove} onTouchEnd={()=>{touching.current=null;}}>
      <div className="tempus-virtual-track">
        {dates.map(index=>{
          const d=dateAt(index,zoom);
          const inRange=index>=bounds[0]&&index<=bounds[1];
          const matches=inRange?(groups.get(index)||[]):[];
          return <div key={index} className={`tempus-virtual-slot ${index===anchorRef.current?'is-current':''}`}>
            <time>{inRange?label(d,zoom):''}</time>
            {matches.map((e,i)=>{
              const x=Math.min(94,Math.max(6,fraction(e,zoom)*100));
              const lane=i%6;
              const below=lane%2===1;
              const height=46+Math.floor(lane/2)*48;
              return <button key={e.id} className={`tempus-virtual-event ${below?'below':'above'}`} style={{'--event-color':e.color,'--event-x':`${x}%`,'--event-height':`${height}px`} as CSSProperties} aria-label={`${eventDateLabel(e)} — ${e.title}`} title={e.title} onClick={()=>onEvent(e)}><span className="tempus-virtual-stem"/><span className="tempus-virtual-dot"/><span className="tempus-virtual-title">{e.title}</span></button>;
            })}
          </div>;
        })}
      </div>
    </div>
    <div className="tempus-virtual-axis" aria-hidden="true"/>
    {!events.length&&<p className="sites-empty">La frise est prête. Les événements seront chargés depuis la base de données.</p>}
    <button className="sites-step sites-prev" aria-label="Période précédente" onClick={()=>step(-1)}>‹</button>
    <button className="sites-step sites-next" aria-label="Période suivante" onClick={()=>step(1)}>›</button>
  </div>;
}
