import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import UserDashboard from './pages/UserDashboard';
import UserStatus from './pages/UserStatus';
import AdminDashboard from './pages/AdminDashboard';
import AdminLogin from './pages/AdminLogin';
import { ShieldCheck, Home, Search } from 'lucide-react';

function App() {
  return (
    <Router>
      <div className="app-container">
        <header className="header animate-fade-in">
          <h1>
            <Home size={28} />
            Torres Petapa - Pagos
          </h1>
          <nav className="nav-links">
            <Link to="/" className="btn btn-secondary">Reportar Pago</Link>
            <Link to="/status" className="btn btn-secondary">
              <Search size={18} /> Consultar Estado
            </Link>
            <Link to="/admin" className="btn btn-secondary">
              <ShieldCheck size={18} /> Admin
            </Link>
          </nav>
        </header>

        <main>
          <Routes>
            <Route path="/" element={<UserDashboard />} />
            <Route path="/status" element={<UserStatus />} />
            <Route path="/admin" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
