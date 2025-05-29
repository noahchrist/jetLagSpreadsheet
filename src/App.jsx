// File: src/App.jsx
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import TeamPage from './pages/TeamPage';
import ScrollToTop from './components/ScrollToTop';

function App() {
  return (
    <Router>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/team/:teamId" element={<TeamPage />} />
      </Routes>
    </Router>
  );
}

export default App;
