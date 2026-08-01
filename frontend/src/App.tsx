import { Routes, Route } from "react-router-dom";
import Auth from "./pages/authPage";
import Home from "./pages/homePage";
import Booking from "./pages/reservationPage";
import ConfirmationPage from "./pages/confirmationPage";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {

  return (
    <Routes>
      <Route path="/auth" element={<Auth/>}/>
      <Route
        path="/home"
        element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        }
      />
      <Route
        path="/home/booking"
        element={
          <ProtectedRoute>
            <Booking />
          </ProtectedRoute>
        }
      />
      <Route
        path="/home/booking/:id"
        element={
          <ProtectedRoute>
            <Booking />
          </ProtectedRoute>
        }
      />
      <Route
        path="/confirmation/:id"
        element={
          <ProtectedRoute>
            <ConfirmationPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App
