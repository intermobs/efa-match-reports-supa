import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Login from './pages/Login'; // ← this line
import Register from './pages/Register'; // ← this line
import Dashboard from './pages/Dashboard';
import './index.css';
import MatchDayMinus1Report from './pages/MatchDayMinus1Report';
import ProtectedRoute from './components/ProtectedRoute';
import IncidentReport from './pages/IncidentReport';
import MatchDayReport from './pages/MatchDayReport';
import MatchOverview from './pages/MatchOverview';

import { ShieldCheck} from 'lucide-react';

function Home() {
  return (
    <div className="w-screen min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      {/* Hero Section */}
      <div className="max-w-5xl mx-auto text-center mb-16">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full font-medium text-sm mb-6">
          <ShieldCheck size={18} />
          <span>EFA Safety & Security Portal</span>
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight mb-8">
          Streamlining <span className="text-blue-600">Match Security</span> Reporting
        </h1>
        <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
          The official digital workspace for Safety & Security officers. 
          Standardized, secure, and instant reporting for every Match.
        </p>
      </div>
      {/* Call to Action */}
      <div className="max-w-2xl mx-auto bg-blue-900 rounded-3xl p-8 md:p-12 text-center text-white shadow-2xl">
        <h2 className="text-3xl font-bold mb-4">Ready to start?</h2>
        <p className="text-blue-100 mb-8 text-lg">
          Log in to your secure portal to begin Reporting and Managing your match reports.
        </p>
        <Link
          to="/login"
          className="bg-white text-blue-900 px-10 py-4 rounded-full font-bold text-lg hover:bg-blue-50 transition-all transform hover:scale-105 inline-block shadow-lg"
        >
          Access Dashboard
        </Link>
      </div>

      
    </div>
  );
}

function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-gray-50">
        {/* Modern Header */}
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            
            {/* These match the 'link' props in your Dashboard cards */}
            <Route path="/match-day-minus1" element={<MatchDayMinus1Report />} />
            <Route path="/match-day" element={<MatchDayReport />} />
            <Route path="/incident-report" element={<IncidentReport />} />
            <Route path="/match-overview" element={<MatchOverview />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
