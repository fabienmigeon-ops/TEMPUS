/* TEMPUS: live PostgreSQL events via the existing public Supabase Edge Function. */
(() => {
  const url = 'https://tgwmqrvcovigpmmnrjtp.supabase.co/functions/v1/tempus-events';
  const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRnd21xcnZjb3ZpZ3BtbW5yanRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQ0MDk0NTQsImV4cCI6MjEwOTk4NTQ1NH0.BnT8P5HIRJW_q_td9MFVU-0dlfVzw_-cSl70WBBN0hQ';
  function pad(n) { return String(n).padStart(2, '0'); }
  function date(e) {
    if (!Number.isInteger(e.year) || e.year < 1 || e.year > 9999) return null;
    return `${pad(e.year).padStart(4,'0')}-${pad(e.month || 1)}-${pad(e.day || 1)}`;
  }
  async function load() {
    try {
      const response = await fetch(url, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
      if (!response.ok) throw new Error('HTTP ' + response.status);
      const data = await response.json();
      if (!Array.isArray(data.events)) throw new Error('Invalid events response');
      const records = data.events.map(e => ({
        id: String(e.id), date_debut: date(e), date_fin: e.endDate ? date(e.endDate) : '',
        titre: e.title, description: e.description || '', lieu: e.place || '',
        categorie: e.category || '', couleur: e.color || '#C5A46D',
        importance: e.importance || 'normale'
      })).filter(e => e.date_debut && e.titre);
      // Preserve the demonstration dataset if the API returns no usable records.
      if (!records.length) return;
      window.tempusByYear.clear();
      records.forEach(record => window.tempusRegister(record));
      window.tempusRefresh();
      // The menu caches the original event catalog; update its underlying collection.
      if (typeof catalog !== 'undefined') catalog.splice(0, catalog.length, ...[...window.tempusByYear.values()].flat());
      if (typeof categories !== 'undefined') {
        categories.clear();
        records.forEach(e => categories.set(e.categorie, e.couleur));
      }
    } catch (error) { console.warn('TEMPUS: API indisponible, données de démonstration conservées.', error); }
  }
  load();
})();