import { useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { UploadCloud, FileText, Loader2, Sparkles } from 'lucide-react';

const HeroSection = ({ onUpload, isAnalyzing }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [jobDescription, setJobDescription] = useState('');

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onUpload(e.dataTransfer.files[0], jobDescription);
    }
  }, [onUpload, jobDescription]);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      onUpload(e.target.files[0], jobDescription);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="flex flex-col items-center max-w-3xl w-full text-center"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card mb-8 text-sm font-medium text-blue-300 border-blue-500/30"
      >
        <Sparkles size={16} />
        <span>Powered by Advanced AI</span>
      </motion.div>

      <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">
        AI Resume Analyzer
      </h1>
      
      <p className="text-xl text-slate-300 mb-12 max-w-2xl leading-relaxed">
        Get an instant ATS score, uncover hidden weaknesses, and improve your resume to land your dream job with actionable insights.
      </p>

      <motion.div 
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full max-w-xl relative"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl blur-xl opacity-30"></div>
        <div 
          className={`glass-card p-10 rounded-2xl flex flex-col items-center justify-center border-2 border-dashed transition-all duration-300 relative z-10 ${
            isDragging ? 'border-blue-400 bg-blue-900/20' : 'border-slate-600/50 hover:border-blue-400/50 hover:bg-slate-800/40'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {isAnalyzing ? (
            <div className="flex flex-col items-center py-8">
              <Loader2 className="w-16 h-16 text-blue-400 animate-spin mb-4" />
              <h3 className="text-xl font-semibold mb-2">Analyzing your Resume...</h3>
              <p className="text-slate-400 text-sm">Extracting text and comparing with ATS algorithms</p>
            </div>
          ) : (
            <>
              <div className="w-20 h-20 bg-slate-800/80 rounded-full flex items-center justify-center mb-6 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                <UploadCloud size={40} />
              </div>
              <h3 className="text-2xl font-bold mb-3">Upload your Resume</h3>
              <p className="text-slate-400 mb-8 max-w-xs">
                Drag and drop your PDF or DOCX file here, or click to browse
              </p>
              
              <label className="cursor-pointer bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-8 py-3 rounded-full font-semibold shadow-lg transition-all duration-300 flex items-center gap-2">
                <FileText size={18} />
                <span>Select File</span>
                <input 
                  type="file" 
                  className="hidden" 
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileChange}
                />
              </label>

              <div className="w-full mt-8 pt-6 border-t border-slate-700/50">
                <label className="block text-sm font-medium text-slate-400 mb-2 text-left">
                  Optional: Paste Job Description for tailored analysis
                </label>
                <textarea
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none h-24"
                  placeholder="Paste the job requirements here..."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                ></textarea>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default HeroSection;
