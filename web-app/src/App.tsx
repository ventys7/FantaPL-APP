import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Home } from './pages/Home';
import { Dashboard } from './pages/Dashboard';
import { Market } from './pages/Market';
import { AdminRules } from './pages/AdminRules';
import { VoteEntry } from './pages/VoteEntry';

function App() {
    return (
        <Router>
            <div className="min-h-screen bg-pl-dark text-white selection:bg-pl-green selection:text-pl-dark">
                <Navbar />
                <main>
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/market" element={<Market />} />
                        <Route path="/admin/rules" element={<AdminRules />} />
                        <Route path="/admin/votes" element={<VoteEntry />} />
                    </Routes>
                </main>
            </div>
        </Router>
    );
}

export default App;
