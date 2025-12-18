'use client';

import { motion, useScroll, useSpring, useTransform } from 'framer-motion';
import { useEffect, useState } from 'react';

interface Section {
  id: string;
  title: string;
}

interface ScrollProgressProps {
  sections?: Section[];
  showPercentage?: boolean;
  showSectionNav?: boolean;
}

export function ScrollProgress({
  sections = [],
  showPercentage = true,
  showSectionNav = true,
}: ScrollProgressProps) {
  const { scrollYProgress } = useScroll();
  const [activeSection, setActiveSection] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  // Smooth spring animation for progress bar
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  // Percentage display
  const percentage = useTransform(scrollYProgress, [0, 1], [0, 100]);
  const [displayPercentage, setDisplayPercentage] = useState(0);

  useEffect(() => {
    const unsubscribe = percentage.on('change', (v) => {
      setDisplayPercentage(Math.round(v));
    });
    return () => unsubscribe();
  }, [percentage]);

  // Show after slight scroll
  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 100);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Track active section
  useEffect(() => {
    if (sections.length === 0) return;

    const handleScroll = () => {
      const scrollPos = window.scrollY + window.innerHeight / 3;

      sections.forEach((section, index) => {
        const el = document.getElementById(section.id);
        if (el && scrollPos >= el.offsetTop) {
          setActiveSection(index);
        }
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [sections]);

  return (
    <>
      {/* Fixed Progress Bar at Top */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-white/5 z-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: isVisible ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      >
        <motion.div
          className="h-full bg-gradient-to-r from-[#4da2ff] to-[#00d4ff] origin-left"
          style={{ scaleX }}
        />
        {/* Glow effect */}
        <motion.div
          className="absolute top-0 h-1 w-20 bg-gradient-to-r from-transparent via-[#4da2ff]/50 to-transparent blur-sm"
          style={{
            left: useTransform(scrollYProgress, [0, 1], ['0%', '100%']),
            x: '-50%',
          }}
        />
      </motion.div>

      {/* Floating Percentage Indicator */}
      {showPercentage && (
        <motion.div
          className="fixed top-4 right-4 z-50"
          initial={{ opacity: 0, y: -20, scale: 0.9 }}
          animate={{
            opacity: isVisible ? 1 : 0,
            y: isVisible ? 0 : -20,
            scale: isVisible ? 1 : 0.9,
          }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        >
          <div className="glass rounded-lg px-3 py-2 font-mono text-sm flex items-center gap-1">
            <span className="text-[#4da2ff] font-semibold tabular-nums">
              {displayPercentage}
            </span>
            <span className="text-white/40">%</span>
          </div>
        </motion.div>
      )}

      {/* Section Navigation Cards - Responsive */}
      {showSectionNav && sections.length > 0 && (
        <motion.div
          className="fixed bottom-4 sm:bottom-6 left-1/2 z-50 w-[calc(100%-2rem)] sm:w-auto max-w-[95vw]"
          initial={{ opacity: 0, y: 20, x: '-50%' }}
          animate={{
            opacity: isVisible ? 1 : 0,
            y: isVisible ? 0 : 20,
            x: '-50%',
          }}
          transition={{ type: 'spring', stiffness: 300, damping: 25, delay: 0.1 }}
        >
          <div className="glass rounded-full px-1.5 sm:px-2 py-1 sm:py-1.5 flex gap-0.5 sm:gap-1 overflow-x-auto scrollbar-hide justify-center sm:justify-start">
            {sections.map((section, index) => (
              <motion.button
                key={section.id}
                onClick={() => {
                  document.getElementById(section.id)?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start',
                  });
                }}
                className={`
                  px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-mono transition-all duration-200
                  whitespace-nowrap flex-shrink-0
                  ${index === activeSection
                    ? 'bg-[#4da2ff] text-white shadow-lg shadow-[#4da2ff]/25'
                    : 'text-white/50 hover:text-white hover:bg-white/10'
                  }
                `}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {section.title}
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}
    </>
  );
}
