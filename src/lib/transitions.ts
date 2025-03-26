
import { Variants } from 'framer-motion';

// Animation ease functions
export const easeTransition = {
  duration: 0.3,
  ease: [0.25, 0.1, 0.25, 1.0], // Ease-out cubic
};

// Basic slide from top animation
export const slideFromTopAnimation: Variants = {
  hidden: { y: -20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: easeTransition },
  exit: { y: -20, opacity: 0, transition: easeTransition },
};

// Slide from bottom animation
export const slideFromBottomAnimation: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: easeTransition },
  exit: { y: 20, opacity: 0, transition: easeTransition },
};

// Slide from left animation
export const slideFromLeftAnimation: Variants = {
  hidden: { x: -20, opacity: 0 },
  visible: { x: 0, opacity: 1, transition: easeTransition },
  exit: { x: -20, opacity: 0, transition: easeTransition },
};

// Slide from right animation
export const slideFromRightAnimation: Variants = {
  hidden: { x: 20, opacity: 0 },
  visible: { x: 0, opacity: 1, transition: easeTransition },
  exit: { x: 20, opacity: 0, transition: easeTransition },
};

// Scale animation
export const scaleAnimation: Variants = {
  hidden: { scale: 0.95, opacity: 0 },
  visible: { scale: 1, opacity: 1, transition: easeTransition },
  exit: { scale: 0.95, opacity: 0, transition: easeTransition },
};

// Fade animation
export const fadeAnimation: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: easeTransition },
  exit: { opacity: 0, transition: easeTransition },
};

// Page transition
export const pageTransition: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.3 } },
  exit: { opacity: 0, transition: { duration: 0.3 } },
};

// Staggered container for children animations
export const staggeredContainer: Variants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { 
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  },
};

// Item animation for staggered containers
export const staggeredItem: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: { 
    y: 0, 
    opacity: 1,
    transition: easeTransition
  },
};
