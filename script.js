document.addEventListener("DOMContentLoaded", () => {
  const weekSelector = document.getElementById("week");
  const weekTitle = document.getElementById("week-title");
  const questionsList = document.getElementById("questions");
  const modeToggle = document.getElementById("mode-toggle");

  // Create a container for the text reference
  const textReference = document.createElement("a");
  textReference.id = "text-reference";
  textReference.style.fontStyle = "italic";
  textReference.style.marginLeft = "1rem";
  textReference.target = "_blank";
  weekTitle.appendChild(textReference);

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
    loadQuestions(weekSelector.value);
  });

  // Load saved week from localStorage
  const savedWeek = localStorage.getItem("selectedWeek") || "1";
  weekSelector.value = savedWeek;

  // Update content when week is selected
  weekSelector.addEventListener("change", () => {
    const selectedWeek = weekSelector.value;
    localStorage.setItem("selectedWeek", selectedWeek); // Save selected week
    loadQuestions(selectedWeek);
  });

  // Function to load questions based on selected week and mode
  function loadQuestions(selectedWeek) {
    const isKidsMode = modeToggle.checked;
    const jsonFile = isKidsMode
      ? "assets/intrebaricopii.json"
      : "assets/intrebari.json";

    fetch(jsonFile)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
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

        // Update title
        weekTitle.textContent = `📖 Săptămâna ${selectedWeek}`;

        // Update text reference
        textReference.textContent = `${weekRange}`;
        textReference.href = getBibleUrl(weekRange);

        // Ensure the text reference is appended correctly
        weekTitle.appendChild(textReference);

        // Update questions
        questionsList.innerHTML = "";
        if (data[weekKey]) {
          data[weekKey].forEach((question) => {
            const li = document.createElement("li");
            li.textContent = question;
            questionsList.appendChild(li);
          });
        }
      })
      .catch((error) => {
        console.error("Error loading questions:", error);
        questionsList.innerHTML = `<li class="error">A apărut o eroare la încărcarea întrebărilor. Te rugăm să încerci din nou.</li>`;
      });
  }

  // Load initial questions
  loadQuestions(weekSelector.value);

  // Helper function to get Bible.com URL
  function getBibleUrl(range) {
    // Remove any "Marcu" text that might be in the range
    const cleanRange = range.replace(/Marcu\s*/i, "");
    const baseUrl = "https://www.bible.com/bible/126/MRK.";
    return `${baseUrl}${cleanRange.replace(/:/g, ".").replace(/-/g, "-")}.NTR`;
  }
});
