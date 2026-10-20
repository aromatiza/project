(()=>{
'use strict';
const icons={
 calorie:'<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>',
 mood:'<circle cx="12" cy="12" r="9"/><path d="M8 14c2 2.7 6 2.7 8 0"/><path d="M8 9h.01M16 9h.01"/>',
 weight:'<rect x="4" y="5" width="16" height="15" rx="3"/><path d="M9 10h6m-3-2v4"/>',
 sleep:'<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5Z"/>',
 search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
 recent:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
 food:'<path d="M7 3v8m-3-8v8m6-8v8M7 11v10M17 3c-4 5-3 9 0 10v8"/>',
 chef:'<path d="M5 13a4 4 0 0 1 0-8 5 5 0 0 1 9-1 4 4 0 1 1 5 7v10H5Z"/><path d="M5 17h14"/>',
 meals:'<path d="M3 13h18M5 13a7 7 0 0 1 14 0M12 6V4"/><path d="M4 17h16"/>',
 chart:'<path d="M4 20V12m5 8V6m5 14v-9m5 9V4"/>',
 star:'<path d="m12 2 3 6 7 .9-5 4.9 1.2 7L12 17.5l-6.2 3.3L7 13.8 2 8.9 9 8Z"/>',
 trend:'<path d="M3 17 9 11l4 4 8-9"/><path d="M16 6h5v5"/>',
 calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 10h18"/>',
 scan:'<path d="M4 9V5a1 1 0 0 1 1-1h4m6 0h4a1 1 0 0 1 1 1v4m0 6v4a1 1 0 0 1-1 1h-4m-6 0H5a1 1 0 0 1-1-1v-4M4 12h16"/>',
 person:'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
 sparkle:'<path d="m12 2 2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5Z"/>',
 help:'<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.8.4-1 1-1 1.7"/><path d="M12 17h.01"/>',
 close:'<path d="M5 5l14 14M19 5 5 19"/>',
 ai:'<rect x="4" y="4" width="16" height="16" rx="5"/><path d="M9 9v6m6-6v6M9 12h6"/><path d="M12 2v2m0 16v2m10-10h-2M4 12H2"/>'
};
const svg=(name)=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name]||icons.star}</svg>`;
function init(){
 const health=document.getElementById('page-health'),launch=document.getElementById('health-launchers');
 if(!health||!launch)return;
 const all=[...health.querySelectorAll(':scope > .block')];
 const config={
  'Calories du jour':['calorie','Consommation et objectif'],
  'Humeur et énergie':['mood','Ton ressenti au quotidien'],
  'Poids':['weight','Suivi et évolution'],
  'Sommeil et sport':['sleep','Ton équilibre quotidien'],
  'Ajouter un aliment':['search','Recherche, code-barres et photo'],
  'Fréquents':['recent','Tes aliments habituels'],
  'Mon aliment (valeurs personnalisées)':['food','Créer une fiche alimentaire'],
  'Recettes':['chef','Créer et gérer tes recettes'],
  'Repas':['meals','Petit-déjeuner, déjeuner, dîner'],
  'Analyse':['chart','Synthèse personnalisée'],
  'Score du jour':['star','Bilan du jour'],
  'Évolution sur 30 jours':['trend','Visualiser ta progression'],
  'Statistiques avancées':['calendar','Bilan hebdomadaire']
 };
 const essentialOrder=['Calories du jour','Score du jour','Sommeil et sport','Ajouter un aliment','Analyse'];
 const hiddenTitles=new Set(['Humeur et énergie']);
 const blockMap=new Map();
 const blocks=all.filter(b=>!b.querySelector('.hero')&&!b.classList.contains('health-intro'));
 blocks.forEach(block=>{
   const title=block.querySelector('.section-title')?.textContent?.trim()||'Statistiques';
   block.dataset.healthTitle=title;
   blockMap.set(title,block);
 });
 const essentialWrap=document.createElement('div');
 essentialWrap.className='health-essential-grid';
 launch.before(essentialWrap);
 
 const dialog=document.createElement('dialog'); dialog.className='company-dialog'; dialog.setAttribute('aria-label','Détail de santé');
 dialog.innerHTML=`<div class="company-dialog-frame"><div class="company-dialog-head"><div><div class="company-eyebrow">SPACE DAILY / SANTÉ</div><h2 id="company-dialog-title"></h2></div><button type="button" class="company-dialog-close" aria-label="Fermer">${svg('close')}</button></div><div class="company-dialog-body" id="company-dialog-body"></div></div>`;
 document.body.appendChild(dialog);
 const content=dialog.querySelector('#company-dialog-body'), heading=dialog.querySelector('#company-dialog-title');
 let active=null,marker=null,trigger=null;
 const close=()=>{if(dialog.open)dialog.close();};
 function reset(){ if(active&&marker){ marker.replaceWith(active); active.classList.remove('health-modal-current'); active.hidden=true; } active=null;marker=null; content.replaceChildren(); if(trigger){trigger.focus();trigger=null;} }
 dialog.addEventListener('close',reset);
 dialog.querySelector('.company-dialog-close').addEventListener('click',close);
 dialog.addEventListener('click',e=>{if(e.target===dialog)close();});
 
 essentialOrder.forEach(title=>{
   const block=blockMap.get(title);
   if(!block) return;
   block.hidden=false;
   block.classList.add('health-essential-block');
   essentialWrap.appendChild(block);
 });
 
 blocks.forEach(block=>{
   const title=block.dataset.healthTitle||'Statistiques';
   if(essentialOrder.includes(title)) return;
   if(hiddenTitles.has(title)) { block.hidden=true; block.classList.add('health-hidden-module'); return; }
   const meta=config[title]||['chart','Voir les détails'];
   block.classList.add('health-modal-section'); block.hidden=true;
   const btn=document.createElement('button');btn.type='button';btn.className='health-launcher';
   btn.innerHTML=`<span class="health-launcher-icon">${svg(meta[0])}</span><span class="health-launcher-copy"><strong>${title}</strong><small>${meta[1]}</small></span><span class="health-launcher-chevron">›</span>`;
   btn.setAttribute('aria-label',`Ouvrir ${title}`);
   btn.addEventListener('click',()=>{
     if(active)close();
     trigger=btn;marker=document.createComment('return health module');
     block.before(marker);active=block;heading.textContent=title;
     content.appendChild(block);block.hidden=false;block.classList.add('health-modal-current');
     if(typeof dialog.showModal==='function')dialog.showModal();else dialog.setAttribute('open','');
   });
   launch.appendChild(btn);
 });
 if(!launch.children.length){ launch.hidden=true; }
 // Synchronise the visual language of the primary navigation icons.
 const navIcons=['calorie','scan','search','ai','help'];
 document.querySelectorAll('.sidebar .tab').forEach((b,i)=>{const previous=b.querySelector('svg');if(previous&&navIcons[i])previous.outerHTML=svg(navIcons[i]);});
 const intro=document.querySelector('.health-guide');if(intro){intro.querySelector('span')?.setAttribute('aria-live','polite');}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();