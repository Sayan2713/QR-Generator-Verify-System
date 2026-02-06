import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Generator from './pages/Generator';
import Verify from './pages/Verify';
import Register from './pages/Register';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/generator" element={<Generator />} />
        <Route path="/verify" element={<Verify />} />
        <Route path="/register/:eventId" element={<Register />} />
      </Routes>
    </Router>
  );
}

export default App;