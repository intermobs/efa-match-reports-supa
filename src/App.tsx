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

function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-gray-50">
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
