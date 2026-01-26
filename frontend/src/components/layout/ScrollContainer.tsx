import { useState } from 'react';
import { motion } from 'framer-motion';
import { ScrollNavbar } from './ScrollNavbar';

interface ScrollContainerProps {
    children: React.ReactNode;
}

/**
 * Full-width scroll container with:
 * - Wooden handles spanning 100vw (no end caps)
 * - Navbar integrated INTO the top handle
 * - Parchment area with proper dark mode support
 * - Smooth unrolling animation
 */
export function ScrollContainer({ children }: ScrollContainerProps) {
    const [animationComplete, setAnimationComplete] = useState(false);

    // Animation timing
    const handleDuration = 0.6;
    const parchmentDelay = 0.2;
    const parchmentDuration = 0.8;
    const contentDelay = parchmentDelay + parchmentDuration - 0.2;

    return (
        <div className="fixed inset-0 bg-[var(--bg-main)] overflow-hidden">
            {/* Top Handle with Integrated Navbar */}
            <motion.div
                initial={{ y: '-100%' }}
                animate={{ y: 0 }}
                transition={{ duration: handleDuration, ease: 'easeOut' }}
                className="fixed top-0 left-0 right-0 h-14 sm:h-16 z-50"
            >
                {/* Wooden bar - full width, rounded bottom */}
                <div
                    className="relative h-full w-full rounded-b-lg overflow-hidden"
                    style={{
                        background: 'linear-gradient(180deg, #CD853F 0%, #A0522D 30%, #8B4513 70%, #5D4037 100%)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.3), inset 0 2px 4px rgba(255,255,255,0.2)',
                    }}
                >
                    {/* Horizontal wood grain texture */}
                    <div
                        className="absolute inset-0 opacity-20 pointer-events-none"
                        style={{
                            backgroundImage: `repeating-linear-gradient(
                                0deg,
                                transparent 0px,
                                transparent 3px,
                                rgba(0,0,0,0.15) 3px,
                                rgba(0,0,0,0.15) 4px
                            )`,
                            backgroundSize: '100% 8px',
                        }}
                    />

                    {/* Wood knot details */}
                    <div className="absolute top-1/2 left-[15%] -translate-y-1/2 w-3 h-3 rounded-full bg-[#4A3728] opacity-30" />
                    <div className="absolute top-1/3 right-[20%] w-2 h-2 rounded-full bg-[#4A3728] opacity-25" />

                    {/* Navbar content */}
                    <div className="relative z-10 h-full">
                        <ScrollNavbar />
                    </div>
                </div>
            </motion.div>

            {/* Parchment Area - full width */}
            <motion.div
                initial={{ scaleY: 0, opacity: 0.5 }}
                animate={{ scaleY: 1, opacity: 1 }}
                transition={{
                    duration: parchmentDuration,
                    delay: parchmentDelay,
                    ease: [0.22, 1, 0.36, 1],
                }}
                onAnimationComplete={() => setAnimationComplete(true)}
                className="fixed top-14 sm:top-16 bottom-14 sm:bottom-16 left-0 right-0 overflow-auto"
                style={{
                    transformOrigin: 'top',
                }}
            >
                {/* Parchment background with proper dark mode */}
                <div className="min-h-full parchment-surface relative">
                    {/* Edge Darkening - Top and Bottom */}
                    <div
                        className="absolute inset-0 pointer-events-none z-[5]"
                        style={{
                            background: `linear-gradient(180deg,
                                rgba(139, 69, 19, 0.08) 0%, transparent 3%,
                                transparent 97%, rgba(139, 69, 19, 0.08) 100%)`,
                        }}
                    />

                    {/* Aged Stain Spots - Light Mode */}
                    <div className="dark:hidden absolute inset-0 pointer-events-none z-[4]">
                        <div
                            style={{
                                position: 'absolute',
                                top: '8%',
                                left: '8%',
                                width: '200px',
                                height: '140px',
                                background: 'radial-gradient(ellipse, #C4A77D 0%, transparent 70%)',
                                opacity: 0.35,
                                filter: 'blur(30px)',
                            }}
                        />
                        <div
                            style={{
                                position: 'absolute',
                                top: '35%',
                                right: '5%',
                                width: '160px',
                                height: '180px',
                                background: 'radial-gradient(ellipse, #B8956E 0%, transparent 65%)',
                                opacity: 0.3,
                                filter: 'blur(25px)',
                            }}
                        />
                        <div
                            style={{
                                position: 'absolute',
                                bottom: '15%',
                                left: '15%',
                                width: '180px',
                                height: '120px',
                                background: 'radial-gradient(ellipse, #A08060 0%, transparent 60%)',
                                opacity: 0.25,
                                filter: 'blur(35px)',
                            }}
                        />
                    </div>

                    {/* Aged Stain Spots - Dark Mode (subtle vellum wear) */}
                    <div className="hidden dark:block absolute inset-0 pointer-events-none z-[4] mix-blend-soft-light">
                        <div
                            style={{
                                position: 'absolute',
                                top: '10%',
                                left: '10%',
                                width: '180px',
                                height: '120px',
                                background: 'radial-gradient(ellipse, #475569 0%, transparent 70%)',
                                opacity: 0.4,
                                filter: 'blur(30px)',
                            }}
                        />
                        <div
                            style={{
                                position: 'absolute',
                                top: '40%',
                                right: '8%',
                                width: '140px',
                                height: '160px',
                                background: 'radial-gradient(ellipse, #3D4A5C 0%, transparent 65%)',
                                opacity: 0.35,
                                filter: 'blur(25px)',
                            }}
                        />
                    </div>

                    {/* Paper Grain Texture */}
                    <div
                        className="absolute inset-0 pointer-events-none z-[3] opacity-[0.15] dark:opacity-[0.08]"
                        style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                            backgroundSize: '150px 150px',
                        }}
                    />

                    {/* Ruled Lines */}
                    <div
                        className="absolute inset-0 pointer-events-none z-[2] opacity-[0.12] dark:opacity-[0.04]"
                        style={{
                            backgroundImage:
                                'linear-gradient(to bottom, rgba(139, 69, 19, 0.4) 1px, transparent 1px)',
                            backgroundSize: '100% 2rem',
                            backgroundPosition: '0 1rem',
                        }}
                    />

                    {/* Parchment Inner Shadow */}
                    <div
                        className="absolute inset-0 pointer-events-none z-[1]"
                        style={{
                            boxShadow:
                                'inset 0 8px 20px rgba(0,0,0,0.08), inset 0 -8px 20px rgba(0,0,0,0.08)',
                        }}
                    />

                    {/* Main Content Area */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: animationComplete ? 1 : 0 }}
                        transition={{ duration: 0.5 }}
                        className="relative z-10 px-4 sm:px-8 py-6 sm:py-10"
                    >
                        {children}
                    </motion.div>
                </div>
            </motion.div>

            {/* Bottom Handle */}
            <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                transition={{ duration: handleDuration, ease: 'easeOut' }}
                className="fixed bottom-0 left-0 right-0 h-14 sm:h-16 z-50"
            >
                {/* Wooden bar - full width, rounded top */}
                <div
                    className="relative h-full w-full rounded-t-lg overflow-hidden"
                    style={{
                        background: 'linear-gradient(0deg, #CD853F 0%, #A0522D 30%, #8B4513 70%, #5D4037 100%)',
                        boxShadow: '0 -4px 12px rgba(0,0,0,0.3), inset 0 -2px 4px rgba(255,255,255,0.2)',
                    }}
                >
                    {/* Horizontal wood grain texture */}
                    <div
                        className="absolute inset-0 opacity-20 pointer-events-none"
                        style={{
                            backgroundImage: `repeating-linear-gradient(
                                0deg,
                                transparent 0px,
                                transparent 3px,
                                rgba(0,0,0,0.15) 3px,
                                rgba(0,0,0,0.15) 4px
                            )`,
                            backgroundSize: '100% 8px',
                        }}
                    />

                    {/* Wood knot details */}
                    <div className="absolute top-1/2 right-[25%] -translate-y-1/2 w-3 h-3 rounded-full bg-[#4A3728] opacity-30" />
                    <div className="absolute top-2/3 left-[30%] w-2 h-2 rounded-full bg-[#4A3728] opacity-25" />
                </div>
            </motion.div>
        </div>
    );
}
