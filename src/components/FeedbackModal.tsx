import React, { useState } from 'react';
import { X, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
  onClose: () => void;
}

export const FeedbackModal = ({ onClose }: Props) => {
  const [category, setCategory] = useState('bug');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category, message }),
    });
    
    if (res.ok) {
      setStatus('Feedback submitted! Thank you.');
      setTimeout(onClose, 2000);
    } else {
      setStatus('Failed to submit. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-slate-800 p-8 rounded-2xl w-full max-w-md shadow-2xl relative"
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
          <X size={20} />
        </button>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Send Feedback</h3>
        {status ? (
          <p className="text-center text-blue-600 dark:text-blue-400 font-medium py-8">{status}</p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <select 
              value={category} 
              onChange={e => setCategory(e.target.value)}
              className="p-3 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-800 dark:text-white"
            >
              <option value="bug">Report a Bug</option>
              <option value="feature">Feature Request</option>
              <option value="other">Other</option>
            </select>
            <textarea 
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="What's on your mind?"
              className="p-3 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-800 dark:text-white h-32"
              required
            />
            <button 
              type="submit"
              className="bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition flex items-center justify-center gap-2"
            >
              <Send size={18} /> Submit
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
};
