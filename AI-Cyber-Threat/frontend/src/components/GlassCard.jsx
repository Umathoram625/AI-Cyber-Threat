import React from 'react';
import { motion } from 'framer-motion';

const GlassCard = ({ children, className = '', glowColor = '', hover = true, ...props }) => {
  let borderGlow = 'glass-panel';
  
  if (glowColor === 'cyan') {
    borderGlow = 'glass-panel-glow';
  } else if (glowColor === 'red') {
    borderGlow = 'glass-panel-glow-red';
  }
  
  const hoverAnimation = hover ? { y: -3, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)' } : {};

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={hoverAnimation}
      className={`rounded-xl p-5 backdrop-blur-md relative overflow-hidden transition-colors ${borderGlow} ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default GlassCard;
