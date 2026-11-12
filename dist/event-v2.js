/* TEMPUS V2 — Event presentation. Isolated from the V0.1 timeline. */
(() => {
  const $ = id => document.getElementById(id);
  const preview = document.createElement('section');
  preview.id = 'v2-preview';
  preview.className = 'v2-preview';
  preview.hidden = true;
  preview.setAttribute('aria-label','Aperçu de l’événement');
  const detail = document.createElement('section');
  detail.id = 'v2-detail';
  detail.className = 'v2-detail';
  detail.hidden = true;
  detail.setAttribute('role','dialog');
  detail.setAttribute('aria-modal','true');
  detail.setAttribute('aria-label','Fiche historique');
  document.body.append(preview, detail);
  let current = null;
  let returnFocus = null;
  let lastTab = 0;
  const text = (tag, cls, value) => {const e=document.createElement(tag);if(cls)e.className=cls;e.textContent=value||'';return e;};
  const btn = (label, cls, fn) => {const e=text('button',cls,label);e.type='button';e.onclick=fn;return e;};
  const available = v => typeof v === 'string' ? v.trim().length>0 : Array.isArray(v) ? v.length>0 : Boolean(v);
  const pick = (event, ...keys) => {for(const k of keys){const v=event[k];if(available(v))return v;}return null;};
  const items = value => Array.isArray(value) ? value : (value && typeof value==='object' ? [value] : []);
  function image(url, cls, alt) {
    if (!url || !/^https:\/\//i.test(url)) return null;
    const e=document.createElement('img');e.className=cls;e.src=url;e.alt=alt||'';e.loading='lazy';e.decoding='async';
    e.onerror=()=>e.remove();return e;
  }
  function closePreview(){preview.hidden=true;preview.replaceChildren();}
  function closeDetail(){
    detail.hidden=true;detail.replaceChildren();document.body.classList.remove('v2-detail-open');
    if(returnFocus?.isConnected)returnFocus.focus({preventScroll:true});
    else $('rail')?.focus?.({preventScroll:true});
  }
  function openPreview(event){
    if(!event)return;
    current=event;returnFocus=document.activeElement;
    closeDetail();preview.replaceChildren();
    const top=text('div','v2-preview-top','');
    top.append(text('span','v2-eyebrow','TEMPUS · ÉVÉNEMENT'),btn('×','v2-close',closePreview));
    preview.append(top);
    const hero=image(pick(event,'image_url','imageUrl'),'v2-preview-image',event.titre);
    if(hero)preview.append(hero);
    preview.append(text('time','v2-date',event.label||event.date_debut||''),text('h2','v2-preview-title',event.titre||'Événement historique'));
    const desc=pick(event,'resume','summary','description');
    if(desc)preview.append(text('p','v2-preview-desc',desc));
    const footer=text('div','v2-preview-footer','');
    footer.append(text('span','v2-category',event.categorie||''),btn('Découvrir','v2-primary',()=>openDetail(event)));
    preview.append(footer);
    preview.hidden=false;
  }
  const tabs=[
    {name:'Contenu',parts:[['Contexte','contexte','context'],['Causes','causes'],['Déroulement','deroulement','narrative'],['Conséquences','consequences'],['Importance historique','importance_historique','significance'],['Débats historiques','debats'],['Introduction','introduction']]},
    {name:'Acteurs',key:['acteurs','actors','personnes','people']},
    {name:'Lieux',key:['lieux','places','locations']},
    {name:'Archives',key:['archives','media','documents']},
    {name:'Sources',key:['sources','references']}
  ];
  function section(title,value){
    const block=text('section','v2-content-block','');
    block.append(text('h3','',title));
    if(typeof value==='string')block.append(text('p','',value));
    else if(Array.isArray(value)){
      for(const entry of value){
        if(typeof entry==='string')block.append(text('p','',entry));
        else if(entry&&typeof entry==='object'){
          const name=pick(entry,'nom','name','titre','title','legende','caption');
          if(name)block.append(text('h4','',name));
          const photo=image(pick(entry,'image_url','url_image'),'v2-archive-image',pick(entry,'alt_text','image_alt')||name);
          if(photo)block.append(photo);
          const body=pick(entry,'description','biographie','bio','details','texte','content','caption');
          if(body)block.append(text('p','',body));
          const url=pick(entry,'source_url','url','lien');
          if(url&&/^https:\/\//i.test(url)){const a=text('a','v2-link','Consulter la référence ↗');a.href=url;a.target='_blank';a.rel='noopener noreferrer';block.append(a);}
        }
      }
    }
    return block;
  }
  const tabIcons={Contenu:'▤',Acteurs:'♙',Lieux:'♧',Archives:'▧',Sources:'☷'};
  function addDetailCards(panel){
    const blocks=[...panel.children].filter(node=>node.classList?.contains('v2-content-block'));
    if(!blocks.length)return;
    panel.classList.add('v2-card-list');
    for(const block of blocks){
      const heading=block.querySelector('h3');
      const title=heading?.textContent||'';
      if(heading)heading.remove();
      const body=text('div','v2-card-copy','');
      const titleEl=text('h3','v2-card-title',title);
      body.append(titleEl);
      while(block.firstChild)body.append(block.firstChild);
      const card=text('article','v2-info-card','');
      const thumbnail=block.querySelector('.v2-archive-image');
      if(thumbnail){thumbnail.classList.add('v2-card-thumbnail');card.append(thumbnail);}
      card.append(body);
      block.replaceWith(card);
    }
  }
  function tabContents(event){
    const contents=[];
    const content=text('div','v2-tab-panel','');
    for(const [heading,...keys] of tabs[0].parts){const v=pick(event,...keys);if(available(v))content.append(section(heading,v));}
    const description=pick(event,'description');
    if(description&&!content.childElementCount)content.append(section('L’événement',description));
    if(available(event.faits_cles))content.append(section('Faits clés',event.faits_cles));
    if(available(event.anecdotes))content.append(section('Anecdotes',event.anecdotes));
    for(const extra of (event.sections||[])){if(extra?.description)content.append(section(extra.titre||'Complément historique',extra.description));}
    if(content.childElementCount)contents.push({name:'Contenu',node:content});
    for(const tab of tabs.slice(1)){
      const v=pick(event,...tab.key);
      const panel=text('div','v2-tab-panel','');
      if(available(v))panel.append(section(tab.name,typeof v==='string'?v:items(v)));
      if(tab.name==='Lieux'&&!panel.childElementCount&&available(event.lieu))panel.append(section('Localisation',event.lieu));
      if(tab.name==='Sources'){
        const source=pick(event,'source_url','sourceUrl');
        if(source&&/^https:\/\//i.test(source)){
          const a=text('a','v2-link','Consulter la source ↗');a.href=source;a.target='_blank';a.rel='noopener noreferrer';panel.append(a);
        }
      }
      if(panel.childElementCount)contents.push({name:tab.name,node:panel});
    }
    return contents;
  }
  function openDetail(event){
    current=event;closePreview();detail.replaceChildren();
    const header=text('header','v2-detail-header','');
    header.append(btn('← Retour','v2-back',closeDetail),text('span','v2-brand','TEMPUS'),btn('×','v2-close',closeDetail));
    detail.append(header);
    const hero=text('div','v2-detail-hero','');
    const visual=image(pick(event,'image_url','imageUrl'),'v2-hero-image',event.titre);
    if(visual){hero.classList.add('v2-has-image');hero.append(visual);if(event.image_credit){const credit=text('p','v2-image-credit','Illustration : '+event.image_credit);hero.append(credit);}}
    const intro=text('div','v2-intro','');
    intro.append(text('time','v2-date',event.label||event.date_debut||''),text('h1','v2-title',event.titre||'Événement historique'));
    if(event.categorie)intro.append(text('span','v2-category',event.categorie));
    const summary=pick(event,'resume','summary','description');
    if(summary)intro.append(text('p','v2-summary',summary));
    const facts=text('div','v2-facts','');
    if(event.lieu)facts.append(text('span','', '⌖ '+event.lieu));
    if(event.importance)facts.append(text('span','', '◆ '+event.importance));
    if(facts.childElementCount)intro.append(facts);
    hero.append(intro);detail.append(hero);
    const counts=[['♙','Personnages',event.acteurs?.length],['♧','Lieux',event.lieux?.length],['▧','Illustrations',event.archives?.length],['▤','Sources',event.sources?.length]].filter(entry=>Number.isFinite(entry[2])&&entry[2]>0);
    if(counts.length){
      const stats=text('div','v2-stat-grid','');
      for(const [symbol,label,count] of counts){
        const item=text('div','v2-stat','');
        item.append(text('span','v2-stat-icon',symbol),text('strong','v2-stat-number',String(count)),text('span','v2-stat-label',label));
        stats.append(item);
      }
      detail.append(stats);
    }
    const overview=text('section','v2-overview','');
    overview.append(text('h2','v2-overview-title','☷  En bref'));
    const overviewItems=[['Date',event.label||event.date_debut],['Lieu principal',event.lieu],['Catégorie',event.categorie],['Importance',event.importance]];
    for(const [label,value] of overviewItems){if(value!==null&&value!==undefined&&value!==''){const item=text('p','v2-overview-row','');item.append(text('strong','',label+' : '),text('span','',String(value)));overview.append(item);}}
    if(overview.children.length>1)detail.append(overview);
    const panels=tabContents(event);
    if(panels.length){
      const nav=text('nav','v2-tabs','');nav.setAttribute('aria-label','Rubriques de la fiche');
      const content=text('div','v2-panels','');
      panels.forEach((entry,i)=>{
        const tab=btn('', 'v2-tab',()=>activate(i));
        tab.append(text('span','v2-tab-icon',tabIcons[entry.name]||'•'),text('span','v2-tab-label',entry.name));
        addDetailCards(entry.node);
        tab.setAttribute('role','tab');tab.id='v2-tab-'+i;tab.setAttribute('aria-controls','v2-panel-'+i);
        entry.node.id='v2-panel-'+i;entry.node.setAttribute('role','tabpanel');entry.node.setAttribute('aria-labelledby',tab.id);
        nav.append(tab);content.append(entry.node);
      });
      function activate(index){lastTab=index;[...nav.children].forEach((node,i)=>{node.setAttribute('aria-selected',String(i===index));node.tabIndex=i===index?0:-1;});[...content.children].forEach((node,i)=>node.hidden=i!==index);}
      nav.onkeydown=e=>{if(!['ArrowLeft','ArrowRight'].includes(e.key))return;e.preventDefault();const next=(lastTab+(e.key==='ArrowRight'?1:-1)+panels.length)%panels.length;activate(next);nav.children[next].focus();};
      detail.append(nav,content);activate(0);
    }
    detail.hidden=false;document.body.classList.add('v2-detail-open');detail.scrollTop=0;
    header.querySelector('button').focus({preventScroll:true});
  }
  document.addEventListener('keydown',e=>{
    if(e.key!=='Escape')return;
    if(!detail.hidden){e.preventDefault();closeDetail();}
    else if(!preview.hidden){e.preventDefault();closePreview();}
  });
  window.tempusV2={openPreview,openDetail,closePreview,closeDetail};
})();
