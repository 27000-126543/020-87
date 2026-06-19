import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Dashboard } from "@/pages/Dashboard";
import { Tracking } from "@/pages/Tracking";
import { Anomalies } from "@/pages/Anomalies";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/tracking" element={<Tracking />} />
          <Route path="/anomalies" element={<Anomalies />} />
        </Route>
      </Routes>
    </Router>
  );
}
