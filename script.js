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

        // Dynamically get the week key and range
        const weekKey = Object.keys(data).find((key) =>
          key.startsWith(`Săptămâna ${selectedWeek}`)
        );
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
      });

      // Trigger initial load
      weekSelector.dispatchEvent(new Event("change"));
    });

  // Helper function to get Bible.com URL
  function getBibleUrl(range) {
    const baseUrl = "https://www.bible.com/bible/126/MRK.";
    return `${baseUrl}${range
      .replace(/:/g, ".")
      .replace(/-/g, "-")
      .replace("Marcu ", "")}.NTR`;
  }
});
