/**
 * Reusable Animation Variants and Configs
 *
 * Optimized animation presets using GPU-accelerated properties (transform, opacity)
 * and spring physics for natural, premium feel.
 */

import type { Variants, Transition } from 'framer-motion';

// ============================================================================
// SPRING CONFIGS
// ============================================================================

/**
 * Gentle spring - smooth and calm (default for most UI interactions)
 * Use for: cards, buttons, modals, panels
 */
export const springGentle: Transition = {
  type: 'spring',
  stiffness: 260,
  damping: 20,
  mass: 0.5,
};

/**
 * Snappy spring - quick and responsive
 * Use for: dropdowns, tooltips, floating toolbars
 */
export const springSnappy: Transition = {
  type: 'spring',
  stiffness: 400,
  damping: 28,
  mass: 0.5,
};

/**
 * Bouncy spring - playful and energetic
 * Use for: success animations, celebrates, fun interactions
 */
export const springBouncy: Transition = {
  type: 'spring',
  stiffness: 300,
  damping: 15,
  mass: 0.8,
};

/**
 * Smooth ease - polished cubic-bezier
 * Use for: complex transitions where spring physics might overshoot
 */
export const easeSmooth: Transition = {
  duration: 0.3,
  ease: [0.25, 0.46, 0.45, 0.94], // easeOutCubic
};

/**
 * Fast ease - quick transitions
 * Use for: small UI changes, micro-interactions
 */
export const easeFast: Transition = {
  duration: 0.15,
  ease: [0.4, 0, 0.2, 1], // easeOutQuart
};

// ============================================================================
// FADE ANIMATIONS
// ============================================================================

export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: easeSmooth,
  },
  exit: {
    opacity: 0,
    transition: easeFast,
  },
};

export const fadeInUp: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: springGentle,
  },
  exit: {
    opacity: 0,
    y: 10,
    transition: easeFast,
  },
};

export const fadeInDown: Variants = {
  initial: { opacity: 0, y: -20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: springGentle,
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: easeFast,
  },
};

// ============================================================================
// SLIDE ANIMATIONS
// ============================================================================

export const slideInLeft: Variants = {
  initial: { opacity: 0, x: -30 },
  animate: {
    opacity: 1,
    x: 0,
    transition: springGentle,
  },
  exit: {
    opacity: 0,
    x: -20,
    transition: easeFast,
  },
};

export const slideInRight: Variants = {
  initial: { opacity: 0, x: 30 },
  animate: {
    opacity: 1,
    x: 0,
    transition: springGentle,
  },
  exit: {
    opacity: 0,
    x: 20,
    transition: easeFast,
  },
};

export const slideInUp: Variants = {
  initial: { opacity: 0, y: 30 },
  animate: {
    opacity: 1,
    y: 0,
    transition: springGentle,
  },
  exit: {
    opacity: 0,
    y: 20,
    transition: easeFast,
  },
};

export const slideInDown: Variants = {
  initial: { opacity: 0, y: -30 },
  animate: {
    opacity: 1,
    y: 0,
    transition: springGentle,
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: easeFast,
  },
};

// ============================================================================
// SCALE ANIMATIONS
// ============================================================================

export const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.9 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: springGentle,
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: easeFast,
  },
};

export const scaleInBounce: Variants = {
  initial: { opacity: 0, scale: 0.8 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: springBouncy,
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    transition: easeFast,
  },
};

// ============================================================================
// MODAL & OVERLAY ANIMATIONS
// ============================================================================

export const modalOverlay: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: 0.2 },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.15 },
  },
};

export const modalContent: Variants = {
  initial: { opacity: 0, scale: 0.95, y: 20 },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: springGentle,
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 10,
    transition: easeFast,
  },
};

/**
 * Simpler modal animation - faster for quick modals
 * Use for: dialogs, popovers, quick selections
 */
export const modalSimple: Variants = {
  initial: { opacity: 0, scale: 0.98 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.15, ease: [0.4, 0, 0.2, 1] },
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    transition: { duration: 0.1 },
  },
};

// ============================================================================
// LIST & STAGGER ANIMATIONS
// ============================================================================

export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
  exit: {
    transition: {
      staggerChildren: 0.03,
      staggerDirection: -1,
    },
  },
};

export const listItem: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: {
    opacity: 1,
    y: 0,
    transition: springGentle,
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: easeFast,
  },
};

export const listItemFade: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: easeSmooth,
  },
  exit: {
    opacity: 0,
    transition: easeFast,
  },
};

// ============================================================================
// CARD & HOVER ANIMATIONS
// ============================================================================

/**
 * Card entrance animation - subtle and polished
 */
export const cardEntrance: Variants = {
  initial: { opacity: 0, y: 15, scale: 0.98 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: springGentle,
  },
};

/**
 * Card hover animation - lift effect
 * Use with whileHover prop
 */
export const cardHover = {
  scale: 1.02,
  y: -4,
  transition: springSnappy,
};

/**
 * Card tap animation - press effect
 * Use with whileTap prop
 */
export const cardTap = {
  scale: 0.98,
  transition: easeFast,
};

// ============================================================================
// BUTTON ANIMATIONS
// ============================================================================

export const buttonHover = {
  scale: 1.05,
  transition: springSnappy,
};

export const buttonTap = {
  scale: 0.95,
  transition: easeFast,
};

// ============================================================================
// PANEL & COLLAPSE ANIMATIONS
// ============================================================================

export const panelCollapse: Variants = {
  expanded: {
    height: 'auto',
    opacity: 1,
    transition: springGentle,
  },
  collapsed: {
    height: 0,
    opacity: 0,
    transition: easeSmooth,
  },
};

export const panelSlideLeft: Variants = {
  visible: {
    x: 0,
    opacity: 1,
    transition: springGentle,
  },
  hidden: {
    x: -20,
    opacity: 0,
    transition: easeFast,
  },
};

export const panelSlideRight: Variants = {
  visible: {
    x: 0,
    opacity: 1,
    transition: springGentle,
  },
  hidden: {
    x: 20,
    opacity: 0,
    transition: easeFast,
  },
};

// ============================================================================
// FLOATING & TOOLTIP ANIMATIONS
// ============================================================================

export const floatingToolbar: Variants = {
  initial: { opacity: 0, y: 8, scale: 0.95 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: springSnappy,
  },
  exit: {
    opacity: 0,
    y: 4,
    scale: 0.95,
    transition: easeFast,
  },
};

export const tooltip: Variants = {
  initial: { opacity: 0, scale: 0.9, y: 5 },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: springSnappy,
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    y: 3,
    transition: easeFast,
  },
};

// ============================================================================
// SKELETON & LOADING ANIMATIONS
// ============================================================================

export const skeletonPulse: Variants = {
  initial: { opacity: 0.5 },
  animate: {
    opacity: [0.5, 1, 0.5],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

export const spinnerRotate = {
  rotate: 360,
  transition: {
    duration: 1,
    repeat: Infinity,
    ease: 'linear',
  },
};

// ============================================================================
// PAGE TRANSITION ANIMATIONS
// ============================================================================

export const pageTransition: Variants = {
  initial: { opacity: 0, x: -20 },
  animate: {
    opacity: 1,
    x: 0,
    transition: easeSmooth,
  },
  exit: {
    opacity: 0,
    x: 20,
    transition: easeFast,
  },
};

// ============================================================================
// HERO & LANDING ANIMATIONS
// ============================================================================

export const heroContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2,
    },
  },
};

export const heroItem: Variants = {
  initial: { opacity: 0, y: 30 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      ...springGentle,
      duration: 0.6,
    },
  },
};

// ============================================================================
// NOTIFICATION ANIMATIONS
// ============================================================================

export const notificationSlideIn: Variants = {
  initial: { opacity: 0, x: 100, scale: 0.95 },
  animate: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: springSnappy,
  },
  exit: {
    opacity: 0,
    x: 50,
    scale: 0.95,
    transition: easeFast,
  },
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Create a delayed animation variant
 */
export const withDelay = (variants: Variants, delay: number): Variants => {
  return {
    ...variants,
    animate: {
      ...variants.animate,
      transition: {
        ...(variants.animate as any)?.transition,
        delay,
      },
    },
  };
};

/**
 * Create a stagger animation with custom delay
 */
export const createStagger = (
  staggerDelay: number = 0.05,
  delayChildren: number = 0.1
): Variants => ({
  initial: {},
  animate: {
    transition: {
      staggerChildren: staggerDelay,
      delayChildren,
    },
  },
});
