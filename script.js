document.addEventListener("DOMContentLoaded", () => {
  const weekSelector = document.getElementById("week");
  const weekTitle = document.getElementById("week-title");
  const questionsList = document.getElementById("questions");

  // Create a container for the text reference
  const textReference = document.createElement("a");
  textReference.id = "text-reference";
  textReference.style.fontStyle = "italic";
  textReference.style.marginLeft = "1rem";
  textReference.target = "_blank";
  weekTitle.appendChild(textReference);

  // Load questions from JSON file
  fetch("intrebari.json")
    .then((response) => response.json())
    .then((data) => {
      // Load saved week from localStorage
      const savedWeek = localStorage.getItem("selectedWeek") || "1";
      weekSelector.value = savedWeek;

      // Update content when week is selected
      weekSelector.addEventListener("change", () => {
        const selectedWeek = weekSelector.value;
        localStorage.setItem("selectedWeek", selectedWeek); // Save selected week
        const weekKey = `Săptămâna ${selectedWeek} (Marcu ${getWeekRange(
          selectedWeek
        )})`;

        // Update title
        weekTitle.textContent = `📖 Săptămâna ${selectedWeek}`;

        // Update text reference
        const weekRange = getWeekRange(selectedWeek);
        textReference.textContent = `Marcu ${weekRange}`;
        textReference.href = getBibleUrl(selectedWeek);

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
      });

      // Trigger initial load
      weekSelector.dispatchEvent(new Event("change"));
    });

  // Helper function to get week range
  function getWeekRange(week) {
    const ranges = [
      "1:1-15",
      "2:1-12",
      "3:7-35",
      "8:22-38",
      "10:17-45",
      "14:53-15:15",
      "15:16-39",
      "15:42-16:8",
    ];
    return ranges[week - 1];
  }

  // Helper function to get Bible.com URL
  function getBibleUrl(week) {
    const urls = [
      "https://www.bible.com/bible/126/MRK.1.1-15.NTR",
      "https://www.bible.com/bible/126/MRK.2.1-12.NTR",
      "https://www.bible.com/bible/126/MRK.3.7-35.NTR",
      "https://www.bible.com/bible/126/MRK.8.22-38.NTR",
      "https://www.bible.com/bible/126/MRK.10.17-45.NTR",
      "https://www.bible.com/bible/126/MRK.14.53-15.15.NTR",
      "https://www.bible.com/bible/126/MRK.15.16-39.NTR",
      "https://www.bible.com/bible/126/MRK.15.42-16.8.NTR",
    ];
    return urls[week - 1];
  }
});
