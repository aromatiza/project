/* Space Daily Explorer — Phase 1, no new framework or credentials. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const STORE = 'space-daily-explorer-v1';
  const off = 'https://world.openfoodfacts.org';
  const empty = () => ({ recent: [], favorites: [] });
  let data;
  try { data = { ...empty(), ...JSON.parse(localStorage.getItem(STORE) || '{}') }; } catch { data = empty(); }
  if (!Array.isArray(data.recent)) data.recent = [];
  if (!Array.isArray(data.favorites)) data.favorites = [];
  const persist = () => { try { localStorage.setItem(STORE, JSON.stringify(data)); } catch {} };
  const safe = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const normal = p => ({
    code: String(p.code || p._id || ''), name: String(p.product_name || p.product_name_fr || 'Produit sans nom'),
    brand: String(p.brands || ''), image: String(p.image_front_small_url || p.image_small_url || ''),
    ingredients: String(p.ingredients_text_fr || p.ingredients_text || ''),
    nutri: p.nutriments || {}, score: String(p.nutriscore_grade || '').toUpperCase(),
    source: 'Open Food Facts'
  });
  const val = (n, k, unit = 'g') => n[k] == null || n[k] === '' || !Number.isFinite(Number(n[k])) ? 'Non renseigné' : `${Number(n[k]).toLocaleString('fr-FR', {maximumFractionDigits:1})} ${unit}`;
  const renderProduct = (p, saved = false) => {
    const code = safe(p.code), name = safe(p.name), brand = safe(p.brand);
    const img = /^https:\/\//.test(p.image) ? `<img src="${safe(p.image)}" alt="Emballage de ${name}" loading="lazy" referrerpolicy="no-referrer">` : '';
    return `<div class="explore-product"><div>${img}</div><div class="explore-product-main"><strong>${name}</strong><div class="muted">${brand}${brand && code ? ' · ' : ''}${code ? 'Code : '+code : ''}</div>
      <div class="explore-facts"><span>Énergie : ${val(p.nutri,'energy-kcal_100g','kcal/100g')}</span><span>Sucre : ${val(p.nutri,'sugars_100g','g/100g')}</span><span>Protéines : ${val(p.nutri,'proteins_100g','g/100g')}</span></div>
      ${p.ingredients ? `<details style="margin-top:9px"><summary>Ingrédients disponibles</summary><p class="muted">${safe(p.ingredients.slice(0,1400))}</p></details>` : '<div class="muted">Ingrédients : non renseignés</div>'}
      <div class="muted" style="margin-top:6px">Source : Open Food Facts · Données participatives, vérifie l’étiquette.</div></div>
      <div class="explore-product-actions">${code ? `<button type="button" data-explore-fav="${code}">${data.favorites.some(f=>f.code===p.code)?'★ Retirer':'☆ Favori'}</button>` : ''}${!saved && code ? `<button type="button" data-explore-detail="${code}">Fiche source ↗</button>` : ''}</div></div>`;
  };
  const renderSaved = () => {
    $('explore-recent').innerHTML = data.recent.length ? data.recent.map(p => renderProduct(p,true)).join('') : '<p class="muted">Aucun produit consulté pour le moment.</p>';
    $('explore-favorites').innerHTML = data.favorites.length ? data.favorites.map(p=>renderProduct(p,true)).join('') : '<p class="muted">Aucun favori pour le moment.</p>';
  };
  let results = [];
  const remember = p => { if(!p.code)return; data.recent=[p,...data.recent.filter(x=>x.code!==p.code)].slice(0,12);persist();renderSaved(); };
  const search = async q => {
    const box=$('explore-results-card'), list=$('explore-results'), status=$('explore-status');
    box.hidden=false;list.innerHTML='';status.textContent='Recherche en cours…';
    $('explore-form').querySelector('button').disabled=true;
    try {
      let arr;
      if (/^\d{8,14}$/.test(q)) {
        const r=await fetch(`${off}/api/v2/product/${encodeURIComponent(q)}.json?fields=code,product_name,product_name_fr,brands,image_front_small_url,ingredients_text_fr,ingredients_text,nutriments,nutriscore_grade`,{signal:AbortSignal.timeout(14000)});
        if (!r.ok) throw Error(`HTTP ${r.status}`);
        const j=await r.json();arr=j.status===1 && j.product?[j.product]:[];
      } else {
        const params=new URLSearchParams({search_terms:q,search_simple:'1',action:'process',json:'1',page_size:'8',fields:'code,product_name,product_name_fr,brands,image_front_small_url,ingredients_text_fr,ingredients_text,nutriments,nutriscore_grade'});
        const r=await fetch(`${off}/cgi/search.pl?${params}`,{signal:AbortSignal.timeout(14000)});
        if(!r.ok) throw Error(`HTTP ${r.status}`);
        arr=(await r.json()).products || [];
      }
      results=arr.map(normal);
      status.textContent=results.length?`${results.length} résultat(s). Les champs manquants ne sont pas remplacés par zéro.`:'Aucun produit trouvé. Essaie un autre nom ou code-barres.';
      list.innerHTML=results.map(renderProduct).join('');
      if(results.length) remember(results[0]);
    } catch(e) { status.textContent='Recherche indisponible (connexion ou service Open Food Facts). Réessaie plus tard.'; }
    finally { $('explore-form').querySelector('button').disabled=false; }
  };
  $('explore-form').addEventListener('submit',e=>{e.preventDefault();const q=$('explore-query').value.trim();if(q)search(q);});
  const health = () => showTab('health');
  $('explore-sante').addEventListener('click',health);
  $('explore-scan').addEventListener('click',()=>{health();$('scan-btn').click();});
  $('explore-focus').addEventListener('click',()=>$('explore-query').focus());
  document.querySelectorAll('[data-explore-go]').forEach(b=>b.addEventListener('click',()=>{if(b.dataset.exploreGo==='ai')showTab('ai');else{health();$('scan-btn').click();}}));
  $('explore-clear-recent').addEventListener('click',()=>{data.recent=[];persist();renderSaved();});
  $('page-journal').addEventListener('click', e=>{
    const f=e.target.closest('[data-explore-fav]');
    if(f){const code=f.dataset.exploreFav;const ix=data.favorites.findIndex(x=>x.code===code);
      if(ix>=0)data.favorites.splice(ix,1);else{const found=[...results,...data.recent].find(x=>x.code===code);if(found)data.favorites.unshift(found);}
      persist();renderSaved();if(results.length)$('explore-results').innerHTML=results.map(renderProduct).join('');return;
    }
    const detail=e.target.closest('[data-explore-detail]');
    if(detail && /^\d{8,14}$/.test(detail.dataset.exploreDetail)) window.open(`${off}/product/${encodeURIComponent(detail.dataset.exploreDetail)}`, '_blank','noopener,noreferrer');
  });
  renderSaved();
})();
