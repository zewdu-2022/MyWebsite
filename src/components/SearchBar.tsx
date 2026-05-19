import React, { useState, useRef, useEffect } from 'react';
import { Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const recentPages = ['Home', 'Services', 'About Us', 'Publications'];
const popularServices = ['Market Analysis', 'Policy Development', 'Economic Modeling', 'Data Visualization'];

export const SearchBar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={wrapperRef} className="relative z-[60]">
      <div 
        className={`flex items-center bg-slate-100 dark:bg-slate-800 rounded-full px-4 py-2 transition-all ${isOpen ? 'w-48 sm:w-64' : 'w-32 sm:w-40'}`}
        onClick={() => setIsOpen(true)}
      >
        <Search size={18} className="text-slate-500 mr-2" />
        <input 
          type="text" 
          placeholder="Search..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          className="bg-transparent border-none outline-none text-sm w-full text-slate-800 dark:text-white"
        />
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute top-12 right-0 w-72 bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden py-2 border border-slate-200 dark:border-slate-700"
          >
            <div className="px-4 py-2 text-xs font-bold text-slate-400 uppercase">Recent</div>
            {recentPages.map(page => (
              <button key={page} className="block w-full text-left px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200">
                {page}
              </button>
            ))}
            <div className="px-4 py-2 text-xs font-bold text-slate-400 uppercase mt-2">Popular</div>
            {popularServices.map(service => (
              <button key={service} className="block w-full text-left px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200">
                {service}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
