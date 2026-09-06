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
  const themeColor = document.querySelector('meta[name="theme-color"]');

  const DATA_FILE = "assets/intrebari.json";
  let cachedData = null;
  let current = clampWeek(parseInt(localStorage.getItem("selectedWeek"), 10) || 1);

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
  function loadData() {
    if (cachedData) return Promise.resolve(cachedData);
    return fetch(DATA_FILE)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        cachedData = data;
        return data;
      });
  }

  function weekKey(data, week) {
    return Object.keys(data).find((key) =>
      key.startsWith(`Săptămâna ${week}`)
    );
  }

  function rangeOf(key) {
    return key?.match(/\((.*?)\)/)?.[1] || "";
  }

  function shortRef(range) {
    return range.replace(/Marcu\s*/i, "");
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
      btn.setAttribute("aria-label", `Săptămâna ${n}`);

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
      console.error("Week key not found:", `Săptămâna ${current}`);
      return;
    }
    const range = rangeOf(key);

    weekLabel.textContent = `Săptămâna ${current}`;
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
      kind === "prev" ? `← Săptămâna ${week}` : `Săptămâna ${week} →`;

    const ref = document.createElement("span");
    ref.className = "pager__ref";
    ref.textContent = rangeOf(weekKey(data, week));

    btn.append(lbl, ref);
  }

  function showError(error) {
    console.error("Error loading questions:", error);
    questionsList.innerHTML = `<li class="error">A apărut o eroare la încărcarea întrebărilor. Te rugăm să încerci din nou.</li>`;
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
  loadData()
    .then((data) => {
      buildTimeline(data);
      render(data, 0);
    })
    .catch(showError);

  // Helper function to get Bible.com URL
  function getBibleUrl(range) {
    // Remove any "Marcu" text that might be in the range
    const cleanRange = range.replace(/Marcu\s*/i, "");
    const baseUrl = "https://www.bible.com/bible/126/MRK.";
    return `${baseUrl}${cleanRange.replace(/:/g, ".").replace(/-/g, "-")}.NTR`;
  }
});
