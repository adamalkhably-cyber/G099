import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Calendar from "./pages/Calendar";
import CustomizeOutfit from "./pages/CustomizeOutfit";
import OutfitSelection from "./pages/OutfitSelection";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/customize" element={<CustomizeOutfit />} />
        <Route path="/outfits" element={<OutfitSelection />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;