export type ZoomLevel = 'century' | 'year' | 'month' | 'day';
export type Era = 'BCE' | 'CE';
export interface HistoricalEvent {
  id: string;
  title: string;
  description: string;
  year: number; // BCE years are negative; year zero is excluded.
  month?: number; // 1..12
  day?: number; // 1..31
  endDate?: { year: number; month: number; day: number };
  category: string;
  color: string;
  place?: string;
  importance?: 'majeure' | 'normale';
}
export const ZOOM_LEVELS: ZoomLevel[] = ['century', 'year', 'month', 'day'];
export const MONTHS = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'] as const;
export function yearLabel(year: number): string { return year < 0 ? `${-year} av. J.-C.` : String(year); }
export function stepYear(year: number, step: number): number { const result = year + step; return year < 0 && result >= 0 ? result + 1 : year > 0 && result <= 0 ? result - 1 : result; }
export function centuryOf(year: number): number { return Math.ceil(Math.abs(year)/100); }
export function eventDateLabel(event: HistoricalEvent): string {
  return [event.day && (event.day === 1 ? '1er' : String(event.day)), event.month && MONTHS[event.month-1], yearLabel(event.year)].filter(Boolean).join(' ');
}
