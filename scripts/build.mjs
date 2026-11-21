#!/usr/bin/env node
// Build a fully static fan-tracker using only Node 20+ built-ins; no npm or Python required.
import { readFile, writeFile, mkdir, copyFile, rm } from "node:fs/promises";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const input = async (file) => readFile(join(root, file), "utf8");
const cities = JSON.parse(await input("src/data/regions.json"));
const world = JSON.parse(await input("src/data/world.json"));
const config = JSON.parse(await input("site.config.json"));
const siteUrl = (
  process.argv
    .find((s) => s.startsWith("--site-url="))
    ?.split("=")
    .slice(1)
    .join("=") ||
  config.siteUrl ||
  ""
)
  .trim()
  .replace(/\/+$/, "");
if (siteUrl && !/^https:\/\/[^/]+/.test(siteUrl))
  throw Error("A URL pública deve usar https://dominio.com.");
const esc = (t) =>
  String(t ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
const out = join(root, "dist");
await rm(out, { force: true, recursive: true });
await mkdir(join(out, "assets"), { recursive: true });
await copyFile(join(root, "src/site.css"), join(out, "assets/site.css"));
await copyFile(join(root, "src/app.js"), join(out, "assets/app.js"));
await copyFile(join(root, "public/hero.webp"), join(out, "assets/hero.webp"));
await copyFile(
  join(root, "public/favicon.svg"),
  join(out, "assets/favicon.svg"),
);
const data = `window.GTA_CITIES=${JSON.stringify(cities)};window.GTA_WORLD=${JSON.stringify(world)};`;
await writeFile(join(out, "assets/data.js"), data);
const waves = [...new Set(cities.map((c) => c.utc))];
const ordered = cities
  .slice()
  .sort(
    (a, b) =>
      Date.parse(a.utc) - Date.parse(b.utc) || a.city.localeCompare(b.city),
  );
const titleFor = (c) => c.city;
const loc = (c, en) => (en ? c.cityEn || c.city : c.city);
const nation = (c, en) => (en ? c.countryEn : c.country);
// English is the default experience at the site root. Portuguese is available
// only when visitors choose it from the language switcher.
const cityPath = (c, en) =>
  en ? `/release-time/${c.id}/` : `/pt-br/horarios/${c.id}/`;
const siteLink = (path) => siteUrl + path;
const timeText = (c, en) =>
  new Intl.DateTimeFormat(en ? "en-US" : "pt-BR", {
    timeZone: c.tz,
    dateStyle: "full",
    timeStyle: "short",
    hourCycle: "h23",
  }).format(new Date(c.utc));
const shortTime = (c, en) =>
  new Intl.DateTimeFormat(en ? "en-US" : "pt-BR", {
    timeZone: c.tz,
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(c.utc));
const flagUrl = (c) =>
  `https://flagcdn.com/w80/${String(c.store).toLowerCase()}.png`;
const official =
  "https://support.rockstargames.com/articles/29jV3Cv2cCgvwM1XgtMO5o/grand-theft-auto-vi-regional-pre-load-and-release-times-on-playstation-5-and-xbox-series-x-or-s";
const origin = "https://www.rockstargames.com/VI";
function page({ en = false, c = null } = {}) {
  const lang = en ? "en" : "pt-BR";
  const prefix = en ? "/" : "/pt-br/";
  const path = c ? cityPath(c, en) : prefix;
  const ptPath = c ? cityPath(c, false) : "/pt-br/";
  const enPath = c ? cityPath(c, true) : "/";
  const title = c
    ? en
      ? `GTA 6 release time in ${loc(c, true)} — live countdown, map & time zone`
      : `Que horas lança GTA 6 em ${loc(c, false)}? Contagem, mapa e horário`
    : en
      ? "GTA 6 Countdown — Global Release Times, World Map & Launch Tracker"
      : "GTA 6 Countdown — Contagem regressiva, mapa mundial e horários por cidade";
  const desc = c
    ? en
      ? `Find the scheduled GTA VI launch window in ${loc(c, true)}, ${nation(c, true)}: ${timeText(c, true)}. Live global countdown, city-by-city schedule and world map.`
      : `Horário previsto do GTA 6 em ${loc(c, false)}, ${nation(c, false)}: ${timeText(c, false)}. Veja a contagem regressiva em tempo real e o mapa mundial.`
    : en
      ? "Live GTA VI release countdown for November 19, 2026. Explore regional release times, an interactive world map, 71 tracked cities, official trailers and launch information."
      : "Contagem regressiva ao vivo do GTA 6 para 19 de novembro de 2026. Mapa mundial interativo, horários por região, 71 cidades, vídeos e trailers oficiais.";
  const canonical = siteUrl
    ? `<link rel="canonical" href="${esc(siteLink(path))}"><link rel="alternate" hreflang="pt-BR" href="${esc(siteLink(ptPath))}"><link rel="alternate" hreflang="en" href="${esc(siteLink(enPath))}"><link rel="alternate" hreflang="x-default" href="${esc(siteLink("/"))}">`
    : "";
  const og = siteUrl
    ? `<meta property="og:url" content="${esc(siteLink(path))}"><meta property="og:image" content="${esc(siteLink("/assets/hero.webp"))}"><meta name="twitter:image" content="${esc(siteLink("/assets/hero.webp"))}">`
    : "";
  const structured = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        name: "GTA VI Zero Hour",
        url: siteUrl || undefined,
        inLanguage: lang,
        description: desc,
        publisher: { "@type": "Person", name: "victor99dev" },
      },
      {
        "@type": "WebPage",
        name: title,
        url: siteUrl ? siteLink(path) : undefined,
        description: desc,
        inLanguage: lang,
        dateModified: "2026-11-18",
        about: {
          "@type": "VideoGame",
          name: "Grand Theft Auto VI",
          alternateName: "GTA 6",
          gamePlatform: ["PlayStation 5", "Xbox Series X|S"],
          datePublished: "2026-11-19",
          url: origin,
        },
      },
      {
        "@type": "FAQPage",
        mainEntity: (en
          ? [
              [
                "When does GTA 6 launch?",
                "Rockstar Games lists November 19, 2026, for PS5 and Xbox Series X|S. Regional windows depend on the store.",
              ],
              [
                "Which country gets GTA 6 first?",
                "New Zealand is the earliest supported store region shown in this tracker.",
              ],
              [
                "Is this an official Rockstar site?",
                "No. This is an independent fan countdown created by developer victor99dev.",
              ],
            ]
          : [
              [
                "Quando lança GTA 6?",
                "A Rockstar Games confirma 19 de novembro de 2026 no PS5 e Xbox Series X|S. Os horários variam conforme a região da loja.",
              ],
              [
                "Qual país recebe GTA 6 primeiro?",
                "A Nova Zelândia é a primeira região de loja acompanhada neste painel.",
              ],
              [
                "O site é oficial da Rockstar?",
                "Não. É uma contagem independente de fãs criada pelo desenvolvedor victor99dev.",
              ],
            ]
        ).map(([name, text]) => ({
          "@type": "Question",
          name,
          acceptedAnswer: { "@type": "Answer", text },
        })),
      },
    ],
  };
  if (c)
    structured["@graph"].push({
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: en ? "Home" : "Início",
          item: siteUrl ? siteLink(prefix) : undefined,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: loc(c, en),
          item: siteUrl ? siteLink(path) : undefined,
        },
      ],
    });
  const head = `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#1a102f"><title>${esc(title)}</title><meta name="description" content="${esc(desc)}"><meta name="robots" content="index,follow,max-image-preview:large"><meta property="og:type" content="website"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta name="twitter:card" content="summary_large_image">${canonical}${og}<link rel="icon" type="image/svg+xml" href="/assets/favicon.svg"><link rel="preload" as="image" href="/assets/hero.webp"><link rel="stylesheet" href="/assets/site.css"><script type="application/ld+json">${JSON.stringify(structured).replace(/</g, "\\u003c")}</script><script defer src="/assets/data.js"></script><script defer src="/assets/app.js"></script></head>`;
  const menu = (
    en
      ? [
          ["#map", "Map"],
          ["#times", "Release times"],
          ["#trailers", "Trailers"],
          ["#radio", "Radio"],
          ["#live-ready", "Live guide"],
          ["#faq", "FAQ"],
        ]
      : [
          ["#map", "Mapa"],
          ["#times", "Horários"],
          ["#trailers", "Trailers"],
          ["#radio", "Rádios"],
          ["#live-ready", "Guia de live"],
          ["#faq", "Perguntas"],
        ]
  )
    .map(([href, name]) => `<a href="${prefix}${href}">${name}</a>`)
    .join("");
  const support = `<section class="support-top shell" id="donate" aria-label="${en ? "Support the site" : "Apoie o site"}"><div class="support-copy"><span class="eyebrow">♥ ${en ? "SUPPORT THE SITE" : "APOIE O SITE"}</span><h2>${en ? "Help keep GTA VI Zero Hour online" : "Ajude a manter o GTA VI Zero Hour no ar"}</h2></div><a href="${esc(config.donationPix)}" target="_blank" rel="noopener noreferrer" class="support-button pix" aria-label="${en ? "Support with Pix" : "Doar via Pix (Brasil)"}"><span class="button-title">◇ ${en ? "Donate via Pix" : "DOAR VIA PIX 🇧🇷"}</span><small>${en ? "Instant bank payment, popular in Brazil" : "Transferência instantânea no Brasil"}</small><span class="button-footer">livepix.gg/vitorcalltv ↗</span></a><a href="${esc(config.donationPayPal)}" target="_blank" rel="noopener noreferrer" class="support-button paypal"><span class="button-title">♥ PAYPAL / TIP</span><small>${en ? "International support through Streamlabs" : "Apoie do exterior via Streamlabs"}</small><span class="button-footer">streamlabs.com/vitorcalltv/tip ↗</span></a></section>`;
  const hero = `<section class="hero" aria-label="GTA 6 release countdown"><div class="hero-inner"><span class="hero-tag">${en ? "NOV 19, 2026 · GLOBAL RELEASE" : "19 NOV 2026 · LANÇAMENTO MUNDIAL"}</span><h1>${c ? `GTA VI <em>${esc(loc(c, en))}</em>` : "GTA VI <em>ZERO HOUR</em>"}</h1><p class="hero-description">${en ? "Track the countdown as each region reaches its scheduled Grand Theft Auto VI launch time. Choose a city on the interactive map." : "Acompanhe o lançamento do GTA 6 em tempo real. Cada país fica rosa no mapa quando chega sua janela de desbloqueio."}</p><div class="timer-card" role="timer" aria-label="${en ? "Countdown to next global launch wave" : "Contagem para a próxima região"}"><div class="timer-header"><span id="frontier-title">${en ? "NEXT WORLDWIDE UNLOCK" : "PRÓXIMA LIBERAÇÃO MUNDIAL"}</span><span>● ${en ? "LIVE COUNTDOWN" : "CONTAGEM AO VIVO"}</span></div><div class="digits">${["days", "hours", "minutes", "seconds"].map((name, i) => `${i ? '<span class="colon">:</span>' : ""}<span class="digit-pair"><strong id="timer-${name}">00</strong><small>${(en ? ["DAYS", "HOURS", "MIN", "SEC"] : ["DIAS", "HORAS", "MIN", "SEG"])[i]}</small></span>`).join("")}</div><div class="timer-message" id="frontier">${en ? "Updating next region..." : "Atualizando próxima região..."}</div></div></div></section>`;
  const cityContent = c
    ? `<section class="city-seo" aria-labelledby="city-seo-title"><span class="overline">${en ? "RELEASE TIME IN YOUR CITY" : "HORÁRIO NA SUA CIDADE"}</span><h2 id="city-seo-title">${en ? `When does GTA 6 launch in ${esc(loc(c, true))}?` : `Que horas lança GTA 6 em ${esc(loc(c, false))}?`}</h2><p>${en ? `The scheduled regional launch window tracked for <strong>${esc(loc(c, true))}, ${esc(nation(c, true))}</strong> is <strong>${esc(timeText(c, true))}</strong> (${esc(c.tz)}). This countdown is derived from the regional store window. Your platform storefront is the final authority for availability.` : `A janela regional de lançamento acompanhada para <strong>${esc(loc(c, false))}, ${esc(nation(c, false))}</strong> está prevista para <strong>${esc(timeText(c, false))}</strong> (fuso ${esc(c.tz)}). O site converte o horário da loja regional para o fuso da cidade. Consulte sua loja de PS5 ou Xbox para confirmar a liberação.`}</p><p><a href="${prefix}#map">${en ? "Return to the world map" : "Voltar ao mapa mundial"}</a></p></section>`
    : "";
  const faq = en
    ? [
        [
          "When does GTA VI launch?",
          "Rockstar announced November 19, 2026, for PS5 and Xbox Series X|S. The time you see depends on the region/store.",
        ],
        [
          "Which country is first?",
          "New Zealand is the first supported regional release window in our tracker. Locations with identical UTC times release simultaneously.",
        ],
        [
          "Does pink mean the game is playable?",
          "Pink means the scheduled release time has been reached; it is not a live check of game access or Rockstar servers.",
        ],
        [
          "Is this site affiliated with Rockstar?",
          "No. GTA VI Zero Hour is an independent, unofficial fan project by victor99dev.",
        ],
      ]
    : [
        [
          "Quando lança GTA 6 no Brasil?",
          "O lançamento está previsto para 19/11/2026 à 00h de Brasília, conforme a janela regional BR. Em outras cidades brasileiras, o relógio local pode ser diferente.",
        ],
        [
          "Quem recebe GTA 6 primeiro?",
          "A Nova Zelândia aparece primeiro entre as regiões de loja acompanhadas. Cidades com o mesmo instante UTC ficam liberadas juntas.",
        ],
        [
          "O mapa rosa significa que já dá para jogar?",
          "Não necessariamente. Rosa indica que a janela de horário prevista chegou. Não é uma verificação da sua conta ou dos servidores.",
        ],
        [
          "Este site é da Rockstar Games?",
          "Não. É um projeto independente de fãs do desenvolvedor victor99dev, sem vínculo oficial.",
        ],
      ];
  const videoCards = [
    {
      id: "QdBZY2fkU-0",
      label: en ? "Official Trailer 1" : "Trailer oficial 1",
      subtitle: "Rockstar Games · Dec 2023",
    },
    {
      id: "VQRLujxTm3c",
      label: en ? "Official Trailer 2" : "Trailer oficial 2",
      subtitle: "Rockstar Games · May 2025",
    },
    {
      id: "tJbzMqJGH4k",
      label: en
        ? "An Extended Look (Netflix preview)"
        : "Um olhar estendido — Netflix / YouTube",
      subtitle: "Rockstar Games · Aug 2026",
    },
  ];
  const videos = videoCards
    .map(
      (v) =>
        `<article class="video-card"><button type="button" class="video-thumb" data-video="${v.id}" aria-label="${esc(v.label)}"><img loading="lazy" src="https://i.ytimg.com/vi/${v.id}/hqdefault.jpg" alt="${esc(v.label)}"><span class="play-bubble">▶</span></button><div class="video-copy"><strong>${esc(v.label)}</strong><small>${esc(v.subtitle)}</small><a target="_blank" rel="noopener noreferrer" href="https://www.youtube.com/watch?v=${v.id}">${en ? "Open on YouTube" : "Abrir no YouTube"} ↗</a></div></article>`,
    )
    .join("");
  const stations = [
    [
      "Cocoteo FM",
      "Modern Latin",
      en ? "El Martillo and La Gata" : "El Martillo e La Gata",
    ],
    [
      "Back Country Radio",
      "Renegade country",
      en ? "MW and Delta Dawne" : "MW e Delta Dawne",
    ],
    [
      "AfroBank FM",
      "Amapiano, African classics & 3-step",
      en ? "Burna and Palmsy" : "Burna e Palmsy",
    ],
    [
      "The Chamber 106.6",
      "Metal",
      en ? "DJ Kerry and DJ Tom" : "DJ Kerry e DJ Tom",
    ],
    ["Flash FM", "Pop", en ? "Robyn and Alex" : "Robyn e Alex"],
    [
      "Dirty South Classics",
      "Southern rap & hip-hop classics",
      en ? "Trick and Trina" : "Trick e Trina",
    ],
  ];
  const radioSection = `<section class="radio-section" id="radio" aria-labelledby="radio-title"><div class="section-header"><div><span class="overline">03 / ${en ? "ON THE AIR" : "NO AR"}</span><h2 id="radio-title">${en ? "GTA VI radio stations" : "Rádios do GTA VI"}</h2><p>${en ? "Six stations officially previewed by Rockstar Games. More in-game radio and podcasts are expected in Leonida." : "Seis rádios oficialmente apresentadas pela Rockstar Games. Mais estações e podcasts farão parte de Leonida."}</p></div><a class="radio-source" href="https://www.rockstargames.com/VI/music/flash-fm" target="_blank" rel="noopener noreferrer">${en ? "Official previews" : "Prévias oficiais"} ↗</a></div><div class="radio-grid">${stations.map(([name, genre, hosts], index) => `<article class="radio-card"><span class="radio-number">0${index + 1}</span><h3>${esc(name)}</h3><p>${esc(genre)}</p><small>${en ? "Featuring" : "Com"} ${esc(hosts)}</small></article>`).join("")}</div><p class="radio-note">${en ? "Station names, genres and featured presenters are based on Rockstar’s official music page." : "Nomes, gêneros e apresentadores seguem a página oficial de música da Rockstar."}</p></section>`;
  const liveGuideSection = `<section class="live-guide" id="live-ready" aria-labelledby="live-ready-title"><div class="section-header"><div><span class="overline">04 / ${en ? "LIVE READY" : "PRONTO PARA A LIVE"}</span><h2 id="live-ready-title">${en ? "Going live for GTA VI? Start ready." : "Vai fazer live de GTA VI? Entre pronto."}</h2><p>${en ? "A quick guide for a smoother, safer launch-night stream." : "Um guia rápido para uma transmissão de estreia mais tranquila e segura."}</p></div></div><div class="live-guide-grid"><article class="live-guide-card"><span class="guide-step">01</span><h3>${en ? "Test before the countdown" : "Teste antes da contagem"}</h3><p>${en ? "Record a short test, check your microphone, game audio, scene transitions and internet backup before viewers arrive." : "Faça um teste curto: microfone, áudio do jogo, transições de cena e uma conexão de reserva antes de o público chegar."}</p></article><article class="live-guide-card"><span class="guide-step">02</span><h3>${en ? "Set a clear run of show" : "Defina um roteiro simples"}</h3><p>${en ? "Prepare an opening, a few talking points and a closing. Pin the release-time link and explain which regional clock you are following." : "Prepare abertura, alguns tópicos e encerramento. Fixe o link dos horários e diga qual relógio regional você está acompanhando."}</p></article><article class="live-guide-card"><span class="guide-step">03</span><h3>${en ? "Keep the stream rights-safe" : "Cuide dos direitos da transmissão"}</h3><p>${en ? "Do not assume background music, radio, game audio or trailers are cleared for a live broadcast. Use material you are licensed to use and check each platform’s rules." : "Não presuma que música, rádio, áudio do jogo ou trailers estão liberados para transmissão. Use material licenciado e confira as regras da plataforma."}</p></article></div><div class="live-checklist"><div><span class="overline">${en ? "TWO-MINUTE CHECKLIST" : "CHECKLIST DE DOIS MINUTOS"}</span><h3>${en ? "Before you press “Go live”" : "Antes de clicar em “Iniciar live”"}</h3></div><ul><li>${en ? "Stable internet, charger and a backup plan." : "Internet estável, carregador e plano B."}</li><li>${en ? "Notifications and private browser tabs are off-screen." : "Notificações e abas privadas estão fora da tela."}</li><li>${en ? "Title, thumbnail and chat rules are ready." : "Título, miniatura e regras do chat estão prontos."}</li><li>${en ? "No unlicensed background audio is playing." : "Nenhum áudio de fundo sem licença está tocando."}</li></ul></div></section>`;
  const tickerCards = [...ordered, ...ordered]
    .map(
      (c) =>
        `<a class="schedule-card" href="${cityPath(c, en)}"><img src="${flagUrl(c)}" alt="${esc(nation(c, en))} flag" width="40" height="30" loading="lazy"><span><strong>${esc(loc(c, en))}</strong><small>${esc(nation(c, en))}</small></span><time>${esc(shortTime(c, en))}</time></a>`,
    )
    .join("");
  const ticker = `<section class="schedule-strip" aria-label="${en ? "Global release schedule" : "Programação global de lançamento"}"><div class="schedule-strip-head"><span class="overline">${en ? "GLOBAL SCHEDULE" : "PROGRAMAÇÃO GLOBAL"}</span><strong>${en ? "Release times by city" : "Horários por cidade"}</strong><a href="/live/">${en ? "Open live dashboard" : "Abrir painel de live"} ↗</a></div><div class="schedule-marquee"><div class="schedule-track">${tickerCards}</div></div></section>`;
  const body = `<body data-city="${c ? esc(c.id) : ""}"><div class="announcement">${en ? "UNOFFICIAL FAN RELEASE TRACKER — NOVEMBER 19, 2026" : "CONTAGEM INDEPENDENTE DE FÃS — LANÇAMENTO EM 19 DE NOVEMBRO DE 2026"}</div><header class="topbar"><div class="shell topbar-inner"><a href="${prefix}" class="brand" aria-label="GTA VI Zero Hour"><span class="brand-symbol">VI</span><span>GTA VI<small>ZERO HOUR</small></span></a><nav class="nav" aria-label="${en ? "Main navigation" : "Navegação principal"}">${menu}<a href="${prefix}#donate" class="cta-nav">♥ ${en ? "SUPPORT" : "APOIE"}</a></nav><div class="lang-switch"><a href="${ptPath}" class="${en ? "" : "active"}">PT</a> / <a href="${enPath}" class="${en ? "active" : ""}">EN</a></div></div></header><main class="shell">${support}${hero}<div class="under-hero"><span><strong>★ ${en ? "Confirmed release date" : "Data confirmada"}: 19/11/2026.</strong> ${en ? "Regional launch times vary by storefront." : "Horários regionais dependem da loja."}</span><a href="${official}" target="_blank" rel="noopener noreferrer">${en ? "Rockstar source ↗" : "Fonte: Rockstar Support ↗"}</a></div>${cityContent}<section id="map" aria-labelledby="map-title"><div class="section-header"><div><span class="overline">01 / ${en ? "GLOBAL RELEASE" : "LIBERAÇÃO MUNDIAL"}</span><h2 id="map-title">${en ? "The world unlocks in waves" : "O mundo fica rosa por etapas"} 🌎</h2><p>${en ? "Countries turn pink once their tracked release window passes. Pins use geographic coordinates." : "Países ficam rosa depois do horário regional previsto. Pontos posicionados por coordenadas geográficas."}</p></div><span class="badge-muted">● ${cities.length} ${en ? "CITIES" : "CIDADES"} · ${waves.length} ${en ? "WAVES" : "ONDAS"}</span></div><div class="launch-layout"><article class="panel map-panel"><div class="panel-head"><div><strong>◉ ${en ? "WORLD RELEASE MAP" : "MAPA GLOBAL DO LANÇAMENTO"}</strong><br><small>${en ? "Click any pin to explore" : "Clique em qualquer ponto para selecionar a cidade"}</small></div><div class="legend"><span><i class="yes"></i>${en ? "Reached" : "Liberado"}</span><span><i class="next"></i>${en ? "Pending" : "Aguardando"}</span></div></div><div class="map-surface"><svg id="world-map" viewBox="0 0 1200 548" role="img" aria-label="${en ? "Live world release map" : "Mapa mundial da liberação do GTA 6"}"></svg></div><div class="map-callout"><div><span class="eyebrow" id="selected-state">${en ? "NEXT REGION" : "PRÓXIMA REGIÃO"}</span><br><strong id="selected-city">🇳🇿 Auckland</strong><p><span id="selected-country">Nova Zelândia</span> · <span id="selected-datetime">00:00</span></p><p id="selected-source">${en ? "Regional schedule" : "Janela regional"}</p></div><a id="selected-link" href="${prefix}" class="status" aria-label="${en ? "City details" : "Detalhes da cidade"}">${en ? "City details" : "Ver detalhes"} ↗</a></div><div class="mini-stats"><div><strong id="stat-countries">0</strong><small>${en ? "Countries reached" : "Países liberados"}</small></div><div><strong id="stat-cities">0</strong><small>${en ? "Cities reached" : "Cidades liberadas"}</small></div><div><strong id="stat-waves">0</strong><small>${en ? "Launch waves reached" : "Ondas liberadas"}</small></div></div></article><aside class="panel" id="times"><div class="panel-head"><div><strong>◷ RELEASE TIMES BY CITY</strong><br><small>${en ? "Chronological UTC unlock order" : "Do primeiro horário absoluto ao último (UTC)"}</small></div><span class="badge-muted" id="result-count">${cities.length}/${cities.length}</span></div><div class="city-controls"><input id="search-cities" type="search" autocomplete="off" placeholder="${en ? "Search city or country" : "Buscar cidade ou país"}" aria-label="${en ? "Search city or country" : "Buscar cidade ou país"}"><button type="button" id="filter-future" aria-pressed="false">${en ? "Pending only" : "Só aguardando"}</button></div><div class="city-list" id="city-list">${ordered
    .slice(0, 5)
    .map(
      (r, i) =>
        `<a class="city-row" href="${cityPath(r, en)}"><span class="rank">${i + 1}</span><span class="city-name"><strong class="city-title">${esc(r.flag)} ${esc(loc(r, en))}</strong><small class="city-sub">${esc(nation(r, en))}</small></span><span class="city-clock"><strong>${esc(timeText(r, en))}</strong></span></a>`,
    )
    .join(
      "",
    )}</div><div class="city-footer">${en ? "Window reached ≠ online-server confirmation. Rows are based on regional store clocks." : "Janela iniciada ≠ garantia de acesso à conta. Referência: horário regional da loja."}</div></aside></div></section><div class="spotlight"><div><span class="eyebrow">✦ ${en ? "WORLDWIDE LAUNCH" : "LANÇAMENTO MUNDIAL"}</span><br><strong>${en ? "New Zealand leads the global countdown" : "Nova Zelândia abre a contagem mundial"}</strong><small>${en ? "Then Australia, Asia, Europe and the Americas — ordered by UTC instant." : "Depois Austrália, Ásia, Europa e Américas — em ordem de instante UTC."}</small></div><a href="${prefix}#times">${en ? "View all cities" : "Ver todas as cidades"} ↗</a></div><section class="media-section" id="trailers"><div class="section-header"><div><span class="overline">02 / ${en ? "WATCH" : "ASSISTA"}</span><h2>${en ? "Official GTA VI trailers and videos" : "Trailers e vídeos do GTA VI"}</h2><p>${en ? "Original Rockstar Games videos, played through YouTube. Netflix special linked separately." : "Vídeos originais da Rockstar via YouTube. Especial da Netflix com link oficial."}</p></div></div><div class="video-grid">${videos}<article class="video-card netflix-card"><a class="video-thumb" href="https://www.netflix.com/tudum/pt-br/artigos/grand-theft-auto-6-um-olhar-estendido" target="_blank" rel="noopener noreferrer"><span>NETFLIX ↗</span></a><div class="video-copy"><strong>${en ? "Netflix Tudum: An Extended Look" : "Netflix Tudum: Um Olhar Estendido"}</strong><small>${en ? "Official Netflix article" : "Matéria oficial da Netflix"}</small><a href="https://www.netflix.com/tudum/pt-br/artigos/grand-theft-auto-6-um-olhar-estendido" target="_blank" rel="noopener noreferrer">${en ? "View on Netflix" : "Ver na Netflix"} ↗</a></div></article></div><p style="text-align:right;margin-top:12px;font-size:12px"><a href="https://www.rockstargames.com/VI/launch-trailer" target="_blank" rel="noopener noreferrer" style="color:#ffadd8;text-decoration:underline">${en ? "Watch the official Launch Trailer (Oct 2026)" : "Assista ao trailer oficial de lançamento (out/2026)"} ↗</a></p></section><aside class="music-section"><div><span class="overline">♫ ${en ? "MUSIC FOR THE HYPE" : "MÚSICA PARA O HYPE"}</span><h2>${en ? "Copyright-safe music sources" : "Música para acompanhar a espera"}</h2><p>${en ? "Explore NCS playlists or YouTube Audio Library. Check each track’s licence and credit the artists before using in your own livestream." : "Explore playlists da NCS ou a Biblioteca de Áudio do YouTube. Confira a licença de cada faixa e credite os artistas antes de transmitir."}</p></div><div class="music-links"><a target="_blank" rel="noopener noreferrer" href="https://ncs.io/playlists">▶ NCS ${en ? "Playlists" : "Playlists"}</a><a target="_blank" rel="noopener noreferrer" href="https://www.youtube.com/audiolibrary">♫ YouTube Audio Library</a></div></aside><section class="faq-section" id="faq"><div class="section-header"><div><span class="overline">03 / FAQ</span><h2>${en ? "Frequently asked questions" : "Perguntas frequentes sobre o GTA 6"}</h2></div></div><div class="faq-grid">${faq.map(([q, a]) => `<article class="faq-item"><h3>${esc(q)}</h3><p>${esc(a)}</p></article>`).join("")}</div></section></main><footer class="footer"><div class="shell footer-inner"><span>© 2026 GTA VI ZERO HOUR · ${en ? "Unofficial fan project" : "Projeto de fãs independente"} · ${esc(config.author)}.</span><div class="footer-links"><a href="${origin}" target="_blank" rel="noopener noreferrer">Rockstar Games ↗</a><a href="${official}" target="_blank" rel="noopener noreferrer">${en ? "Official release information" : "Horários oficiais"} ↗</a><a href="${config.donationPix}" target="_blank" rel="noopener noreferrer">♥ ${en ? "Support" : "Apoie"}</a></div></div><div class="shell" style="padding-top:9px;color:#857b9c">${en ? "Not affiliated with Rockstar Games or Take-Two Interactive. Third-party trademarks belong to their owners." : "Sem vínculo com Rockstar Games ou Take-Two Interactive. Marcas pertencem aos respectivos titulares."}</div></footer><div id="toast" role="status" hidden></div></body></html>`;
  return (head + body)
    .replace(
      '</section><div class="under-hero"',
      `</section>${ticker}<div class="under-hero"`,
    )
    .replace(
      '</aside><section class="faq-section"',
      `</aside>${radioSection}${liveGuideSection}<section class="faq-section"`,
    );
}
function livePage() {
  const cards = ordered
    .map(
      (c, i) =>
        `<a class="live-city" href="${cityPath(c, true)}"><span>${String(i + 1).padStart(2, "0")}</span><img src="${flagUrl(c)}" alt="${esc(c.countryEn)} flag" width="40" height="30"><strong>${esc(c.cityEn || c.city)}</strong><time>${esc(shortTime(c, true))}</time></a>`,
    )
    .join("");
  const ticker = [...ordered, ...ordered]
    .map(
      (c) =>
        `<span><img src="${flagUrl(c)}" alt="" width="32" height="24">${esc(c.cityEn || c.city)} <b>${esc(shortTime(c, true))}</b></span>`,
    )
    .join("");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#100b20"><title>GTA VI Zero Hour — Live Dashboard</title><meta name="robots" content="noindex"><link rel="stylesheet" href="/assets/site.css"><script defer src="/assets/data.js"></script><script defer src="/assets/app.js"></script></head><body class="live-board" data-city=""><main class="live-canvas"><header class="live-header"><div><span class="live-kicker">GRAND THEFT AUTO VI</span><h1>ZERO HOUR <em>LIVE</em></h1></div><div class="live-countdown"><span id="frontier-title">NEXT WORLDWIDE UNLOCK</span><div><b id="timer-days">00</b><i>:</i><b id="timer-hours">00</b><i>:</i><b id="timer-minutes">00</b><i>:</i><b id="timer-seconds">00</b></div><small>DAYS &nbsp;&nbsp;&nbsp;&nbsp; HOURS &nbsp;&nbsp;&nbsp;&nbsp; MINUTES &nbsp;&nbsp;&nbsp;&nbsp; SECONDS</small></div></header><section class="live-grid"><article class="live-map-card"><div class="live-panel-title"><span>LIVE WORLD RELEASE MAP</span><b id="frontier">Updating next region...</b></div><div class="live-map"><svg id="world-map" viewBox="0 0 1200 548" role="img" aria-label="Live world release map"></svg></div><div class="live-selected"><span id="selected-state">NEXT REGION</span><strong id="selected-city">Auckland</strong><small><span id="selected-country"></span> · <span id="selected-datetime"></span></small><em id="selected-source"></em></div><div class="live-stats"><div><b id="stat-countries">0</b><span>COUNTRIES UNLOCKED</span></div><div><b id="stat-cities">0</b><span>CITIES UNLOCKED</span></div><div><b id="stat-waves">0</b><span>LAUNCH WAVES</span></div></div></article><aside class="live-list-card"><div class="live-panel-title"><span>GLOBAL RELEASE SCHEDULE</span><b id="result-count">71 / 71</b></div><div id="city-list" class="live-city-list">${cards}</div></aside></section><footer class="live-ticker"><div>${ticker}</div></footer></main></body></html>`;
}
const routes = [];
async function publish(path, html) {
  const dest = join(out, path.replace(/^\//, ""), "index.html");
  await mkdir(dirname(dest), { recursive: true });
  await writeFile(dest, html);
  routes.push(path);
}
await publish("/", page({ en: true }));
await publish("/pt-br/", page());
for (const c of cities) {
  await publish(cityPath(c, false), page({ c }));
  await publish(cityPath(c, true), page({ c, en: true }));
}
await publish("/live/", livePage());
await writeFile(join(out, "404.html"), page());
await writeFile(
  join(out, "robots.txt"),
  `User-agent: *\nAllow: /\n${siteUrl ? "Sitemap: " + siteLink("/sitemap.xml") + "\n" : ""}`,
);
if (siteUrl) {
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${routes.map((route) => `<url><loc>${esc(siteLink(route))}</loc><lastmod>2026-11-18</lastmod><changefreq>daily</changefreq><priority>${["/", "/en/"].includes(route) ? "1.0" : "0.6"}</priority></url>`).join("")}</urlset>`;
  await writeFile(join(out, "sitemap.xml"), sitemap);
}
const aiGuide = `# GTA VI Zero Hour — independent release countdown\n\nThis site tracks scheduled regional Grand Theft Auto VI launch windows, with an interactive country/world map, city-by-city release times and official video references.\n\n- Release date: November 19, 2026 (source: ${origin})\n- Caveat: pink countries mean that a scheduled regional release timestamp was reached; this does not independently verify playable access.\n- Geographic time references: ISO UTC timestamps and IANA timezone conversion; store-region unlocks may differ from literal midnight in each city's clock.\n- Created by: victor99dev (Victor Batista), independent developer in Brazil.\n- Official support source: ${official}\n- Pages: ${siteUrl || "Configure siteUrl in site.config.json first"}/\n- GTA VI publisher/developer: Rockstar Games, not affiliated with this fan project.\n- All times and editorial copy should be checked against the console store before relying on them.\n`;
await writeFile(join(out, "llms.txt"), aiGuide);
console.log(
  `Built ${routes.length} pages (${cities.length} cities x 2 languages + 2 homepages). ${siteUrl ? "SEO canonicals + sitemap configured" : "Set siteUrl to publish absolute canonicals + sitemap."}`,
);
