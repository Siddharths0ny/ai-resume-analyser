import { useState, useEffect } from 'react';
import axios from 'axios';
import { LogOut, Sun, Moon, X } from 'lucide-react';
import { motion } from 'framer-motion';
import HeroSection from './components/HeroSection';
import Dashboard from './components/Dashboard';
import Auth from './components/Auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function App() {
  const [resumeData, setResumeData] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState('dark');

  // Check for existing token and theme on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
    }
    
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);
    document.body.setAttribute('data-theme', savedTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.body.setAttribute('data-theme', newTheme);
  };

  const handleLoginSuccess = (token, userData) => {
    localStorage.setItem('token', token);
    setIsAuthenticated(true);
    setUser(userData);
    setShowAuthModal(false);
  };

  const handleAuthClose = () => {
    setShowAuthModal(false);
  };

  // Check token validity on mount and upload fail
  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const response = await axios.get(`${API_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUser(response.data);
      } catch {
        localStorage.removeItem('token');
        setIsAuthenticated(false);
        setShowAuthModal(true);
      }
    } else {
      setShowAuthModal(true);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setUser(null);
    setResumeData(null);
  };

  const handleUpload = async (file, jobDescription) => {
    setIsAnalyzing(true);
    
    const formData = new FormData();
    formData.append('resume', file);
    if (jobDescription) {
      formData.append('jobDescription', jobDescription);
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setShowAuthModal(true);
        return;
      }
      const response = await axios.post(`${API_URL}/api/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data && response.data.data) {
        setResumeData(response.data.data);
      } else {
        setResumeData(response.data);
      }
    } catch (error) {
      console.error('Upload Error:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        setIsAuthenticated(false);
        setShowAuthModal(true);
      } else {
        alert('Failed to process the resume. Please ensure the backend is running and the file is a valid PDF or DOCX.');
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setResumeData(null);
  };

  return (
    <div className="min-h-screen font-sans text-white relative overflow-hidden">
      {/* Background ambient light effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/20 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-600/20 blur-[120px] pointer-events-none"></div>
      
      <main className="container mx-auto px-4 py-12 relative z-10 flex flex-col items-center justify-center min-h-screen">
        
        <div className="absolute top-4 right-4 z-50 flex items-center gap-4">
          <button 
            onClick={toggleTheme}
            className="p-2 bg-slate-800/80 hover:bg-slate-700 border border-slate-600 rounded-full text-slate-300 transition-colors"
            title="Toggle Theme"
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          
          {isAuthenticated && (
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800/80 hover:bg-slate-700 border border-slate-600 rounded-full text-sm font-medium transition-colors"
            >
              <LogOut size={16} />
              Logout
            </button>
          )}
        </div>

        {!resumeData ? (
          <HeroSection onUpload={handleUpload} isAnalyzing={isAnalyzing} />
        ) : (
          <Dashboard data={resumeData} onReset={handleReset} />
        )}

        {showAuthModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-md relative"
            >
              <button 
                onClick={handleAuthClose}
                className="absolute -top-4 -right-4 z-60 p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
              >
                <X size={24} />
              </button>
              <Auth onLoginSuccess={handleLoginSuccess} />
            </motion.div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
