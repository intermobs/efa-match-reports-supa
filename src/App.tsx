import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login'; // ← this line
import Register from './pages/Register'; // ← this line
import Dashboard from './pages/Dashboard';
import './index.css';
import MatchDayMinus1Report from './pages/MatchDayMinus1Report';
import ProtectedRoute from './components/ProtectedRoute';
import IncidentReport from './pages/IncidentReport';
import MatchDayReport from './pages/MatchDayReport';
import MatchOverview from './pages/MatchOverview';
import SettingsPage from './pages/SettingsPage';

function SplashScreen() {
  return (
    <div className="splash-screen" role="status" aria-label="Loading EFA Safety and Security Portal">
      <div className="splash-glow splash-glow-top" />
      <div className="splash-glow splash-glow-bottom" />
      <div className="splash-content">
        <div className="splash-mark">
          <span className="splash-ring splash-ring-outer" />
          <span className="splash-ring splash-ring-inner" />
          <img src="/efa_logo.png" alt="EFA" />
        </div>
        <p className="splash-kicker">EFA Digital</p>
        <h1>Safety &amp; Security Portal</h1>
        <div className="splash-loader" aria-hidden="true">
          <span />
        </div>
        <p className="splash-status">Preparing your secure workspace</p>
      </div>
    </div>
  );
}

function App() {
  const [isBooting, setIsBooting] = useState(true);

  useEffect(() => {
    const splashTimer = window.setTimeout(() => setIsBooting(false), 850);
    return () => window.clearTimeout(splashTimer);
  }, []);

  if (isBooting) return <SplashScreen />;

  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-gray-50!">
        {/* Modern Header */}
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
            
            {/* These match the 'link' props in your Dashboard cards */}
            <Route path="/match-day-minus1" element={<MatchDayMinus1Report />} />
            <Route path="/match-day" element={<MatchDayReport />} />
            <Route path="/incident-report" element={<IncidentReport />} />
            <Route path="/match-overview" element={<MatchOverview />} />
          </Routes>
        </main>
        <Toaster position="top-right" />
      </div>
    </Router>
  );
}

export default App;
