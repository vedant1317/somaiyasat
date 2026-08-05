import { Route, Routes } from 'react-router-dom';

import Footer from './components/Footer.jsx';
import Nav from './components/Nav.jsx';
import ScrollToTop from './components/ScrollToTop.jsx';
import Architecture from './pages/Architecture.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Home from './pages/Home.jsx';
import Mission from './pages/Mission.jsx';
import NotFound from './pages/NotFound.jsx';
import Program from './pages/Program.jsx';

export default function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <ScrollToTop />
      <Nav />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/mission" element={<Mission />} />
          <Route path="/architecture" element={<Architecture />} />
          <Route path="/program" element={<Program />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
