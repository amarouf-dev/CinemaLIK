import { Routes, Route } from "react-router-dom";
import Auth from "./pages/authPage";
import Home from "./pages/homePage";
import Booking from "./pages/reservationPage";

function App() {
  return (
    <Routes>
      <Route path="/auth" element={<Auth/>}/>
      <Route path="/home" element={<Home/>}/>
      <Route path="home/booking" element={<Booking/>}/>
      <Route path="home/booking/:id" element={<Booking/>}/>
    </Routes>
  );
}

export default App
