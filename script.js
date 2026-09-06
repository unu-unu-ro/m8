document.addEventListener("DOMContentLoaded", () => {
  const weekSelector = document.getElementById("week");
  const weekTitle = document.getElementById("week-title");
  const questionsList = document.getElementById("questions");
  const modeToggle = document.getElementById("mode-toggle");
  const sheet = document.getElementById("content");
  const sheetInner = document.getElementById("sheet-inner");
  const heading = weekTitle.parentElement;
  const rail = document.getElementById("week-rail");
  const progress = document.getElementById("timeline-progress");
  const timeline = document.getElementById("timeline");
  const sentinel = document.querySelector(".timeline-sentinel");
  const prevBtn = document.getElementById("prev-week");
  const nextBtn = document.getElementById("next-week");
  const folioNow = document.querySelector(".folio__now");
  const folioTotal = document.querySelector(".folio__total");
  const main = document.querySelector("main");

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  // Săptămânile sunt citite din <select>, care rămâne sursa de adevăr
  const weeks = Array.from(weekSelector.options).map((option) => ({
    value: option.value,
    name: option.textContent.trim(),
  }));

  const pad = (n) => String(n).padStart(2, "0");
  const cache = new Map();

  // Create a container for the text reference
  const textReference = document.createElement("a");
  textReference.id = "text-reference";
  textReference.target = "_blank";
  textReference.rel = "noopener";
  heading.appendChild(textReference);

  /* ---------------------------------------------------- Timeline --- */

  const nodes = weeks.map((week, index) => {
    const node = document.createElement("button");
    node.type = "button";
    node.className = "tl-node";
    node.dataset.week = week.value;
    node.setAttribute(
      "aria-label",
      `Săptămâna ${week.value} — ${week.name}`
    );
    node.innerHTML =
      '<span class="tl-node__dot" aria-hidden="true"></span>' +
      `<span class="tl-node__num">${pad(index + 1)}</span>`;
    node.addEventListener("click", () => {
      const current = weeks.findIndex((w) => w.value === weekSelector.value);
      selectWeek(week.value, Math.sign(index - current));
    });
    rail.appendChild(node);
    return node;
  });

  folioTotal.textContent = pad(weeks.length);

  function paintTimeline(selectedWeek) {
    const index = weeks.findIndex((w) => w.value === selectedWeek);
    if (index < 0) return;

    nodes.forEach((node, i) => {
      node.classList.toggle("is-current", i === index);
      node.classList.toggle("is-done", i < index);
      if (i === index) {
        node.setAttribute("aria-current", "step");
      } else {
        node.removeAttribute("aria-current");
      }
    });

    // Linia de progres pornește din centrul primului reper (6.25% din rail)
    const span = 100 - 2 * 6.25;
    progress.style.left = "6.25%";
    progress.style.width = `${(index / (weeks.length - 1)) * span}%`;

    prevBtn.disabled = index === 0;
    nextBtn.disabled = index === weeks.length - 1;
    folioNow.textContent = pad(index + 1);
  }

  if (sentinel && "IntersectionObserver" in window) {
    new IntersectionObserver(
      ([entry]) => timeline.classList.toggle("is-stuck", !entry.isIntersecting),
      { threshold: 1 }
    ).observe(sentinel);
  }

  /* ------------------------------------------------ Navigation ----- */

  function selectWeek(value, direction = 0) {
    if (value === weekSelector.value) return;
    weekSelector.value = value;
    localStorage.setItem("selectedWeek", value); // Save selected week
    paintTimeline(value);
    loadQuestions(value, direction);
  }

  function step(delta) {
    const index = weeks.findIndex((w) => w.value === weekSelector.value);
    const next = index + delta;
    if (next < 0 || next >= weeks.length) return;
    selectWeek(weeks[next].value, Math.sign(delta));
  }

  [prevBtn, nextBtn].forEach((button) => {
    button.addEventListener("click", () => step(Number(button.dataset.dir)));
  });

  document.addEventListener("keydown", (event) => {
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    const tag = (event.target.tagName || "").toLowerCase();
    if (["input", "select", "textarea"].includes(tag)) return;
    if (event.key === "ArrowLeft") step(-1);
    if (event.key === "ArrowRight") step(1);
  });

  // Swipe pentru săptămâna următoare / precedentă
  let touchX = 0;
  let touchY = 0;
  let tracking = false;

  main.addEventListener(
    "touchstart",
    (event) => {
      if (event.touches.length !== 1) return;
      touchX = event.touches[0].clientX;
      touchY = event.touches[0].clientY;
      tracking = true;
    },
    { passive: true }
  );

  main.addEventListener(
    "touchend",
    (event) => {
      if (!tracking) return;
      tracking = false;
      const touch = event.changedTouches[0];
      const dx = touch.clientX - touchX;
      const dy = touch.clientY - touchY;
      if (Math.abs(dx) > 56 && Math.abs(dx) > Math.abs(dy) * 1.4) {
        step(dx < 0 ? 1 : -1);
      }
    },
    { passive: true }
  );

  /* ----------------------------------------------------- Modes ----- */

  // Check for saved mode preference
  const kidsMode = localStorage.getItem("kidsMode") === "true";
  modeToggle.checked = kidsMode;
  if (kidsMode) {
    document.body.classList.add("kids-mode");
  }

  // Toggle between adult and kids mode
  modeToggle.addEventListener("change", () => {
    const isKidsMode = modeToggle.checked;
    localStorage.setItem("kidsMode", isKidsMode);

    document.body.classList.toggle("kids-mode", isKidsMode);

    // Reload questions for current selection
    loadQuestions(weekSelector.value, 0);
  });

  // Load saved week from localStorage
  const savedWeek = localStorage.getItem("selectedWeek") || "1";
  weekSelector.value = weeks.some((w) => w.value === savedWeek)
    ? savedWeek
    : "1";

  // Update content when week is selected
  weekSelector.addEventListener("change", () => {
    selectWeek(weekSelector.value);
  });

  /* --------------------------------------------------- Content ----- */

  function getData(jsonFile) {
    if (cache.has(jsonFile)) return cache.get(jsonFile);
    const request = fetch(jsonFile).then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    });
    cache.set(jsonFile, request);
    return request;
  }

  // Fade out, render, fade back in — ca întoarcerea unei file
  function turnPage(direction, render) {
    sheet.style.setProperty("--dir", direction || 0);

    if (reduceMotion.matches || !direction) {
      render();
      restartEnter();
      return;
    }

    sheet.classList.add("is-leaving");
    window.setTimeout(() => {
      render();
      sheet.classList.remove("is-leaving");
      restartEnter();
    }, 160);
  }

  function restartEnter() {
    sheetInner.style.animation = "none";
    void sheetInner.offsetWidth;
    sheetInner.style.animation = "";
  }

  // Function to load questions based on selected week and mode
  function loadQuestions(selectedWeek, direction = 0) {
    const isKidsMode = modeToggle.checked;
    const jsonFile = isKidsMode
      ? "assets/intrebaricopii.json"
      : "assets/intrebari.json";

    getData(jsonFile)
      .then((data) => {
        // Dynamically get the week key and range
        const weekKey = Object.keys(data).find((key) =>
          key.startsWith(`Săptămâna ${selectedWeek}`)
        );

        if (!weekKey) {
          console.error("Week key not found:", `Săptămâna ${selectedWeek}`);
          return;
        }

        const weekRange = weekKey.match(/\((.*?)\)/)?.[1] || "";

        turnPage(direction, () => {
          // Update title
          weekTitle.textContent = "";
          const mark = document.createElement("span");
          mark.className = "sheet__mark";
          mark.setAttribute("aria-hidden", "true");
          mark.textContent = "📖";
          weekTitle.append(mark, `Săptămâna ${selectedWeek}`);

          // Update text reference
          textReference.textContent = `${weekRange}`;
          textReference.href = getBibleUrl(weekRange);

          // Update questions
          questionsList.innerHTML = "";
          data[weekKey].forEach((question) => {
            const li = document.createElement("li");
            li.textContent = question;
            questionsList.appendChild(li);
          });
        });
      })
      .catch((error) => {
        console.error("Error loading questions:", error);
        cache.delete(jsonFile);
        questionsList.innerHTML = `<li class="error">A apărut o eroare la încărcarea întrebărilor. Te rugăm să încerci din nou.</li>`;
      });
  }

  // Load initial questions
  paintTimeline(weekSelector.value);
  loadQuestions(weekSelector.value);

  // Helper function to get Bible.com URL
  function getBibleUrl(range) {
    // Remove any "Marcu" text that might be in the range
    const cleanRange = range.replace(/Marcu\s*/i, "");
    const baseUrl = "https://www.bible.com/bible/126/MRK.";
    return `${baseUrl}${cleanRange.replace(/:/g, ".").replace(/-/g, "-")}.NTR`;
  }
});
