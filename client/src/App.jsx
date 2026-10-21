import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home          from "./pages/Home.jsx";
import Scanner       from "./pages/Scanner.jsx";
import LiveDashboard from "./pages/LiveDashboard.jsx";
import QRCodes       from "./pages/QRCodes.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"          element={<Home />} />
        <Route path="/scanner"   element={<Scanner />} />
        <Route path="/scan"      element={<Scanner />} />
        <Route path="/dashboard" element={<LiveDashboard />} />
        <Route path="/qrcodes"   element={<QRCodes />} />
      </Routes>
    </BrowserRouter>
  );
}
