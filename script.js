document.addEventListener("DOMContentLoaded", () => {
  const TOTAL_WEEKS = 8;

  const timeline = document.getElementById("timeline");
  const weekBody = document.getElementById("week-body");
  const weekLabel = document.getElementById("week-label");
  const textReference = document.getElementById("text-reference");
  const questionsList = document.getElementById("questions");
  const prevBtn = document.getElementById("prev");
  const nextBtn = document.getElementById("next");
  const pagerPos = document.getElementById("pager-pos");
  const themeToggle = document.getElementById("theme-toggle");
  const langToggle = document.getElementById("lang-toggle");
  const themeColor = document.querySelector('meta[name="theme-color"]');

  // ---- Limbă / Language ----------------------------------------------------
  // Toate textele de interfață și sursa de date, pe limbă.
  const I18N = {
    ro: {
      file: "assets/intrebari.json",
      title: "8 Săptămâni prin Evanghelia după Marcu",
      subtitle: "ghid de discuție pentru întâlniri unu-la-unu",
      timelineAria: "Săptămânile planului",
      pagerAria: "Săptămâna anterioară / următoare",
      footerPre: "extras din",
      footerPost: "de David Helm",
      darkMode: "Mod întunecat",
      week: (n) => `Săptămâna ${n}`,
      error:
        "A apărut o eroare la încărcarea întrebărilor. Te rugăm să încerci din nou.",
      book: /^(Marcu|Mark)\s*/i,
      // Noua Traducere Românească (NTR) pe bible.com
      bible: (ref) => `https://www.bible.com/bible/126/MRK.${ref}.NTR`,
    },
    en: {
      file: "assets/intrebari.en.json",
      title: "8 Weeks through Mark’s Gospel",
      subtitle: "a discussion guide for one-to-one meetings",
      timelineAria: "Weeks of the plan",
      pagerAria: "Previous / next week",
      footerPre: "extracted from",
      footerPost: "by David Helm",
      darkMode: "Dark mode",
      week: (n) => `Week ${n}`,
      error:
        "Something went wrong while loading the questions. Please try again.",
      book: /^(Marcu|Mark)\s*/i,
      // English Standard Version (ESV) pe bible.com — traducerea citată în ghidul original
      bible: (ref) => `https://www.bible.com/bible/59/MRK.${ref}.ESV`,
    },
  };

  function normalizeLang(value) {
    return value === "en" ? "en" : value === "ro" ? "ro" : null;
  }

  // Prioritate: ?lang= în URL → alegerea salvată → română
  let lang =
    normalizeLang(new URLSearchParams(location.search).get("lang")) ||
    normalizeLang(localStorage.getItem("lang")) ||
    "ro";
  let t = I18N[lang];

  function applyLanguage() {
    t = I18N[lang];
    document.documentElement.lang = lang;
    document.title = t.title;

    document.querySelectorAll("[data-i18n]").forEach((el) => {
      el.textContent = t[el.dataset.i18n];
    });
    document.querySelectorAll("[data-i18n-aria]").forEach((el) => {
      el.setAttribute("aria-label", t[el.dataset.i18nAria]);
    });

    langToggle.querySelectorAll(".lang-toggle__btn").forEach((btn) => {
      const active = btn.dataset.lang === lang;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-pressed", String(active));
    });
  }

  function setLanguage(next) {
    next = normalizeLang(next);
    if (!next || next === lang) return;
    lang = next;
    localStorage.setItem("lang", lang);
    applyLanguage();
    loadData()
      .then((data) => {
        buildTimeline(data);
        render(data, 0);
      })
      .catch(showError);
  }

  langToggle.addEventListener("click", (event) => {
    const btn = event.target.closest(".lang-toggle__btn");
    if (btn) setLanguage(btn.dataset.lang);
  });

  // ---- Dark mode -----------------------------------------------------------
  // Implicit: preferința sistemului. Comutatorul salvează o alegere explicită.
  const systemDark = window.matchMedia("(prefers-color-scheme: dark)");

  function isDark() {
    const saved = localStorage.getItem("theme");
    if (saved === "dark") return true;
    if (saved === "light") return false;
    return systemDark.matches;
  }

  function applyTheme() {
    const dark = isDark();
    const saved = localStorage.getItem("theme");
    if (saved === "dark" || saved === "light") {
      document.documentElement.setAttribute("data-theme", saved);
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
    themeToggle.checked = dark;
    if (themeColor) themeColor.content = dark ? "#1c1b18" : "#fbf9f4";
  }

  themeToggle.addEventListener("change", () => {
    localStorage.setItem("theme", themeToggle.checked ? "dark" : "light");
    applyTheme();
  });

  systemDark.addEventListener("change", applyTheme);
  applyTheme();

  // ---- Data ----------------------------------------------------------------
  const cache = {}; // pe fișier / limbă
  let current = clampWeek(
    parseInt(localStorage.getItem("selectedWeek"), 10) || 1
  );

  function loadData() {
    const file = t.file;
    if (cache[file]) return Promise.resolve(cache[file]);
    return fetch(file)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        cache[file] = data;
        return data;
      });
  }

  // Cheia săptămânii = prima cheie al cărei prim număr e săptămâna cerută
  // („Săptămâna 3 (Marcu 3:7-35)” / „Week 3 (Mark 3:7-35)”).
  function weekKey(data, week) {
    return Object.keys(data).find(
      (key) => parseInt(key.match(/\d+/)?.[0], 10) === week
    );
  }

  function rangeOf(key) {
    return key?.match(/\((.*?)\)/)?.[1] || "";
  }

  function shortRef(range) {
    return range.replace(t.book, "");
  }

  function clampWeek(n) {
    return Math.min(TOTAL_WEEKS, Math.max(1, n));
  }

  function pad(n) {
    return String(n).padStart(2, "0");
  }

  // ---- Timeline ------------------------------------------------------------
  function buildTimeline(data) {
    timeline.innerHTML = "";
    for (let n = 1; n <= TOTAL_WEEKS; n++) {
      const li = document.createElement("li");
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "timeline__step";
      btn.dataset.week = n;
      btn.setAttribute("aria-label", t.week(n));

      const nr = document.createElement("span");
      nr.className = "timeline__nr";
      nr.textContent = pad(n);

      const tick = document.createElement("span");
      tick.className = "timeline__tick";

      const ref = document.createElement("span");
      ref.className = "timeline__ref";
      ref.textContent = shortRef(rangeOf(weekKey(data, n)));

      btn.append(nr, tick, ref);
      li.appendChild(btn);
      timeline.appendChild(li);
    }
  }

  function updateTimeline() {
    timeline.style.setProperty("--pos", (current - 1) / (TOTAL_WEEKS - 1));
    timeline.querySelectorAll(".timeline__step").forEach((btn) => {
      const n = Number(btn.dataset.week);
      btn.classList.toggle("is-active", n === current);
      btn.classList.toggle("is-past", n < current);
      if (n === current) {
        btn.setAttribute("aria-current", "step");
      } else {
        btn.removeAttribute("aria-current");
      }
    });
  }

  timeline.addEventListener("click", (event) => {
    const btn = event.target.closest(".timeline__step");
    if (btn) goTo(Number(btn.dataset.week));
  });

  // ---- Render --------------------------------------------------------------
  function render(data, direction) {
    const key = weekKey(data, current);
    if (!key) {
      console.error("Week key not found:", t.week(current));
      return;
    }
    const range = rangeOf(key);

    weekLabel.textContent = t.week(current);
    textReference.textContent = range;
    textReference.href = getBibleUrl(range);

    questionsList.innerHTML = "";
    (data[key] || []).forEach((question) => {
      const li = document.createElement("li");
      li.textContent = question;
      questionsList.appendChild(li);
    });

    renderPagerButton(prevBtn, data, current - 1, "prev");
    renderPagerButton(nextBtn, data, current + 1, "next");
    pagerPos.textContent = `${current} / ${TOTAL_WEEKS}`;

    updateTimeline();

    weekBody.classList.remove("enter-from-right", "enter-from-left");
    if (direction !== 0) {
      void weekBody.offsetWidth; // restart animation
      weekBody.classList.add(
        direction > 0 ? "enter-from-right" : "enter-from-left"
      );
    }
  }

  function renderPagerButton(btn, data, week, kind) {
    btn.innerHTML = "";
    if (week < 1 || week > TOTAL_WEEKS) {
      btn.classList.add("is-off");
      btn.disabled = true;
      btn.setAttribute("aria-hidden", "true");
      return;
    }
    btn.classList.remove("is-off");
    btn.disabled = false;
    btn.removeAttribute("aria-hidden");

    const lbl = document.createElement("span");
    lbl.className = "pager__lbl";
    lbl.textContent =
      kind === "prev" ? `← ${t.week(week)}` : `${t.week(week)} →`;

    const ref = document.createElement("span");
    ref.className = "pager__ref";
    ref.textContent = rangeOf(weekKey(data, week));

    btn.append(lbl, ref);
  }

  function showError(error) {
    console.error("Error loading questions:", error);
    questionsList.innerHTML = "";
    const li = document.createElement("li");
    li.className = "error";
    li.textContent = t.error;
    questionsList.appendChild(li);
  }

  // ---- Navigation ----------------------------------------------------------
  function goTo(week) {
    week = clampWeek(week);
    if (week === current) return;
    const direction = week > current ? 1 : -1;
    current = week;
    localStorage.setItem("selectedWeek", current);
    loadData()
      .then((data) => render(data, direction))
      .catch(showError);
  }

  prevBtn.addEventListener("click", () => goTo(current - 1));
  nextBtn.addEventListener("click", () => goTo(current + 1));

  // Keyboard: ← / →
  document.addEventListener("keydown", (event) => {
    const tag = event.target.tagName;
    if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;
    if (event.key === "ArrowRight") goTo(current + 1);
    if (event.key === "ArrowLeft") goTo(current - 1);
  });

  // Swipe: horizontal gesture on the sheet
  let touchStartX = 0;
  let touchStartY = 0;
  let touchTracking = false;

  document.addEventListener(
    "touchstart",
    (event) => {
      if (event.touches.length !== 1) return;
      touchStartX = event.touches[0].clientX;
      touchStartY = event.touches[0].clientY;
      touchTracking = true;
    },
    { passive: true }
  );

  document.addEventListener(
    "touchend",
    (event) => {
      if (!touchTracking) return;
      touchTracking = false;
      const touch = event.changedTouches[0];
      const dx = touch.clientX - touchStartX;
      const dy = touch.clientY - touchStartY;
      if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
      if (dx < 0) goTo(current + 1);
      else goTo(current - 1);
    },
    { passive: true }
  );

  // ---- Init ----------------------------------------------------------------
  applyLanguage();
  loadData()
    .then((data) => {
      buildTimeline(data);
      render(data, 0);
    })
    .catch(showError);

  // Helper: URL bible.com pentru referință („Marcu 14:53-15:15” → „14.53-15.15”)
  function getBibleUrl(range) {
    const cleanRange = range.replace(t.book, "").replace(/:/g, ".");
    return t.bible(cleanRange);
  }
});
