import React, { useRef } from 'react';
import { PointCloudHero } from './PointCloudHero';
import { motion } from 'motion/react';

export const Hero = () => {
  const sectionRef = useRef<HTMLElement>(null);
  
  return (
    <section ref={sectionRef} className="relative min-h-screen flex items-center justify-center overflow-hidden bg-slate-950">
      <div className="absolute inset-0 z-0">
        <PointCloudHero />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-20 text-center">
        <motion.div
           initial={{ opacity: 0, y: 30 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.8 }}
        >
          <motion.h1 
            className="text-6xl md:text-8xl font-black text-white leading-tight mb-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", type: "spring", bounce: 0.4 }}
          >
            Empowering Economic Development<br />
            <motion.span 
              className="text-brand-blue inline-block"
              initial={{ y: 0 }}
              animate={{ y: [0, -15, 0] }}
              transition={{
                duration: 1.2,
                delay: 0.6,
                ease: "easeInOut"
              }}
            >
              for All
            </motion.span>
          </motion.h1>
        </motion.div>
      </div>
    </section>
  );
};
