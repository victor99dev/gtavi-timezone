/* GTA VI Zero Hour — original independent fan tracker. No libraries, no API keys. */
(() => {
  'use strict';
  const cities = (window.GTA_CITIES || []).slice().sort((a,b) => Date.parse(a.utc)-Date.parse(b.utc) || a.city.localeCompare(b.city));
  if (!cities.length) return;
  const lang = window.APP_LANG === 'en' ? 'en' : 'pt';
  const isEn = lang === 'en';
  const locale = isEn ? 'en-US' : 'pt-BR';
  const live = document.body.classList.contains('live-page');
  const label = (city) => isEn ? city.cityEn || city.city : city.city;
  const country = (city) => isEn ? city.countryEn : city.country;
  const ts = (city) => Date.parse(city.utc);
  const byId = Object.fromEntries(cities.map(city => [city.id,city]));
  const waves = [...new Set(cities.map(c => c.utc))];
  const $ = (id) => document.getElementById(id);
  const copy = isEn ? {
    days:'DAYS',hours:'HRS',minutes:'MIN',seconds:'SEC',reached:'WINDOW STARTED',waiting:'COUNTING DOWN',selected:'SELECTED REGION',next:'NEXT WORLD UNLOCK',finished:'ALL WINDOWS REACHED',
    noResults:'No cities match your search.',localTime:'Unlock time in this city',store:'Store region',share:'LINK COPIED!',copyFail:'Copy this page address:',windowReached:'Unlock window reached:',
    nextUp:'Next region',all:'All scheduled launch windows have passed',unknown:'Time shown is based on regional store listings; your console is the definitive reference.'
  } : {
    days:'DIAS',hours:'HRS',minutes:'MIN',seconds:'SEG',reached:'JANELA INICIADA',waiting:'EM CONTAGEM',selected:'REGIÃO SELECIONADA',next:'PRÓXIMA LIBERAÇÃO MUNDIAL',finished:'TODAS AS JANELAS ATINGIDAS',
    noResults:'Nenhuma cidade corresponde à busca.',localTime:'Horário de liberação nesta cidade',store:'Região da loja',share:'LINK COPIADO!',copyFail:'Copie o endereço desta página:',windowReached:'A janela começou:',
    nextUp:'Próxima região',all:'Todas as janelas previstas de lançamento já passaram',unknown:'Os horários seguem listagens regionais; confirme o desbloqueio na sua loja do console.'
  };
  let selectedId = window.APP_SELECTED || null;
  let alphabetical = false;
  let searchValue = '';
  let lastWave = null;
  let tickCount = 0;
  const pad = n => String(n).padStart(2,'0');
  const now = () => Date.now();
  const released = (city, time=now()) => ts(city) <= time;
  const future = (time=now()) => cities.find(c => ts(c) > time) || null;
  const focused = (time=now()) => byId[selectedId] || future(time) || cities[cities.length-1];
  const dateFormat = (city, time=ts(city)) => new Intl.DateTimeFormat(locale, {
    timeZone: city.tz, day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit',hour12:false
  }).format(new Date(time));
  const displayShort = (city) => {
    const parts = new Intl.DateTimeFormat(locale,{timeZone:city.tz,day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit',hour12:false}).formatToParts(new Date(city.utc));
    const part = type => (parts.find(p=>p.type===type)||{}).value||'';
    return `${part('day')} ${part('month').toUpperCase().replace('.','')} · ${part('hour')}:${part('minute')}`;
  };
  const hourFormat = (city,time=ts(city)) => new Intl.DateTimeFormat(locale, {
    timeZone:city.tz,hour:'2-digit',minute:'2-digit',hour12:false
  }).format(new Date(time));
  const utcFormat = city => new Intl.DateTimeFormat('en-GB', {
    timeZone:'UTC',day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit',hour12:false
  }).format(new Date(city.utc)) + ' UTC';
  const count = (target,time) => {
    let left = Math.max(0,Math.floor((target - time)/1000));
    const d = Math.floor(left / 86400);left%=86400;
    const h = Math.floor(left / 3600);left%=3600;
    const m = Math.floor(left / 60);
    return [pad(d),pad(h),pad(m),pad(left%60)];
  };
  const set = (id, value) => {const el=$(id); if(el)el.textContent=value;};
  function flash(message) {
    const el=$('toast');if(!el)return;
    el.textContent=message;el.hidden=false;
    clearTimeout(flash.timer);flash.timer=setTimeout(()=>el.hidden=true,4300);
  }
  const pinXY = (city,inLive) => {
    const x=(city.lon+180)/360;
    const y=(86-city.lat)/172;
    return {left: ((inLive? .01:.01)+ x*(inLive?.98:.98))*100+'%',top:((inLive?.01:.08) + y*(inLive?.98:.88))*100+'%'};
  };
  function makePin(city, inLive) {
    const btn=document.createElement('button');
    btn.type='button';btn.className='map-pin';btn.dataset.city=city.id;
    btn.title=label(city)+' — '+dateFormat(city);
    btn.setAttribute('aria-label',`${label(city)}, ${country(city)} — ${dateFormat(city)}`);
    Object.assign(btn.style,pinXY(city,inLive));
    // Prevent clustered markers from obscuring the map; every city remains in the searchable list.
    const span=document.createElement('span');span.className='map-label';span.textContent=label(city);
    btn.append(span);
    btn.addEventListener('click',()=>selectCity(city.id));
    return btn;
  }
  function drawMap(id, inLive) {
    const el=$(id);if(!el)return;
    cities.filter(c=>c.focus).forEach(c=>el.appendChild(makePin(c,inLive)));
    updatePins();
  }
  function updatePins(time=now()) {
    document.querySelectorAll('.map-pin').forEach(el=>{
      const city=byId[el.dataset.city];
      el.classList.toggle('reached',released(city,time));
      el.classList.toggle('selected',city.id===focused(time).id);
    });
  }
  function rowForCity(city,time) {
    const b=document.createElement('button');b.className='region-item';b.type='button';
    if (focused(time).id===city.id)b.classList.add('active');
    const status = released(city,time) ? copy.reached : copy.waiting;
    b.innerHTML=`<span class="flag" aria-hidden="true">${city.flag}</span><span class="region-name"><strong>${label(city)}</strong><small>${country(city)} · ${city.store}</small></span><span class="region-time"><strong>${displayShort(city)}</strong><small class="${released(city,time)?'reached':''}">${status}</small></span>`;
    b.setAttribute('aria-label',label(city)+' '+dateFormat(city)+' '+status);
    b.addEventListener('click',()=>selectCity(city.id));
    return b;
  }
  function drawList(time=now()) {
    const box=$('region-list');if(!box)return;
    const filtered=cities.filter(c=>(label(c)+' '+country(c)+' '+c.city+' '+c.store).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().includes(searchValue));
    if(alphabetical)filtered.sort((a,b)=>label(a).localeCompare(label(b),locale));
    box.replaceChildren(...(filtered.length?filtered.map(c=>rowForCity(c,time)):[Object.assign(document.createElement('div'),{className:'no-results',textContent:copy.noResults})]));
    set('city-count',String(cities.length));
    set('list-count',filtered.length+' / '+cities.length);
  }
  function drawLiveList(time=now()) {
    const box=$('live-region-list');if(!box)return;
    const unique=cities.filter((c,i)=>cities.findIndex(other=>other.utc===c.utc)===i);
    const position=unique.findIndex(c=>ts(c)>time);
    const start=position < 0 ? Math.max(0,unique.length-8):Math.max(0,Math.min(position-1,unique.length-8));
    const show=unique.slice(start,start+8);
    box.replaceChildren(...show.map(c=>{
      const row=document.createElement('div');row.className='live-region-item'+(released(c,time)?' reached':'');
      const str=new Intl.DateTimeFormat(locale,{timeZone:'UTC',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(c.utc));
      row.innerHTML=`<span>${c.flag}</span><span class="where">${label(c)}</span><time>${str} UTC</time>`;
      return row;
    }));
  }
  function selectCity(id) {
    if(!byId[id])return;
    selectedId=id;
    drawList();render();
  }
  function render(time=now()) {
    const next=future(time);
    // In live mode always follow the next worldwide launch wave.
    const city=live ? (next || cities[cities.length-1]) : focused(time);
    const nums=count(ts(city),time);
    ['days','hours','minutes','seconds'].forEach((u,i)=>set('clock-'+u,nums[i]));
    ['days','hours','minutes','seconds'].forEach((u,i)=>set('live-clock-'+u,nums[i]));
    const done=released(city,time);
    set('timer-target',done?copy.reached:`${city.flag} ${label(city)} · ${hourFormat(city)}`);
    set('timer-mode',!selectedId?copy.next:copy.selected);
    set('next-name',next?label(next):copy.all);
    set('next-time',next?dateFormat(next):'—');
    set('focus-city',label(city));set('focus-country',country(city));
    set('focus-local-time',dateFormat(city));set('focus-utc',utcFormat(city));
    set('focus-type',!selectedId?copy.next:copy.selected);
    set('live-target',next?label(next):copy.finished);
    set('live-target-country',next?`${next.flag} ${country(next)} · ${dateFormat(next)}`:copy.all);
    const reachedCount=cities.filter(c=>released(c,time)).length;
    const waveCount=waves.filter(w=>Date.parse(w)<=time).length;
    set('cities-reached',`${reachedCount} / ${cities.length}`);
    set('waves-reached',`${waveCount} / ${waves.length}`);
    set('global-percent',Math.round(reachedCount/cities.length*100)+'%');
    set('waves-percent',`${waveCount} / ${waves.length}`);
    for(const id of ['progress-fill','live-progress-fill']){const el=$(id);if(el)el.style.width=reachedCount/cities.length*100+'%';}
    updatePins(time);
    tickCount++;
    if(tickCount%5===1)drawList(time);
    if(tickCount%3===1)drawLiveList(time);
    const activeWave=next?.utc || 'end';
    if(lastWave !== null && lastWave!==activeWave){
      const previous=cities.find(c=>c.utc===lastWave);
      if(previous && !live)flash(`${copy.windowReached} ${label(previous)} ${previous.flag}`);
    }
    lastWave=activeWave;
  }
  drawMap('world-map',false);
  drawMap('live-map',true);
  const search=$('region-search');if(search)search.addEventListener('input',e=>{searchValue=e.target.value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();drawList();});
  const sort=$('sort-cities');if(sort)sort.addEventListener('click',()=>{alphabetical=!alphabetical;sort.textContent=alphabetical?'A–Z ↑':'UTC ↑';drawList();});
  const reset=$('reset-target');if(reset)reset.addEventListener('click',()=>{selectedId=null;drawList();render();});
  const share=$('copy-link');if(share)share.addEventListener('click',async()=>{
    try{await navigator.clipboard.writeText(location.href);flash(copy.share);}
    catch{window.prompt(copy.copyFail,location.href);}
  });
  const fullscreen=$('live-fullscreen');if(fullscreen)fullscreen.addEventListener('click',()=>{
    if(!document.fullscreenElement)document.documentElement.requestFullscreen?.();
    else document.exitFullscreen?.();
  });
  render();setInterval(()=>render(),1000);
})();
