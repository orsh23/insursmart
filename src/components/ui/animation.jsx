import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from './cn';

export const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.1 } }
};

export const slideUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.2 } }
};

export const slideDown = {
  hidden: { opacity: 0, y: -20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, y: 20, transition: { duration: 0.2 } }
};

export const slideRight = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, x: 20, transition: { duration: 0.2 } }
};

export const slideLeft = {
  hidden: { opacity: 0, x: 20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, x: -20, transition: { duration: 0.2 } }
};

export const scale = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.3 } },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } }
};

export function AnimatedDiv({
  children,
  className,
  animation = "fadeIn", // Options: fadeIn, slideUp, slideDown, slideRight, slideLeft, scale
  ...props
}) {
  const getAnimation = () => {
    switch (animation) {
      case "slideUp": return slideUp;
      case "slideDown": return slideDown;
      case "slideRight": return slideRight;
      case "slideLeft": return slideLeft;
      case "scale": return scale;
      default: return fadeIn;
    }
  };

  return (
    <motion.div
      className={cn(className)}
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={getAnimation()}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function AnimatedPresenceWrapper({ children }) {
  return (
    <AnimatePresence mode="wait">
      {children}
    </AnimatePresence>
  );
}