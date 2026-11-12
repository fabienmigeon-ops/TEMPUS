const drawer = el('drawer');
const home = el('menuHome');
const page = el('menuPage');
const body = el('pageBody');
const catalog = [...byYear.values()].flat();
const eventKey = event => event.id || event.date_debut+'|'+event.titre;
const favorites = new Set(loadList('favorites'));
let visits = loadList('history');
const categories = new Map((window.tempusEvents || []).map(event => [event.categorie,event.couleur]));
let closing = false;

function saveList(name, values) {
  try { localStorage.setItem('tempus.'+name, JSON.stringify([...values])); }
  catch { /* Keep the current session usable if storage is unavailable. */ }
}
function recordVisit(event) {
  const key = eventKey(event);
  visits = [key,...visits.filter(id => id !== key)];
  saveList('history', visits);
  const button = el('favoriteButton');
  function update() {
    button.textContent = favorites.has(key) ? 'Retirer des favoris' : 'Ajouter aux favoris';
  }
  update();
  button.onclick = () => {
    if (favorites.has(key)) favorites.delete(key);
    else favorites.add(key);
    saveList('favorites', favorites);
    update();
  };
}
function menuHome() {
  home.hidden = false;
  page.hidden = true;
  drawer.setAttribute('aria-labelledby','drawerTitle');
}
el('menuOpen').onclick = () => {
  menuHome();
  drawer.showModal();
  drawer.getBoundingClientRect();
  drawer.classList.add('active');
  el('menuOpen').setAttribute('aria-expanded','true');
};
function closeMenu(after) {
  if (closing) return;
  closing = true;
  drawer.classList.remove('active');
  setTimeout(() => {
    drawer.close();
    closing = false;
    el('menuOpen').setAttribute('aria-expanded','false');
    el('menuOpen').focus({preventScroll:true});
    if (after) after();
  },matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 250);
}
el('menuClose').onclick = () => closeMenu();
drawer.oncancel = event => { event.preventDefault(); closeMenu(); };
drawer.onclick = event => {
  if (event.target === drawer && event.clientX >= drawer.getBoundingClientRect().right) closeMenu();
};
let touch;
drawer.addEventListener('touchstart', event => {
  touch = event.touches.length === 1 ? event.touches[0] : null;
}, {passive:true});
drawer.addEventListener('touchcancel', () => { touch = null; });
drawer.addEventListener('touchend', event => {
  const end = event.changedTouches[0];
  if (touch && touch.identifier === end.identifier) {
    const dx = touch.clientX - end.clientX;
    if (dx > 55 && dx > Math.abs(touch.clientY-end.clientY)*1.5) closeMenu();
  }
  touch = null;
}, {passive:true});

function eventList(container, items, emptyText) {
  container.replaceChildren();
  if (!items.length) {
    const message = document.createElement('p');
    message.textContent = emptyText;
    container.append(message);
  }
  for (const event of items) {
    const button = document.createElement('button');
    button.className = 'result';
    const date = document.createElement('small');
    date.textContent = event.label;
    button.append(date,document.createTextNode(event.titre));
    button.onclick = () => closeMenu(() => show(event));
    container.append(button);
  }
}
function categoryList() {
  for (const [name,color] of [...categories].sort(([a],[b]) => a.localeCompare(b,'fr'))) {
    const label = document.createElement('label');
    const dot = document.createElement('i');
    dot.style.backgroundColor = color;
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = !disabledCategories.has(name);
    input.onchange = () => {
      if (input.checked) disabledCategories.delete(name);
      else disabledCategories.add(name);
      saveList('categories',disabledCategories);
      for (const point of rail.querySelectorAll('.event')) {
        point.classList.toggle('filtered',disabledCategories.has(point.dataset.category));
      }
      centuries.dispatchEvent(new Event('filterchange'));
    };
    label.append(dot,document.createTextNode(name),input);
    body.append(label);
  }
}
const normalize = value => value.toLocaleLowerCase('fr').normalize('NFD').replace(/\p{M}/gu,'');
function searchPage() {
  const input = document.createElement('input');
  input.type = 'search';
  input.placeholder = 'Titre, lieu ou année';
  input.setAttribute('aria-label',input.placeholder);
  const results = document.createElement('div');
  body.append(input,results);
  const refresh = () => {
    const query = normalize(input.value.trim());
    const matches = catalog.filter(e => normalize([e.titre,e.label,e.lieu].join(' ')).includes(query));
    eventList(results,matches,'Aucun événement trouvé.');
  };
  input.oninput = refresh;
  refresh();
  input.focus();
}
let lastItem;
home.onclick = event => {
  const button = event.target.closest('[data-page]');
  if (!button || closing) return;
  const key = button.dataset.page;
  if (key === 'frise') return closeMenu();
  lastItem = button;
  home.hidden = true;
  page.hidden = false;
  el('pageTitle').textContent = button.textContent;
  drawer.setAttribute('aria-labelledby','pageTitle');
  body.replaceChildren();
  drawer.scrollTop = 0;
  el('pageTitle').focus();
  if (key === 'categories') categoryList();
  else if (key === 'search') searchPage();
  else {
    const ids = key === 'favorites' ? [...favorites] : visits;
    const items = ids.map(id => catalog.find(e => eventKey(e) === id)).filter(Boolean);
    eventList(body,items,key === 'favorites' ? 'Ajoutez un favori depuis la fiche d’un événement.' : 'Les fiches consultées apparaîtront ici.');
  }
};
el('menuBack').onclick = () => { menuHome(); lastItem.focus(); };