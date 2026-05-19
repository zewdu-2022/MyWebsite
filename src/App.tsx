/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { Particles } from './components/Particles';
import { Hero } from './components/Hero';
import { 
  Menu, X, ChevronDown, Rocket, BarChart3, LineChart, 
  Search, Users, BookOpen, Globe, Newspaper, Mail, MessageCircle,
  Linkedin, Facebook, ArrowRight, ArrowLeft, ArrowUp, ChevronLeft, ShieldCheck, Shield,
  Leaf, Cpu, Presentation, Handshake, CreditCard, LogIn, UserPlus, Youtube,
  Link as LinkIcon, Activity, TrendingUp, Lightbulb, Workflow, Microscope, Layers, Plus,
  Key, Terminal, Copy, Trash2, Bell, AlertTriangle, Calendar, Info, Sun, Moon, Hash, Settings, User as UserIcon, Tag
} from 'lucide-react';
import { useDarkMode } from './lib/theme';
import { trackEvent, trackPageView } from './lib/analytics';
import { motion, AnimatePresence, useScroll, useTransform } from 'motion/react';
import * as THREE from 'three';
import { ServiceDetailModal } from './components/ServiceDetailModal';
import { FeedbackButton } from './components/FeedbackButton';
import { SearchBar } from './components/SearchBar';
import { InteractiveGlobe } from './components/InteractiveGlobe';
import { 
  signInWithGoogle, logout, subscribeToAuthChanges, fetchUserProfile, 
  fetchAllUsers, updateUserRole, createApiKey, fetchUserApiKeys, deleteApiKey, updateUserProfile,
  subscribeToNotifications, markNotificationAsRead, createNotification,
  fetchBlogPosts, createBlogPost
} from './lib/firebase';
import type { User as FirebaseUser } from 'firebase/auth';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend, 
  Filler 
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const isValidEmail = (email: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

// --- Types ---
interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  image_path?: string;
  imagePath?: string; // Support both for compatibility
  date?: string;
  createdAt?: any;
}

interface Stats {
  gdp: number[];
  employment: number[];
  investment: number[];
  labels: string[];
}

interface EconomicIndicator {
  code: string;
  name: string;
  value: number;
  year: number;
  last_updated: string;
}

interface User {
  id: string;
  name: string;
  role: 'viewer' | 'editor' | 'admin';
  email: string;
  photoURL?: string;
  interests?: string[];
}

interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'event' | 'update' | 'alert';
  read: boolean;
  link?: string;
  createdAt: any;
}

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

const servicesData: ServiceData[] = [
  {
    title: "Research",
    slug: "research",
    icon: <Microscope size={32} />,
    summary: "Harnessing deep-tech methodologies for high-fidelity economic forecasting and policy simulation.",
    description: "Our research services provide deep insights into complex economic systems. We utilize advanced econometric models and qualitative methodologies to help institutions understand market dynamics, policy impacts, and future growth trajectories in emerging economies.",
    features: [
      "Macroeconomic Policy Analysis",
      "Sectoral Growth Studies",
      "Socio-Economic Impact Assessments",
      "Feasibility Studies & Market Mapping",
      "Sustainable Development Strategy"
    ],
    gradient: "from-blue-600 to-indigo-600",
    image: "https://images.unsplash.com/photo-1532187875605-2fe358711e98?auto=format&fit=crop&q=80&w=1200"
  },
  {
    title: "Market Intelligence",
    slug: "market-intelligence",
    icon: <TrendingUp size={32} />,
    summary: "Real-time insights using proprietary algorithms to capture and capitalize on fluctuating global economies.",
    description: "Navigate market volatility with precision. Our intelligence services aggregate global data to provide real-time updates on investment climates, competitive landscapes, and consumer behavior shifts specifically tailored for the Ethiopian and African markets.",
    features: [
      "Competitive Landscape Analysis",
      "Consumer Behavior Tracking",
      "Investment Risk Assessment",
      "Supply Chain Intelligence",
      "Real-time Pricing Monitors",
      "Export Market Research",
      "Local Market Research"
    ],
    gradient: "from-emerald-500 to-teal-600",
    image: "https://images.unsplash.com/photo-1551288049-bb8c803er9a2?auto=format&fit=crop&q=80&w=1200"
  },
  {
    title: "Data Analysis",
    slug: "data-analysis",
    icon: <Activity size={32} />,
    summary: "Transforming raw data into actionable wisdom through advanced neural networks and econometric modeling.",
    description: "We turn complex data sets into clear visual narratives. Our data scientists employ machine learning and traditional stats to uncover hidden patterns, optimizing organizational decision-making and project efficiency.",
    features: [
      "Predictive Analytics",
      "Custom Dashboard Development",
      "Big Data Visualization",
      "Statistical Simulation",
      "Data Integrity Auditing"
    ],
    gradient: "from-blue-400 to-cyan-500",
    image: "https://images.unsplash.com/photo-1543286386-713bcd534a70?auto=format&fit=crop&q=80&w=1200"
  },
  {
    title: "Project Development",
    slug: "project-development",
    icon: <Workflow size={32} />,
    summary: "Strategic project management and framework design to foster institutional excellence and capital growth.",
    description: "From conceptualization to execution, we manage high-impact development projects. We specialize in designing sustainable frameworks that bridge international expertise with local implementation needs.",
    features: [
      "Feasibility Study",
      "Financial Feasibility Assessment",
      "Economic Impact Analysis",
      "Risk & Uncertainty Analysis",
      "Post‑Evaluation & Lessons Learned",
      "Climate & Disaster Risk Assessment",
      "Project Lifecycle Management",
      "Institutional Capacity Building",
      "Stakeholder Engagement Strategies"
    ],
    gradient: "from-indigo-400 to-violet-500",
    image: "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&q=80&w=1200"
  },
  {
    title: "Training",
    slug: "training",
    icon: <Presentation size={32} />,
    summary: "Expert-led capacity building and knowledge transfer systems for future-ready professional development.",
    description: "Empower your workforce with modern skills. We offer specialized training programs in economic research, data tools, and leadership designed to increase efficiency and adapt to the digital economy.",
    features: [
      "International Market Intelligence",
      "Project Appraisal & Analysis",
      "Macroeconomic Diagnostics",
      "Research Methods & Statistical Software",
      "Import & Export Procedures",
      "Data Analysis & Science",
      "Energy Audit",
      "Capacity Utilization",
      "Marketing",
      "Data Science for Professionals"
    ],
    gradient: "from-amber-400 to-orange-600",
    image: "https://images.unsplash.com/photo-1524178232353-128462779140?auto=format&fit=crop&q=80&w=1200"
  },
  {
    title: "Consultancy",
    slug: "consultancy",
    icon: <Layers size={32} />,
    summary: "Bespoke advisory for cross-border ecosystems and resilient institutional leadership in a changing world.",
    description: "Bespoke strategic advice for businesses and governmental bodies. We provide expert guidance on organizational restructuring, investment strategies, and navigating regulatory environments in the Horn of Africa.",
    features: [
      "Economic Development Consultancy",
      "Macroeconomics Consultancy",
      "Manufacturing Industry Consultancy",
      "Strategic Business Planning",
      "Regulatory Compliance Advisory",
      "Investment Strategy Design",
      "Cross-border Trade Consulting",
      "Organizational Design"
    ],
    gradient: "from-emerald-400 to-green-600",
    image: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&q=80&w=1200"
  },
  {
    title: "Software Development",
    slug: "software-development",
    icon: <Cpu size={32} />,
    summary: "Architecting agile technological frameworks that adapt to global shifts with surgical precision.",
    description: "Custom software solutions designed for complexity. From data collection platforms to enterprise ERPs, we build the tools that power modern economic development and industrial efficiency.",
    features: [
      "Custom Enterprise Software",
      "Data Collection Platforms",
      "FinTech Solutions",
      "Mobile App Development",
      "API & Cloud Integration",
      "Website Development"
    ],
    gradient: "from-green-500 to-emerald-700",
    image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=1200"
  }
];

// --- Components ---

const BrandLogo = ({ isDark = false, text = "", onClick }: { isDark?: boolean, text?: string, onClick?: () => void }) => {
  const words = text.split(' ');
  const firstLine = words[0] || "";
  const remaining = words.slice(1).join(' ');
  
  return (
    <div 
      className="flex items-center gap-4 cursor-pointer group"
      onClick={onClick || (() => alert("Welcome to 567 Development for all - ልማት ለሁሉም \nBuilding a sustainable future together."))}
    >
      <div className="relative w-14 h-14 flex items-center justify-center border-2 border-dashed border-slate-200/20 rounded-full">
        <div className={`absolute inset-0 rounded-full transition-colors ${isDark ? 'bg-white/10 group-hover:bg-white/20' : 'bg-brand-blue/10 group-hover:bg-brand-blue/20'}`} />
        <div className="rotating-logo absolute inset-0">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <path
              id={isDark ? "circlePathFooter" : "circlePathHeader"}
              d="M 50, 50 m -37, 0 a 37,37 0 1,1 74,0 a 37,37 0 1,1 -74,0"
              fill="none"
            />
            <text className={`text-[8px] font-bold uppercase tracking-widest ${isDark ? 'fill-white' : 'fill-brand-blue'}`}>
              <textPath xlinkHref={isDark ? "#circlePathFooter" : "#circlePathHeader"}>
                567 Development for all • ልማት ለሁሉም • 
              </textPath>
            </text>
          </svg>
        </div>
        <div className="w-8 h-8 bg-brand-blue rounded-lg flex items-center justify-center text-white font-bold text-sm z-10 shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
          567
        </div>
      </div>
      <div className="flex flex-col justify-center leading-none">
        <span className={`text-base sm:text-lg font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-blue-400'}`}>
          {firstLine}
        </span>
        {remaining && (
          <span className="text-[10px] sm:text-sm font-medium tracking-wide text-slate-400 uppercase">
            {remaining}
          </span>
        )}
      </div>
    </div>
  );
};

const NavDropdown = ({ title, items, onSelect }: { title: string, items: string[], onSelect?: (item: string) => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div 
      className="relative group py-2"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button className="nav-link flex items-center gap-1">
        {title} <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <div className={`nav-dropdown ${isOpen ? '!block' : ''}`}>
        {items.map((item) => (
          <button 
            key={item} 
            onClick={() => onSelect?.(item)}
            className="nav-dropdown-item block w-full text-left bg-transparent border-none"
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );
};

const MobileNavDropdown = ({ title, items, onSelect }: { title: string, items: string[], onSelect?: (item: string) => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="w-full">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full py-3 text-slate-800 font-medium border-b border-slate-100"
      >
        {title} <ChevronDown size={18} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-slate-50"
          >
            {items.map((item) => (
              <button 
                key={item} 
                onClick={() => onSelect?.(item)}
                className="block w-full text-left py-3 px-6 text-slate-600 text-sm hover:text-brand-blue transition-colors"
              >
                {item}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ServiceRequestForm = ({ serviceTitle }: { serviceTitle: string }) => {
  const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    
    if (!isValidEmail(data.email as string)) {
      setStatus({ type: 'error', msg: 'Please enter a valid email address.' });
      return;
    }

    setLoading(true);
    setStatus(null);
    
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, service: serviceTitle })
      });
      const result = await res.json();
      if (res.ok) {
        trackEvent('service_request_submitted', { service: serviceTitle });
        setStatus({ type: 'success', msg: 'Your request has been submitted. We will contact you soon!' });
        (e.target as HTMLFormElement).reset();
      } else {
        setStatus({ type: 'error', msg: result.error || 'Submission failed.' });
      }
    } catch (err) {
      setStatus({ type: 'error', msg: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-100">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-brand-blue/10 flex items-center justify-center text-brand-blue">
          <Mail size={20} />
        </div>
        <h3 className="text-2xl font-black text-slate-900">Request This Service</h3>
      </div>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid md:grid-cols-2 gap-5">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Full Name</label>
            <input name="name" required className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3.5 text-sm focus:bg-white focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none transition-all" placeholder="e.g. John Doe" />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Email Address</label>
            <input name="email" type="email" required className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3.5 text-sm focus:bg-white focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none transition-all" placeholder="e.g. john@growthlab.org" />
          </div>
        </div>
        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Selected Service</label>
          <div className="w-full bg-slate-100/50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm text-slate-500 font-bold capitalize">
            {serviceTitle}
          </div>
        </div>
        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Consultation Details</label>
          <textarea name="message" required className="w-full min-h-[140px] bg-slate-50 border border-slate-100 rounded-xl px-4 py-4 text-sm focus:bg-white focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none transition-all resize-none" placeholder="Please describe your specific needs or project goals..." />
        </div>
        <button 
          type="submit" 
          disabled={loading}
          className="w-full py-4 bg-brand-blue text-white font-black rounded-xl hover:bg-brand-blue/90 transform active:scale-[0.98] transition-all disabled:opacity-50 shadow-lg shadow-blue-500/25 flex items-center justify-center gap-3"
        >
          {loading ? 'Processing...' : 'Submit Request'} <ArrowRight size={18} />
        </button>
        {status && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-xl text-center text-xs font-bold flex items-center justify-center gap-2 ${status.type === 'success' ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'}`}
          >
            {status.type === 'success' ? <ShieldCheck size={16} /> : <X size={16} />}
            {status.msg}
          </motion.div>
        )}
      </form>
    </div>
  );
};

const BlogPostCard = ({ post, index }: { post: BlogPost, index: number }) => (
  <motion.article 
    initial={{ opacity: 0, scale: 0.95 }}
    whileInView={{ opacity: 1, scale: 1 }}
    viewport={{ once: true }}
    transition={{ delay: index * 0.1 }}
    className="break-inside-avoid mb-8 bg-white rounded-3xl overflow-hidden border border-slate-100 hover:border-brand-blue/30 shadow-sm hover:shadow-xl hover:shadow-brand-blue/5 transition-all duration-500 group"
  >
    <div className="relative h-64 overflow-hidden">
      <img 
        src={post.image_path} 
        alt={post.title} 
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
      />
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-6">
        <div className="flex items-center justify-between">
          <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-bold text-white uppercase tracking-widest">
            {post.category || 'Opinion'}
          </span>
          <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
            {post.date ? new Date(post.date).toLocaleDateString() : post.createdAt ? new Date(post.createdAt.seconds * 1000).toLocaleDateString() : 'Recent'}
          </span>
        </div>
      </div>
    </div>
    <div className="p-8">
      <h4 className="text-xl font-bold text-slate-900 mb-4 line-clamp-2 leading-tight group-hover:text-brand-blue transition-colors">
        {post.title}
      </h4>
      <p className="text-slate-600 mb-6 text-sm line-clamp-3 leading-relaxed">
        {post.excerpt}
      </p>
      
      <div className="flex items-center justify-between pt-6 border-t border-slate-50">
        <button className="text-sm font-bold text-slate-900 flex items-center gap-2 hover:text-brand-blue transition-colors group/link">
          Read More <ArrowRight className="group-hover/link:translate-x-1 transition-transform" size={16} />
        </button>
        <div className="flex gap-2 text-slate-400">
          <button 
            onClick={() => {
              const url = `${window.location.origin}#blog-${post.id}`;
              navigator.clipboard.writeText(url);
            }}
            className="hover:text-brand-blue transition-colors p-2 hover:bg-slate-50 rounded-lg"
            title="Copy Link"
          >
            <LinkIcon size={16} />
          </button>
          <button className="hover:text-blue-700 transition-colors p-2 hover:bg-slate-50 rounded-lg"><Linkedin size={16} /></button>
          <button className="hover:text-slate-900 transition-colors p-2 hover:bg-slate-50 rounded-lg"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"/></svg></button>
        </div>
      </div>
    </div>
  </motion.article>
);

const AboutView = ({ section, onBack }: { section?: string, onBack: () => void }) => {
  const [selectedService, setSelectedService] = useState<ServiceData | null>(null);
  useEffect(() => {
    if (section) {
      const el = document.getElementById(section);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.scrollTo(0, 0);
    }
  }, [section]);

  const values = [
    { title: "Integrity", desc: "Upholding the highest ethical standards in all our research and advisory.", icon: <ShieldCheck className="text-brand-blue" /> },
    { title: "Sustainability", desc: "Ensuring our solutions balance economic growth with environmental care.", icon: <Leaf className="text-brand-green" /> },
    { title: "Innovation", desc: "Driving progress through cutting-edge technology and creative thinking.", icon: <Lightbulb className="text-amber-500" /> },
    { title: "Collaboration", desc: "Building strong partnerships for shared global prosperity.", icon: <Users className="text-indigo-500" /> }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="bg-white"
    >
      {/* --- HERO HEADER --- */}
      <section className="relative pt-32 pb-20 overflow-hidden bg-slate-50">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-brand-blue/5 -skew-x-12 transform translate-x-1/4" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-xs font-black text-brand-blue mb-8 uppercase tracking-widest hover:opacity-70 transition-all"
          >
            <ArrowLeft size={14} strokeWidth={3} /> Back to Home
          </button>
          
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h1 className="text-5xl md:text-6xl font-black text-slate-900 leading-tight mb-6">
                Redefining Development <span className="text-brand-blue">Together.</span>
              </h1>
              <p className="text-xl text-slate-600 leading-relaxed font-medium mb-8">
                Since 2008, 567 Development has been at the forefront of economic research and institutional framework design across emerging markets. We bridge the gap between data-driven insight and sustainable local implementation.
              </p>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2 bg-white px-6 py-3 rounded-2xl shadow-sm border border-slate-100">
                  <Activity size={20} className="text-brand-green" />
                  <span className="font-bold text-slate-800">15+ Years Impact</span>
                </div>
                <div className="flex items-center gap-2 bg-white px-6 py-3 rounded-2xl shadow-sm border border-slate-100">
                  <Globe size={20} className="text-brand-blue" />
                  <span className="font-bold text-slate-800">Global Reach</span>
                </div>
              </div>
            </div>
            
            {/* Video Intro Area */}
            <div className="relative group">
              <div className="aspect-video bg-slate-200 rounded-[2.5rem] overflow-hidden shadow-2xl relative">
                <img 
                  src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1200" 
                  alt="Office Video Placeholder"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
                />
                <div className="absolute inset-0 bg-slate-900/20 group-hover:bg-slate-900/10 transition-colors" />
                <button className="absolute inset-0 m-auto w-20 h-20 bg-white rounded-full flex items-center justify-center text-brand-blue shadow-2xl hover:scale-110 transition-all">
                  <Youtube size={32} />
                </button>
              </div>
              {/* Decorative elements */}
              <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-brand-green/20 rounded-full blur-2xl" />
              <div className="absolute -top-4 -left-4 w-32 h-32 bg-brand-blue/20 rounded-full blur-2xl" />
            </div>
          </div>
        </div>
      </section>

      {/* --- MISSION & VISION --- */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12">
            <motion.div 
              id="mission"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="p-10 rounded-[3rem] bg-brand-blue/5 border border-brand-blue/10"
            >
              <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-brand-blue mb-6">
                <Rocket size={24} />
              </div>
              <h2 className="text-3xl font-black text-slate-900 mb-6">Our Mission</h2>
              <p className="text-lg text-slate-600 leading-relaxed font-medium">
                To empower societies through data-driven development strategies that foster economic resilience, social equity, and environmental harmony. We aim to be the catalyst for sustainable growth in every community we serve.
              </p>
            </motion.div>

            <motion.div 
              id="vision"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="p-10 rounded-[3rem] bg-brand-green/5 border border-brand-green/10"
            >
              <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-brand-green mb-6">
                <Globe size={24} />
              </div>
              <h2 className="text-3xl font-black text-slate-900 mb-6">Our Vision</h2>
              <p className="text-lg text-slate-600 leading-relaxed font-medium">
                To become the global benchmark for transformative development consultancy, recognized for bridging the gap between sophisticated global research and impactful local implementation.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* --- VALUES --- */}
      <section id="values" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16"
          >
            <h2 className="text-brand-blue font-black uppercase tracking-[0.3em] text-xs mb-4">Core Principles</h2>
            <h3 className="text-4xl md:text-6xl font-black text-slate-900 mb-6 leading-tight">
              The Values We <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-blue to-emerald-500">Live By</span>
            </h3>
            <div className="w-24 h-1.5 bg-gradient-to-r from-brand-blue to-brand-green mx-auto rounded-full" />
          </motion.div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((v, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white p-8 rounded-[2.5rem] shadow-sm hover:shadow-xl transition-all border border-white"
              >
                <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                  {v.icon}
                </div>
                <h4 className="text-xl font-bold text-slate-900 mb-4">{v.title}</h4>
                <p className="text-slate-500 text-sm leading-relaxed">{v.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* --- GLOBE SECTION --- */}
      <section className="py-24 bg-slate-900 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-brand-blue font-black uppercase tracking-[0.3em] text-xs mb-4">Global Reach</h2>
            <h3 className="text-4xl md:text-6xl font-black text-white mb-6">Our Global Presence</h3>
            <div className="w-24 h-1.5 bg-brand-blue mx-auto rounded-full" />
          </div>
          <div className="h-[600px] w-full rounded-[3rem] overflow-hidden bg-black/50 border border-slate-800">
            <InteractiveGlobe />
          </div>
        </div>
      </section>

      <FeedbackButton />
      <ServiceDetailModal service={selectedService} onClose={() => setSelectedService(null)} />
    </motion.div>
  );
};

const PublicationView = ({ onBack }: { onBack: () => void }) => {
  const [expanded, setExpanded] = useState<string | null>('research');

  const publications = [
    { 
      id: 'research', 
      title: 'Research', 
      content: 'Our latest research papers cover a wide range of topics from macroeconomic stability to micro-level institutional audits. Each publication is peer-reviewed and vetted by international development experts to ensure accuracy and relevance in today\'s volatile markets.' 
    },
    { 
      id: 'portfolio', 
      title: 'Portfolio', 
      content: 'A detailed catalog of 567 Development\'s engagements across four continents. This portfolio highlights our capacity to manage complex, multi-stakeholder projects and deliver sustainable outcomes that align with both local needs and global standards.' 
    },
    { 
      id: 'journal', 
      title: 'Journal', 
      content: 'The GrowthLab Journal of Emerging Economies is our flagship quarterly publication. It features contributions from leading scholars, frontline development workers, and data scientists, providing a holistic view of modern development challenges.' 
    },
    { 
      id: 'books', 
      title: 'Books', 
      content: 'Explore our collection of in-depth analytical books. These volumes serve as essential reference material for policy makers, academic researchers, and development practitioners who seek to understand the underlying drivers of long-term economic growth.' 
    }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-slate-50 pt-24 pb-20"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-black text-brand-blue mb-12 uppercase tracking-widest hover:opacity-70 transition-all"
        >
          <ArrowLeft size={14} strokeWidth={3} /> Back to Home
        </button>

        <div className="grid lg:grid-cols-12 gap-12">
          {/* Left Sidebar - Accordions */}
          <div className="lg:col-span-4 space-y-4">
            <h2 className="text-sm font-black text-brand-blue uppercase tracking-widest mb-8">Categories</h2>
            {publications.map((pub) => (
              <div 
                key={pub.id}
                className={`overflow-hidden rounded-2xl border transition-all ${expanded === pub.id ? 'bg-white border-brand-blue shadow-lg' : 'bg-white/50 border-slate-200 shadow-sm'}`}
              >
                <button 
                  onClick={() => setExpanded(expanded === pub.id ? null : pub.id)}
                  className="w-full p-6 flex items-center justify-between group"
                >
                  <span className={`text-lg font-bold transition-colors ${expanded === pub.id ? 'text-brand-blue' : 'text-slate-700'}`}>
                    {pub.title}
                  </span>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${expanded === pub.id ? 'bg-brand-blue text-white rotate-45' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'}`}>
                    <Plus size={20} />
                  </div>
                </button>
                <AnimatePresence>
                  {expanded === pub.id && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                    >
                      <div className="px-6 pb-6 text-sm text-slate-500 leading-relaxed italic">
                        {pub.title} overview and archives.
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>

          {/* Middle - Reading Space */}
          <div className="lg:col-span-8">
            <div className="bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100 min-h-[700px] flex flex-col">
              <div className="p-12 md:p-20 flex-1">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={expanded || 'empty'}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.4 }}
                    className="max-w-2xl mx-auto"
                  >
                    {expanded ? (
                      <>
                        <h1 className="text-5xl font-black text-slate-900 mb-10 leading-tight">
                          Modern Perspectives on <span className="text-brand-blue">{publications.find(p => p.id === expanded)?.title}</span>
                        </h1>
                        <div className="prose prose-slate lg:prose-xl max-w-none">
                          <p className="text-xl text-slate-600 leading-relaxed font-medium mb-8">
                            {publications.find(p => p.id === expanded)?.content}
                          </p>
                          <div className="w-16 h-1 bg-brand-green mb-8 rounded-full" />
                          <p className="text-slate-500 leading-relaxed">
                            Building upon a decade of field work, this directory consolidates our most impactful contributions to the global developmental discourse. We invite you to explore the intersections of data, policy, and human progress.
                          </p>
                          
                          {/* Placeholder for "Reading space" specific items */}
                          <div className="mt-16 space-y-12">
                             {[1, 2, 3].map(i => (
                               <div key={i} className="group cursor-pointer">
                                 <div className="flex justify-between items-end mb-4 border-b border-slate-100 pb-2">
                                   <span className="text-xs font-black text-brand-green uppercase tracking-widest">Article 0{i}</span>
                                   <span className="text-xs text-slate-400">MAY 2024</span>
                                 </div>
                                 <h4 className="text-2xl font-bold text-slate-800 mb-2 group-hover:text-brand-blue transition-colors">Strategic Implications of Urban Resilience in Sub-Saharan Governance</h4>
                                 <p className="text-slate-500 text-sm line-clamp-2">This paper investigates how urban centers can leverage digital infrastructure to mitigate economic shocks...</p>
                               </div>
                             ))}
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center py-20">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-6">
                          <BookOpen size={40} />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-400">Select a category to begin reading</h2>
                        <p className="text-slate-300 max-w-xs mt-4 italic">Our knowledge hub is designed for deep focus and academic exploration.</p>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
              
              {/* Reading Space Footer/Status */}
              <div className="bg-slate-50 px-12 py-6 border-t border-slate-100 flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-brand-green rounded-full animate-pulse" />
                  READING MODE ACTIVE
                </div>
                <div>GROWTHLAB KNOWLEDGE HUB // 2024</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const ProfileView = ({ user, onUpdate, onBack }: { user: User, onUpdate: (data: Partial<User>) => void, onBack: () => void }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user.name);
  const [interests, setInterests] = useState<string[]>(user.interests || []);
  const [updating, setUpdating] = useState(false);

  const availableInterests = ["Sustainability", "Global Economy", "Technology", "Public Policy", "Market Research", "Education", "Healthcare", "Infrastructure", "Renewable Energy"];

  const toggleInterest = (interest: string) => {
    if (interests.includes(interest)) {
      setInterests(interests.filter(i => i !== interest));
    } else {
      setInterests([...interests, interest]);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    try {
      await updateUserProfile(user.id, { displayName: name, interests });
      onUpdate({ name, interests });
      setIsEditing(false);
    } catch (err) {
      console.error("Failed to update profile", err);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-slate-50 pt-24 pb-20"
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-black text-brand-blue mb-12 uppercase tracking-widest hover:opacity-70 transition-all group"
        >
          <ArrowLeft size={14} strokeWidth={3} className="group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
        </button>

        <div className="bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100">
          <div className="h-64 bg-gradient-to-br from-indigo-600 via-brand-blue to-purple-700 relative">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
            <div className="absolute -bottom-20 left-12">
              <div className="relative">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="" className="w-40 h-40 rounded-[2.5rem] border-8 border-white shadow-2xl object-cover" />
                ) : (
                  <div className="w-40 h-40 rounded-[2.5rem] border-8 border-white bg-slate-100 shadow-2xl flex items-center justify-center text-slate-300">
                    <UserIcon size={64} />
                  </div>
                )}
                <div className="absolute bottom-2 right-2 w-8 h-8 bg-green-500 border-4 border-white rounded-full"></div>
              </div>
            </div>
          </div>

          <div className="pt-24 px-12 pb-12">
            <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-16">
              <div className="flex-grow">
                <div className="flex items-center gap-4 mb-2">
                  <h1 className="text-4xl font-black text-slate-900">{user.name}</h1>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 ${
                    user.role === 'admin' ? 'bg-red-50 text-red-600' :
                    user.role === 'editor' ? 'bg-blue-50 text-blue-600' :
                    'bg-slate-100 text-slate-500'
                  }`}>
                    <Shield size={10} /> {user.role}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-6 text-slate-500 font-medium text-sm">
                  <span className="flex items-center gap-2">
                    <Mail size={16} className="text-brand-blue/60" /> {user.email}
                  </span>
                  <span className="flex items-center gap-2">
                    <Calendar size={16} className="text-brand-blue/60" /> Member since 2024
                  </span>
                </div>
                
                <div className="mt-8">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                    <Hash size={14} /> Professional Interests
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {user.interests?.length ? user.interests.map(interest => (
                      <span key={interest} className="px-4 py-1.5 bg-slate-50 text-slate-600 text-[10px] font-bold rounded-xl border border-slate-100 uppercase tracking-wider">
                        {interest}
                      </span>
                    )) : (
                      <p className="text-slate-400 text-sm italic">No interests specified.</p>
                    )}
                  </div>
                </div>
              </div>
              
              {!isEditing ? (
                <button 
                  onClick={() => setIsEditing(true)}
                  className="w-full md:w-auto px-8 py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-brand-blue transition-all shadow-xl hover:shadow-brand-blue/20 flex items-center justify-center gap-2 group"
                >
                  <Settings size={18} className="group-hover:rotate-90 transition-transform duration-500" /> Edit Profile
                </button>
              ) : null}
            </div>

            {isEditing ? (
              <motion.form 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                onSubmit={handleUpdate} 
                className="space-y-10 bg-slate-50 p-10 rounded-[3rem] border border-slate-100 shadow-inner"
              >
                <div className="grid md:grid-cols-2 gap-10">
                  <div className="space-y-3">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Display Name</label>
                    <div className="relative">
                      <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                      <input 
                        type="text" 
                        required
                        disabled={updating}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold text-slate-800 focus:ring-4 focus:ring-brand-blue/10 outline-none transition-all disabled:opacity-50"
                        placeholder="Your full name"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Account Email</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-200" size={18} />
                      <input 
                        type="email" 
                        disabled
                        value={user.email}
                        className="w-full bg-slate-100/50 border border-slate-100 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold text-slate-400 cursor-not-allowed"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium ml-1">Email cannot be changed once verified.</p>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 ml-1 flex items-center gap-2">
                    <Tag size={12} /> Expertise & Interests
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {availableInterests.map(interest => (
                      <button
                        key={interest}
                        type="button"
                        onClick={() => toggleInterest(interest)}
                        className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                          interests.includes(interest) 
                            ? 'bg-brand-blue text-white shadow-xl shadow-blue-500/30 ring-4 ring-brand-blue/10' 
                            : 'bg-white border border-slate-200 text-slate-500 hover:border-brand-blue/40'
                        }`}
                      >
                        {interest}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 pt-8 border-t border-slate-200/50">
                  <button 
                    type="submit"
                    disabled={updating}
                    className="w-full sm:flex-grow py-5 bg-brand-blue text-white font-black rounded-2xl shadow-2xl shadow-blue-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
                  >
                    {updating ? <LoadingSpinner size={20} className="text-white" /> : (
                      <>
                        <ShieldCheck size={20} /> Save Profile Changes
                      </>
                    )}
                  </button>
                  <button 
                    type="button"
                    disabled={updating}
                    onClick={() => { setIsEditing(false); setName(user.name); setInterests(user.interests || []); }}
                    className="w-full sm:w-auto px-10 py-5 bg-white border border-slate-200 text-slate-600 font-bold rounded-2xl hover:bg-slate-50 transition-all disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </motion.form>
            ) : (
              <div className="grid md:grid-cols-3 gap-8">
                <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 hover:border-brand-blue/20 transition-colors group">
                  <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-brand-blue mb-6 group-hover:scale-110 transition-transform">
                    <Activity size={24} />
                  </div>
                  <h4 className="font-black text-slate-900 mb-2">Activity Monitor</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">Track your engagement and contributions across the Knowledge Hub platform.</p>
                </div>
                <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 hover:border-brand-blue/20 transition-colors group">
                  <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-brand-blue mb-6 group-hover:scale-110 transition-transform">
                    <ShieldCheck size={24} />
                  </div>
                  <h4 className="font-black text-slate-900 mb-2">Privacy & Security</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">Manage your data permissions and security settings for your 567 Development account.</p>
                </div>
                <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 hover:border-brand-blue/20 transition-colors group">
                  <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-brand-blue mb-6 group-hover:scale-110 transition-transform">
                    <TrendingUp size={24} />
                  </div>
                  <h4 className="font-black text-slate-900 mb-2">Growth Tracking</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">See how your professional profile has evolved and get tailored research recommendations.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const LoadingSpinner = ({ size = 24, className = "" }: { size?: number, className?: string }) => (
  <motion.div
    animate={{ rotate: 360 }}
    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
    className={`text-brand-blue ${className}`}
  >
    <Activity size={size} />
  </motion.div>
);

const Skeleton = ({ className = "" }: { className?: string }) => (
  <div className={`bg-slate-200 animate-pulse rounded ${className}`} />
);

const NotificationCenter = ({ 
  notifications, 
  onClose, 
  onMarkRead 
}: { 
  notifications: Notification[], 
  onClose: () => void,
  onMarkRead: (id: string) => void
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      className="absolute top-full right-0 mt-4 w-96 bg-white rounded-[2rem] shadow-2xl border border-slate-100 overflow-hidden z-[100]"
    >
      <div className="p-6 border-b border-slate-50 flex items-center justify-between">
        <h3 className="font-black text-slate-900 uppercase tracking-widest text-xs">Notifications</h3>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
          <X size={16} />
        </button>
      </div>
      
      <div className="max-h-[400px] overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center gap-4">
            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
              <Bell size={24} />
            </div>
            <p className="text-sm text-slate-400 italic">No notifications yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {notifications.map((notif) => (
              <div 
                key={notif.id} 
                onClick={() => !notif.read && onMarkRead(notif.id)}
                className={`p-6 hover:bg-slate-50 transition-colors cursor-pointer relative ${!notif.read ? 'bg-blue-50/30' : ''}`}
              >
                {!notif.read && (
                  <div className="absolute top-6 right-6 w-2 h-2 bg-brand-blue rounded-full" />
                )}
                <div className="flex gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    notif.type === 'alert' ? 'bg-red-50 text-red-500' :
                    notif.type === 'event' ? 'bg-amber-50 text-amber-500' :
                    notif.type === 'update' ? 'bg-green-50 text-green-500' :
                    'bg-blue-50 text-brand-blue'
                  }`}>
                    {notif.type === 'alert' ? <AlertTriangle size={18} /> :
                     notif.type === 'event' ? <Calendar size={18} /> :
                     notif.type === 'update' ? <Activity size={18} /> :
                     <Info size={18} />}
                  </div>
                  <div>
                    <h5 className={`text-sm font-bold mb-1 ${!notif.read ? 'text-slate-900' : 'text-slate-600'}`}>{notif.title}</h5>
                    <p className="text-xs text-slate-500 leading-relaxed mb-2">{notif.message}</p>
                    <span className="text-[10px] font-medium text-slate-400 capitalize">
                      {notif.createdAt?.toDate ? notif.createdAt.toDate().toLocaleDateString() : 'Just now'} • {notif.type}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {notifications.length > 0 && (
        <div className="p-4 bg-slate-50 text-center border-t border-slate-100">
          <button className="text-[10px] font-black text-brand-blue uppercase tracking-widest hover:opacity-70">
            View All Updates
          </button>
        </div>
      )}
    </motion.div>
  );
};

const AdminPanelView = ({ onBack, currentUser }: { onBack: () => void, currentUser: User | null }) => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'blog'>('users');
  
  // Blog form state
  const [blogForm, setBlogForm] = useState({ title: '', excerpt: '', content: '', category: 'Research', imagePath: '' });
  const [creatingPost, setCreatingPost] = useState(false);
  const [postStatus, setPostStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

  useEffect(() => {
    if (activeTab === 'users') {
      const loadUsers = async () => {
        setLoading(true);
        const allUsers = await fetchAllUsers();
        setUsers(allUsers);
        setLoading(false);
      };
      loadUsers();
    }
  }, [activeTab]);

  const handleRoleChange = async (uid: string, newRole: 'admin' | 'editor' | 'viewer') => {
    setUsers(users.map(u => u.uid === uid ? { ...u, role: newRole, isUpdating: true } : u));
    await updateUserRole(uid, newRole);
    setUsers(users.map(u => u.uid === uid ? { ...u, role: newRole, isUpdating: false } : u));
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setCreatingPost(true);
    setPostStatus(null);
    try {
      const res = await createBlogPost({
        ...blogForm,
        authorId: currentUser.id
      });
      if (res) {
        setPostStatus({ type: 'success', msg: 'Blog post created successfully!' });
        setBlogForm({ title: '', excerpt: '', content: '', category: 'Research', imagePath: '' });
      }
    } catch (err) {
      setPostStatus({ type: 'error', msg: 'Failed to create blog post.' });
    } finally {
      setCreatingPost(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-slate-50 pt-24 pb-20"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-black text-brand-blue mb-12 uppercase tracking-widest hover:opacity-70 transition-all"
        >
          <ArrowLeft size={14} strokeWidth={3} /> Back to Home
        </button>

        <div className="flex gap-4 mb-8">
          <button 
            onClick={() => setActiveTab('users')}
            className={`px-6 py-3 rounded-2xl font-bold transition-all ${activeTab === 'users' ? 'bg-brand-blue text-white shadow-lg shadow-blue-500/20' : 'bg-white text-slate-500 border border-slate-100 hover:border-brand-blue/30'}`}
          >
            Users
          </button>
          <button 
            onClick={() => setActiveTab('blog')}
            className={`px-6 py-3 rounded-2xl font-bold transition-all ${activeTab === 'blog' ? 'bg-brand-blue text-white shadow-lg shadow-blue-500/20' : 'bg-white text-slate-500 border border-slate-100 hover:border-brand-blue/30'}`}
          >
            Blog Management
          </button>
        </div>

        <div className="bg-white rounded-[2rem] shadow-xl overflow-hidden border border-slate-100">
          {activeTab === 'users' ? (
            <>
              <div className="p-8 border-b border-slate-100 flex justify-between items-center text-slate-800">
                <div>
                  <h1 className="text-2xl font-black text-slate-900">User Role Management</h1>
                  <p className="text-sm text-slate-500 mt-1">Manage system permissions and access levels</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-full border border-slate-100 text-xs font-bold text-slate-600">
                  {loading ? <Skeleton className="w-4 h-4 rounded-full" /> : <Users size={16} />} 
                  {loading ? <Skeleton className="w-20 h-3" /> : `${users.length} Total Users`}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <th className="px-8 py-4">User</th>
                      <th className="px-8 py-4">Email</th>
                      <th className="px-8 py-4">Current Role</th>
                      <th className="px-8 py-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {loading ? (
                      [...Array(5)].map((_, i) => (
                        <tr key={i}>
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-3">
                              <Skeleton className="w-8 h-8 rounded-full" />
                              <Skeleton className="w-32 h-4" />
                            </div>
                          </td>
                          <td className="px-8 py-6"><Skeleton className="w-48 h-4" /></td>
                          <td className="px-8 py-6"><Skeleton className="w-16 h-6 rounded-full" /></td>
                          <td className="px-8 py-6"><Skeleton className="w-40 h-8 rounded-lg" /></td>
                        </tr>
                      ))
                    ) : users.map(userDoc => (
                      <tr key={userDoc.uid} className="hover:bg-slate-50/30 transition-colors">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-3">
                            {userDoc.photoURL ? (
                              <img src={userDoc.photoURL} alt="" className="w-8 h-8 rounded-full" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                                <Users size={16} />
                              </div>
                            )}
                            <span className="font-bold text-slate-800">{userDoc.displayName || 'Anonymous'}</span>
                          </div>
                        </td>
                        <td className="px-8 py-6 text-sm text-slate-500">{userDoc.email}</td>
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-2">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                              userDoc.role === 'admin' ? 'bg-red-50 text-red-600' :
                              userDoc.role === 'editor' ? 'bg-blue-50 text-blue-600' :
                              'bg-slate-100 text-slate-500'
                            }`}>
                              {userDoc.role}
                            </span>
                            {userDoc.isUpdating && <LoadingSpinner size={12} />}
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-2">
                            {(['viewer', 'editor', 'admin'] as const).map(role => (
                              <button
                                key={role}
                                disabled={userDoc.role === role || userDoc.isUpdating}
                                onClick={() => handleRoleChange(userDoc.uid, role)}
                                className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${
                                  userDoc.role === role 
                                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                    : 'bg-white border border-slate-200 text-slate-600 hover:border-brand-blue hover:text-brand-blue'
                                }`}
                              >
                                Set {role}
                              </button>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="p-12">
              <div className="mb-12">
                <h2 className="text-2xl font-black text-slate-900">Create New Blog Post</h2>
                <p className="text-slate-500 mt-2 font-medium">Add a new article or research piece to the Knowledge Hub</p>
              </div>

              <form onSubmit={handleCreatePost} className="max-w-3xl space-y-8">
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Title</label>
                    <input 
                      required
                      value={blogForm.title}
                      onChange={e => setBlogForm({ ...blogForm, title: e.target.value })}
                      placeholder="Enter post title"
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3.5 text-sm focus:bg-white outline-none ring-brand-blue/20 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</label>
                    <select 
                      value={blogForm.category}
                      onChange={e => setBlogForm({ ...blogForm, category: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3.5 text-sm focus:bg-white outline-none ring-brand-blue/20 transition-all font-bold text-slate-600"
                    >
                      {['Research', 'Market News', 'Institutional Audit', 'Policy', 'Industrial'].map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Image URL</label>
                  <input 
                    value={blogForm.imagePath}
                    onChange={e => setBlogForm({ ...blogForm, imagePath: e.target.value })}
                    placeholder="https://images.unsplash.com/photo-..."
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3.5 text-sm focus:bg-white outline-none ring-brand-blue/20 transition-all"
                  />
                  <p className="text-[10px] text-slate-400 font-medium">Leave empty for default image</p>
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Excerpt</label>
                  <textarea 
                    required
                    value={blogForm.excerpt}
                    onChange={e => setBlogForm({ ...blogForm, excerpt: e.target.value })}
                    placeholder="Short summary for the preview card..."
                    className="w-full h-24 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3.5 text-sm focus:bg-white outline-none ring-brand-blue/20 transition-all resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Full Content</label>
                  <textarea 
                    required
                    value={blogForm.content}
                    onChange={e => setBlogForm({ ...blogForm, content: e.target.value })}
                    placeholder="Article body content..."
                    className="w-full h-64 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3.5 text-sm focus:bg-white outline-none ring-brand-blue/20 transition-all resize-none"
                  />
                </div>

                <div className="flex items-center gap-4 pt-4">
                  <button 
                    disabled={creatingPost}
                    type="submit"
                    className="px-10 py-4 bg-brand-blue text-white font-black rounded-xl shadow-xl shadow-blue-500/20 hover:scale-[1.02] active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-3"
                  >
                    {creatingPost ? <LoadingSpinner size={20} className="text-white" /> : 'Publish Article'}
                  </button>
                  
                  {postStatus && (
                    <motion.div 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`text-sm font-bold ${postStatus.type === 'success' ? 'text-green-500' : 'text-red-500'}`}
                    >
                      {postStatus.msg}
                    </motion.div>
                  )}
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const DevSettingsView = ({ user, onBack }: { user: User, onBack: () => void }) => {
  const [keys, setKeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newKeyName, setNewKeyName] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const loadKeys = async () => {
      const userKeys = await fetchUserApiKeys(user.id);
      setKeys(userKeys);
      setLoading(false);
    };
    loadKeys();
  }, [user.id]);

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;
    setCreating(true);
    const newKey = await createApiKey(user.id, newKeyName);
    if (newKey) {
      setKeys([...keys, { ...newKey, createdAt: { toDate: () => new Date() } }]);
      setNewKeyName('');
    }
    setCreating(false);
  };

  const handleDeleteKey = async (keyId: string) => {
    if (confirm('Are you sure you want to delete this API key?')) {
      // Optimistic update
      setKeys(keys.filter(k => k.id !== keyId));
      await deleteApiKey(keyId);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-slate-50 pt-24 pb-20"
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-black text-brand-blue mb-12 uppercase tracking-widest hover:opacity-70 transition-all"
        >
          <ArrowLeft size={14} strokeWidth={3} /> Back to Home
        </button>

        <div className="bg-white rounded-[2rem] shadow-xl overflow-hidden border border-slate-100">
          <div className="p-8 border-b border-slate-100 flex justify-between items-center text-slate-800">
            <div>
              <h1 className="text-2xl font-black text-slate-900">API Settings</h1>
              <p className="text-sm text-slate-500 mt-1">Manage your developer credentials and access tokens</p>
            </div>
            <div className="p-3 bg-brand-blue/10 rounded-2xl text-brand-blue">
              {loading ? <LoadingSpinner size={24} /> : <Terminal size={24} />}
            </div>
          </div>

          <div className="p-8">
            <form onSubmit={handleCreateKey} className="mb-12">
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Create New API Key</label>
              <div className="flex gap-4">
                <input 
                  type="text" 
                  disabled={creating}
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="Key Name (e.g. Production, Testing)" 
                  className="flex-grow bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-blue/20 outline-none transition-all disabled:opacity-50"
                />
                <button 
                  disabled={creating}
                  className="px-6 py-3 bg-brand-blue text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 hover:scale-[1.02] active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2 min-w-[160px]"
                >
                  {creating ? <LoadingSpinner size={18} className="text-white" /> : <><Plus size={18} /> Generate Key</>}
                </button>
              </div>
            </form>

            <div className="space-y-4">
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Active Keys</label>
              {loading ? (
                <div className="space-y-4">
                  <Skeleton className="h-24 rounded-2xl" />
                  <Skeleton className="h-24 rounded-2xl" />
                </div>
              ) : keys.length === 0 ? (
                <div className="py-12 border-2 border-dashed border-slate-100 rounded-3xl text-center text-slate-400">
                  No API keys generated yet.
                </div>
              ) : (
                keys.map(key => (
                  <div key={key.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-grow">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-slate-800">{key.name}</span>
                        <span className="text-[10px] bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded font-mono uppercase tracking-tighter">sk_...{key.key.slice(-4)}</span>
                      </div>
                      <div className="text-xs text-slate-400 font-mono">
                        {key.createdAt?.toDate ? key.createdAt.toDate().toLocaleDateString() : 'Just now'}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => copyToClipboard(key.key)}
                        className="p-3 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-brand-blue hover:border-brand-blue transition-all"
                      >
                        <Copy size={18} />
                      </button>
                      <button 
                        onClick={() => handleDeleteKey(key.id)}
                        className="p-3 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-red-500 hover:border-red-500 transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          
          <div className="p-8 bg-slate-900 text-slate-300">
             <div className="flex items-center gap-3 mb-4 text-white">
               <Cpu size={20} className="text-brand-blue" />
               <h3 className="font-bold uppercase tracking-widest text-xs">Developer Documentation</h3>
             </div>
             <p className="text-sm opacity-70 mb-4 font-light leading-relaxed">
               Use your secret keys to access our economic datasets and research tools programmatically. 
               Always keep your keys safe and never share them in public repositories.
             </p>
             <div className="bg-black/50 rounded-xl p-4 font-mono text-xs text-blue-400 border border-white/5">
                $ curl -H "X-API-Key: YOUR_SECRET_KEY" \ <br/>
                &nbsp;&nbsp;https://api.dev-all.org/v1/indicators?code=GDP.ETH
             </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const ServiceDetailView = ({ service, onBack }: { service: ServiceData, onBack: () => void }) => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [service]);

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="pb-24 pt-8"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400 mb-8">
          <button onClick={onBack} className="hover:text-brand-blue">Home</button>
          <span>/</span>
          <span className="text-brand-blue">Services</span>
          <span>/</span>
          <span className="text-slate-900">{service.title}</span>
        </nav>

        <motion.button 
          onClick={onBack}
          whileHover={{ x: -4 }}
          className="flex items-center gap-2 text-sm font-black text-brand-blue mb-12 hover:opacity-80 transition-all uppercase tracking-wider"
        >
          <ArrowLeft size={18} strokeWidth={3} />
          Back to Services
        </motion.button>

        <div className="grid lg:grid-cols-2 gap-16 items-start">
          {/* Content */}
          <div className="space-y-8">
            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${service.gradient} flex items-center justify-center text-white shadow-xl`}>
              {service.icon}
            </div>
            
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 leading-tight">
              {service.title}
            </h1>
            
            <p className="text-xl text-slate-600 leading-relaxed font-medium">
              {service.description}
            </p>

            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-widest flex items-center gap-3">
                <span className="w-8 h-[2px] bg-brand-green rounded-full" />
                Key Features & Capabilities
              </h3>
              <div className="grid sm:grid-cols-2 gap-4">
                {service.features.map((feature, i) => (
                  <div key={i} className="flex items-center gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div className="w-5 h-5 rounded-full bg-brand-green/20 flex items-center justify-center text-brand-green">
                      <ShieldCheck size={14} />
                    </div>
                    <span className="text-sm font-bold text-slate-700">{feature}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Structured Service Request Form */}
            <div className="mt-12">
              <ServiceRequestForm serviceTitle={service.title} />
              <p className="mt-6 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-center gap-2">
                <Activity size={14} className="text-brand-green" /> Express Evaluation & Response Guaranteed
              </p>
            </div>
          </div>

          {/* Side Visual */}
          <div className="lg:sticky lg:top-32">
            <div className="relative rounded-[2rem] lg:rounded-[3rem] overflow-hidden shadow-2xl border-4 lg:border-8 border-white group text-white">
              <img 
                src={service.image} 
                alt={service.title} 
                className="w-full h-[300px] lg:h-[600px] object-cover group-hover:scale-110 transition-transform duration-1000"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent" />
              <div className="absolute bottom-10 left-10 text-white">
                <p className="text-sm font-bold uppercase tracking-[0.3em] mb-2 text-white/80">Innovation Lab</p>
                <h4 className="text-3xl font-black">{service.title} Excellence</h4>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default function App() {
  const [isDark, toggleDark] = useDarkMode();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentView, setCurrentView] = useState<{ type: 'home' | 'service' | 'about' | 'publication' | 'admin' | 'dev' | 'profile', slug?: string, section?: string }>({ type: 'home' });
  
  useEffect(() => {
    trackPageView(currentView.type + (currentView.slug ? `:${currentView.slug}` : ''));
  }, [currentView]);
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  useEffect(() => {
    setAuthError(null);
  }, [authMode, showAuthModal]);
  const [authLoading, setAuthLoading] = useState(false);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [gdpIndicator, setGdpIndicator] = useState<EconomicIndicator | null>(null);
  const [loading, setLoading] = useState(true);
  const [appLoading, setAppLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const [subscribeStatus, setSubscribeStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [selectedCountry, setSelectedCountry] = useState('ETH');
  const [selectedService, setSelectedService] = useState<ServiceData | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  const [contacting, setContacting] = useState(false);
  const [contactStatus, setContactStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);
  const [selectedBlogCategory, setSelectedBlogCategory] = useState<string>('All');

  const [creatingPost, setCreatingPost] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const { scrollY } = useScroll();
  const heroBgY = useTransform(scrollY, [0, 800], [0, 150]);
  const heroCloudsY = useTransform(scrollY, [0, 800], [0, 300]);
  const heroParticlesY = useTransform(scrollY, [0, 800], [0, -150]);
  const heroContentY = useTransform(scrollY, [0, 800], [0, 100]);

  const handleBackHome = () => {
    setCurrentView({ type: 'home' });
    setIsMenuOpen(false);
  };


  const handleSelectService = (item: string) => {
    trackEvent('service_selected', { service: item });
    if (!user) {
      setAuthMode('login');
      setShowAuthModal(true);
      return;
    }
    const slug = item.toLowerCase().replace(/ /g, '-');
    setCurrentView({ type: 'service', slug });
    setIsMenuOpen(false);
    window.scrollTo(0, 0);
  };

  const handleOpenDev = () => {
    setCurrentView({ type: 'dev' });
    setIsMenuOpen(false);
    window.scrollTo(0, 0);
  };

  const handleSelectPublication = (item?: string) => {
    trackEvent('publication_selected', { category: item || 'all' });
    setCurrentView({ type: 'publication', slug: item?.toLowerCase() });
    setIsMenuOpen(false);
    window.scrollTo(0, 0);
  };

  const handleOpenAdmin = () => {
    setCurrentView({ type: 'admin' });
    setIsMenuOpen(false);
    window.scrollTo(0, 0);
  };

  const handleOpenProfile = () => {
    setCurrentView({ type: 'profile' });
    setIsMenuOpen(false);
    window.scrollTo(0, 0);
  };

  const handleViewAbout = (section?: string) => {
    setCurrentView({ type: 'about', section });
    setIsMenuOpen(false);
    window.scrollTo(0, 0);
  };

  const scrollToServices = () => {
    const el = document.getElementById('services-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    let unsubscribe: () => void;
    if (user) {
      unsubscribe = subscribeToNotifications(user.id, (notifs) => {
        setNotifications(notifs);
        
        // Example: Only create a welcome notification if user has none for testing
        if (notifs.length === 0) {
          createNotification({
            userId: user.id,
            title: "Welcome to GrowthLab",
            message: "Thank you for joining our community. Explore our latest research and economic tools.",
            type: 'info'
          });
        }
      });
    }
    return () => unsubscribe?.();
  }, [user?.id]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 400) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges(async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        const profile = await fetchUserProfile(fbUser.uid);
        setUser({
          id: fbUser.uid,
          name: fbUser.displayName || 'User',
          email: fbUser.email || '',
          role: (profile?.role as any) || 'viewer',
          photoURL: fbUser.photoURL || undefined
        });
      } else {
        setUser(null);
      }
      setLoading(false);
      setAppLoading(false);
    });

    const fetchData = async (country: string = 'ETH') => {
      setLoading(true);
      try {
        const [blogData, statsRes, gdpRes] = await Promise.all([
          fetchBlogPosts(10), // Use Firestore
          fetch('/api/stats'),
          fetch(`/api/indicator/gdp?country=${country}`)
        ]);
        
        let finalBlogData = blogData;
        // Fallback or seed if Firestore is empty (optional, but good for demo)
        if (blogData.length === 0) {
          const res = await fetch('/api/blog');
          finalBlogData = await res.json();
        }

        const statsData = await statsRes.json();
        const gdpData = await gdpRes.json();
        setBlogPosts(finalBlogData as BlogPost[]);
        setStats(statsData);
        setGdpIndicator(gdpData);
      } catch (error) {
        console.error("Data fetch error", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData(selectedCountry);
  }, [selectedCountry]);

  const handleGoogleSignIn = async () => {
    setAuthLoading(true);
    try {
      await signInWithGoogle();
      setShowAuthModal(false);
    } catch (error) {
      console.error("Google Sign-In failed", error);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setUser(null);
      // Redirect to home if on a protected page
      if (currentView.type !== 'home') {
        setCurrentView({ type: 'home' });
      }
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const handleAuth = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAuthError(null);
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    
    if (!isValidEmail(data.email as string)) {
      setAuthError("Please enter a valid email address.");
      return;
    }

    setAuthLoading(true);
    const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/register';
    
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const result = await res.json();
      if (res.ok) {
        setUser(result);
        setShowAuthModal(false);
      } else {
        setAuthError(result.error);
      }
    } catch (e) {
      setAuthError("A network error occurred.");
      console.error("Auth error", e);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleCreatePost = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    setCreatingPost(true);
    const formData = new FormData(e.currentTarget);
    const data = {
      ...Object.fromEntries(formData.entries()),
      userId: user.id
    };

    try {
      const res = await fetch('/api/blog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        const blogRes = await fetch('/api/blog');
        setBlogPosts(await blogRes.json());
        (e.target as HTMLFormElement).reset();
        alert("Post created!");
      }
    } catch (e) {
      alert("Failed to create post.");
    } finally {
      setCreatingPost(false);
    }
  };

  const handleSubscribe = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    
    if (!isValidEmail(email)) {
      setSubscribeStatus({ type: 'error', msg: 'Invalid email address.' });
      return;
    }

    setSubscribeStatus(null);
    setSubscribing(true);
    
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setSubscribeStatus({ type: 'success', msg: "You've been successfully subscribed!" });
        (e.target as HTMLFormElement).reset();
      } else {
        setSubscribeStatus({ type: 'error', msg: data.error || 'Failed to subscribe.' });
      }
    } catch (e) {
      setSubscribeStatus({ type: 'error', msg: 'A network error occurred. Please try again.' });
    } finally {
      setSubscribing(false);
    }
  };

  const handleContact = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    
    if (!isValidEmail(data.email as string)) {
      setContactStatus({ type: 'error', msg: 'Please enter a valid email address.' });
      return;
    }

    setContactStatus(null);
    setContacting(true);
    
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      const result = await res.json();
      
      if (res.ok) {
        setContactStatus({ type: 'success', msg: "Thank you! Your message has been sent." });
        (e.target as HTMLFormElement).reset();
      } else {
        setContactStatus({ type: 'error', msg: result.error || 'Failed to send message.' });
      }
    } catch (e) {
      setContactStatus({ type: 'error', msg: 'Network error. Please check your connection.' });
    } finally {
      setContacting(false);
    }
  };

  const chartData = stats ? {
    labels: stats.labels,
    datasets: [
      {
        label: 'GDP Growth (%)',
        data: stats.gdp,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4
      },
      {
        label: 'Investment (Index)',
        data: stats.investment,
        borderColor: '#2d6a4f',
        backgroundColor: 'transparent',
        borderDash: [5, 5],
        tension: 0.4
      }
    ]
  } : null;

  const partners = [
    { name: "UNCTAD", logo: "https://upload.wikimedia.org/wikipedia/commons/4/4c/UNCTAD_logo.svg" },
    { name: "IMF", logo: "https://upload.wikimedia.org/wikipedia/commons/7/7e/International_Monetary_Fund_logo.svg" },
    { name: "World Bank", logo: "https://upload.wikimedia.org/wikipedia/commons/0/07/World_Bank_Group_logo.svg" },
    { name: "African Union", logo: "https://upload.wikimedia.org/wikipedia/commons/5/51/Logo_of_the_African_Union.svg" },
    { name: "WTO", logo: "https://upload.wikimedia.org/wikipedia/commons/6/64/World_Trade_Organization_%28logo%29.svg" },
    { name: "ITC", logo: "https://upload.wikimedia.org/wikipedia/commons/b/b8/ITC_International_Trade_Centre.svg" },
    { name: "AfDB", logo: "https://upload.wikimedia.org/wikipedia/commons/6/6d/AfDB_Logo.svg" },
    { name: "EEA", logo: "https://eea-et.org/wp-content/uploads/2021/04/EEA-Log-new-1.png" }
  ];

  const currentService = currentView.type === 'service' 
    ? servicesData.find(s => s.slug === currentView.slug) 
    : null;

  return (
    <div className="min-h-screen flex flex-col font-sans">
      {/* --- HEADER --- */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <div className="flex-shrink-0">
              <BrandLogo text="Development for all" onClick={handleBackHome} />
            </div>

            <div className="flex items-center gap-2 sm:gap-4 ml-auto mr-6 lg:mr-12">
              <SearchBar />
              <button 
                onClick={toggleDark}
                className="p-2 rounded-full hover:bg-slate-100 transition-colors"
              >
                {isDark ? <Sun size={20} className="text-yellow-500" /> : <Moon size={20} className="text-slate-600" />}
              </button>
            </div>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-6">
              <button onClick={handleBackHome} className="nav-link bg-transparent border-none">Home</button>
              <NavDropdown 
                title="About Us" 
                items={["Overview", "Mission", "Vision", "Values"]} 
                onSelect={(item) => item === "Overview" ? handleViewAbout() : handleViewAbout(item.toLowerCase())}
              />
              <NavDropdown 
                title="Services" 
                items={["Research", "Market Intelligence", "Data Analysis", "Project Development", "Training", "Consultancy", "Software Development"]} 
                onSelect={handleSelectService}
              />
              <button 
                onClick={() => {
                  handleBackHome();
                  setTimeout(() => { window.location.hash = "#blog"; }, 100);
                }} 
                className="nav-link border-none bg-transparent"
              >
                Blog
              </button>
              <NavDropdown title="Publications" items={["Research", "Portfolio", "Journal", "Books"]} onSelect={handleSelectPublication} />
              {user && (
                <button 
                  onClick={handleOpenDev}
                  className="nav-link border-none bg-transparent flex items-center gap-2 text-slate-600 font-bold hover:text-brand-blue"
                >
                  <Key size={16} /> Developer
                </button>
              )}
              {user?.role === 'admin' && (
                <button 
                  onClick={handleOpenAdmin}
                  className="nav-link border-none bg-transparent flex items-center gap-2 text-red-600 font-black"
                >
                  <ShieldCheck size={16} /> Admin Panel
                </button>
              )}
              <button 
                onClick={() => {
                  handleBackHome();
                  setTimeout(() => { window.location.hash = "#dashboard"; }, 100);
                }} 
                className="nav-link border-none bg-transparent"
              >
                Data
              </button>

              <button 
                onClick={() => {
                  handleBackHome();
                  setTimeout(() => { window.location.hash = "#contact"; }, 100);
                }} 
                className="nav-link border-none bg-transparent"
              >
                Contact Us
              </button>
            </nav>

            {/* Auth Buttons */}
            <div className="hidden lg:flex items-center gap-4 border-l border-slate-200 ml-4 pl-6">
              {user && (
                <div className="relative mr-2" ref={notificationRef}>
                  <button 
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="p-2.5 text-slate-400 hover:text-brand-blue hover:bg-brand-blue/5 rounded-xl transition-all relative"
                  >
                    <Bell size={20} />
                    {notifications.some(n => !n.read) && (
                      <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
                    )}
                  </button>
                  
                  <AnimatePresence>
                    {showNotifications && (
                      <NotificationCenter 
                        notifications={notifications} 
                        onClose={() => setShowNotifications(false)}
                        onMarkRead={markNotificationAsRead}
                      />
                    )}
                  </AnimatePresence>
                </div>
              )}
              
              <a href="#payment" className="text-brand-blue hover:text-brand-blue/80 transition-colors">
                <CreditCard size={20} />
              </a>
              {user ? (
                <div className="flex items-center gap-4">
                  {user.photoURL && (
                    <img 
                      src={user.photoURL} 
                      alt={user.name} 
                      onClick={handleOpenProfile}
                      className="w-10 h-10 rounded-full border-2 border-brand-blue/30 shadow-sm cursor-pointer hover:scale-110 transition-transform"
                    />
                  )}
                  <div className="flex flex-col items-end cursor-pointer group" onClick={handleOpenProfile}>
                    <span className="text-sm font-bold text-slate-800 group-hover:text-brand-blue transition-colors">{user.name}</span>
                    <span className="text-[10px] uppercase tracking-widest text-brand-blue font-bold">{user.role}</span>
                  </div>
                  <button 
                    onClick={handleLogout}
                    className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                    title="Sign Out"
                  >
                    <LogIn size={20} className="rotate-180" />
                  </button>
                </div>
              ) : (
                <>
                  <button 
                    onClick={() => { setAuthMode('login'); setShowAuthModal(true); }}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-slate-600 hover:text-brand-blue transition-colors"
                  >
                    <LogIn size={16} /> Sign In
                  </button>
                  <button 
                    onClick={() => { setAuthMode('register'); setShowAuthModal(true); }}
                    className="flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-brand-blue text-white text-sm font-semibold hover:bg-brand-blue/90 shadow-md transform active:scale-95 transition-all"
                  >
                    <UserPlus size={16} /> Sign Up
                  </button>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="flex items-center gap-2 lg:hidden">
              {user && (
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 text-slate-600 relative"
                >
                  <Bell size={24} />
                  {notifications.some(n => !n.read) && (
                    <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
                  )}
                </button>
              )}
              <button 
                className="p-2 text-slate-600"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-label="Toggle Menu"
              >
                {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Notifications Transition */}
        {user && (
          <AnimatePresence>
            {showNotifications && (
              <div className="lg:hidden">
                <NotificationCenter 
                  notifications={notifications} 
                  onClose={() => setShowNotifications(false)}
                  onMarkRead={markNotificationAsRead}
                />
              </div>
            )}
          </AnimatePresence>
        )}

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, x: '100%' }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-0 top-20 z-40 lg:hidden bg-white overflow-y-auto"
            >
              <div className="px-6 py-8 flex flex-col gap-2">
                <button onClick={handleBackHome} className="w-full text-left py-3 text-slate-800 font-medium border-b border-slate-100 bg-transparent">Home</button>
                <MobileNavDropdown 
                  title="About Us" 
                  items={["Overview", "Mission", "Vision", "Values"]} 
                  onSelect={(item) => item === "Overview" ? handleViewAbout() : handleViewAbout(item.toLowerCase())}
                />
                <MobileNavDropdown 
                  title="Services" 
                  items={["Research", "Market Intelligence", "Data Analysis", "Project Development", "Training", "Consultancy", "Software Development"]} 
                  onSelect={handleSelectService}
                />
                <button 
                  onClick={() => {
                    handleBackHome();
                    setTimeout(() => { window.location.hash = "#blog"; }, 100);
                    setIsMenuOpen(false);
                  }} 
                  className="w-full text-left py-3 text-slate-800 font-medium border-b border-slate-100 bg-transparent"
                >
                  Blog
                </button>
                <MobileNavDropdown title="Publications" items={["Research", "Portfolio", "Journal", "Books"]} onSelect={handleSelectPublication} />
                {user && (
                  <button 
                    onClick={handleOpenDev}
                    className="w-full text-left py-3 text-slate-800 font-medium border-b border-slate-100 bg-transparent flex items-center gap-2"
                  >
                    <Key size={18} /> Developer
                  </button>
                )}
                {user?.role === 'admin' && (
                  <button 
                    onClick={handleOpenAdmin}
                    className="w-full text-left py-3 text-red-600 font-black border-b border-slate-100 bg-transparent flex items-center gap-2"
                  >
                    <ShieldCheck size={18} /> Admin Panel
                  </button>
                )}
                <button 
                  onClick={() => {
                    handleBackHome();
                    setTimeout(() => { window.location.hash = "#dashboard"; }, 100);
                    setIsMenuOpen(false);
                  }} 
                  className="w-full text-left py-3 text-slate-800 font-medium border-b border-slate-100 bg-transparent"
                >
                  Data
                </button>

                <button 
                  onClick={() => {
                    handleBackHome();
                    setTimeout(() => { window.location.hash = "#contact"; }, 100);
                    setIsMenuOpen(false);
                  }} 
                  className="w-full text-left py-3 text-slate-800 font-medium border-b border-slate-100 bg-transparent"
                >
                  Contact Us
                </button>
                
                {user ? (
                  <div className="mt-8 p-6 bg-slate-50 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {user.photoURL && (
                        <img 
                          src={user.photoURL} 
                          alt={user.name} 
                          className="w-12 h-12 rounded-full border-2 border-brand-blue/20"
                        />
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-900 font-bold">{user.name}</span>
                          <span className="text-[8px] px-1.5 py-0.5 bg-brand-blue text-white rounded font-black uppercase">{user.role}</span>
                        </div>
                        <div className="text-xs text-slate-500">{user.email}</div>
                      </div>
                    </div>
                    <button 
                      onClick={() => { handleLogout(); setIsMenuOpen(false); }}
                      className="p-2 text-slate-400 hover:text-red-500"
                    >
                      <LogIn size={20} className="rotate-180" />
                    </button>
                  </div>
                ) : (
                  <div className="mt-8 grid grid-cols-2 gap-4">
                    <button 
                      onClick={() => { setAuthMode('login'); setShowAuthModal(true); setIsMenuOpen(false); }}
                      className="flex items-center justify-center gap-2 py-3 border border-slate-200 rounded-xl text-slate-600 font-medium"
                    >
                      <LogIn size={18} /> Sign In
                    </button>
                    <button 
                      onClick={() => { setAuthMode('register'); setShowAuthModal(true); setIsMenuOpen(false); }}
                      className="flex items-center justify-center gap-2 py-3 bg-brand-blue rounded-xl text-white font-medium shadow-lg shadow-blue-500/20"
                    >
                      <UserPlus size={18} /> Sign Up
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* --- MAIN CONTENT AREA --- */}
      <main className="flex-grow">
        <AnimatePresence mode="wait">
          {currentView.type === 'home' ? (
            <motion.div
              key="home"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* --- HERO SECTION --- */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black">
        {/* Cosmic Night & Fire Background */}
        <motion.div 
          style={{ y: heroBgY }}
          className="absolute inset-0 z-0 bg-gradient-to-br from-[#1a0a0a] via-[#0a0a1a] to-[#050505]" 
        />
        
        {/* Dynamic Fiery Nebula "Cloud" Accents */}
        <motion.div 
          style={{ y: heroCloudsY }}
          className="absolute inset-0 z-0"
        >
          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              x: ['0%', '100%'],
              y: ['100%', '0%'],
              opacity: [0.1, 0.2, 0.1]
            }}
            transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
            className="absolute -bottom-1/4 -left-1/4 w-[80rem] h-[80rem] bg-orange-600/10 rounded-full blur-[220px]"
          />
          <motion.div 
            animate={{ 
              scale: [1.2, 1, 1.2],
              x: ['0%', '80%'],
              y: ['0%', '-80%'],
              opacity: [0.05, 0.15, 0.05]
            }}
            transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
            className="absolute top-1/4 -right-1/4 w-[70rem] h-[70rem] bg-indigo-700/10 rounded-full blur-[200px]"
          />
          <motion.div 
            animate={{ 
              scale: [1, 1.3, 1],
              x: ['-20%', '60%'],
              y: ['20%', '-60%'],
              opacity: [0.05, 0.1, 0.05]
            }}
            transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
            className="absolute top-1/2 -left-1/4 w-[60rem] h-[60rem] bg-purple-900/10 rounded-full blur-[180px]"
          />
        </motion.div>

        {/* Background Starfield for Depth */}
        <div className="absolute inset-0 z-0">
          {[...Array(200)].map((_, i) => (
            <motion.div
              key={`bg-star-${i}`}
              initial={{ 
                left: Math.random() * 100 + '%', 
                top: Math.random() * 100 + '%',
                opacity: Math.random() * 0.3 + 0.1,
                scale: Math.random() * 0.4 + 0.1
              }}
              animate={{ 
                opacity: [0.1, 0.4, 0.1],
                y: [0, -40, 0]
              }}
              transition={{ 
                duration: 5 + Math.random() * 10, 
                repeat: Infinity,
                ease: "linear"
              }}
              className="absolute w-[1px] h-[1px] bg-white rounded-full"
            />
          ))}
        </div>

        {/* Floating Bold Stars & Cosmic Particles (Diagonal Movement: Bottom-Left to Top-Right) */}
        <motion.div 
          style={{ y: heroParticlesY }}
          className="absolute inset-0 z-0 pointer-events-none overflow-hidden"
        >
          {[...Array(100)].map((_, i) => {
            const size = Math.random() * 4 + 1;
            const duration = Math.random() * 25 + 15;
            const delay = Math.random() * -40;
            const isStar = Math.random() > 0.7;
            const startX = Math.random() * 100 - 50; // Start more to the left
            const colors = [
              'rgba(255, 255, 255, 0.9)', 
              'rgba(230, 240, 255, 0.8)', 
              'rgba(255, 200, 100, 0.7)', // Amber Star
              'rgba(255, 150, 50, 0.6)',  // Fiery Spark
            ];
            const color = colors[Math.floor(Math.random() * colors.length)];
            
            return (
              <motion.div
                key={`star-particle-${i}`}
                initial={{ 
                  left: startX + '%', 
                  bottom: '-5%',
                  opacity: 0,
                  scale: 0.1,
                  rotate: 0
                }}
                animate={{ 
                  left: (startX + 60) + '%', // Move diagonally to the right
                  bottom: '105%',
                  opacity: [0, 1, 0.8, 1, 0],
                  scale: isStar ? [0.4, 1.2, 0.8, 1.4, 0.4] : [0.4, 0.8, 0.4],
                  rotate: isStar ? [0, 180, 360] : 0,
                }}
                transition={{ 
                  duration: duration,
                  repeat: Infinity,
                  delay: delay,
                  ease: "linear",
                }}
                className={`absolute ${isStar ? "rotate-45" : "rounded-full"}`}
                style={{ 
                  width: size, 
                  height: size,
                  backgroundColor: color,
                  boxShadow: `0 0 ${size * 5}px ${color}`,
                  filter: 'blur(0.2px)'
                }}
              />
            );
          })}
        </motion.div>

        {/* Secondary Layer of Majestic Stars (Diagonal Flow) */}
        <motion.div 
          style={{ y: heroParticlesY }}
          className="absolute inset-0 z-0 pointer-events-none overflow-hidden"
        >
          {[...Array(40)].map((_, i) => {
            const size = Math.random() * 2 + 1;
            const startX = Math.random() * 100 - 30;
            return (
              <motion.div
                key={`majestic-star-${i}`}
                initial={{ left: startX + '%', bottom: '-10%', opacity: 0 }}
                animate={{ 
                  left: (startX + 40) + '%',
                  bottom: '110%', 
                  opacity: [0, 1, 0.5, 1, 0],
                  y: [0, -150, 0]
                }}
                transition={{ 
                  duration: Math.random() * 10 + 10, 
                  repeat: Infinity, 
                  delay: Math.random() * -20,
                  ease: "linear" 
                }}
                className="absolute rotate-45"
                style={{ 
                  width: size, 
                  height: size,
                  backgroundColor: 'white',
                  boxShadow: `0 0 ${size * 10}px white`,
                }}
              />
            );
          })}
        </motion.div>

        {/* Heat Distortion/Rising Cosmic Mist Effects (Diagonal) */}
        <motion.div 
          style={{ y: heroParticlesY }}
          className="absolute inset-0 z-0 overflow-hidden opacity-25"
        >
          {[...Array(10)].map((_, i) => (
            <motion.div
              key={`mist-${i}`}
              animate={{
                x: ['-20%', '20%'],
                y: ['100%', '-20%'],
                opacity: [0, 0.3, 0],
              }}
              transition={{
                duration: 15 + i * 2,
                repeat: Infinity,
                delay: i * -4,
                ease: "linear"
              }}
              className={`absolute w-full h-[600px] bg-gradient-to-tr from-transparent via-${i % 2 === 0 ? 'orange-900/10' : 'indigo-900/10'} to-transparent blur-[140px]`}
            />
          ))}
        </motion.div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-20">
          <div className="flex flex-col items-center justify-center text-center min-h-[80vh] py-12">
            {/* Content Container */}
            <motion.div 
              style={{ y: heroContentY }}
              className="flex flex-col items-center"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-600/10 border border-orange-500/20 mb-8 backdrop-blur-md">
                <motion.span 
                  animate={{ 
                    opacity: [0.5, 1, 0.5],
                    scale: [1, 1.2, 1],
                    boxShadow: ["0 0 8px rgba(249,115,22,0.4)", "0 0 16px rgba(249,115,22,0.8)", "0 0 8px rgba(249,115,22,0.4)"]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-2 h-2 rounded-full bg-orange-500"
                />
                <span className="text-orange-400 text-xs font-black uppercase tracking-[0.2em]">Next-Gen Global Network</span>
              </div>

              {/* Headline */}
              <motion.h1 
                initial="hidden"
                animate="visible"
                variants={{
                  visible: {
                    transition: {
                      staggerChildren: 0.1,
                      delayChildren: 0.2,
                    }
                  }
                }}
                className="text-4xl sm:text-6xl md:text-8xl font-black text-white leading-tight mb-8"
              >
                Empowering Economic Development <span className="text-brand-blue">for All</span>
              </motion.h1>

              <div className="flex flex-wrap justify-center gap-3 mb-10 text-slate-300">
                {[
                  "Research", "Market Intelligence", "Data Analysis", 
                  "Project Development and Analysis", "Training", 
                  "Consultancy", "Software Development"
                ].map((item, i) => (
                  <span key={i} className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-400">
                    {i > 0 && <span className="w-1.5 h-1.5 rounded-full bg-brand-green" />}
                    {item}
                  </span>
                ))}
              </div>

              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.8 }}
                className="text-lg sm:text-xl md:text-2xl text-slate-300 leading-relaxed font-medium max-w-3xl mb-12"
              >
                Building a fluid and sustainable future through collaborative innovation and resilient global economies. Join the motion towards universal progress.
              </motion.p>

              {/* CTAs */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1, duration: 0.8 }}
                className="flex flex-wrap items-center justify-center gap-6 mb-14"
              >
                <motion.button 
                  onClick={scrollToServices}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full sm:w-auto px-8 py-4 sm:px-12 sm:py-6 bg-gradient-to-r from-indigo-500 to-blue-700 text-white rounded-2xl font-black shadow-2xl shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all flex items-center justify-center gap-3"
                >
                  Explore Services <Rocket size={20} />
                </motion.button>
                
                <motion.button 
                  whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.1)" }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full sm:w-auto px-8 py-4 sm:px-12 sm:py-6 bg-white/5 text-white rounded-2xl font-black border border-white/10 backdrop-blur-md transition-all flex items-center justify-center gap-3"
                >
                  Join Network <Users size={20} />
                </motion.button>
              </motion.div>

              {/* Social Links Sub-row */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2, duration: 1 }}
                className="flex flex-col items-center gap-6"
              >
                <div className="flex items-center gap-4">
                  {[
                    { icon: <Linkedin size={22} />, label: 'LinkedIn', color: 'hover:text-blue-400', url: '#' },
                    { icon: <Facebook size={22} />, label: 'Facebook', color: 'hover:text-cyan-400', url: '#' },
                    { 
                      icon: <Youtube size={22} />, 
                      label: 'YouTube', 
                      color: 'hover:text-red-500', 
                      url: 'https://youtube.com/@GlobalNetwork',
                      isYouTube: true 
                    },
                    { icon: <MessageCircle size={22} />, label: 'WhatsApp', color: 'hover:text-emerald-500', url: '#' }
                  ].map((social, idx) => (
                    <motion.a
                      key={idx}
                      href={social.url}
                      whileHover={{ scale: 1.2, y: -4 }}
                      whileTap={{ scale: 0.9 }}
                      className={`p-4 rounded-2xl bg-white/5 border border-white/10 text-slate-400 transition-colors ${social.color} backdrop-blur-sm shadow-xl`}
                      aria-label={social.label}
                    >
                      {social.icon}
                    </motion.a>
                  ))}
                </div>
                <span className="text-white/30 text-xs font-black uppercase tracking-[0.4em]">Follow Our Global Journey</span>
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* --- Volcanic Landscape & Atmospheric Effects --- */}
        <div className="absolute bottom-0 left-0 w-full h-[50vh] z-10 pointer-events-none">
          {/* Farthest Mountain Range (Hazy/Slate) */}
          <svg className="absolute bottom-0 w-full h-full text-slate-900/60" viewBox="0 0 1440 320" preserveAspectRatio="none">
            <defs>
              <linearGradient id="mtnGrad1" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#4a4e54" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#1a1c1e" stopOpacity="1" />
              </linearGradient>
            </defs>
            <path fill="url(#mtnGrad1)" d="M0,320L120,240L300,280L500,120L750,260L950,180L1200,290L1440,210L1440,320L0,320Z"></path>
          </svg>

          {/* Active Volcano (Distant Left) */}
          <div className="absolute bottom-0 left-[5%] w-80 h-[380px] origin-bottom scale-75 opacity-90">
            {/* Mountain Body with Texture and Shading */}
            <svg className="absolute bottom-0 w-full h-full" viewBox="0 0 320 400" preserveAspectRatio="none">
              <defs>
                <linearGradient id="volcanoGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#1a1614" />
                  <stop offset="50%" stopColor="#2d241e" />
                  <stop offset="100%" stopColor="#1a1614" />
                </linearGradient>
              </defs>
              <path fill="url(#volcanoGrad)" d="M160,60 L20,400 L300,400 Z"></path>
              {/* Shading on the left side */}
              <path fill="rgba(0,0,0,0.3)" d="M160,60 L20,400 L160,400 Z"></path>
            </svg>
            
            {/* Crater Glow */}
            <motion.div 
              animate={{ 
                opacity: [0.6, 1, 0.6],
                scale: [1, 1.15, 1],
                filter: ['blur(12px)', 'blur(20px)', 'blur(12px)']
              }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-[55px] left-1/2 -translate-x-1/2 w-24 h-12 bg-orange-700 rounded-[50%] z-20 shadow-[0_0_50px_rgba(234,88,12,1),0_0_100px_rgba(234,88,12,0.5)]"
            />

            {/* Plume of ash and embers */}
            <div className="absolute top-[60px] left-1/2 -translate-x-1/2">
              {[...Array(80)].map((_, i) => {
                const isEmber = Math.random() > 0.4;
                const size = Math.random() * (isEmber ? 4 : 8) + 1;
                return (
                  <motion.div
                    key={`v-realistic-${i}`}
                    initial={{ x: 0, y: 0, opacity: 0 }}
                    animate={{ 
                      x: [0, (Math.random() - 0.2) * 500 + 200], 
                      y: [0, -Math.random() * 800 - 500], 
                      opacity: [0, 0.8, 0.4, 0],
                      scale: [1, 0.5, 0],
                      rotate: Math.random() * 720
                    }}
                    transition={{ 
                      duration: Math.random() * 7 + 4, 
                      repeat: Infinity,
                      delay: Math.random() * 10,
                      ease: "easeOut"
                    }}
                    className={`absolute rounded-full ${isEmber ? 'bg-orange-400 shadow-[0_0_10px_#fb923c]' : 'bg-stone-500/20 blur-[2px]'}`}
                    style={{ width: size, height: size }}
                  />
                );
              })}
            </div>
          </div>

          {/* Middle Mountain Range (Earth Tones/Natural colors) */}
          <svg className="absolute bottom-0 w-full h-[80%] text-stone-900/90" viewBox="0 0 1440 320" preserveAspectRatio="none">
            <defs>
              <linearGradient id="mtnGrad2" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#3a3d36" />
                <stop offset="100%" stopColor="#0a0b09" />
              </linearGradient>
            </defs>
            <path fill="url(#mtnGrad2)" d="M0,320L180,220L400,290L600,160L850,280L1100,200L1350,300L1440,320L1440,320L0,320Z"></path>
          </svg>

          {/* Closest Foreground Peaks (Deep Rock/Natural) */}
          <svg className="absolute bottom-0 w-full h-[60%] text-[#0d0c0b]" viewBox="0 0 1440 320" preserveAspectRatio="none">
            <path fill="currentColor" d="M0,320L250,260L550,310L850,220L1200,300L1440,240L1440,320L0,320Z"></path>
            {/* Subtle snowcap/highlight simulation */}
            <path fill="rgba(255,255,255,0.05)" d="M250,260 L200,280 L300,280 Z M850,220 L800,240 L900,240 Z"></path>
          </svg>

          {/* Ground Mist & Heat Haze */}
          <motion.div 
            animate={{ x: ['-3%', '3%', '-3%'], opacity: [0.15, 0.3, 0.15] }}
            transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
            className="absolute bottom-0 left-0 w-[140%] h-64 bg-gradient-to-t from-black/70 via-stone-950/20 to-transparent blur-3xl"
          />
        </div>

        {/* Scroll Indicator */}

        {/* Scroll Indicator */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ 
            opacity: [0, 1],
            y: [0, 10, 0] 
          }}
          transition={{ 
            opacity: { delay: 2, duration: 1 },
            y: { duration: 2, repeat: Infinity, ease: "easeInOut" }
          }}
          className="absolute bottom-12 left-1/2 -translate-x-1/2 text-white/50 flex flex-col items-center gap-2 cursor-pointer z-20"
          onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
        >
          <span className="text-[10px] font-black uppercase tracking-[0.4em]">Dive Deeper</span>
          <ChevronDown size={32} />
        </motion.div>
      </section>

      {/* --- MANAGEMENT PANEL (Editor/Admin Only) --- */}
      {user && (user.role === 'admin' || user.role === 'editor') && (
        <section className="py-16 bg-slate-50 border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-200">
              <div className="flex items-center gap-3 mb-8">
                <ShieldCheck className="text-brand-blue" />
                <h3 className="text-2xl font-bold text-slate-900">Content Management</h3>
              </div>
              
              <form onSubmit={handleCreatePost} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Post Title</label>
                    <input name="title" required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-brand-blue" placeholder="Emerging Market Trends 2024" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Short Excerpt</label>
                    <input name="excerpt" required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-brand-blue" placeholder="A brief summary for the preview card..." />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Image URL</label>
                    <input name="imagePath" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-brand-blue" placeholder="https://unsplash..." />
                  </div>
                </div>
                <div className="flex flex-col">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Full Content</label>
                  <textarea name="content" required className="flex-1 min-h-[150px] bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-brand-blue resize-none" placeholder="Write your full article here..." />
                  <button 
                    type="submit" 
                    disabled={creatingPost}
                    className="mt-4 w-full py-4 bg-brand-blue text-white font-bold rounded-xl hover:bg-brand-blue/90 transition-all disabled:opacity-50"
                  >
                    {creatingPost ? 'Publishing...' : 'Publish Blog Post'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </section>
      )}

      {/* --- SERVICES SECTION --- */}
      <motion.section 
        id="services-section"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="py-24 bg-white"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-24"
          >
            <h2 className="text-brand-blue font-black uppercase tracking-[0.3em] text-xs mb-4">Our Expertise</h2>
            <h3 className="text-4xl md:text-6xl font-black text-slate-900 mb-8 leading-tight">
              Comprehensive <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-emerald-600">Growth Services</span>
            </h3>
            <div className="w-24 h-1.5 bg-gradient-to-r from-blue-600 to-emerald-600 mx-auto rounded-full" />
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
            {servicesData.map((service, i) => (
              <motion.div
                key={service.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                whileHover={{ 
                  y: -8,
                  scale: 1.01,
                  transition: { duration: 0.3, ease: "easeOut" }
                }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.6 }}
                onClick={() => setSelectedService(service)}
                className="group relative p-10 rounded-[2.5rem] border border-white/40 bg-white/70 backdrop-blur-xl hover:bg-white transition-all duration-300 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.06)] overflow-hidden cursor-pointer"
              >
                {/* Decorative Elements */}
                <div className={`absolute -right-12 -top-12 w-48 h-48 rounded-full blur-[60px] opacity-0 group-hover:opacity-20 transition-opacity bg-gradient-to-br ${service.gradient}`} />
                
                <motion.div 
                  className="relative z-10"
                  whileHover={{ y: -5 }}
                  transition={{ type: "spring", stiffness: 200 }}
                >
                  <motion.div 
                    whileHover={{ scale: 1.1 }}
                    transition={{ repeat: Infinity, repeatType: "reverse", duration: 1 }}
                    className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${service.gradient} flex items-center justify-center text-white mb-8 shadow-lg ring-4 ring-white`}
                  >
                    {service.icon}
                  </motion.div>

                  <h4 className="text-2xl font-bold text-slate-800 mb-4 tracking-tight group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-slate-900 group-hover:to-slate-600 transition-all">
                    {service.title}
                  </h4>
                  
                  <p className="text-slate-500 leading-relaxed text-sm lg:text-base font-medium mb-10">
                    {service.summary}
                  </p>
                  
                  <div className="flex items-center justify-between pt-6 border-t border-slate-100/50">
                    <span className="text-xs font-bold uppercase tracking-widest text-slate-400 group-hover:text-brand-blue transition-colors">
                      View Details
                    </span>
                    <button className="w-10 h-10 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center group-hover:bg-brand-blue group-hover:text-white transition-all duration-500 translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100">
                      <ArrowRight size={18} />
                    </button>
                  </div>
                </motion.div>
                
                {/* Interactive Bottom Accent */}
                <div className={`absolute bottom-0 left-10 right-10 h-1 bg-gradient-to-r ${service.gradient} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 rounded-t-full`} />
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* --- ABOUT SECTION TEASER --- */}
      <motion.section 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="py-24 bg-brand-earth overflow-hidden"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 items-center gap-16">
            <div className="relative">
              <div className="relative z-10 rounded-3xl overflow-hidden shadow-2xl border-4 border-white">
                <img 
                  src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=1200" 
                  alt="Organization Team" 
                  className="w-full h-[400px] object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -right-6 z-20 bg-white p-6 rounded-2xl shadow-xl flex items-center gap-4">
                <div className="w-12 h-12 bg-brand-green rounded-full flex items-center justify-center text-white">
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">15+ Years</p>
                  <p className="text-sm text-slate-500">Trusted Advisory</p>
                </div>
              </div>
              <div className="absolute -top-10 -left-10 w-40 h-40 bg-brand-blue/10 rounded-full blur-3xl" />
            </div>

            <div>
              <h2 className="text-brand-blue font-bold tracking-widest text-sm mb-4">Who We Are</h2>
              <h3 className="text-4xl font-bold text-slate-900 mb-8 leading-tight">
                Global Leaders in Sustainable Development and Economic Resilience.
              </h3>
              <p className="text-lg text-slate-600 mb-8 leading-relaxed italic">
                "Our mission is to foster a world where economic prosperity lives in harmony with environmental sanity and social equity."
              </p>
              
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-brand-blue">
                    <Globe size={18} />
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-900 mb-1">Global Vision</h5>
                    <p className="text-slate-600">Creating scalable frameworks for international cooperation and sustainable investment.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-brand-green">
                    <Leaf size={18} />
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-900 mb-1">Environmental Impact</h5>
                    <p className="text-slate-600">Integrating green methodologies into every economic projection and project development.</p>
                  </div>
                </div>
              </div>
              
              <button className="mt-10 px-8 py-3.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all flex items-center gap-2">
                Read Our Story <BookOpen size={18} />
              </button>
            </div>
          </div>
        </div>
      </motion.section>

      {/* --- DASHBOARD SECTION --- */}
      <motion.section 
        id="dashboard" 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="py-24 bg-white border-y border-slate-100"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-12">
            <div className="lg:col-span-1">
              <h2 className="text-brand-blue font-bold text-sm mb-4">Interactive Data</h2>
              <h3 className="text-4xl font-bold text-slate-900 mb-6">Economic Indicator Dashboard</h3>
              <p className="text-slate-600 mb-8">
                Monitor key real-time indicators. Our laboratory tracks global data points to provide actionable insights for decision-makers.
              </p>
              <div className="flex flex-wrap gap-3">
                <span className="px-4 py-2 rounded-lg bg-brand-earth text-brand-green font-semibold text-xs border border-brand-green/10">GDP GROWTH</span>
                <span className="px-4 py-2 rounded-lg bg-brand-earth text-brand-blue font-semibold text-xs border border-brand-blue/10">INVESTMENT TRENDS</span>
                <span className="px-4 py-2 rounded-lg bg-brand-earth text-slate-600 font-semibold text-xs border border-slate-200">EMPLOYMENT RATE</span>
              </div>
            </div>

            <div className="lg:col-span-2 bg-slate-50 p-8 rounded-3xl border border-slate-100 shadow-inner min-h-[400px] flex items-center justify-center">
              {loading ? (
                <div className="w-full h-full flex flex-col gap-4">
                  <div className="flex justify-between items-center mb-8">
                     <Skeleton className="w-48 h-8 rounded-xl" />
                     <div className="flex gap-4">
                        <Skeleton className="w-24 h-4 rounded-full" />
                        <Skeleton className="w-24 h-4 rounded-full" />
                     </div>
                  </div>
                  <Skeleton className="flex-1 w-full rounded-2xl" />
                </div>
              ) : chartData ? (
                <div className="w-full h-full">
                  <Line 
                    data={chartData} 
                    options={{ 
                      responsive: true, 
                      maintainAspectRatio: false,
                      interaction: {
                        mode: 'index',
                        intersect: false,
                      },
                      plugins: { 
                        legend: { 
                          position: 'top' as const,
                          labels: {
                            usePointStyle: true,
                            padding: 20,
                            font: { size: 12, weight: 'bold' }
                          }
                        },
                        tooltip: {
                          backgroundColor: 'rgba(255, 255, 255, 0.9)',
                          titleColor: '#1e293b',
                          bodyColor: '#475569',
                          borderColor: '#e2e8f0',
                          borderWidth: 1,
                          padding: 12,
                          boxPadding: 6,
                          usePointStyle: true,
                          callbacks: {
                            label: (context: any) => {
                              let label = context.dataset.label || '';
                              if (label) label += ': ';
                              if (context.parsed.y !== null) {
                                label += context.parsed.y + (context.datasetIndex === 0 ? '%' : ' pts');
                              }
                              return label;
                            }
                          }
                        }
                      },
                      scales: {
                        y: {
                          beginAtZero: false,
                          grid: { color: 'rgba(0,0,0,0.05)' }
                        },
                        x: {
                          grid: { display: false }
                        }
                      }
                    }} 
                  />
                </div>
              ) : "No data available"}
            </div>
          </div>
        </div>
      </motion.section>

      {/* --- BLOG PREVIEW --- */}
      <motion.section 
        id="blog" 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="py-24 bg-brand-earth/30"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div>
              <h2 className="text-brand-blue font-bold text-sm mb-4 uppercase tracking-widest">Knowledge Hub</h2>
              <h3 className="text-4xl font-bold text-slate-900 mb-2">Latest Research & News</h3>
              <p className="text-slate-500">Read the newest insights from our experts on the ground.</p>
              
              <div className="flex flex-wrap gap-4 mt-8">
                {['All', 'Research', 'Market News', 'Institutional Audit', 'Policy', 'Industrial'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedBlogCategory(cat)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      selectedBlogCategory === cat
                        ? 'bg-brand-blue text-white shadow-lg shadow-blue-500/20'
                        : 'bg-white text-slate-500 hover:border-brand-blue/30 border border-slate-100'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
            <button className="flex items-center gap-2 text-brand-blue font-bold border-b-2 border-brand-blue pb-1 hover:text-brand-blue/70 hover:border-brand-blue/70 transition-all">
              View All Posts <ArrowRight size={18} />
            </button>
          </div>

          <div className="columns-1 md:columns-2 lg:columns-3 gap-8">
            {loading ? (
              [...Array(6)].map((_, i) => (
                <div key={i} className="break-inside-avoid mb-8 bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100">
                  <Skeleton className="h-60 w-full" />
                  <div className="p-8">
                    <Skeleton className="h-6 w-3/4 mb-4 rounded-lg" />
                    <Skeleton className="h-20 w-full mb-6 rounded-xl" />
                    <div className="flex justify-between items-center pt-6 border-t border-slate-50">
                      <Skeleton className="h-4 w-16" />
                      <div className="flex gap-2">
                        <Skeleton className="w-4 h-4 rounded-full" />
                        <Skeleton className="w-4 h-4 rounded-full" />
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : blogPosts
                .filter(post => selectedBlogCategory === 'All' || post.category === selectedBlogCategory)
                .slice(0, 9)
                .map((post, i) => (
                  <BlogPostCard key={post.id} post={post} index={i} />
                ))}
          </div>
        </div>
      </motion.section>
            </motion.div>
          ) : currentView.type === 'publication' ? (
            <PublicationView onBack={handleBackHome} />
          ) : currentView.type === 'admin' ? (
            <AdminPanelView onBack={handleBackHome} currentUser={user} />
          ) : currentView.type === 'profile' ? (
            user && <ProfileView user={user} onUpdate={(data) => setUser({ ...user, ...data })} onBack={handleBackHome} />
          ) : currentView.type === 'dev' ? (
            user && <DevSettingsView user={user} onBack={handleBackHome} />
          ) : currentView.type === 'about' ? (
            <AboutView 
              section={currentView.section} 
              onBack={handleBackHome} 
            />
          ) : (
            currentService && (
              <ServiceDetailView 
                service={currentService} 
                onBack={handleBackHome} 
              />
            )
          )}
        </AnimatePresence>
      </main>

      {/* --- PARTNER MARQUEE --- */}
      <motion.section 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1 }}
        className="py-16 bg-white border-y border-slate-100 overflow-hidden"
      >
        <div className="max-w-7xl mx-auto px-4 mb-10 text-center">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Our Development Partners</p>
        </div>
        <div className="flex marquee-content whitespace-nowrap group">
          {[...partners, ...partners].map((partner, i) => (
            <div key={i} className="mx-12 flex items-center justify-center relative">
              <motion.div
                whileHover={{ scale: 1.1 }}
                className="group/item relative flex flex-col items-center"
              >
                <div className="h-16 w-36 flex items-center justify-center filter drop-shadow-sm transition-all duration-500 group-hover/item:drop-shadow-md">
                  <img 
                    src={partner.logo} 
                    alt={partner.name}
                    className="max-h-full max-w-full object-contain grayscale opacity-40 group-hover/item:grayscale-0 group-hover/item:opacity-100 transition-all duration-500 transform group-hover/item:scale-105"
                  />
                </div>
                
                {/* Tooltip */}
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1 bg-slate-900/90 backdrop-blur-sm text-white text-[10px] font-bold rounded-lg opacity-0 group-hover/item:opacity-100 pointer-events-none transition-all duration-300 translate-y-2 group-hover/item:translate-y-0 whitespace-nowrap z-50 shadow-xl border border-white/10">
                  {partner.name}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-t-slate-900/90" />
                </div>
              </motion.div>
            </div>
          ))}
        </div>
      </motion.section>

      {/* --- FOOTER --- */}
      <footer className="bg-slate-900 text-slate-300 pt-24 pb-12 overflow-hidden">
        <div className="w-full px-4 sm:px-6 lg:px-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 mb-20">
            {/* Brand */}
            <div>
              <div className="mb-8">
                <BrandLogo isDark text="Development for all" />
              </div>
              <p className="text-slate-400 mb-8 leading-relaxed">
                Advancing sustainable economic growth through data-driven research, collaborative development, and market intelligence since 2008.
              </p>
              <div className="flex gap-4">
                <a href="#" className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center hover:bg-brand-blue hover:text-white transition-all"><Linkedin size={20} /></a>
                <a href="#" className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center hover:bg-brand-blue hover:text-white transition-all" title="X (Twitter)">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"/></svg>
                </a>
                <a href="#" className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center hover:bg-brand-blue hover:text-white transition-all"><Facebook size={20} /></a>
                <a href="#" className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center hover:bg-brand-blue hover:text-white transition-all"><Youtube size={20} /></a>
                <a href="#" className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center hover:bg-brand-blue hover:text-white transition-all"><MessageCircle size={20} /></a>
              </div>
            </div>

            {/* Services */}
            <div>
              <h5 className="text-white font-bold mb-8 uppercase tracking-widest text-xs">Our Services</h5>
              <ul className="space-y-4 text-sm mb-6">
                {servicesData.slice(0, 5).map(service => (
                  <li key={service.slug}>
                    <button 
                      onClick={() => handleSelectService(service.title)} 
                      className="hover:text-brand-blue transition-colors bg-transparent border-none p-0 text-left cursor-pointer"
                    >
                      {service.title}
                    </button>
                  </li>
                ))}
              </ul>
              <div className="pt-4 border-t border-slate-800">
                <a href="#privacy" className="text-xs text-slate-500 hover:text-brand-blue transition-colors flex items-center gap-2">
                  <ShieldCheck size={14} /> Privacy Policy
                </a>
              </div>
            </div>

            {/* Newsletter */}
            <div className="lg:col-span-2">
              <h5 className="text-white font-bold mb-8 uppercase tracking-widest text-xs">Newsletter</h5>
              <p className="text-slate-400 mb-6 text-sm">Subscribe to our weekly economic briefing and development reports.</p>
              <form onSubmit={handleSubscribe} className="flex gap-2 max-w-md">
                <input 
                  type="email" 
                  name="email"
                  placeholder="name@email.com" 
                  required
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-blue transition-colors"
                />
                <button 
                  disabled={subscribing}
                  className="px-6 py-3 bg-brand-blue text-white font-bold rounded-xl hover:bg-brand-blue/90 transition-all disabled:opacity-50 min-w-[64px] flex items-center justify-center"
                >
                  {subscribing ? <LoadingSpinner size={20} className="text-white" /> : <Mail size={20} />}
                </button>
              </form>
              {subscribeStatus && (
                <motion.p 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`mt-4 text-sm font-medium ${subscribeStatus.type === 'success' ? 'text-green-400' : 'text-red-400'}`}
                >
                  {subscribeStatus.msg}
                </motion.p>
              )}
            </div>
          </div>

          {/* Contact Form Section */}
          <div id="contact" className="grid lg:grid-cols-2 gap-16 py-16 border-t border-slate-800">
            <div>
              <h3 className="text-4xl font-bold text-white mb-6">Let's Connect</h3>
              <p className="text-slate-400 mb-8">
                Ready to collaborate on a project or have a research inquiry? Reach out to our global team.
              </p>
              <div className="space-y-4">
                <div className="flex items-center gap-4 text-slate-400">
                  <Globe size={20} className="text-brand-blue" />
                  <span>HQ: 123 Global Plaza, Addis Ababa, Ethiopia</span>
                </div>
                <div className="flex items-center gap-4 text-slate-400">
                  <Mail size={20} className="text-brand-blue" />
                  <span>contact@growthlab.org</span>
                </div>
              </div>
            </div>

            <form onSubmit={handleContact} className="space-y-4 bg-slate-800/50 p-8 rounded-3xl">
              <div className="grid grid-cols-2 gap-4">
                <input type="text" name="name" placeholder="Full Name" required className="bg-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none" />
                <input type="email" name="email" placeholder="Email" required className="bg-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none" />
              </div>
              <textarea name="message" placeholder="Message" rows={4} required className="w-full bg-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none resize-none" />
              <button 
                type="submit"
                disabled={contacting}
                className="w-full py-4 bg-brand-blue text-white font-bold rounded-xl hover:bg-brand-blue/90 shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {contacting ? <LoadingSpinner size={20} className="text-white" /> : 'Send Message'}
              </button>
              {contactStatus && (
                <motion.p 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`text-center text-sm font-medium ${contactStatus.type === 'success' ? 'text-green-400' : 'text-red-400'}`}
                >
                  {contactStatus.msg}
                </motion.p>
              )}
            </form>
          </div>

          <div className="text-center pt-12 text-slate-500 text-sm border-t border-slate-800">
            <p>&copy; 2024 Global Growth Initiatives. All rights reserved. Empowering Sustainable Futures.</p>
          </div>
        </div>
      </footer>

      {/* --- AUTH MODAL --- */}
      <AnimatePresence>
        {showAuthModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white rounded-[2rem] sm:rounded-3xl shadow-2xl p-6 sm:p-8 w-full max-w-md relative"
            >
              <button 
                onClick={() => setShowAuthModal(false)}
                className="absolute top-6 right-6 text-slate-400 hover:text-slate-600"
              >
                <X size={24} />
              </button>
              
              <h3 className="text-2xl font-bold text-slate-900 mb-2">
                {authMode === 'login' ? 'Welcome Back' : 'Join GrowthLab'}
              </h3>
              <p className="text-slate-500 mb-8 text-sm">
                {authMode === 'login' ? 'Enter your credentials to access your account.' : 'Create an account to start contributing to sustainable growth.'}
              </p>
              
              <form onSubmit={handleAuth} className="space-y-4">
                {authError && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs font-bold text-center">
                    {authError}
                  </div>
                )}
                {authMode === 'register' && (
                  <input name="name" type="text" disabled={authLoading} placeholder="Full Name" required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 disabled:opacity-50" />
                )}
                <input name="email" type="email" disabled={authLoading} placeholder="Email Address" required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 disabled:opacity-50" />
                <input name="password" type="password" disabled={authLoading} placeholder="Password" required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 disabled:opacity-50" />
                
                <button 
                  type="submit" 
                  disabled={authLoading}
                  className="w-full py-4 bg-brand-blue text-white font-bold rounded-xl mt-4 shadow-lg shadow-blue-500/20 hover:scale-[1.02] transition-transform flex items-center justify-center gap-2"
                >
                  {authLoading ? <LoadingSpinner size={20} className="text-white" /> : (authMode === 'login' ? 'Sign In with Email' : 'Sign Up with Email')}
                </button>
              </form>

              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-slate-500">Or continue with</span>
                </div>
              </div>

              <button 
                onClick={handleGoogleSignIn}
                disabled={authLoading}
                className="w-full py-4 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl shadow-sm hover:bg-slate-50 transition-colors flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {authLoading ? <LoadingSpinner size={20} /> : (
                  <>
                    <svg width="20" height="20" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.28 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Google Account
                  </>
                )}
              </button>
              
              <p className="mt-8 text-center text-sm text-slate-500">
                {authMode === 'login' ? "Don't have an account?" : "Already have an account?"} {' '}
                <button 
                  onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
                  className="font-bold text-brand-blue hover:underline"
                >
                  {authMode === 'login' ? 'Sign Up' : 'Sign In'}
                </button>
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- BACK TO TOP --- */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.5, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 50 }}
            whileHover={{ scale: 1.1, y: -5 }}
            whileTap={{ scale: 0.9 }}
            onClick={scrollToTop}
            className="fixed bottom-8 right-8 z-[60] w-14 h-14 bg-white text-brand-blue rounded-full shadow-2xl flex items-center justify-center border border-slate-100 hover:bg-brand-blue hover:text-white transition-colors duration-300"
            aria-label="Back to Top"
          >
            <ArrowUp size={24} strokeWidth={3} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
