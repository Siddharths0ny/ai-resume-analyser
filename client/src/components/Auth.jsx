import { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Mail, User, ArrowRight, Key, X } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Auth = ({ onLoginSuccess }) => {
const [mode, setMode] = useState('login'); // 'login', 'register', 'forgot', 'reset'
  const [formData, setFormData] = useState({ name: '', email: '', password: '', token: '' });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const setModeHandler = (newMode) => {
    setMode(newMode);
    setError('');
    setMessage('');
    setFormData({ name: '', email: '', password: '', token: '' });
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setMessage('');

    let endpoint, body;
    switch (mode) {
      case 'login':
        endpoint = '/api/auth/login';
        body = { email: formData.email, password: formData.password };
        break;
      case 'register':
        endpoint = '/api/auth/register';
        body = formData;
        break;
      case 'forgot':
        endpoint = '/api/auth/forgot-password';
        body = { email: formData.email };
        break;
      case 'reset':
        endpoint = '/api/auth/reset-password';
        body = { token: formData.token, password: formData.password };
        break;
      default:
        return;
    }

    try {
      const response = await axios.post(`${API_URL}${endpoint}`, body);
      if (mode === 'login' || mode === 'register') {
        const { token, user } = response.data;
        localStorage.setItem('token', token);
        onLoginSuccess(token, user);
      } else if (mode === 'forgot') {
        setMessage('If email exists, check your inbox for reset link.');
      } else if (mode === 'reset') {
        setMessage('Password reset successful. You can now login.');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Operation failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <h2 className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
            {mode === 'login' ? 'Welcome Back' : mode === 'register' ? 'Create Account' : mode === 'forgot' ? 'Forgot Password' : 'Reset Password'}
          </h2>
          <p className="text-slate-400 mt-2">
            {mode === 'login' ? 'Sign in to access your analysis history.' : 
             mode === 'register' ? 'Join to start scoring your resume.' :
             mode === 'forgot' ? 'Enter email to receive reset link.' :
             'Enter token from email and new password.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="glass-card p-8 rounded-2xl border border-slate-700/50">
{error && (
            <div className="mb-4 p-3 bg-red-900/30 border border-red-500/30 rounded-lg text-sm text-red-400 text-center">
              {error}
            </div>
          )}
          {message && !isLoading && (
            <div className="mb-4 p-3 bg-green-900/30 border border-green-500/30 rounded-lg text-sm text-green-400 text-center">
              {message}
            </div>
          )}
        

{mode === 'register' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-300 mb-1">Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User size={18} className="text-slate-500" />
                </div>
                <input 
                  type="text" 
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full bg-slate-800/50 border border-slate-600 rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="John Doe"
                />
              </div>
            </div>
          )}
          {(mode === 'login' || mode === 'register' || mode === 'forgot') && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-300 mb-1">
                {mode === 'forgot' ? 'Email for Reset' : 'Email Address'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail size={18} className="text-slate-500" />
                </div>
                <input 
                  type="email" 
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full bg-slate-800/50 border border-slate-600 rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="you@example.com"
                />
              </div>
            </div>
          )}
          {mode === 'reset' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-300 mb-1">Reset Token (from email)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Key size={18} className="text-slate-500" />
                </div>
                <input 
                  type="text" 
                  name="token"
                  value={formData.token}
                  onChange={handleChange}
                  required
                  className="w-full bg-slate-800/50 border border-slate-600 rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="eyJhbGciOiJIUzI1Ni..."
                />
              </div>
            </div>
          )}
          {(mode === 'login' || mode === 'register' || mode === 'reset') && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-300 mb-1">
                {mode === 'reset' ? 'New Password' : 'Password'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={18} className="text-slate-500" />
                </div>
                <input 
                  type="password" 
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full bg-slate-800/50 border border-slate-600 rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="••••••••"
                />
              </div>
            </div>
          )}

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white py-3 rounded-lg font-semibold shadow-lg transition-all disabled:opacity-70"
          >
            {isLoading ? 'Processing...' : 
              (mode === 'login' ? 'Sign In' : 
               mode === 'register' ? 'Sign Up' : 
               mode === 'forgot' ? 'Send Reset Link' :
               'Reset Password')}
            {!isLoading && <ArrowRight size={18} />}
          </button>

          <div className="mt-6 text-center">
              <div className="flex flex-wrap gap-4 justify-center text-sm text-slate-400">
                {mode === 'login' && (
                  <>
                    <span>Don't have an account?</span>
                    <button onClick={() => setModeHandler('register')} className="text-blue-400 hover:text-blue-300 font-medium transition-colors">Sign Up</button>
                    <span>|</span>
                    <button onClick={() => setModeHandler('forgot')} className="text-blue-400 hover:text-blue-300 font-medium transition-colors">Forgot Password?</button>
                  </>
                )}
                {mode === 'register' && (
                  <>
                    <span>Already have an account?</span>
                    <button onClick={() => setModeHandler('login')} className="text-blue-400 hover:text-blue-300 font-medium transition-colors">Sign In</button>
                  </>
                )}
                {mode === 'forgot' && (
                  <>
                    <span>Remember password?</span>
                    <button onClick={() => setModeHandler('login')} className="text-blue-400 hover:text-blue-300 font-medium transition-colors">Sign In</button>
                  </>
                )}
                {mode === 'reset' && (
                  <>
                    <span>Back to login?</span>
                    <button onClick={() => setModeHandler('login')} className="text-blue-400 hover:text-blue-300 font-medium transition-colors">Sign In</button>
                  </>
                )}
              </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default Auth;
