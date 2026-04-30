import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, ArrowLeft, TrendingUp, Briefcase, XCircle, Zap, Download, Edit3, Loader2, ExternalLink } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Dashboard = ({ data, onReset }) => {
  const dashboardRef = useRef(null);
  const [rewriteTarget, setRewriteTarget] = useState(null);
  const [rewrittenText, setRewrittenText] = useState('');
  const [isRewriting, setIsRewriting] = useState(false);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  const handleDownloadPDF = async () => {
    if (!dashboardRef.current) return;
    
    // Temporarily hide buttons for the screenshot
    const buttons = dashboardRef.current.querySelectorAll('button');
    buttons.forEach(btn => btn.style.display = 'none');
    
    try {
      const canvas = await html2canvas(dashboardRef.current, { scale: 2, useCORS: true, backgroundColor: '#0f172a' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save('AI_Resume_Analysis.pdf');
    } catch (error) {
      console.error("Failed to generate PDF", error);
    } finally {
      // Restore buttons
      buttons.forEach(btn => btn.style.display = '');
    }
  };

  const handleRewrite = async (target) => {
    setRewriteTarget(target);
    setIsRewriting(true);
    setRewrittenText('');

    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${API_URL}/api/rewrite`, {
        targetSection: target,
        originalText: data.summary || "Full resume content passed from backend not available in state directly, assuming general rewrite requested."
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setRewrittenText(res.data.rewrittenText);
    } catch (error) {
      setRewrittenText('Failed to generate rewrite. Please ensure your OpenRouter API key is configured and you are logged in.');
    } finally {
      setIsRewriting(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreRing = (score) => {
    if (score >= 80) return 'stroke-green-400';
    if (score >= 60) return 'stroke-yellow-400';
    return 'stroke-red-400';
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="w-full max-w-6xl relative"
    >
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
            Analysis Dashboard
          </h2>
          <p className="text-slate-400 mt-1">Here is how your resume performed.</p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={handleDownloadPDF}
            className="flex items-center gap-2 px-4 py-2 rounded-full glass-card border border-blue-500/30 hover:bg-blue-500/10 transition-colors text-sm font-medium text-blue-300"
          >
            <Download size={16} />
            <span>Download PDF</span>
          </button>
          <button 
            onClick={onReset}
            className="flex items-center gap-2 px-4 py-2 rounded-full glass-card hover:bg-white/10 transition-colors text-sm font-medium"
          >
            <ArrowLeft size={16} />
            <span>Analyze Another</span>
          </button>
        </div>
      </div>

      <div ref={dashboardRef} className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-4 -m-4 rounded-2xl bg-slate-900/50">
        {/* Right Column: Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Job Recommendations Section */}
          {data.recommendedJobs && data.recommendedJobs.length > 0 && (
            <motion.div variants={itemVariants} className="glass-card p-6 rounded-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Briefcase size={80} />
              </div>
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2 relative z-10 text-slate-200">
                <Briefcase size={20} className="text-blue-400" />
                Recommended Roles
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                {data.recommendedJobs.map((job, idx) => (
                  <div key={idx} className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 hover:border-blue-500/30 transition-colors flex flex-col justify-between">
                    <div>
                      <h4 className="font-semibold text-slate-200 text-lg">{job.title}</h4>
                      <p className="text-xs text-blue-400 font-medium mb-2">{job.companyType}</p>
                      <p className="text-sm text-slate-400 mb-4">{job.matchReason}</p>
                    </div>
                    <a 
                      href={job.applyUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="mt-auto self-start flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg transition-colors"
                    >
                      Search & Apply <ExternalLink size={14} />
                    </a>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Detailed Feedback */}
          <motion.div variants={itemVariants} className="glass-card p-6 flex flex-col h-full justify-between">
            <div>
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-slate-300 flex items-center gap-2">
                  <Briefcase size={20} className="text-purple-400" />
                  Keywords Overview
                </h3>
                <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-lg text-sm font-bold shadow-[0_0_15px_rgba(79,70,229,0.4)] transition-all">
                  <Zap size={16} className="text-yellow-300" />
                  Improve Resume
                </button>
              </div>

              {/* Weak Sections Highlight */}
              {data.weakSections && data.weakSections.length > 0 && (
                <div className="mb-6 p-4 rounded-xl border border-orange-500/30 bg-orange-900/10">
                  <h4 className="text-sm font-semibold text-orange-400 mb-3 flex items-center gap-2">
                    <AlertCircle size={16} />
                    Structurally Weak Sections
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {data.weakSections.map((section, index) => (
                      <span 
                        key={index} 
                        className="px-3 py-1.5 rounded-md bg-orange-900/40 text-orange-300 text-xs border border-orange-500/30"
                      >
                        {section}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Missing Keywords (Highlighted Weak Area) */}
              {data.missingKeywords && data.missingKeywords.length > 0 && (
                <div className="mb-6 p-4 rounded-xl border border-red-500/30 bg-red-900/10">
                  <h4 className="text-sm font-semibold text-red-400 mb-3 flex items-center gap-2">
                    <AlertCircle size={16} />
                    Missing Critical Keywords
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {data.missingKeywords.map((keyword, index) => (
                      <span 
                        key={index} 
                        className="px-3 py-1.5 rounded-md bg-red-900/40 text-red-300 text-xs border border-red-500/30 flex items-center gap-1"
                      >
                        <XCircle size={12} />
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Detected Keywords */}
              <div className="mb-2">
                <h4 className="text-sm font-semibold text-slate-400 mb-3 flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-green-400" />
                  Detected Strengths
                </h4>
                <div className="flex flex-wrap gap-2">
                  {data.atsKeywords && data.atsKeywords.length > 0 ? (
                    data.atsKeywords.map((keyword, index) => (
                      <span 
                        key={index} 
                        className="px-3 py-1.5 rounded-md bg-blue-900/30 text-blue-300 text-xs border border-blue-500/20"
                      >
                        {keyword}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-500 text-sm">No specific keywords detected.</span>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Left Column: Scores */}
        <div className="space-y-6">
          {/* ATS Score Card */}
          <motion.div variants={itemVariants} className="glass-card p-6 flex flex-col items-center justify-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500"></div>
            <h3 className="text-lg font-semibold text-slate-300 mb-6 w-full flex items-center gap-2">
              <TrendingUp size={20} className="text-blue-400" />
              ATS Match Score
            </h3>
            
            <div className="relative w-40 h-40 flex items-center justify-center mb-4">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle 
                  className="text-slate-700 stroke-current" 
                  strokeWidth="8" 
                  cx="50" cy="50" r="40" 
                  fill="transparent"
                ></circle>
                <motion.circle 
                  className={`${getScoreRing(data.score)}`} 
                  strokeWidth="8" 
                  strokeLinecap="round" 
                  cx="50" cy="50" r="40" 
                  fill="transparent"
                  strokeDasharray="251.2"
                  initial={{ strokeDashoffset: 251.2 }}
                  animate={{ strokeDashoffset: 251.2 - (251.2 * data.score) / 100 }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                ></motion.circle>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-4xl font-bold ${getScoreColor(data.score)}`}>{data.score}</span>
                <span className="text-slate-400 text-xs">/ 100</span>
              </div>
            </div>
            {data.score < 60 && (
              <p className="text-center text-sm text-red-400 mt-2 font-medium bg-red-900/20 px-3 py-1 rounded-full border border-red-500/20">
                Critical updates needed.
              </p>
            )}
          </motion.div>

          {/* Keyword Match % Card */}
          <motion.div variants={itemVariants} className="glass-card p-6">
            <h3 className="text-sm font-semibold text-slate-300 mb-2">Keyword Match</h3>
            <div className="w-full bg-slate-700 rounded-full h-4 mb-2 overflow-hidden border border-slate-600">
              <motion.div 
                className={`h-4 rounded-full ${data.score < 60 ? 'bg-red-500' : 'bg-gradient-to-r from-blue-500 to-indigo-500'}`}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(data.score + 10, 100)}%` }}
                transition={{ duration: 1, delay: 0.5 }}
              ></motion.div>
            </div>
            <div className="flex justify-between text-xs text-slate-400">
              <span>0%</span>
              <span className="font-bold text-slate-200">{Math.min(data.score + 10, 100)}% Match</span>
            </div>
          </motion.div>
        </div>

        {/* Summary & Keywords */}
        <div className="lg:col-span-2 space-y-6">
          <motion.div variants={itemVariants} className="glass-card p-6 flex flex-col h-full justify-between">
            <div>
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-slate-300 flex items-center gap-2">
                  <Briefcase size={20} className="text-purple-400" />
                  Keywords Overview
                </h3>
                <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-lg text-sm font-bold shadow-[0_0_15px_rgba(79,70,229,0.4)] transition-all">
                  <Zap size={16} className="text-yellow-300" />
                  Improve Resume
                </button>
              </div>

              {/* Weak Sections Highlight */}
              {data.weakSections && data.weakSections.length > 0 && (
                <div className="mb-6 p-4 rounded-xl border border-orange-500/30 bg-orange-900/10">
                  <h4 className="text-sm font-semibold text-orange-400 mb-3 flex items-center gap-2">
                    <AlertCircle size={16} />
                    Structurally Weak Sections
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {data.weakSections.map((section, index) => (
                      <span 
                        key={index} 
                        className="px-3 py-1.5 rounded-md bg-orange-900/40 text-orange-300 text-xs border border-orange-500/30"
                      >
                        {section}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Missing Keywords (Highlighted Weak Area) */}
              {data.missingKeywords && data.missingKeywords.length > 0 && (
                <div className="mb-6 p-4 rounded-xl border border-red-500/30 bg-red-900/10">
                  <h4 className="text-sm font-semibold text-red-400 mb-3 flex items-center gap-2">
                    <AlertCircle size={16} />
                    Missing Critical Keywords
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {data.missingKeywords.map((keyword, index) => (
                      <span 
                        key={index} 
                        className="px-3 py-1.5 rounded-md bg-red-900/40 text-red-300 text-xs border border-red-500/30 flex items-center gap-1"
                      >
                        <XCircle size={12} />
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Detected Keywords */}
              <div className="mb-2">
                <h4 className="text-sm font-semibold text-slate-400 mb-3 flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-green-400" />
                  Detected Strengths
                </h4>
                <div className="flex flex-wrap gap-2">
                  {data.atsKeywords && data.atsKeywords.length > 0 ? (
                    data.atsKeywords.map((keyword, index) => (
                      <span 
                        key={index} 
                        className="px-3 py-1.5 rounded-md bg-blue-900/30 text-blue-300 text-xs border border-blue-500/20"
                      >
                        {keyword}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-500 text-sm">No specific keywords detected.</span>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Suggestions */}
        <motion.div variants={itemVariants} className="lg:col-span-3 glass-card p-6 border-t-4 border-indigo-500">
          <h3 className="text-xl font-semibold text-slate-200 mb-6 flex items-center gap-2">
            <Zap size={24} className="text-indigo-400" />
            Actionable Suggestions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.suggestions && data.suggestions.length > 0 ? (
              data.suggestions.map((suggestion, index) => (
                <motion.div 
                  key={index}
                  whileHover={{ y: -5, backgroundColor: "rgba(30, 41, 59, 0.8)" }}
                  className="bg-slate-800/40 p-5 rounded-xl border border-slate-700/50 flex items-start gap-4 transition-colors duration-300"
                >
                  <div className="mt-1 bg-indigo-900/30 p-1.5 rounded-full flex-shrink-0">
                    <CheckCircle2 size={16} className="text-indigo-400" />
                  </div>
                  <div className="flex flex-col gap-3 w-full">
                    <p className="text-slate-300 text-sm leading-relaxed">{suggestion}</p>
                    <button 
                      onClick={() => handleRewrite(suggestion)}
                      className="self-start flex items-center gap-1.5 text-xs font-medium text-blue-400 hover:text-blue-300 bg-blue-900/20 px-3 py-1.5 rounded-md transition-colors"
                    >
                      <Edit3 size={14} />
                      Ask AI to Rewrite
                    </button>
                  </div>
                </motion.div>
              ))
            ) : (
              <p className="text-slate-500 text-sm">No suggestions available at this time.</p>
            )}
          </div>
        </motion.div>
      </div>

      {/* Rewrite Modal */}
      {rewriteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass-card p-6 rounded-2xl max-w-2xl w-full border border-blue-500/30 shadow-[0_0_40px_rgba(59,130,246,0.15)]"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold flex items-center gap-2 text-slate-200">
                <Zap size={20} className="text-yellow-400" />
                AI Rewrite Suggestion
              </h3>
              <button 
                onClick={() => setRewriteTarget(null)}
                className="text-slate-400 hover:text-white"
              >
                <XCircle size={24} />
              </button>
            </div>
            
            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 min-h-[150px] relative">
              {isRewriting ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-blue-400">
                  <Loader2 className="animate-spin mb-2" size={24} />
                  <span className="text-sm">Generating magic...</span>
                </div>
              ) : (
                <p className="text-slate-200 text-sm whitespace-pre-wrap leading-relaxed">
                  {rewrittenText}
                </p>
              )}
            </div>
            
            <div className="mt-4 flex justify-end">
              <button 
                onClick={() => navigator.clipboard.writeText(rewrittenText)}
                disabled={isRewriting || !rewrittenText}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Copy to Clipboard
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default Dashboard;
