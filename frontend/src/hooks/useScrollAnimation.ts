import { useState, useEffect, useRef, useCallback } from 'react';

interface UseScrollAnimationOptions {
  /** Maximum rotation angle in degrees (default: 12) */
  maxRotation?: number;
  /** Velocity decay factor (0-1, default: 0.92) */
  velocityDecay?: number;
  /** Sensitivity to scroll speed (default: 0.3) */
  sensitivity?: number;
  /** The scrollable element ref (default: window) */
  scrollRef?: React.RefObject<HTMLElement | null>;
}

interface UseScrollAnimationReturn {
  /** Current rotation value in degrees (positive = scrolling down, negative = scrolling up) */
  handleRotation: number;
  /** Whether reduced motion is preferred */
  prefersReducedMotion: boolean;
}

/**
 * Custom hook that tracks scroll velocity and calculates rotation angle
 * for scroll handle animation. Uses requestAnimationFrame for smooth decay.
 */
export function useScrollAnimation(
  options: UseScrollAnimationOptions = {}
): UseScrollAnimationReturn {
  const {
    maxRotation = 25,
    velocityDecay = 0.95,
    sensitivity = 0.8,
    scrollRef,
  } = options;

  const [handleRotation, setHandleRotation] = useState(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Refs for tracking scroll state
  const lastScrollY = useRef(0);
  const lastTime = useRef(performance.now());
  const currentVelocity = useRef(0);
  const animationFrameId = useRef<number | null>(null);
  const isScrolling = useRef(false);
  const scrollTimeout = useRef<number | null>(null);

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Decay animation loop
  const animateDecay = useCallback(() => {
    if (prefersReducedMotion) return;

    // Apply decay to velocity
    currentVelocity.current *= velocityDecay;

    // Clamp velocity to max rotation
    const clampedRotation = Math.max(
      -maxRotation,
      Math.min(maxRotation, currentVelocity.current)
    );

    setHandleRotation(clampedRotation);

    // Continue animating if velocity is still significant
    if (Math.abs(currentVelocity.current) > 0.1) {
      animationFrameId.current = requestAnimationFrame(animateDecay);
    } else {
      currentVelocity.current = 0;
      setHandleRotation(0);
      animationFrameId.current = null;
    }
  }, [maxRotation, velocityDecay, prefersReducedMotion]);

  // Handle scroll events
  const handleScroll = useCallback(() => {
    if (prefersReducedMotion) return;

    const scrollElement = scrollRef?.current;
    const currentScrollY = scrollElement
      ? scrollElement.scrollTop
      : window.scrollY;
    const currentTime = performance.now();

    // Calculate velocity (pixels per millisecond)
    const deltaY = currentScrollY - lastScrollY.current;
    const deltaTime = currentTime - lastTime.current;

    if (deltaTime > 0) {
      // Calculate velocity and apply sensitivity
      const rawVelocity = (deltaY / deltaTime) * sensitivity;

      // Smooth the velocity with the current value
      currentVelocity.current =
        currentVelocity.current * 0.5 + rawVelocity * 50 * 0.5;

      // Clamp velocity to max rotation
      currentVelocity.current = Math.max(
        -maxRotation,
        Math.min(maxRotation, currentVelocity.current)
      );

      setHandleRotation(currentVelocity.current);
    }

    // Update refs
    lastScrollY.current = currentScrollY;
    lastTime.current = currentTime;
    isScrolling.current = true;

    // Clear existing timeout
    if (scrollTimeout.current) {
      clearTimeout(scrollTimeout.current);
    }

    // Set timeout to start decay when scrolling stops
    scrollTimeout.current = window.setTimeout(() => {
      isScrolling.current = false;
      // Start decay animation
      if (!animationFrameId.current) {
        animationFrameId.current = requestAnimationFrame(animateDecay);
      }
    }, 50);
  }, [scrollRef, sensitivity, maxRotation, animateDecay, prefersReducedMotion]);

  // Set up scroll listener
  useEffect(() => {
    if (prefersReducedMotion) {
      setHandleRotation(0);
      return;
    }

    const scrollElement = scrollRef?.current;
    const target = scrollElement || window;

    // Initialize last scroll position
    lastScrollY.current = scrollElement
      ? scrollElement.scrollTop
      : window.scrollY;

    target.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      target.removeEventListener('scroll', handleScroll);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }
    };
  }, [scrollRef, handleScroll, prefersReducedMotion]);

  return {
    handleRotation,
    prefersReducedMotion,
  };
}
