document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  const searchInput = document.getElementById("search-input");
  const categoryFilter = document.getElementById("category-filter");
  const sortFilter = document.getElementById("sort-filter");

  let allActivities = {};

  function populateActivityOptions(activities) {
    const allNames = Object.keys(activities).sort();
    activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

    allNames.forEach((name) => {
      const option = document.createElement("option");
      option.value = name;
      option.textContent = name;
      activitySelect.appendChild(option);
    });
  }

  function populateCategoryOptions(activities) {
    const categories = [...new Set(Object.values(activities).map((details) => details.category || "General"))].sort();
    categoryFilter.innerHTML = '<option value="all">All categories</option>';

    categories.forEach((category) => {
      const option = document.createElement("option");
      option.value = category;
      option.textContent = category;
      categoryFilter.appendChild(option);
    });
  }

  function getFilteredActivities() {
    const searchTerm = searchInput.value.trim().toLowerCase();
    const selectedCategory = categoryFilter.value;
    const selectedSort = sortFilter.value;

    const filtered = Object.entries(allActivities).filter(([name, details]) => {
      const matchesSearch =
        !searchTerm ||
        name.toLowerCase().includes(searchTerm) ||
        (details.description || "").toLowerCase().includes(searchTerm);

      const matchesCategory =
        selectedCategory === "all" || details.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });

    filtered.sort(([, a], [, b]) => {
      if (selectedSort === "spots_left") {
        return (b.spots_left || 0) - (a.spots_left || 0);
      }

      if (selectedSort === "popular") {
        return (b.participant_count || 0) - (a.participant_count || 0);
      }

      return a.name?.localeCompare?.(b.name || "") || String(a[0]).localeCompare(String(b[0]));
    });

    return filtered;
  }

  function renderActivities() {
    activitiesList.innerHTML = "";

    const filtered = getFilteredActivities();

    if (filtered.length === 0) {
      activitiesList.innerHTML = "<p>No activities match your current search and filters.</p>";
      return;
    }

    filtered.forEach(([name, details]) => {
      const activityCard = document.createElement("div");
      activityCard.className = "activity-card";

      const spotsLeft = details.spots_left ?? Math.max(details.max_participants - details.participant_count, 0);
      const participantList = details.participants || [];

      const participantsHTML =
        participantList.length > 0
          ? `<div class="participants-section">
              <h5>Participants:</h5>
              <ul class="participants-list">
                ${participantList
                  .map(
                    (email) =>
                      `<li><span class="participant-email">${email}</span><button class="delete-btn" data-activity="${name}" data-email="${email}">❌</button></li>`
                  )
                  .join("")}
              </ul>
            </div>`
          : `<p><em>No participants yet</em></p>`;

      activityCard.innerHTML = `
        <div class="activity-header">
          <h4>${name}</h4>
          <span class="category-badge">${details.category || "General"}</span>
        </div>
        <p>${details.description}</p>
        <p><strong>Schedule:</strong> ${details.schedule}</p>
        <p><strong>Availability:</strong> ${spotsLeft} spot${spotsLeft === 1 ? "" : "s"} left</p>
        <p><strong>Participants:</strong> ${details.participant_count || participantList.length}/${details.max_participants}</p>
        <div class="participants-container">
          ${participantsHTML}
        </div>
      `;

      activitiesList.appendChild(activityCard);
    });

    document.querySelectorAll(".delete-btn").forEach((button) => {
      button.addEventListener("click", handleUnregister);
    });
  }

  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      allActivities = await response.json();
      populateCategoryOptions(allActivities);
      populateActivityOptions(allActivities);
      renderActivities();
    } catch (error) {
      activitiesList.innerHTML =
        "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  async function handleUnregister(event) {
    const button = event.target;
    const activity = button.getAttribute("data-activity");
    const email = button.getAttribute("data-email");

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/unregister?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to unregister. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error unregistering:", error);
    }
  }

  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  searchInput.addEventListener("input", renderActivities);
  categoryFilter.addEventListener("change", renderActivities);
  sortFilter.addEventListener("change", renderActivities);

  fetchActivities();
});
