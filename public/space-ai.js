/* Space AI: transparent rule-based, local wellness insights. No external API. */
(() => {
  'use strict';
  const log = document.getElementById('ai-chat');
  const form = document.getElementById('ai-form');
  const input = document.getElementById('ai-input');
  const overview = document.getElementById('ai-overview');
  const messages = [];
  let sending=false;
  const number = x => { const n = Number(String(x ?? '').replace(',','.')); return Number.isFinite(n) && n >= 0 ? n : null; };
  const val = (day, key) => number(day?.[key]);
  const label = x => x == null ? 'Non renseigné' : String(x);
  const dateLabel = iso => new Date(iso+'T12:00:00').toLocaleDateString('fr-FR', {day:'numeric',month:'short'});
  const get = () => dayData(current);
  const week = () => Array.from({length:7},(_,i)=>dayData(shiftDate(current,i-6)));
  const average = data => data.length ? data.reduce((a,b)=>a+b,0)/data.length : null;
  const fmt = n => n == null ? '—' : Number(n.toFixed(1)).toLocaleString('fr-FR');
  function addMessage(who, content){
    messages.push({who,content});
    if(messages.length > 50) messages.shift();
    drawMessages();
  }
  function drawMessages(){
    log.replaceChildren();
    messages.forEach(({who,content})=>{
      const root=document.createElement('div');root.className='ai-message '+(who==='user'?'user':'assistant');
      const icon=document.createElement('div');icon.className='ai-avatar';icon.textContent=who==='user'?'☺':'✦';
      const bubble=document.createElement('div');bubble.className='ai-bubble';bubble.textContent=content;
      root.append(icon,bubble);log.append(root);
    });
    log.scrollTop=log.scrollHeight;
  }
  function sleep(){
    const n=val(get(),'sleep');
    if(n == null || n === 0) return '🌙 Le sommeil du jour n’est pas encore renseigné. Ajoute tes heures de sommeil dans Santé pour obtenir une analyse personnalisée.';
    return `🌙 Tu as noté ${fmt(n)} heure(s) de sommeil. ${n<7?'Pour beaucoup d’adultes, 7 à 9 heures constituent une plage couramment conseillée : essaie une heure de coucher régulière et réduis les écrans avant le sommeil.':n<=9?'Cette durée se situe dans la plage couramment recommandée pour de nombreux adultes (7 à 9 h). Observe aussi comment tu te sens au réveil.':'Tu as enregistré plus de 9 heures. Les besoins varient selon les personnes : regarde surtout la régularité et la qualité de ton repos.'} Ce repère n'est pas une évaluation médicale.`;
  }
  function activity(){
    const n=val(get(),'sport');
    if(n == null || n === 0) return '🏃 Aucune minute d’activité n’est enregistrée pour cette journée. Même une petite marche peut être un bon point de départ. Pense à ajouter tes minutes de sport dans Santé.';
    return `🏃 Tu as enregistré ${fmt(n)} minute(s) de sport aujourd’hui. ${n<20?'Une courte activité est déjà un début : privilégie la régularité à la performance.':'Bravo pour cette séance ! Pense aussi à la récupération et adapte l’effort à tes capacités.'} Cette application ne mesure pas l'intensité de ton effort.`;
  }
  function mood(){
    const m=val(get(),'mood'), e=val(get(),'energy');
    if(!m && !e) return '💜 Tu n’as pas encore noté ton humeur ou ton énergie aujourd’hui. Utilise les icônes de la page Santé et, si tu le souhaites, écris quelques mots dans le Journal.';
    const level = m ? `Humeur : ${m}/5.` : 'Humeur non renseignée.';
    const energy = e ? `Énergie : ${e}/5.` : 'Énergie non renseignée.';
    return `💜 ${level} ${energy} ${m && m<=2?'Tu sembles traverser une journée moins agréable. Accorde-toi une pause et échange avec une personne de confiance si tu en ressens le besoin.':'Prendre quelques notes sur tes journées peut t’aider à repérer des habitudes qui te conviennent.'}`;
  }
  function nutrition(){
    const total=totals(current), target=number(state.settings.target);
    if(!total.kcal) return '🥗 Aucun aliment n’est enregistré pour cette journée. Ajoute tes repas pour suivre les apports et voir les macronutriments. Le suivi calorique reste une estimation.';
    return `🥗 Tu as enregistré environ ${Math.round(total.kcal)} kcal (${Math.round(total.p)} g de protéines, ${Math.round(total.c)} g de glucides et ${Math.round(total.f)} g de lipides)${target?`, pour un objectif défini à ${Math.round(target)} kcal`:''}. Les quantités dépendent des aliments et portions saisis. Privilégie la variété et une relation souple avec l'alimentation.`;
  }
  function weekly(){
    const days=week(), s=days.map(d=>val(d,'sleep')).filter(x=>x>0), a=days.map(d=>val(d,'sport')).filter(x=>x>0), m=[];
    if(![s,a,m].some(x=>x.length))return '📊 Il n’y a pas encore assez de données pour cette semaine. Complète quelques journées dans Santé, puis reviens me demander ton bilan.';
    return `📊 Bilan des 7 jours jusqu’au ${dateLabel(current)} :\n• Sommeil : ${s.length?`${fmt(average(s))} h en moyenne sur ${s.length} jour(s) renseigné(s)`:'non renseigné'}\n• Sport : ${a.length?`${fmt(average(a))} min en moyenne sur ${a.length} jour(s) avec une activité saisie`:'non renseigné'}\nIl s'agit de tendances descriptives : les jours sans saisie ne comptent pas dans ces moyennes.`;
  }
  function summary(){
    const d=get(),sleepNum=val(d,'sleep'), sportNum=val(d,'sport'), moodNum=val(d,'mood');
    const lines=[`✨ Ton bilan du ${dateLabel(current)} :`, `• Sommeil : ${sleepNum?fmt(sleepNum)+' h':'non renseigné'}`,`• Activité : ${sportNum?fmt(sportNum)+' min':'non renseignée'}`,`• Nutrition : ${totals(current).kcal?Math.round(totals(current).kcal)+' kcal saisies':'pas de repas saisi'}`];
    let tip='';
    if (!sleepNum && !sportNum && !moodNum && !totals(current).kcal)tip='Commence par enregistrer tes activités du jour pour recevoir des recommandations adaptées.';
    else if(sleepNum && sleepNum<7) tip='Priorité suggérée : essaie de régulariser ton sommeil.';
    else if(sportNum===0 || sportNum===null)tip='Idée du jour : prends un moment pour bouger à ton rythme.';
    else tip='Continue à observer ce qui te fait du bien, sans chercher à tout optimiser.';
    return lines.join('\n')+'\n\n💡 '+tip;
  }
  function reply(q){
    const t=q.toLocaleLowerCase('fr-FR').normalize('NFD').replace(/[\u0300-\u036f]/g,'');
    if(/(suicid|me tuer|automutil|self.harm|envie de mourir)/.test(t))return 'Je suis désolé que tu traverses cela. Je ne suis pas un service d’urgence. Si tu es en danger immédiat, contacte les services d’urgence locaux ou une personne de confiance maintenant.';
    if(/(douleur|maladie|medicament|diagnos|symptome|urgence medicale)/.test(t))return 'Je ne peux pas poser de diagnostic ni proposer de traitement. Pour un symptôme, une douleur ou un médicament, consulte un professionnel de santé. Je peux t’aider à examiner tes données de suivi.';
    if(/(semaine|hebdo|7 jours|tendance)/.test(t))return weekly();
    if(/(sommeil|dorm|nuit|fatigue|repos)/.test(t))return sleep();
    if(/(sport|activit|bouger|march|exercice)/.test(t))return activity();
    
    if(/(nutrition|mang|repas|calori|aliment|proteine)/.test(t))return nutrition();
    if(/(jour|bilan|conseil|resume|analyse|bonjour|salut|hello)/.test(t))return summary();
    return '✦ Je peux analyser tes données locales et t’aider pour le bilan du jour, le sommeil, l’activité physique, l’humeur, la nutrition ou la semaine. Choisis une suggestion ci-dessus pour commencer.';
  }
  async function smartReply(question){
    // A server-side proxy keeps the API key out of browser source code.
    const cleanDay = d => { const {water, ...rest} = d || {}; return rest; };
    const snapshot={date:current,nutrition:totals(current),sleep:val(get(),'sleep'),activity:val(get(),'sport'),goals:{calories:state.settings.target}};
    try {
      const r=await fetch('/api/ai/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({question,history:messages.slice(-10).map(m=>({role:m.who==='user'?'user':'assistant',content:m.content})),context:snapshot})});
      if (r.status===503 || r.status===404) return reply(question)+'\n\nℹ️ Mode local. Pour répondre aux questions générales, démarre le serveur avec GEMINI_API_KEY (voir README).';
      if(!r.ok){let detail='';try{const e=await r.json();detail=e.detail||e.error||'';}catch{};return '⚠️ Gemini: '+(detail||('Erreur HTTP '+r.status));}
      const j=await r.json();
      return j.answer || reply(question);
    }catch(e){return reply(question)+'\n\nℹ️ Mode local : active le serveur IA pour poser toutes sortes de questions.';}
  }
  async function ask(q){
    if(sending)return; sending=true; form.querySelector('button[type=submit]').disabled=true;
    addMessage('user',q);
    const placeholder= '✦ Space AI réfléchit…';
    addMessage('assistant',placeholder);
    const position=messages.length-1;
    let answer;try{answer=await smartReply(q);}catch(e){answer='Analyse temporairement indisponible : '+e.message;}finally{sending=false;form.querySelector('button[type=submit]').disabled=false;}
    if(messages[position]?.content===placeholder){messages[position].content=answer;drawMessages();}
  }
  function stat(icon,value,caption){const card=document.createElement('div');card.className='ai-stat';const i=document.createElement('div');i.className='ai-stat-icon';i.textContent=icon;const v=document.createElement('div');v.className='ai-stat-value';v.textContent=value;const c=document.createElement('div');c.className='ai-stat-caption';c.textContent=caption;card.append(i,v,c);return card;}
  function render(){
    const d=get();overview.replaceChildren(
      stat('◷',val(d,'sleep')?fmt(val(d,'sleep'))+' h':'—','Sommeil enregistré'),
      stat('↗',val(d,'sport')?fmt(val(d,'sport'))+' min':'—','Activité physique'),
      stat('◉',totals(current).kcal?Math.round(totals(current).kcal)+' kcal':'—','Nutrition enregistrée'));
  }
  window.renderSpaceAI=render;
  document.querySelectorAll('[data-ai-prompt]').forEach(button=>button.addEventListener('click',()=>{const q=button.dataset.aiPrompt;ask(q);}));
  form.addEventListener('submit',e=>{e.preventDefault();const q=input.value.trim();if(!q)return;input.value='';ask(q);input.focus();});
  document.getElementById('ai-clear').addEventListener('click',()=>{messages.length=0;addMessage('assistant','Bonjour ! ✦ Je suis Space AI, ton compagnon bien-être local. Pose-moi une question ou sélectionne une suggestion.');});
  addMessage('assistant','Bonjour ! ✦ Je suis Space AI. Je peux faire ton bilan quotidien et analyser les habitudes que tu as enregistrées. Sur quoi souhaites-tu te concentrer ?');
  render();
})();
