document.addEventListener("DOMContentLoaded", () => {
    // Application Data (State)
    const outfitPlans = [
        {
            date: "2026-06-04",
            top: "White T-Shirt",
            bottom: "Black Jeans",
            shoes: "Sneakers"
        }
    ];

    // Initialize date context to June 2026 to showcase the mock data seamlessly
    let selectedDate = new Date(2026, 5, 4); 
    let viewDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);

    // DOM Elements
    const monthYearTitle = document.getElementById("monthYearTitle");
    const daysGrid = document.getElementById("daysGrid");
    const prevMonthBtn = document.getElementById("prevMonthBtn");
    const nextMonthBtn = document.getElementById("nextMonthBtn");
    const selectedDateText = document.getElementById("selectedDateText");
    const outfitDisplay = document.getElementById("outfitDisplay");

    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    // Helper: Formats Date objects consistently to YYYY-MM-DD local time strings
    function formatDateString(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // Main Render Pipeline
    function render() {
        const currentYear = viewDate.getFullYear();
        const currentMonth = viewDate.getMonth();

        // Update Text header header (e.g., "June 2026")
        monthYearTitle.textContent = `${months[currentMonth]} ${currentYear}`;

        // Clear out previous grid blocks
        daysGrid.innerHTML = "";

        // Determine calendar offset grids
        const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
        const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();

        // Render padding/empty slots for layout alignment
        for (let i = 0; i < firstDayIndex; i++) {
            const emptyDiv = document.createElement("div");
            emptyDiv.classList.add("empty");
            daysGrid.appendChild(emptyDiv);
        }

        // Render actual month calendar days
        for (let day = 1; day <= totalDays; day++) {
            const dayDiv = document.createElement("div");
            dayDiv.textContent = day;

            // Apply selected state styling check
            if (
                selectedDate.getDate() === day &&
                selectedDate.getMonth() === currentMonth &&
                selectedDate.getFullYear() === currentYear
            ) {
                dayDiv.classList.add("selected");
            }

            // Click listener replaces React's onChange state hook
            dayDiv.addEventListener("click", () => {
                selectedDate = new Date(currentYear, currentMonth, day);
                render();
            });

            daysGrid.appendChild(dayDiv);
        }

        // Update selected date text node target
        const formattedStr = formatDateString(selectedDate);
        selectedDateText.textContent = formattedStr;

        // Sync and find matching outfit data models
        const plannedOutfit = outfitPlans.find(outfit => outfit.date === formattedStr);

        if (plannedOutfit) {
            outfitDisplay.innerHTML = `
                <p><strong>Top:</strong> ${plannedOutfit.top}</p>
                <p><strong>Bottom:</strong> ${plannedOutfit.bottom}</p>
                <p><strong>Shoes:</strong> ${plannedOutfit.shoes}</p>
            `;
        } else {
            outfitDisplay.innerHTML = `<p style="color: #6b7280; margin: 0;">No outfit planned.</p>`;
        }
    }

    // Header Navigation Bindings
    prevMonthBtn.addEventListener("click", () => {
        viewDate.setMonth(viewDate.getMonth() - 1);
        render();
    });

    nextMonthBtn.addEventListener("click", () => {
        viewDate.setMonth(viewDate.getMonth() + 1);
        render();
    });

    // Run First Render Interface Initialization
    render();
});