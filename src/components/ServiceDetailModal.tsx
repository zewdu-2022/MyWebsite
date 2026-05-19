import React, { useState } from 'react';
import { X, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ServiceData {
  title: string;
  slug: string;
  icon: React.ReactNode;
  summary: string;
  description: string;
  features: string[];
  gradient: string;
  image: string;
}

interface Props {
  service: ServiceData | null;
  onClose: () => void;
}

export const ServiceDetailModal = ({ service, onClose }: Props) => {
  const [formState, setFormState] = useState({ name: '', email: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidEmail(formState.email)) {
      setStatus({ type: 'error', msg: 'Please enter a valid email address.' });
      return;
    }

    setIsSubmitting(true);
    setStatus(null);
    try {
      // Simulate API call or real one if exists
      await new Promise(resolve => setTimeout(resolve, 1000));
      setStatus({ type: 'success', msg: 'Thank you! Your inquiry has been sent.' });
      setFormState({ name: '', email: '', message: '' });
    } catch (error) {
      setStatus({ type: 'error', msg: 'Something went wrong. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!service) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-4xl shadow-2xl relative overflow-hidden flex flex-col md:flex-row max-h-[90vh]"
      >
        <button onClick={onClose} className="absolute top-4 right-4 z-10 text-white bg-black/50 p-2 rounded-full hover:bg-black/70">
          <X size={20} />
        </button>
        
        <div className="w-full md:w-1/2 p-8 overflow-y-auto">
          <h2 className="text-3xl font-bold mb-4">{service.title}</h2>
          <p className="text-slate-600 mb-6">{service.description}</p>
          <ul className="list-disc pl-5 space-y-2 mb-8 text-slate-700">
            {service.features.map(f => <li key={f}>{f}</li>)}
          </ul>
        </div>
        
        <div className="w-full md:w-1/2 p-8 bg-slate-50 dark:bg-slate-800 flex flex-col justify-center">
            <h3 className="text-xl font-bold mb-4">Request Service Details</h3>
            <form className="space-y-4" onSubmit={handleSubmit}>
                <input 
                  type="text" 
                  placeholder="Name" 
                  className="w-full p-3 rounded-lg border border-slate-200" 
                  value={formState.name}
                  onChange={(e) => setFormState(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
                <input 
                  type="email" 
                  placeholder="Email" 
                  className={`w-full p-3 rounded-lg border ${status?.type === 'error' && !isValidEmail(formState.email) ? 'border-red-500' : 'border-slate-200'}`} 
                  value={formState.email}
                  onChange={(e) => setFormState(prev => ({ ...prev, email: e.target.value }))}
                  required
                />
                <textarea 
                  placeholder="Message" 
                  className="w-full p-3 rounded-lg border border-slate-200" 
                  value={formState.message}
                  onChange={(e) => setFormState(prev => ({ ...prev, message: e.target.value }))}
                  required
                />
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="bg-blue-600 text-white w-full p-3 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                    {isSubmitting ? 'Sending...' : <><Send size={18}/> Send Inquiry</>}
                </button>
                {status && (
                  <p className={`text-sm mt-2 font-medium ${status.type === 'success' ? 'text-green-500' : 'text-red-500'}`}>
                    {status.msg}
                  </p>
                )}
            </form>
        </div>
      </motion.div>
    </div>
  );
};
