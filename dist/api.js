/* TEMPUS — API PostgreSQL. No demonstration data or silent fallback. */
(() => {
  const endpoint = 'https://tgwmqrvcovigpmmnrjtp.supabase.co/functions/v1/tempus-events-v2';
  const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRnd21xcnZjb3ZpZ3BtbW5yanRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQ0MDk0NTQsImV4cCI6MjEwOTk4NTQ1NH0.BnT8P5HIRJW_q_td9MFVU-0dlfVzw_-cSl70WBBN0hQ';
  function iso(year, month = 1, day = 1) {
    const y = Number(year), m = Number(month), d = Number(day);
    if (!Number.isInteger(y) || y < 1 || y > 9999 || !Number.isInteger(m) || m < 1 || m > 12 || !Number.isInteger(d) || d < 1 || d > 31) return null;
    return String(y).padStart(4, '0') + '-' + String(m).padStart(2, '0') + '-' + String(d).padStart(2, '0');
  }
  function normalize(event) {
    const start = event.date_debut || iso(event.year, event.month, event.day);
    const end = event.date_fin || (event.endDate && typeof event.endDate === 'object' ? iso(event.endDate.year, event.endDate.month, event.endDate.day) : null);
    return {
      id: String(event.id ?? ''),
      date_debut: start,
      date_fin: end || '',
      titre: event.title || event.titre || '',
      description: event.description || '',
      lieu: event.place || event.lieu || '',
      categorie: event.category || event.categorie || '',
      couleur: event.color || event.couleur || '#C5A46D',
      importance: event.importance || 'normale',
      event_type: event.event_type || 'milestone',
      image_url: event.image_url || event.imageUrl || '',
      source_url: event.source_url || event.sourceUrl || '',
      resume: event.resume || event.summary || '',
      contexte: event.contexte || event.context || '',
      causes: event.causes || '',
      deroulement: event.deroulement || event.narrative || '',
      consequences: event.consequences || '',
      importance_historique: event.importance_historique || event.significance || '',
      acteurs: event.acteurs || event.actors || [],
      lieux: event.lieux || event.places || [],
      archives: event.archives || event.media || [],
      sources: event.sources || event.references || [],
      introduction: event.introduction || '',
      debats: event.debats || '',
      faits_cles: event.faits_cles || [],
      anecdotes: event.anecdotes || [],
      sections: event.sections || [],
      image_alt: event.image_alt || '',
      image_credit: event.image_credit || '',
      image_status: event.image_status || ''
    };
  }
  function startFrontend(records) {
    window.tempusEvents = records;
    const bootstrap = document.getElementById('timeline-bootstrap');
    const script = document.createElement('script');
    script.textContent = bootstrap.textContent;
    document.body.appendChild(script);
    const menu = document.createElement('script');
    menu.src = 'menu.js';
    document.body.appendChild(menu);
    const v2 = document.createElement('script');
    v2.src = 'event-v2.js';
    document.body.appendChild(v2);
  }
  function showError(message) {
    console.error('TEMPUS: ' + message);
    const notice = document.createElement('div');
    notice.setAttribute('role', 'alert');
    notice.style.cssText = 'position:fixed;z-index:1000;top:65px;left:12px;right:12px;padding:16px;border:1px solid #C5A46D;border-radius:12px;background:#10131B;color:#fff;text-align:center';
    notice.textContent = 'Les événements ne peuvent pas être chargés pour le moment. ' + message;
    document.body.appendChild(notice);
  }
  async function load() {
    try {
      const response = await fetch(endpoint, {headers: {apikey: anonKey, Authorization: 'Bearer ' + anonKey}});
      if (!response.ok) throw new Error('API HTTP ' + response.status);
      const payload = await response.json();
      const source = Array.isArray(payload) ? payload : payload.events;
      if (!Array.isArray(source)) throw new Error('Format de réponse API inattendu');
      const records = source.map(normalize).filter(item => item.date_debut && item.titre);
      startFrontend(records);
    } catch (error) {
      showError(error.message || 'Erreur réseau');
    }
  }
  load();
})();