import { useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

export default function OutfitCalendar() {
  const [selectedDate, setSelectedDate] = useState(new Date());

  const outfitPlans = [
    {
      date: "2026-06-04",
      top: "White T-Shirt",
      bottom: "Black Jeans",
      shoes: "Sneakers"
    }
  ];

  const formattedDate = selectedDate.toISOString().split("T")[0];

  const plannedOutfit = outfitPlans.find(
    outfit => outfit.date === formattedDate
  );

  return (
    <div>
      <h2>Outfit Planner</h2>

      <Calendar
        onChange={setSelectedDate}
        value={selectedDate}
      />

      <h3>Selected Date: {formattedDate}</h3>

      {plannedOutfit ? (
        <div>
          <p>Top: {plannedOutfit.top}</p>
          <p>Bottom: {plannedOutfit.bottom}</p>
          <p>Shoes: {plannedOutfit.shoes}</p>
        </div>
      ) : (
        <p>No outfit planned.</p>
      )}
    </div>
  );
}