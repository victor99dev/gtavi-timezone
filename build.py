#!/usr/bin/env python3
"""Build a zero-dependency, pre-rendered bilingual static GTA VI countdown website."""
import json,shutil,html,argparse,os
from pathlib import Path
from datetime import datetime,timezone
from zoneinfo import ZoneInfo
from urllib.parse import quote

ROOT=Path(__file__).resolve().parent
SRC=ROOT/'src'
OUT=ROOT/'dist'
CITIES=json.loads((SRC/'regions.json').read_text(encoding='utf-8'))
OFFICIAL='https://www.rockstargames.com/VI'
SUPPORT='https://support.rockstargames.com/articles/29jV3Cv2cCgvwM1XgtMO5o/grand-theft-auto-vi-regional-pre-load-and-release-times-on-playstation-5-and-xbox-series-x-or-s'
PS_BR='https://store.playstation.com/pt-br/concept/10000730'
PS_US='https://store.playstation.com/en-us/concept/10000730'
LAST_CHECK='2026-11-18'

def h(value):return html.escape(str(value),quote=True)
def city_name(c,en):return c.get('cityEn',c['city']) if en else c['city']
def country_name(c,en):return c['countryEn'] if en else c['country']
def zone_time(c,en):
 d=datetime.fromisoformat(c['utc'].replace('Z','+00:00')).astimezone(ZoneInfo(c['tz']))
 months_en=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
 months_pt=['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez']
 return (f'{months_en[d.month-1]} {d.day}, {d.year} at {d:%H:%M}' if en else f'{d.day} de {months_pt[d.month-1]} de {d.year} às {d:%H:%M}')
def slug_url(c,en):return ('en/time/' if en else 'horarios/')+c['id']+'/'
def page_path(lang,kind,c=None):
 en=lang=='en'
 if kind=='home':return 'en/' if en else ''
 if kind=='live':return 'en/live/' if en else 'live/'
 return slug_url(c,en)
def breadcrumb(c,en,prefix):
 if not c:return ''
 return f'<p class="city-article-heading">{c["flag"]} <a href="{prefix}{"en/" if en else ""}">{"World map" if en else "Mapa mundial"}</a> / {h(city_name(c,en))}</p>'
def source_note(en):
 return (f'<div class="source-card"><strong>Source transparency:</strong> Rockstar Support states midnight local time on 19 November. Individual timestamps are organized from regional PlayStation Store listings. For places with several time zones, the displayed clock can reflect the country store rather than each city’s midnight. Check the console store for the definitive time. <a href="{SUPPORT}" rel="noopener noreferrer" target="_blank">Rockstar Support</a> · <a href="{PS_US}" rel="noopener noreferrer" target="_blank">PlayStation Store</a>. Checked {LAST_CHECK}.</div>' if en else
 f'<div class="source-card"><strong>Transparência das fontes:</strong> o suporte da Rockstar informa meia-noite local em 19 de novembro. Os instantes regionais foram organizados com base nas listagens da PlayStation Store. Em países com múltiplos fusos, o horário exibido pode seguir a loja nacional, e não a meia-noite de cada cidade. Confira sua loja no console. <a href="{SUPPORT}" rel="noopener noreferrer" target="_blank">Suporte Rockstar</a> · <a href="{PS_BR}" rel="noopener noreferrer" target="_blank">PlayStation Store</a>. Conferido em 18/11/2026.</div>')
def faq(en,c=None):
 if c:
  n=city_name(c,en); t=zone_time(c,en); co=country_name(c,en)
  if en:
   return [
    (f'What time does GTA 6 unlock in {n}?',f'The regional store reference converts to {t} in {n}, {co} ({c["tz"]}). Check the exact listing on your console.'),
    (f'Why does {n} have a different time from another city?',f'Countries and store regions can use a single launch timestamp even where multiple local time zones exist. This tracker converts that timestamp using the IANA {c["tz"]} time zone.'),
    ('Is GTA VI launching on PC on November 19?','No. Rockstar announced the November 19, 2026 launch for PlayStation 5 and Xbox Series X|S. There is no confirmed PC release date.')]
  return [
    (f'Que horas GTA 6 lança em {n}?',f'A referência da loja regional corresponde a {t} em {n}, {co} (fuso {c["tz"]}). Confira a hora exata na loja do seu console.'),
    (f'Por que {n} pode ter horário diferente de outras cidades?',f'Alguns países utilizam um único horário de desbloqueio da loja, mesmo com vários fusos. Este site converte o instante da loja para o fuso IANA {c["tz"]}.'),
    ('GTA 6 lança para PC em 19 de novembro?','Não. A Rockstar anunciou o lançamento de 19 de novembro de 2026 para PlayStation 5 e Xbox Series X|S. Não há data confirmada para PC.')]
 return ([('When does GTA 6 come out?','Grand Theft Auto VI launches on November 19, 2026 on PlayStation 5 and Xbox Series X|S, according to Rockstar.'),
          ('What time does GTA 6 unlock worldwide?','Rockstar Support says midnight local time on November 19 in all regions. PlayStation Store listings provide regional launch timestamps; countries with multiple time zones may share a store-wide unlock.'),
          ('Does changing my console time zone unlock the game earlier?','No. The store region and your digital entitlement control availability, not the device clock.'),
          ('Is there a GTA 6 PC release date?','Not yet. Rockstar has not confirmed a PC launch date.')]
  if en else
         [('Quando GTA 6 será lançado?','Grand Theft Auto VI estreia em 19 de novembro de 2026 para PlayStation 5 e Xbox Series X|S, conforme a Rockstar.'),
          ('Qual é o horário de lançamento do GTA 6 no mundo?','A Rockstar informa meia-noite local em 19 de novembro para todas as regiões. As lojas digitais exibem instantes regionais e países com vários fusos podem compartilhar o desbloqueio de uma mesma loja.'),
          ('Mudar o fuso do console libera GTA 6 antes?','Não. A região da loja e a licença da conta determinam a disponibilidade, não o relógio do console.'),
          ('GTA 6 vai lançar para PC?','Ainda não há data oficial de lançamento de GTA VI para PC.')])

def fmeta(en,kind,c=None):
 if kind=='home':
  title=('GTA 6 Release Countdown 2026 | Live World Map & Unlock Times' if en else 'GTA 6: Contagem Regressiva ao Vivo | Horários no Mundo')
  desc=('Track the GTA 6 launch on November 19, 2026 with a real-time global countdown, interactive release map, timezone conversions, and PS5/Xbox unlock times.' if en else 'Acompanhe a contagem regressiva do GTA 6 para 19 de novembro de 2026: mapa mundial interativo, horário por cidade, fusos, PS5 e Xbox.')
 elif kind=='live':
  title=('GTA 6 Live Countdown — OBS Scene' if en else 'GTA 6 — Painel ao Vivo para OBS')
  desc=('Full-screen Grand Theft Auto VI global countdown stream scene.' if en else 'Cena para live: contagem mundial de lançamento de GTA VI em tela cheia.')
 else:
  name=city_name(c,en); co=country_name(c,en); t=zone_time(c,en)
  title=(f'GTA 6 Release Time in {name}: {t} | Live Countdown' if en else f'GTA 6 em {name}: {t} | Contagem Regressiva')
  desc=(f'When does GTA 6 unlock in {name}, {co}? Regional store reference: {t}. Live countdown, local timezone, map and Rockstar sources.' if en else f'Que horas GTA 6 lança em {name}, {co}? Referência regional: {t}. Contador ao vivo, fuso local, mapa e fontes oficiais.')
 return title,desc

def schema(en,kind,c=None):
 title,_=fmeta(en,kind,c)
 graph=[{'@type':'WebSite','name':'GTA VI Zero Hour','description':'Independent global launch-time tracker','inLanguage':('en-US' if en else 'pt-BR')},
        {'@type':'VideoGame','name':'Grand Theft Auto VI','alternateName':'GTA 6','gamePlatform':['PlayStation 5','Xbox Series X|S'],'publisher':{'@type':'Organization','name':'Rockstar Games'},'datePublished':'2026-11-19','sameAs':OFFICIAL},
        {'@type':'WebPage','name':title,'inLanguage':'en-US' if en else 'pt-BR'}]
 if kind!='live':graph.append({'@type':'FAQPage','mainEntity':[{'@type':'Question','name':q,'acceptedAnswer':{'@type':'Answer','text':a}} for q,a in faq(en,c)]})
 if c: graph.append({'@type':'BreadcrumbList','itemListElement':[{'@type':'ListItem','position':1,'name':'Worldwide' if en else 'Mapa mundial','item':'/en/' if en else '/'},{'@type':'ListItem','position':2,'name':city_name(c,en)}]})
 return json.dumps({'@context':'https://schema.org','@graph':graph},ensure_ascii=False,separators=(',',':')).replace('</','<\\/')

def city_tiles(en,prefix):
 selected=[next(c for c in CITIES if c['id']==id) for id in ('auckland','sydney','tokyo','london','brasilia','manaus','new-york','los-angeles','mexico-city','paris','dubai','lisbon')]
 result=[]
 for c in selected:
  href=prefix+slug_url(c,en)
  result.append(f'<a class="city-tile" href="{h(href)}"><small>{c["flag"]} {h(country_name(c,en))}</small><strong>{h(city_name(c,en))}</strong><em>{h(zone_time(c,en))}</em></a>')
 return ''.join(result)

def article(en,prefix,c):
 if c:
  name=city_name(c,en); co=country_name(c,en); time=zone_time(c,en)
  local=datetime.fromisoformat(c['utc'].replace('Z','+00:00')).astimezone(ZoneInfo(c['tz']))
  weekday=local.strftime('%A')
  if en:
   content=(f'{breadcrumb(c,en,prefix)}<h2>GTA 6 release time in {h(name)}, {h(co)}</h2>'
     f'<p>On <strong>{h(time)}</strong>, the regional PlayStation Store launch reference for <strong>{h(name)}</strong> reaches its target. The countdown above tracks that exact absolute timestamp. The city’s IANA time zone is <strong>{h(c["tz"])}</strong>, so no manual daylight-saving adjustment is required.</p>'
     f'<div class="lead-time">{h(name)}: <strong>{h(time)}</strong> · {h(c["store"])} STORE</div>'
     f'<h3>Which release time should you trust?</h3><p>Rockstar confirms a <strong>November 19, 2026</strong> release at midnight local time, but it does not publish a separate instant for every city. The clock shown here is the converted timestamp of the <strong>{h(c["store"])} store region</strong>. This distinction is particularly important in countries with multiple time zones.</p>'
     f'<h3>How to prepare for launch</h3><p>Verify your account region on the PlayStation Store or Xbox Store, install any available preload, and check the unlock time directly on the product page. The countdown is informative, not an access guarantee.</p>')
  else:
   content=(f'{breadcrumb(c,en,prefix)}<h2>Horário de lançamento do GTA 6 em {h(name)}, {h(co)}</h2>'
     f'<p>Em <strong>{h(time)}</strong>, a referência de desbloqueio regional da PlayStation Store chega ao horário previsto em <strong>{h(name)}</strong>. O contador acima acompanha esse mesmo instante absoluto. O fuso da cidade é <strong>{h(c["tz"])}</strong>, com conversão automática de horário.</p>'
     f'<div class="lead-time">{h(name)}: <strong>{h(time)}</strong> · LOJA {h(c["store"] )}</div>'
     f'<h3>Qual horário de lançamento é confiável?</h3><p>A Rockstar confirma <strong>19 de novembro de 2026</strong> à meia-noite local, mas não detalha um instante para cada cidade. O horário exibido converte a referência da <strong>loja regional {h(c["store"])}</strong> e pode ser diferente da meia-noite física de cidades em países com vários fusos.</p>'
     f'<h3>Como se preparar para jogar</h3><p>Confira a região da sua conta na PlayStation Store ou Xbox Store, faça o pré-carregamento quando disponível e consulte diretamente o horário de desbloqueio na página do jogo. O contador não garante o acesso imediato.</p>')
 else:
  content=(('<h2>When exactly does GTA 6 launch around the world?</h2><p>The official release date is <strong>Thursday, November 19, 2026</strong>, on PlayStation 5 and Xbox Series X|S. Rockstar Support specifies <strong>midnight local time</strong> in each region. Storefront-specific timestamps explain why launch windows begin in New Zealand, then spread west through Asia, Europe and the Americas.</p><h3>How this worldwide countdown works</h3><p>Each plotted city uses an absolute UTC launch timestamp, converted by the browser to its IANA time zone. This avoids the common mistake of counting down to the viewer’s midnight for every country. Cities within one national store can share an unlock moment even where their local clocks differ.</p><h3>Can you watch this page on a YouTube live stream?</h3><p>Yes. The dedicated <a href="'+prefix+'en/live/">OBS streaming scene</a> shows a clean, automatically updating 16:9 map and counter. No account, database or server-side process is needed.</p>') if en else
  ('<h2>Que dia e que horas GTA 6 lança no Brasil e no mundo?</h2><p>O lançamento oficial de <strong>Grand Theft Auto VI é quinta-feira, 19 de novembro de 2026</strong>, no PlayStation 5 e Xbox Series X|S. A Rockstar informa <strong>meia-noite local</strong> por região. As lojas digitais apresentam instantes regionais, por isso a Nova Zelândia chega primeiro à data e as Américas vêm depois.</p><h3>Como funciona o contador global</h3><p>Cada cidade do mapa usa um instante absoluto em UTC, convertido para o fuso IANA correspondente. Assim, o contador não confunde a meia-noite do visitante com a referência da loja. Em países grandes, cidades com fusos distintos podem compartilhar um mesmo desbloqueio nacional.</p><h3>Como transmitir a contagem regressiva no YouTube?</h3><p>Use a <a href="'+prefix+'live/">cena 16:9 para OBS</a>. O mapa e os contadores se atualizam sozinhos no navegador, sem banco de dados ou processo no servidor.</p>'))
 return content + source_note(en)

def meta_links(url,alter_en,alter_pt,site_url):
 if not site_url:return ''
 url,alter_en,alter_pt=(site_url.rstrip('/')+'/'+u for u in (url,alter_en,alter_pt))
 return (f'<link rel="canonical" href="{h(url)}">\n'
         f'<link rel="alternate" hreflang="en" href="{h(alter_en)}">\n'
         f'<link rel="alternate" hreflang="pt-BR" href="{h(alter_pt)}">\n'
         f'<link rel="alternate" hreflang="x-default" href="{h(alter_pt)}">\n'
         f'<meta property="og:url" content="{h(url)}">')

def render(lang,kind='home',c=None,site_url=''):
 en=lang=='en'; path=page_path(lang,kind,c)
 depth=len([x for x in path.split('/') if x]);prefix='../'*depth or './'
 home=prefix+('en/' if en else '')
 livehref=prefix+('en/live/' if en else 'live/')
 other=prefix+page_path('pt' if en else 'en',kind,c)
 title,desc=fmeta(en,kind,c)
 url=path
 switch=f'<a class="lang-switch" href="{h(other)}" aria-label="{"Switch to Portuguese" if en else "Mudar para inglês"}">{"PT-BR" if en else "EN-US"} ↗</a>'
 meta=meta_links(path,page_path('en',kind,c),page_path('pt',kind,c),site_url)
 og=(site_url.rstrip('/')+'/'+ 'assets/og-card.png') if site_url else prefix+'assets/og-card.png'
 faq_items=faq(en,c)
 faq_dom=''.join(f'<details><summary>{h(q)}</summary><p>{h(a)}</p></details>' for q,a in faq_items)
 intro_h1=('GTA 6 <em>WORLDWIDE COUNTDOWN</em>' if en else 'GTA 6 <em>CONTAGEM MUNDIAL</em>') if not c else ((f'GTA 6 <em>IN {h(city_name(c,en))}</em>' if en else f'GTA 6 <em>EM {h(city_name(c,en))}</em>'))
 teaser=('Track the November 19, 2026 launch by country, city and time zone. No refresh. No guessing.' if en else 'Acompanhe o lançamento de 19/11/2026 por país, cidade e fuso. Atualização automática, segundo a segundo.')
 map_alt='Stylized worldwide launch map' if en else 'Mapa ilustrado do mundo com regiões de lançamento'
 feed=(f'<section class="section" id="cities"><div class="section-kicker">// GLOBAL UNLOCK TIMES</div><h2>Release time by city</h2><p class="section-intro">Compare regional launch timestamps and open dedicated local countdown pages with explanatory timezone information.</p><div class="city-links">{city_tiles(en,prefix)}</div></section>'
    if en else f'<section class="section" id="cities"><div class="section-kicker">// HORÁRIOS NO MUNDO</div><h2>Horário de lançamento por cidade</h2><p class="section-intro">Compare as janelas regionais e abra páginas com contagem local e explicações sobre fusos e horário da loja.</p><div class="city-links">{city_tiles(en,prefix)}</div></section>')
 return f'''<!doctype html>
<html lang="{'en' if en else 'pt-BR'}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{h(title)}</title>
<meta name="description" content="{h(desc)}">
<meta name="theme-color" content="#0c1328">
<meta name="robots" content="{'noindex,follow' if kind=='live' else 'index,follow,max-image-preview:large'}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="GTA VI Zero Hour">
<meta property="og:locale" content="{'en_US' if en else 'pt_BR'}">
<meta property="og:title" content="{h(title)}">
<meta property="og:description" content="{h(desc)}">
<meta property="og:image" content="{h(og)}">
<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{h(title)}">
<meta name="twitter:description" content="{h(desc)}">
<meta name="twitter:image" content="{h(og)}">
{meta}
<link rel="icon" type="image/svg+xml" href="{prefix}assets/favicon.svg">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600;700&family=Rajdhani:wght@600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="{prefix}assets/style.css">
<script type="application/ld+json">{schema(en,kind,c)}</script>
<script>window.APP_LANG={json.dumps(lang)};window.APP_SELECTED={json.dumps(c['id'] if c else None)};window.APP_ROOT_PREFIX={json.dumps(prefix)};</script>
<script src="{prefix}assets/launch-data.js" defer></script><script src="{prefix}assets/app.js" defer></script>
</head>
<body class="{'live-page' if kind=='live' else ''}">
<div class="notice-strip">{'INDEPENDENT FAN PROJECT • NOT AFFILIATED WITH ROCKSTAR GAMES • STORE TIMES ARE REFERENCES' if en else 'PROJETO INDEPENDENTE DE FÃS • NÃO AFILIADO À ROCKSTAR GAMES • HORÁRIOS DAS LOJAS SÃO REFERÊNCIAS'}</div>
<div class="shell">
 <header class="site-header">
  <a class="brand" href="{home}" aria-label="GTA VI Zero Hour — home"><span class="brand-mark"><span>VI</span></span><span><span class="brand-title">ZERO<span>HOUR</span></span><span class="brand-sub">GLOBAL LAUNCH MONITOR / 2026</span></span></a>
  <nav class="main-nav" aria-label="{'Main navigation' if en else 'Navegação principal'}"><a href="{home}#map">{'Global map' if en else 'Mapa global'}</a><a href="{home}#cities">{'Cities' if en else 'Cidades'}</a><a href="{home}#faq">FAQ</a><a href="{livehref}">{'Streaming mode' if en else 'Modo live'}</a></nav>
  <div class="header-actions">{switch}<div class="onair"><span class="pulse"></span> {'LAUNCH TRACKER' if en else 'CONTAGEM AO VIVO'}</div></div>
 </header>
 <main>
  <section class="top-hero">
   <div><div class="eyebrow"><span class="pulse"></span>{'THE WAIT IS ALMOST OVER // NOV 19' if en else 'A ESPERA ESTÁ ACABANDO // 19 NOV'}</div><h1>{intro_h1}</h1><p class="hero-lede">{teaser}</p><div class="launch-date"><span class="diamond">◆</span><strong>19.11.2026</strong><span>·</span>{'PS5 & XBOX SERIES X|S' if en else 'PS5 E XBOX SERIES X|S'}<span class="diamond">◆</span></div></div>
   <div class="timer-wrap"><div class="timer-kicker" id="timer-mode">{'NEXT WORLD UNLOCK' if en else 'PRÓXIMA LIBERAÇÃO MUNDIAL'}</div>
    <div class="timer-digits" role="timer" aria-label="{'Launch countdown' if en else 'Contagem regressiva'}"><div class="timer-unit"><span class="timer-num" id="clock-days">00</span><small>{'DAYS' if en else 'DIAS'}</small></div><span class="timer-sep">:</span><div class="timer-unit"><span class="timer-num" id="clock-hours">00</span><small>HRS</small></div><span class="timer-sep">:</span><div class="timer-unit"><span class="timer-num" id="clock-minutes">00</span><small>MIN</small></div><span class="timer-sep">:</span><div class="timer-unit"><span class="timer-num" id="clock-seconds">00</span><small>SEC</small></div></div>
    <div class="target-line">{'Tracking' if en else 'Acompanhando'} <strong id="timer-target">—</strong></div><div class="control-row"><button type="button" class="soft-btn" id="reset-target">↻ {'Next worldwide' if en else 'Próxima mundial'}</button><button type="button" class="soft-btn" id="copy-link">⤴ {'Share' if en else 'Compartilhar'}</button><a class="soft-btn primary" href="{livehref}">◉ {'YouTube / OBS mode' if en else 'Modo YouTube / OBS'}</a></div>
   </div>
  </section>
  <div class="dashboard" id="map">
   <section class="panel" aria-label="{'World map' if en else 'Mapa mundial'}"><div class="panel-head"><div class="panel-head-title"><h2>// {'WORLD UNLOCK MAP' if en else 'MAPA DE LIBERAÇÃO MUNDIAL'}</h2><span class="panel-head-sub">{'CLICK A PIN TO TRACK THAT CITY' if en else 'CLIQUE NUM PONTO PARA ACOMPANHAR A CIDADE'}</span></div><div class="legend"><span><i></i>{'Window reached' if en else 'Janela iniciada'}</span><span class="future"><i></i>{'Upcoming' if en else 'Aguardando'}</span></div></div>
    <div class="map-box" id="world-map"><img class="world-svg" src="{prefix}assets/world.svg" alt="{map_alt}"><div class="world-glow"></div><span class="map-crosshair">LAT / LON : GLOBAL FEED</span><span class="map-side-label">V.1.0 // UTC</span><div class="map-focus"><small id="focus-type">{'NEXT WORLD UNLOCK' if en else 'PRÓXIMA LIBERAÇÃO MUNDIAL'}</small><h3><span id="focus-city">Auckland</span> <span style="color:var(--cyan)">●</span></h3><p id="focus-country">—</p><p id="focus-local-time">—</p><div class="utc-note" id="focus-utc">—</div></div></div>
    <div class="map-footer"><div><small>{'NEXT UNLOCK WINDOW' if en else 'PRÓXIMA JANELA'}</small><strong id="next-name">Auckland</strong><em id="next-time">—</em></div><div><small>{'WORLDWIDE PROGRESS' if en else 'PROGRESSO MUNDIAL'}</small><strong id="cities-reached">0 / 35</strong><em>{'cities tracked' if en else 'cidades monitoradas'}</em></div></div>
   </section>
   <aside class="panel region-panel"><div class="panel-head"><div class="panel-head-title"><h2>// {'REGIONAL RELEASE TIMES' if en else 'HORÁRIOS REGIONAIS'}</h2><span class="panel-head-sub">{'REGIONAL STORE REFERENCE · LOCAL CLOCK' if en else 'REFERÊNCIA DA LOJA · HORA LOCAL'}</span></div><span class="pulse"></span></div><div class="region-filter"><input id="region-search" type="search" class="search" aria-label="{'Search city or country' if en else 'Buscar cidade ou país'}" placeholder="{'Search city, country, region...' if en else 'Buscar cidade, país, região...'}"><button class="sort-btn" type="button" id="sort-cities" aria-label="{'Toggle sorting' if en else 'Alternar ordenação'}">UTC ↑</button></div><div class="region-list" id="region-list"><div class="no-results">{'Loading regions...' if en else 'Carregando regiões...'}</div></div><div class="region-foot"><span>{'INDEXED CITIES' if en else 'CIDADES INDEXADAS'} <span id="list-count">—</span></span><span>UTC / IANA</span></div></aside>
  </div>
  <div class="metric-grid" aria-label="{'Launch statistics' if en else 'Estatísticas do lançamento'}"><div class="metric"><small>{'OFFICIAL LAUNCH DATE' if en else 'DATA OFICIAL'}</small><strong>19 NOV</strong><p>2026 · ROCKSTAR GAMES</p></div><div class="metric"><small>{'CITIES IN THIS TRACKER' if en else 'CIDADES NO PAINEL'}</small><strong class="cyan" id="city-count">35</strong><p>{'Across global store regions' if en else 'Distribuídas por lojas regionais'}</p></div><div class="metric"><small>{'REGIONAL UTC WINDOWS REACHED' if en else 'JANELAS UTC ATINGIDAS'}</small><strong class="pink" id="waves-reached">0 / 15</strong><p>{'Unique launch timestamps' if en else 'Instantes únicos de lançamento'}</p></div><div class="metric"><small>{'GLOBAL CITY TRACKER PROGRESS' if en else 'PROGRESSO DAS CIDADES'}</small><strong id="global-percent">0%</strong><div class="progress-track"><span id="progress-fill"></span></div></div></div>
  {feed}
  <div class="article-layout" id="about"><article class="article-content">{article(en,prefix,c)}</article><aside class="info-card"><h3>{'How to read this tracker' if en else 'Como interpretar o painel'}</h3><p>{'Three things to keep in mind:' if en else 'Três pontos importantes:'}</p><ol>{('<li><strong>Official date:</strong> Nov 19, 2026.</li><li><strong>Time:</strong> local midnight according to Rockstar; specific store timestamps vary.</li><li><strong>Window reached:</strong> a scheduled time has passed, not proof that servers are accessible.</li>' if en else '<li><strong>Data oficial:</strong> 19/11/2026.</li><li><strong>Hora:</strong> meia-noite local conforme a Rockstar; instantes das lojas podem variar.</li><li><strong>Janela iniciada:</strong> horário previsto atingido, não é confirmação de acesso ao jogo.</li>')}</ol><a href="{h(SUPPORT)}" target="_blank" rel="noopener noreferrer">{'Read Rockstar Support' if en else 'Ver suporte da Rockstar'} ↗</a></aside></div>
  <section class="section" id="faq"><div class="section-kicker">// FAQ</div><h2>{'Frequently asked questions' if en else 'Perguntas frequentes sobre GTA 6'}</h2><div class="faq-list">{faq_dom}</div></section>
 </main>
 <footer class="disclaimer"><span>{'Independent fan project. Grand Theft Auto VI and related names are trademarks of their respective owners. No affiliation, endorsement or official live broadcast. Original map from Natural Earth (public domain).' if en else 'Projeto independente de fãs. Grand Theft Auto VI e nomes relacionados pertencem aos respectivos titulares. Sem afiliação, endosso ou transmissão oficial. Mapa baseado em Natural Earth (domínio público).'}</span><span><a href="{h(OFFICIAL)}" target="_blank" rel="noopener noreferrer">ROCKSTAR GAMES ↗</a> · {LAST_CHECK}</span></footer>
</div>
<section class="live-stage" aria-label="{'Live broadcast scene' if en else 'Cena de transmissão ao vivo'}"><div class="live-top"><div class="live-logo">VI <b>ZEROHOUR</b> <span style="color:#9eb0d4">/ GLOBAL COUNTDOWN</span></div><div class="live-lights"><span class="pulse"></span><div class="live-sub">NOV 19 · 2026</div><div class="live-live">● LIVE</div></div></div><div class="live-divider"></div><div class="live-hero"><div><div class="live-hero-kicker">◆ {'NEXT WORLDWIDE UNLOCK' if en else 'PRÓXIMA LIBERAÇÃO MUNDIAL'} ◆</div><h1 class="live-target" id="live-target">Auckland</h1><div class="live-target-country" id="live-target-country">—</div></div><div class="live-timer" role="timer"><div class="live-unit"><strong id="live-clock-days">00</strong><small>{'DAYS' if en else 'DIAS'}</small></div><div class="live-colon">:</div><div class="live-unit"><strong id="live-clock-hours">00</strong><small>HRS</small></div><div class="live-colon">:</div><div class="live-unit"><strong id="live-clock-minutes">00</strong><small>MIN</small></div><div class="live-colon">:</div><div class="live-unit"><strong id="live-clock-seconds">00</strong><small>SEC</small></div></div></div><div class="live-mid"><div class="live-map" id="live-map"><img class="world-svg" src="{prefix}assets/world.svg" alt="{map_alt}"><div class="world-glow"></div><div class="map-focus"><small>{'WORLDWIDE STATUS' if en else 'STATUS MUNDIAL'}</small><h3>GTA VI // ZERO HOUR</h3><p>{'Regional store unlock reference' if en else 'Referência de liberação regional'}</p></div></div><div class="live-side"><h2>// {'UNLOCK ORDER' if en else 'ORDEM DE LIBERAÇÃO'}</h2><div class="live-region-list" id="live-region-list"></div></div></div><div class="live-footer"><span class="live-watermark">GTA VI ZEROHOUR · <strong>{'INDEPENDENT FAN TRACKER' if en else 'PAINEL INDEPENDENTE'}</strong></span><span>{'TRACKED CITIES' if en else 'CIDADES MONITORADAS'} <strong id="waves-percent">0 / 15</strong> {'REGIONAL WINDOWS' if en else 'JANELAS UTC'}</span><span class="offline-note">{ 'NOT AFFILIATED WITH ROCKSTAR' if en else 'NÃO AFILIADO À ROCKSTAR' }</span></div><div class="live-progress"><span id="live-progress-fill"></span></div></section>
<div class="live-setup"><button class="soft-btn" id="live-fullscreen" type="button">⛶ {'Fullscreen' if en else 'Tela cheia'}</button></div>
<div id="toast" class="toast" hidden></div>
</body></html>'''

def main():
 parser=argparse.ArgumentParser(description='Render static bilingual GTA VI world countdown')
 parser.add_argument('--site-url',default=os.environ.get('SITE_URL',''),help='Your production URL, e.g. https://countdown.example.com. Required for canonical/absolute OG/sitemap.')
 args=parser.parse_args()
 site=args.site_url.rstrip('/')
 if site and not site.startswith('https://'):parser.error('--site-url must begin with https://')
 if OUT.exists():shutil.rmtree(OUT)
 (OUT/'assets').mkdir(parents=True)
 for f in ['world.svg','favicon.svg','og-card.png']:
  shutil.copy2(ROOT/'assets'/f,OUT/'assets'/f)
 shutil.copy2(SRC/'style.css',OUT/'assets/style.css')
 shutil.copy2(SRC/'app.js',OUT/'assets/app.js')
 (OUT/'assets/launch-data.js').write_text('window.GTA_CITIES='+json.dumps(CITIES,ensure_ascii=False,separators=(',',':'))+';\n',encoding='utf-8')
 paths=[]
 for lang in ['pt','en']:
  for kind,c in [('home',None),('live',None)]+[('city',c) for c in CITIES]:
   path=page_path(lang,kind,c)
   target=OUT/path/'index.html' if path else OUT/'index.html'
   target.parent.mkdir(parents=True,exist_ok=True)
   target.write_text(render(lang,kind,c,site),encoding='utf-8')
   if kind!='live':paths.append(path)
 robots=['User-agent: *','Allow: /']
 if site:robots.append('Sitemap: '+site+'/sitemap.xml')
 (OUT/'robots.txt').write_text('\n'.join(robots)+'\n',encoding='utf-8')
 if site:
  entries=''.join(f'<url><loc>{h(site+"/"+path)}</loc><lastmod>{LAST_CHECK}</lastmod><changefreq>hourly</changefreq><priority>{"1.0" if path in ("","en/") else ".7"}</priority></url>' for path in paths)
  (OUT/'sitemap.xml').write_text('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+entries+'</urlset>',encoding='utf-8')
 (OUT/'404.html').write_text(render('pt','home',None,site).replace('<title>','<title>404 · '),encoding='utf-8')
 print(f'Generated {len(paths)} indexed pages + two OBS scenes in {OUT} ({len(CITIES)} cities).')
 if not site:print('No site URL: canonical/absolute OG/sitemap will be generated after --site-url is set.')

if __name__=='__main__':main()
