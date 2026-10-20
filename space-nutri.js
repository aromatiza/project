
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  if (!$('page-nutri')) return;

  const STORE = 'space-daily-nutri-v1';
  const OFF = 'https://world.openfoodfacts.org';
  const fields = 'code,product_name,product_name_fr,brands,image_front_url,image_front_small_url,image_url,image_small_url,ingredients_text,ingredients_text_fr,nutriments,nutriscore_grade,nutrition_grades,additives_tags,additives_n,categories_tags,nova_group';
  const empty = () => ({ recent: [], favorites: [], compareA: '', compareB: '' });
  let state;
  try { state = { ...empty(), ...JSON.parse(localStorage.getItem(STORE) || '{}') }; } catch { state = empty(); }
  // Legacy storage may contain null or malformed products. Sanitize before every render.
  const valid = p => p && typeof p === 'object' && typeof p.code === 'string' && /^\d{8,14}$/.test(p.code);
  state.recent = Array.isArray(state.recent) ? state.recent.filter(valid) : [];
  state.favorites = Array.isArray(state.favorites) ? state.favorites.filter(valid) : [];
  state.compareA = typeof state.compareA === 'string' ? state.compareA : '';
  state.compareB = typeof state.compareB === 'string' ? state.compareB : '';
  const save = () => { try { localStorage.setItem(STORE, JSON.stringify(state)); } catch {} };
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const num = v => v === null || v === undefined || v === '' || typeof v === 'boolean' ? null : (Number.isFinite(Number(v)) ? Number(v) : null);
  const fmt = (v, d=1) => v == null ? '—' : Number(v).toLocaleString('fr-FR',{maximumFractionDigits:d});
  const value = (v, unit='g') => v == null ? '—' : `${fmt(v)} ${unit}`;
  const additiveLabel = raw => String(raw || '').replace(/^en:/i,'').replace(/-/g,' ').replace(/\b\w/g,m=>m.toUpperCase());
  const status = msg => { const el = $('nutri-status'); if (el) el.textContent = msg || ''; };
  const uniqByCode = arr => (Array.isArray(arr) ? arr : []).filter((p,i,a) => valid(p) && a.findIndex(x => valid(x) && x.code === p.code) === i);

  function pickDisplayName(p) {
    const names = [p.product_name_fr, p.product_name, p.generic_name_fr, p.generic_name]
      .map(v => String(v || '').trim())
      .filter(Boolean);
    const noisy = /^(test|essai|sample|produit sans nom)$/i;
    const candidate = names.find(v => !noisy.test(v)) || names[0] || '';
    const brand = String(p.brands || '').split(',')[0].trim();
    if (!candidate) return brand || 'Produit sans nom';
    if (noisy.test(candidate) && brand) return brand;
    return candidate;
  }

  function normalize(p) {
    if (!p || typeof p !== 'object') return null;
    return {
      code: String(p.code || p._id || ''),
      name: pickDisplayName(p),
      brand: String(p.brands || 'Marque inconnue'),
      image: String(p.image_front_url || p.image_front_small_url || p.image_url || p.image_small_url || ''),
      ingredients: String(p.ingredients_text_fr || p.ingredients_text || ''),
      nutri: p.nutriments || {},
      grade: String(p.nutriscore_grade || p.nutrition_grades || '').toUpperCase(),
      additives: Array.isArray(p.additives_tags) ? p.additives_tags.map(additiveLabel) : [],
      additivesN: num(p.additives_n),
      nova: num(p.nova_group),
      source: 'Open Food Facts'
    };
  }

  // Score Space Daily indicatif. Ce N'EST PAS le score officiel Yuka ou Nutri-Score.
  // Ne jamais attribuer de note sans un socle minimal de données pertinentes.
  function scoreProduct(p) {
    const n = p.nutri || {};
    const get = key => num(n[key]);
    const sugar = get('sugars_100g');
    const salt = get('salt_100g') ?? (get('sodium_100g') == null ? null : get('sodium_100g')*2.5);
    const sat = get('saturated-fat_100g');
    const energy = get('energy-kcal_100g') ?? (get('energy-kj_100g') == null ? null : get('energy-kj_100g') / 4.184);
    const fiber = get('fiber_100g');
    const protein = get('proteins_100g');
    const critical = [sugar, salt, sat, energy].filter(v=>v!==null).length;
    const grade = /^[A-E]$/.test(p.grade) ? p.grade : '';
    const reasons = {good:[],bad:[],missing:[]};
    if(sugar == null) reasons.missing.push('sucres');
    if(salt == null) reasons.missing.push('sel');
    if(sat == null) reasons.missing.push('graisses saturées');
    if(energy == null) reasons.missing.push('énergie');
    if(p.additivesN == null && !p.additives?.length) reasons.missing.push('additifs (information non confirmée)');
    const additivesN = p.additivesN ?? (p.additives?.length || null);
    // Base indicative dérivée du Nutri-Score déjà calculé par OFF lorsque connu.
    // Sans grade, utiliser une heuristique prudente fondée sur les nutriments disponibles.
    if(!grade && critical < 3) return {score:null,verdict:'Données insuffisantes',tone:'#64748b',reasons,confidence:'insuffisante'};
    let score = grade ? ({A:92,B:76,C:58,D:36,E:16}[grade]) : 75;
    if(!grade){
      if(sugar !== null) score -= sugar>22.5?22:sugar>12.5?14:sugar>5?6:0;
      if(salt !== null) score -= salt>1.5?20:salt>0.8?11:salt>0.3?4:0;
      if(sat !== null) score -= sat>5?16:sat>2?8:0;
      if(energy !== null) score -= energy>500?11:energy>350?5:0;
      if(fiber !== null) score += fiber>=6?8:fiber>=3?4:0;
      if(protein !== null) score += protein>=12?5:protein>=6?2:0;
    }
    if(sugar !== null) (sugar>12.5?reasons.bad: sugar<=5?reasons.good:[]).push(sugar>12.5?'Riche en sucres':'Peu de sucres');
    if(salt !== null) (salt>1.5?reasons.bad:salt<=0.3?reasons.good:[]).push(salt>1.5?'Riche en sel':'Peu de sel');
    if(sat !== null && sat>5) reasons.bad.push('Riche en graisses saturées');
    if(fiber !== null && fiber>=6) reasons.good.push('Riche en fibres');
    if(protein !== null && protein>=12) reasons.good.push('Source importante de protéines');
    // Additives are listed as factual information, NEVER a toxicology judgement by count alone.
    if(additivesN !== null && additivesN>0) reasons.bad.push(`${additivesN} additif(s) déclaré(s) : risque non déterminé`);
    if(additivesN === 0) reasons.good.push('Aucun additif déclaré dans la fiche');
    score=Math.max(0,Math.min(100,Math.round(score)));
    let verdict='À limiter',tone='#ef4444';
    if(score>=80){verdict='Excellent';tone='#16a34a';}
    else if(score>=60){verdict='Bon';tone='#65a30d';}
    else if(score>=40){verdict='Moyen';tone='#f59e0b';}
    return {score,verdict,tone,reasons,confidence:grade?'Nutri-Score disponible':critical===4?'indicatif':'partiel'};
  }
  const displayScore = s => s.score == null ? '—' : `${s.score}<small>/100</small>`;
  const additivesCount = p => valid(p) ? (p.additivesN ?? (Array.isArray(p.additives) ? p.additives.length : null)) : null;
  const additivesText = p => additivesCount(p) == null ? 'Non renseignés' : `${additivesCount(p)} déclaré(s)`;
  const additivesTone = p => { const n = additivesCount(p); if (n == null) return 'neutral'; if (n >= 6) return 'danger'; if (n >= 3) return 'warn'; if (n === 0) return 'safe'; return 'mild'; };
  const additivesFact = p => { const n = additivesCount(p); const tone = additivesTone(p); const label = n == null ? 'Additifs ?' : n === 0 ? 'Sans additif déclaré' : `${n} additif(s)`; return `<span class="nutri-fact nutri-additive-fact ${tone}">${esc(label)}</span>`; };

  let results = [];
  let featured = null;

  function remember(p) {
    if (!p || !p.code) return;
    state.recent = [p, ...state.recent.filter(x => valid(x) && x.code !== p.code)].slice(0, 14);
    save();
    renderSaved();
    renderComparePickers();
  }

  function toggleFav(code) {
    const idx = state.favorites.findIndex(x => valid(x) && x.code === code);
    if (idx >= 0) state.favorites.splice(idx, 1);
    else {
      const p = uniqByCode([featured, ...results, ...state.recent]).find(x => x && x.code === code);
      if (p) state.favorites.unshift(p);
    }
    state.favorites = uniqByCode(state.favorites).slice(0, 20);
    save();
    renderSaved();
    renderResults();
    renderFeature(featured);
    renderComparePickers();
  }

  function productByCode(code) {
    return uniqByCode([featured, ...results, ...state.recent, ...state.favorites]).find(x => x && x.code === code);
  }

  function resultCard(p) {
    const s = scoreProduct(p);
    const fav = state.favorites.some(x => valid(x) && x.code === p.code);
    const img = /^https:\/\//.test(p.image) ? `<img src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy" referrerpolicy="no-referrer">` : '<div style="width:96px;height:96px;border-radius:18px;background:var(--field);border:1px solid var(--sep)"></div>';
    const tone = additivesTone(p);
    const adds = (p.additives.length ? p.additives.slice(0,4) : []).map(a => `<span class="nutri-pill ${tone}">${esc(a)}</span>`).join('');
    return `<article class="nutri-result-card"><div>${img}</div><div class="nutri-result-main"><h4>${esc(p.name)}</h4><div class="muted">${esc(p.brand)}${p.code ? ' · '+esc(p.code) : ''}</div><div class="nutri-score-row"><div class="nutri-score-badge" style="--tone:${s.tone}">${displayScore(s)}</div><div class="nutri-verdict">${s.verdict}</div>${p.grade ? `<div class="nutri-chip neutral">Nutri-Score ${esc(p.grade)}</div>` : ''}</div><div class="nutri-facts"><span class="nutri-fact">Sucre ${value(num(p.nutri.sugars_100g),'g')}</span><span class="nutri-fact">Sel ${value(num(p.nutri.salt_100g) ?? (num(p.nutri.sodium_100g)!=null?num(p.nutri.sodium_100g)*2.5:null),'g')}</span><span class="nutri-fact">Prot ${value(num(p.nutri.proteins_100g),'g')}</span>${additivesFact(p)}</div>${adds ? `<div class="nutri-additives ${tone}">${adds}</div>` : ''}<div class="nutri-actions"><button class="nutri-action" data-nutri-view="${esc(p.code)}">Détails</button><button class="nutri-action" data-nutri-fav="${esc(p.code)}">${fav ? 'Retirer' : 'Favori'}</button><button class="nutri-action" data-nutri-a="${esc(p.code)}">Choisir A</button><button class="nutri-action" data-nutri-b="${esc(p.code)}">Choisir B</button></div></div></article>`;
  }

  function renderResults() {
    const card = $('nutri-results-card');
    const box = $('nutri-results');
    if (!box || !card) return;
    card.hidden = !results.length;
    box.innerHTML = results.map(resultCard).join('');
  }

  function briefBox(title, text) {
    return `<div class="cardish"><strong>${title}</strong><p>${esc(text)}</p></div>`;
  }

  function renderFeature(p) {
    const box = $('nutri-feature');
    const src = $('nutri-feature-source');
    if (!box || !src) return;
    featured = p || null;
    window.dispatchEvent(new CustomEvent("space:nutri-update"));
    if (!p) {
      box.className = 'nutri-empty-state';
      box.textContent = 'Aucun produit sélectionné.';
      src.textContent = 'Choisis un produit';
      return;
    }
    const s = scoreProduct(p);
    const sugar = num(p.nutri.sugars_100g);
    const salt = num(p.nutri.salt_100g) ?? (num(p.nutri.sodium_100g) != null ? num(p.nutri.sodium_100g)*2.5 : null);
    const protein = num(p.nutri.proteins_100g);
    const fiber = num(p.nutri.fiber_100g);
    const sat = num(p.nutri['saturated-fat_100g']);
    const img = /^https:\/\//.test(p.image) ? `<img src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy" referrerpolicy="no-referrer">` : '<div style="width:108px;height:108px;border-radius:22px;background:var(--field);border:1px solid var(--sep)"></div>';
    const plus = s.reasons.good.slice(0,3).join(' · ') || 'Pas de point fort clair';
    const minus = s.reasons.bad.slice(0,3).join(' · ') || 'Rien de notable';
    const missing = s.reasons.missing.slice(0,3).join(', ') || 'données principales présentes';
    const addTone = additivesTone(p);
    const addCount = additivesCount(p);
    box.className = 'nutri-feature-wrap';
    box.innerHTML = `
      <div class="nutri-feature-top">
        ${img}
        <div class="nutri-feature-title">
          <span class="nutri-source-badge">Produit analysé</span>
          <h4>${esc(p.name)}</h4>
          <p>${esc(p.brand)}${p.code ? ' · '+esc(p.code) : ''}</p>
        </div>
      </div>
      <div class="nutri-score-panel">
        <div class="nutri-score-big" style="--tone:${s.tone}">${displayScore(s)}</div>
        <div class="nutri-feature-status">
          <h5 style="color:${s.tone}">${s.verdict}</h5>
          <p>${p.grade ? 'Nutri-Score ' + esc(p.grade) + ' · ' : ''}<span class="nutri-additive-status ${addTone}">${addCount == null ? 'additifs non renseignés ou non repérés' : addCount + ' additif(s) déclaré(s)'}</span></p>
        </div>
      </div>
      <p class="nutri-score-explanation">Score Space Daily indicatif, non officiel, basé sur les données disponibles. Fiabilité : ${esc(s.confidence)}. Ce n’est ni le score Yuka ni un avis médical.</p><div class="nutri-focus-actions"><button class="chip-btn" type="button" data-nutri-fav="${esc(p.code)}">${state.favorites.some(x=>valid(x) && x.code===p.code)?'Retirer des favoris':'Ajouter aux favoris'}</button><button class="chip-btn" type="button" data-nutri-a="${esc(p.code)}">Choisir comme produit A</button><button class="chip-btn" type="button" data-nutri-b="${esc(p.code)}">Choisir comme produit B</button></div>
      <div class="nutri-metric-grid">
        <div class="nutri-metric"><span>Sucre /100g</span><b>${value(sugar,'g')}</b></div>
        <div class="nutri-metric"><span>Sel /100g</span><b>${value(salt,'g')}</b></div>
        <div class="nutri-metric"><span>Protéines</span><b>${value(protein,'g')}</b></div>
        <div class="nutri-metric"><span>Fibres</span><b>${value(fiber,'g')}</b></div>
      </div>
      <div class="nutri-brief">
        ${briefBox('Bien', plus)}
        ${briefBox('À surveiller', minus)}
        ${briefBox('Manquant', missing)}
      </div>
      <div class="nutri-metric-grid">
        <div class="nutri-metric"><span>Graisses sat.</span><b>${value(sat,'g')}</b></div>
        <div class="nutri-metric ${addTone === 'danger' ? 'danger' : addTone === 'warn' ? 'warn' : ''}"><span>Additifs</span><b>${esc(additivesText(p))}</b></div>
        <div class="nutri-metric"><span>Énergie</span><b>${value(num(p.nutri['energy-kcal_100g']),'kcal')}</b></div>
        <div class="nutri-metric"><span>Source</span><b style="font-size:14px">OFF</b></div>
      </div>
      ${p.additives.length ? `<div class="nutri-additives ${addTone}">${p.additives.slice(0,8).map(a => `<span class="nutri-pill ${addTone}">${esc(a)}</span>`).join('')}</div>` : ''}
      <p class="nutri-ingredient-label">Ingrédients</p>
      ${p.ingredients ? `<div class="nutri-empty-state">${esc(p.ingredients.slice(0,800))}</div>` : '<p class="muted">Liste non renseignée.</p>'}
      <a class="nutri-off-link" target="_blank" rel="noopener noreferrer" href="https://world.openfoodfacts.org/product/${encodeURIComponent(p.code)}">Voir la fiche Open Food Facts ↗</a>
    `;
    src.textContent = 'Source : Open Food Facts';
  }

  function optionList(products, selected) {
    const opts = ['<option value="">Choisir</option>'];
    uniqByCode(products).forEach(p => opts.push(`<option value="${esc(p.code)}" ${selected===p.code?'selected':''}>${esc(p.name)}${p.brand ? ' · ' + esc(p.brand) : ''}</option>`));
    return opts.join('');
  }

  function renderComparePickers() {
    const pool = uniqByCode([...results, ...state.recent, ...state.favorites]);
    $('nutri-compare-a').innerHTML = optionList(pool, state.compareA);
    $('nutri-compare-b').innerHTML = optionList(pool, state.compareB);
    renderCompare();
    window.dispatchEvent(new CustomEvent("space:nutri-update"));
  }

  function compareSummary(a, b) {
    const sa = scoreProduct(a), sb = scoreProduct(b);
    const sugarA = num(a.nutri.sugars_100g), sugarB = num(b.nutri.sugars_100g);
    const saltA = num(a.nutri.salt_100g) ?? (num(a.nutri.sodium_100g) != null ? num(a.nutri.sodium_100g)*2.5 : null);
    const saltB = num(b.nutri.salt_100g) ?? (num(b.nutri.sodium_100g) != null ? num(b.nutri.sodium_100g)*2.5 : null);
    let best = sa.score == null || sb.score == null ? null : sa.score >= sb.score ? a : b;
    const reasons=[];
    if (sugarA != null && sugarB != null) reasons.push((sugarA <= sugarB ? a.name : b.name) + ' est moins sucré');
    if (saltA != null && saltB != null) reasons.push((saltA <= saltB ? a.name : b.name) + ' est moins salé');
    if ((a.additivesN||a.additives.length) !== (b.additivesN||b.additives.length)) reasons.push(((a.additivesN||a.additives.length) <= (b.additivesN||b.additives.length) ? a.name : b.name) + ' a moins d’additifs');
    return { best, text: best ? `Score indicatif le plus élevé : ${best.name}. ${reasons.slice(0,2).join(' · ')}` : 'Comparaison des scores impossible : informations nutritionnelles manquantes.' };
  }

  function compareRow(label, va, vb) {
    return `<div class="nutri-compare-row"><div class="nutri-value">${va}</div><b>${label}</b><div class="nutri-value">${vb}</div></div>`;
  }

  function renderCompare() {
    const box = $('nutri-compare');
    const a = productByCode(state.compareA);
    const b = productByCode(state.compareB);
    if (!a || !b) {
      box.className = 'nutri-empty-state';
      box.textContent = 'Ajoute deux produits à comparer.';
      return;
    }
    const sa = scoreProduct(a), sb = scoreProduct(b);
    const sum = compareSummary(a,b);
    box.className = 'nutri-compare-wrap';
    box.innerHTML = `
      <div class="nutri-compare-summary">${esc(sum.text)}</div>
      <div class="nutri-vs">
        <div class="nutri-vs-card"><h4>${esc(a.name)}</h4><div class="muted">${esc(a.brand)}</div><div class="nutri-score-badge" style="--tone:${sa.tone}">${displayScore(sa)}</div></div>
        <div class="nutri-vs-label">VS</div>
        <div class="nutri-vs-card"><h4>${esc(b.name)}</h4><div class="muted">${esc(b.brand)}</div><div class="nutri-score-badge" style="--tone:${sb.tone}">${displayScore(sb)}</div></div>
      </div>
      <div class="nutri-compare-table">
        ${compareRow('Sucre', value(num(a.nutri.sugars_100g),'g'), value(num(b.nutri.sugars_100g),'g'))}
        ${compareRow('Sel', value(num(a.nutri.salt_100g) ?? (num(a.nutri.sodium_100g) != null ? num(a.nutri.sodium_100g)*2.5 : null),'g'), value(num(b.nutri.salt_100g) ?? (num(b.nutri.sodium_100g) != null ? num(b.nutri.sodium_100g)*2.5 : null),'g'))}
        ${compareRow('Prot.', value(num(a.nutri.proteins_100g),'g'), value(num(b.nutri.proteins_100g),'g'))}
        ${compareRow('Fibres', value(num(a.nutri.fiber_100g),'g'), value(num(b.nutri.fiber_100g),'g'))}
        ${compareRow('Additifs', esc(additivesText(a)), esc(additivesText(b)))}
      </div>`;
  }

  function renderSaved() {
    state.recent = uniqByCode(state.recent);
    state.favorites = uniqByCode(state.favorites);
    const renderItem = p => `<div class="nutri-saved-item"><div><strong>${esc(p.name)}</strong><div class="muted">${esc(p.brand)}</div></div><div style="display:flex;gap:8px;flex-wrap:wrap"><button data-nutri-view="${esc(p.code)}">Détails</button><button data-nutri-fav="${esc(p.code)}">${state.favorites.some(x=>valid(x) && x.code===p.code)?'Retirer':'Favori'}</button></div></div>`;
    $('nutri-recent').innerHTML = state.recent.length ? state.recent.map(renderItem).join('') : '<div class="nutri-empty-state">Aucun produit récent.</div>';
    $('nutri-favorites').innerHTML = state.favorites.length ? state.favorites.map(renderItem).join('') : '<div class="nutri-empty-state">Aucun favori.</div>';
  }

  let searchSequence=0;
  async function searchProducts(query) {
    const q = String(query || '').trim().replace(/[\s\u200B-\u200D]/g, '');
    if (!q) { status('Saisis un nom ou un code-barres.'); return; }
    if (location.protocol === 'file:') { status('Le code-barres nécessite le serveur : ouvre CMD, lance node server.js, puis http://localhost:3000 (ne lance pas index.html directement).'); return; }
    const current=++searchSequence;
    $('nutri-results-card').hidden = false;
    $('nutri-results').innerHTML = '';
    status('Recherche Open Food Facts…');
    try {
      const isBarcode=/^\d{8,14}$/.test(q);
      const endpoint=isBarcode ? `/api/off/product/${encodeURIComponent(q)}` : `/api/off/search?q=${encodeURIComponent(q)}`;
      const r=await fetch(endpoint,{signal:AbortSignal.timeout(18000)});
      let j=await r.json();
      if(current!==searchSequence)return;
      if(!r.ok) throw new Error(j.error || 'Erreur réseau');
      const arr=isBarcode ? (j?.status===1 && j?.product ? [j.product] : []) : (Array.isArray(j?.products) ? j.products : []);
      results=(Array.isArray(arr) ? arr : []).map(normalize).filter(valid);
      status(results.length ? `${results.length} produit(s) trouvé(s). Sélectionne une fiche.` : (isBarcode ? `Code ${q} introuvable dans Open Food Facts. Vérifie les chiffres ou essaie une recherche par nom.` : 'Aucun produit trouvé. Essaie un autre nom.'));
      renderResults();
      if(results.length){remember(results[0]);renderFeature(results[0]);}
      else renderFeature(null);
      renderComparePickers();
    }catch(e){
      if(current!==searchSequence)return;
      status(e.name==='TimeoutError' ? 'Délai dépassé. Réessaie.' : `Recherche indisponible : ${e.message}. Vérifie Internet et le serveur Node.`);
      results=[];renderResults();
    }
  }

  let scanStream = null, scanTimer = null, zxingControls = null, scanBusy = false, scannerSession = 0;
  function stopScanner() {
    scannerSession++;
    if (scanTimer) { clearInterval(scanTimer); scanTimer = null; }
    scanBusy = false;
    if (zxingControls) { try { zxingControls.stop(); } catch {} zxingControls = null; }
    if (scanStream) { try { scanStream.getTracks().forEach(t => t.stop()); } catch {} scanStream = null; }
    const video = $('nutri-scan-video');
    if (video) { try { video.pause(); video.srcObject = null; } catch {} }
    $('nutri-scan-box').hidden = true;
    $('nutri-scan-stop').hidden = true;
  }
  function loadZXing() {
    if (window.ZXing?.BrowserMultiFormatReader) return Promise.resolve();
    if (window.spaceZXingLoading) return window.spaceZXingLoading;
    window.spaceZXingLoading = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@zxing/library@0.21.3/umd/index.min.js';
      script.onload = () => window.ZXing?.BrowserMultiFormatReader ? resolve() : reject(new Error('ZXing indisponible'));
      script.onerror = () => reject(new Error('Chargement ZXing impossible : connexion ou CDN bloqué'));
      document.head.appendChild(script);
    }).catch(err => { window.spaceZXingLoading = null; throw err; });
    return window.spaceZXingLoading;
  }
  function foundBarcode(code) {
    const cleaned = String(code || '').replace(/\D/g, '');
    if (!/^\d{8,14}$/.test(cleaned)) return;
    stopScanner();
    $('nutri-barcode').value = cleaned;
    searchProducts(cleaned);
  }
  async function startScanner() {
    if (!navigator.mediaDevices?.getUserMedia) { status('Caméra indisponible : ouvre le site sur localhost ou HTTPS, et autorise la caméra dans le navigateur.'); return; }
    stopScanner();
    const session = scannerSession;
    const video = $('nutri-scan-video');
    $('nutri-scan-box').hidden = false;
    $('nutri-scan-stop').hidden = false;
    status('Autorise la caméra…');
    try {
      if ('BarcodeDetector' in window) {
        try {
          const available = await BarcodeDetector.getSupportedFormats();
          const formats = ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128'].filter(f => available.includes(f));
          if (formats.length) {
            const detector = new BarcodeDetector({ formats });
            scanStream = await navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } } });
            if (session !== scannerSession) {scanStream.getTracks().forEach(t=>t.stop()); return;}
            video.srcObject = scanStream; await video.play();
            status('Scanner actif.');
            scanTimer = setInterval(async () => {
              if (scanBusy || video.readyState < 2) return;
              scanBusy = true;
              try { const found = await detector.detect(video); if (found.length) foundBarcode(found[0].rawValue); } catch {} finally { scanBusy = false; }
            }, 250);
            return;
          }
        } catch {}
      }
      status('Chargement du scanner…');
      await loadZXing();
      const reader = new window.ZXing.BrowserMultiFormatReader();
      zxingControls = await reader.decodeFromVideoDevice(undefined, video, (result) => {
        if (result && session === scannerSession) foundBarcode(result.getText());
      });
      status('Scanner actif.');
    } catch (e) {
      stopScanner();
      status(e?.name === 'NotAllowedError' ? 'Caméra refusée : active la permission dans le navigateur.' : e?.name === 'NotFoundError' ? 'Aucune caméra détectée.' : `Scanner indisponible : ${e?.message || 'erreur inconnue'}. Tu peux saisir le code manuellement.`);
    }
  }

  $('nutri-search-form').addEventListener('submit', e => { e.preventDefault(); searchProducts($('nutri-query').value); });
  $('nutri-barcode-btn').addEventListener('click', () => searchProducts($('nutri-barcode').value));
  $('nutri-barcode').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); searchProducts(e.currentTarget.value); } });
  $('nutri-open-scan').addEventListener('click', startScanner);
  $('nutri-scan-btn').addEventListener('click', startScanner);
  $('nutri-scan-stop').addEventListener('click', stopScanner);
  $('nutri-focus-compare').addEventListener('click', () => $('nutri-compare-card').scrollIntoView({ behavior: 'smooth', block: 'start' }));
  $('nutri-clear-recent').addEventListener('click', () => { state.recent = []; save(); renderSaved(); renderComparePickers(); });
  $('nutri-compare-a').addEventListener('change', e => { state.compareA = e.target.value; save(); renderCompare(); });
  $('nutri-compare-b').addEventListener('change', e => { state.compareB = e.target.value; save(); renderCompare(); });

  $('page-nutri').addEventListener('click', e => {
    const view = e.target.closest('[data-nutri-view]');
    if (view) {
      const p = productByCode(view.dataset.nutriView);
      if (p) { remember(p); renderFeature(p); }
      return;
    }
    const fav = e.target.closest('[data-nutri-fav]');
    if (fav) { toggleFav(fav.dataset.nutriFav); return; }
    const a = e.target.closest('[data-nutri-a]');
    if (a) { state.compareA = a.dataset.nutriA; save(); renderComparePickers(); return; }
    const b = e.target.closest('[data-nutri-b]');
    if (b) { state.compareB = b.dataset.nutriB; save(); renderComparePickers(); return; }
  });

  save(); // persist cleaned records from older versions
  renderSaved();
  renderComparePickers();
  renderFeature(null);
  window.SpaceNutriTest={normalize,scoreProduct};
  window.SpaceNutriV5={getFeatured:()=>featured,getCompare:()=>[productByCode(state.compareA),productByCode(state.compareB)]};
  window.dispatchEvent(new CustomEvent("space:nutri-update"));
})();
