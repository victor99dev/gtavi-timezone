/* GTA VI ZERO HOUR — vanilla JS: zero dependencies, static hosting, no Python. */
(() => {
  "use strict";
  const regions = (window.GTA_CITIES || [])
    .slice()
    .sort(
      (a, b) =>
        Date.parse(a.utc) - Date.parse(b.utc) || a.city.localeCompare(b.city),
    );
  const shapes = window.GTA_WORLD || [];
  if (!regions.length) return;
  const lang = document.documentElement.lang === "en" ? "en" : "pt";
  const en = lang === "en";
  const locale = en ? "en-US" : "pt-BR";
  const TEXT = en
    ? {
        upcoming: "NEXT WORLDWIDE UNLOCK",
        complete: "ALL TRACKED WINDOWS PASSED",
        launched: "WINDOW STARTED",
        waiting: "WAITING",
        next: "NEXT REGION",
        cities: "Tracked cities",
        world: "Unlocked countries",
        waves: "Launch waves",
        empty: "No matching cities",
        selected: "SELECTED REGION",
        first: "FIRST WAVE",
        regionTime: "Regional release window",
        source: "Scheduled window — platform storefront controls access",
        find: "Find a city or country...",
        sorted: "FIRST TO LAST",
        link: "See city page",
        countdownFor: "COUNTDOWN TO NEXT GLOBAL WAVE",
        copy: "Link copied",
        local: "Local time",
        allDone: "All listed release windows have passed",
        noClock: "No future launch window",
      }
    : {
        upcoming: "PRÓXIMA LIBERAÇÃO MUNDIAL",
        complete: "TODAS AS JANELAS JÁ PASSARAM",
        launched: "JANELA INICIADA",
        waiting: "AGUARDANDO",
        next: "PRÓXIMA REGIÃO",
        cities: "Cidades no mapa",
        world: "Países liberados",
        waves: "Ondas de lançamento",
        empty: "Nenhuma cidade encontrada",
        selected: "REGIÃO SELECIONADA",
        first: "PRIMEIRA LIBERAÇÃO",
        regionTime: "Janela regional de lançamento",
        source: "Janela prevista — a loja do console confirma o desbloqueio",
        find: "Busque cidade ou país...",
        sorted: "DO PRIMEIRO AO ÚLTIMO",
        link: "Ver página da cidade",
        countdownFor: "CONTAGEM PARA A PRÓXIMA REGIÃO",
        copy: "Link copiado",
        local: "Hora local",
        allDone: "Todas as janelas previstas já passaram",
        noClock: "Sem janelas futuras",
      };
  const $ = (id) => document.getElementById(id);
  const ts = (c) => Date.parse(c.utc);
  const byId = Object.fromEntries(regions.map((c) => [c.id, c]));
  let chosen = byId[document.body.dataset.city] || null;
  let query = "";
  let showOnlyNext = false;
  let lastSecond = -1;
  let lastFrontierId = "";
  const countryCodes = new Set(regions.map((c) => c.store));
  const waves = [...new Set(regions.map((c) => c.utc))];
  const regionName = (c) => (en ? c.cityEn || c.city : c.city);
  const countryName = (c) => (en ? c.countryEn : c.country);
  const pad = (n) => String(n).padStart(2, "0");
  const dateLocal = (c) =>
    new Intl.DateTimeFormat(locale, {
      timeZone: c.tz,
      day: "2-digit",
      month: "short",
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).format(new Date(c.utc));
  const localHour = (c) =>
    new Intl.DateTimeFormat(locale, {
      timeZone: c.tz,
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).format(new Date(c.utc));
  const currentTime = () => Date.now();
  const released = (c, now) => ts(c) <= now;
  const upcoming = (now) => regions.find((c) => ts(c) > now) || null;
  const normalize = (text) =>
    text
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase();
  function set(id, value) {
    const el = $(id);
    if (el) el.textContent = value;
  }
  function countdown(utc, now) {
    let sec = Math.max(0, Math.ceil((utc - now) / 1000));
    const days = Math.floor(sec / 86400);
    sec %= 86400;
    const hours = Math.floor(sec / 3600);
    sec %= 3600;
    const minutes = Math.floor(sec / 60);
    return [pad(days), pad(hours), pad(minutes), pad(sec % 60)];
  }
  function createSvgEl(name, attrs = {}) {
    const el = document.createElementNS("http://www.w3.org/2000/svg", name);
    for (const [key, val] of Object.entries(attrs))
      el.setAttribute(key, String(val));
    return el;
  }
  const toX = (lon) => ((lon + 180) / 360) * 1200;
  const toY = (lat) => ((86 - lat) / 172) * 548;
  function buildMap() {
    const svg = $("world-map");
    if (!svg) return;
    const grid = createSvgEl("g", { "aria-hidden": "true" });
    for (let n = -150; n <= 180; n += 30)
      grid.append(
        createSvgEl("path", { class: "graticule", d: `M ${toX(n)} 0 V 548` }),
      );
    for (let n = -60; n <= 80; n += 20)
      grid.append(
        createSvgEl("path", { class: "graticule", d: `M 0 ${toY(n)} H 1200` }),
      );
    svg.append(grid);
    const countries = createSvgEl("g", {
      "aria-label": en ? "World map by country" : "Mapa mundial por país",
    });
    for (const country of shapes) {
      const group = createSvgEl("g", {
        "data-country": country.code || "ZZ",
        class: "country-shape",
      });
      for (const d of country.paths)
        group.append(createSvgEl("path", { class: "country", d }));
      countries.append(group);
    }
    svg.append(countries);
    const cities = createSvgEl("g", {
      "aria-label": en ? "City locations" : "Cidades",
    });
    for (const c of regions) {
      const x = toX(c.lon),
        y = toY(c.lat);
      const g = createSvgEl("g", {
        class: "pin",
        tabindex: "0",
        role: "button",
        "data-pin": c.id,
        "aria-label": regionName(c) + ", " + countryName(c),
      });
      g.append(createSvgEl("circle", { cx: x, cy: y, r: c.focus ? 5 : 3.3 }));
      const title = createSvgEl("title");
      title.textContent = `${regionName(c)}, ${countryName(c)} — ${dateLocal(c)}`;
      g.append(title);
      if (c.focus) {
        const text = createSvgEl("text", {
          x: x + 9,
          y: y - 8,
          class: "pin-label",
          "data-label": c.id,
        });
        text.textContent = regionName(c);
        g.append(text);
      }
      g.addEventListener("click", () => selectCity(c));
      g.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          selectCity(c);
        }
      });
      cities.append(g);
    }
    svg.append(cities);
    recolorMap(currentTime());
  }
  function recolorMap(now) {
    const countryTimes = new Map();
    for (const c of regions) {
      const prev = countryTimes.get(c.store);
      if (prev === undefined || ts(c) < prev) countryTimes.set(c.store, ts(c));
    }
    document.querySelectorAll("[data-country]").forEach((g) => {
      const code = g.dataset.country;
      const unlock = countryTimes.get(code);
      g.querySelectorAll(".country").forEach((p) => {
        p.classList.toggle("reached", unlock !== undefined && now >= unlock);
        p.classList.toggle(
          "selected",
          Boolean(chosen) && chosen.store === code,
        );
      });
    });
    document.querySelectorAll("[data-pin]").forEach((p) => {
      const c = byId[p.dataset.pin];
      p.classList.toggle("reached", released(c, now));
      p.classList.toggle("selected", Boolean(chosen) && chosen.id === c.id);
      const label = p.querySelector("text");
      if (label) {
        label.style.display =
          (chosen && chosen.id !== c.id && c.focus) || (!chosen && c.focus)
            ? ""
            : "none";
      }
    });
    const done = new Set(
      [...countryTimes.entries()]
        .filter(([, time]) => time <= now)
        .map(([code]) => code),
    );
    set("stat-countries", String(done.size));
    set("stat-cities", String(regions.filter((c) => released(c, now)).length));
    set("stat-waves", String(waves.filter((t) => Date.parse(t) <= now).length));
  }
  function cityURL(c) {
    return en ? `/release-time/${c.id}/` : `/pt-br/horarios/${c.id}/`;
  }
  function selectCity(c) {
    chosen = c;
    updateSelected(currentTime());
    recolorMap(currentTime());
    document
      .querySelectorAll("[data-list-city]")
      .forEach((row) =>
        row.classList.toggle("selected", row.dataset.listCity === c.id),
      );
  }
  function updateSelected(now) {
    const c = chosen || upcoming(now) || regions[regions.length - 1];
    set("selected-city", c.flag + " " + regionName(c));
    set("selected-country", countryName(c));
    set("selected-datetime", dateLocal(c));
    set("selected-state", released(c, now) ? TEXT.launched : TEXT.waiting);
    const more = $("selected-link");
    if (more) {
      more.href = cityURL(c);
      more.textContent = TEXT.link + " ↗";
    }
    const source = $("selected-source");
    if (source) source.textContent = TEXT.source;
  }
  function drawList(now) {
    const ul = $("city-list");
    if (!ul) return;
    const term = normalize(query);
    const match = regions.filter((c) =>
      normalize(
        [c.city, c.cityEn || "", c.country, c.countryEn, c.store].join(" "),
      ).includes(term),
    );
    const filtered = showOnlyNext
      ? match.filter((c) => !released(c, now))
      : match;
    const isLiveBoard = document.body.classList.contains("live-board");
    const fragment = document.createDocumentFragment();
    filtered.forEach((c) => {
      const number = regions.indexOf(c) + 1;
      if (isLiveBoard) {
        const row = document.createElement("a");
        row.className =
          "live-city" +
          (released(c, now) ? " reached" : "") +
          (chosen && chosen.id === c.id ? " selected" : "");
        row.href = cityURL(c);
        row.dataset.listCity = c.id;
        const rank = document.createElement("span");
        rank.textContent = String(number).padStart(2, "0");
        const flag = document.createElement("img");
        flag.src = `https://flagcdn.com/w80/${String(c.store).toLowerCase()}.png`;
        flag.alt = countryName(c) + " flag";
        flag.width = 40;
        flag.height = 30;
        const name = document.createElement("strong");
        name.textContent = regionName(c);
        const time = document.createElement("time");
        time.textContent = localHour(c);
        row.append(rank, flag, name, time);
        fragment.append(row);
        return;
      }
      const b = document.createElement("button");
      b.type = "button";
      b.className =
        "city-row" +
        (released(c, now) ? " reached" : "") +
        (chosen && chosen.id === c.id ? " selected" : "");
      b.dataset.listCity = c.id;
      const rank = document.createElement("span");
      rank.className = "rank";
      rank.textContent = number;
      const name = document.createElement("span");
      name.className = "city-name";
      const strong = document.createElement("strong");
      strong.className = "city-title";
      strong.textContent = `${c.flag} ${regionName(c)}`;
      const sub = document.createElement("small");
      sub.className = "city-sub";
      sub.textContent = `${countryName(c)} · ${dateLocal(c)}`;
      name.append(strong, sub);
      const clock = document.createElement("span");
      clock.className = "city-clock";
      const time = document.createElement("strong");
      time.textContent = localHour(c);
      const status = document.createElement("small");
      status.className = released(c, now) ? "done" : "";
      status.textContent = released(c, now)
        ? "● " + TEXT.launched
        : TEXT.waiting;
      clock.append(time, status);
      b.append(rank, name, clock);
      b.addEventListener("click", () => selectCity(c));
      fragment.append(b);
    });
    if (!filtered.length) {
      const message = document.createElement("p");
      message.style.cssText = "padding:20px;color:#dbb0d3";
      message.textContent = TEXT.empty;
      fragment.append(message);
    }
    ul.replaceChildren(fragment);
    set("result-count", `${filtered.length} / ${regions.length}`);
  }
  function tick() {
    const now = currentTime();
    const sec = Math.floor(now / 1000);
    if (sec === lastSecond) return;
    lastSecond = sec;
    const frontier = upcoming(now);
    const reference = frontier || regions[regions.length - 1];
    const nums = frontier
      ? countdown(ts(reference), now)
      : ["00", "00", "00", "00"];
    ["days", "hours", "minutes", "seconds"].forEach((item, i) =>
      set("timer-" + item, nums[i]),
    );
    set(
      "frontier",
      frontier
        ? `${frontier.flag} ${regionName(frontier)} · ${dateLocal(frontier)}`
        : TEXT.allDone,
    );
    set("frontier-title", frontier ? TEXT.countdownFor : TEXT.complete);
    const newId = frontier?.id || "end";
    if (newId !== lastFrontierId) {
      lastFrontierId = newId;
      if (!chosen || !byId[chosen.id]) updateSelected(now);
      drawList(now);
    }
    updateSelected(now);
    recolorMap(now);
  }
  $("search-cities")?.addEventListener("input", (e) => {
    query = e.target.value;
    drawList(currentTime());
  });
  $("filter-future")?.addEventListener("click", (e) => {
    showOnlyNext = !showOnlyNext;
    e.currentTarget.setAttribute("aria-pressed", String(showOnlyNext));
    e.currentTarget.textContent = showOnlyNext
      ? en
        ? "Show all"
        : "Ver todas"
      : en
        ? "Pending only"
        : "Só aguardando";
    drawList(currentTime());
  });
  document.querySelectorAll("[data-video]").forEach((btn) =>
    btn.addEventListener("click", () => {
      const id = btn.dataset.video;
      if (!/^[\w-]{11}$/.test(id)) return;
      const frame = document.createElement("iframe");
      frame.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`;
      frame.loading = "lazy";
      frame.title = btn.getAttribute("aria-label") || "Rockstar video";
      frame.allow =
        "accelerometer;autoplay;encrypted-media;gyroscope;picture-in-picture;web-share";
      frame.allowFullscreen = true;
      btn.replaceWith(frame);
    }),
  );
  buildMap();
  drawList(currentTime());
  tick();
  setInterval(tick, 250);
})();
