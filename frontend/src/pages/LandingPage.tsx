import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Scroll, Calendar, ChevronRight, Plus, Eye, BookOpen, Heart } from 'lucide-react';
import { useSavedStudies } from '../hooks/useSavedStudies';
import { Card, CardContent } from '../components/ui/Card';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { CreateStudyWizard } from '../components/wizard/CreateStudyWizard';
import {
  heroContainer,
  heroItem,
  staggerContainer,
  cardEntrance,
  cardHover,
  cardTap,
  buttonHover,
  buttonTap,
} from '../utils/animations';
import { ScrollContainer } from '../components/layout/ScrollContainer';

export function LandingPage() {
  const navigate = useNavigate();
  const [showWizard, setShowWizard] = useState(false);
  const { data: savedStudies, isLoading } = useSavedStudies();

  // Get most recent 4 studies
  const recentStudies = savedStudies
    ?.sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime())
    .slice(0, 4) || [];

  const handleStudyClick = (studyId: string) => {
    navigate(`/editor?saved=${studyId}`);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Using optimized animations from animations.ts

  return (
    <ScrollContainer>
      <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <motion.div
            initial="initial"
            animate="animate"
            variants={heroContainer}
            className="pt-8 sm:pt-12 pb-16 text-center relative z-10"
          >
            {/* Background Decorative Elements */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-4xl -z-10 opacity-30 pointer-events-none">
              <div className="absolute top-20 left-20 w-72 h-72 bg-[var(--color-accent)] rounded-full mix-blend-multiply filter blur-3xl animate-pulse-subtle" />
              <div className="absolute top-20 right-20 w-72 h-72 bg-[var(--color-observation)] rounded-full mix-blend-multiply filter blur-3xl animate-pulse-subtle" style={{ animationDelay: '1s' }} />
            </div>

            <motion.div variants={heroItem} className="mb-8">
              <motion.div
                whileHover={{ scale: 1.05, rotate: 5 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="inline-block relative"
              >
                <div className="absolute inset-0 bg-[var(--color-accent)] blur-2xl opacity-20 rounded-full" />
                <img
                  src="/scribby-logo.png"
                  alt="Scribby"
                  className="relative h-32 w-32 sm:h-40 sm:w-40 object-contain drop-shadow-2xl"
                />
              </motion.div>
            </motion.div>

            <motion.h1
              variants={heroItem}
              className="text-5xl sm:text-6xl lg:text-7xl font-serif font-black text-[var(--text-primary)] mb-6 tracking-tight px-4 leading-tight"
            >
              Meet{' '}
              <span className="bg-gradient-to-r from-[var(--color-accent)] via-[var(--color-accent-light)] to-[var(--color-accent)] bg-[length:200%_auto] animate-text-shimmer bg-clip-text text-transparent">
                Scribby
              </span>
            </motion.h1>

            <motion.p
              variants={heroItem}
              className="text-2xl sm:text-3xl text-[var(--text-secondary)] mb-4 font-serif italic px-4"
            >
              Your AI-Powered Bible Study Companion
            </motion.p>

            <motion.p
              variants={heroItem}
              className="text-lg sm:text-xl text-[var(--text-muted)] mb-12 max-w-2xl mx-auto leading-relaxed px-4"
            >
              Craft deep, meaningful expository studies in minutes. Let Scribby guide you through
              observation, interpretation, and application with theological precision.
            </motion.p>

            <motion.button
              variants={heroItem}
              whileHover={buttonHover}
              whileTap={buttonTap}
              onClick={() => setShowWizard(true)}
              className="
              group relative inline-flex items-center gap-3 px-8 sm:px-10 py-4 sm:py-5
              text-lg sm:text-xl font-bold text-white
              bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-hover)]
              rounded-2xl shadow-xl shadow-[var(--color-accent)]/20
              overflow-hidden
              will-animate
              tap-target
              transition-all duration-300
              hover:shadow-2xl hover:shadow-[var(--color-accent)]/40
            "
            >
              <span className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <Scroll className="h-6 w-6 sm:h-7 sm:w-7 relative z-10" />
              <span className="relative z-10">Create New Study</span>
              <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6 relative z-10 group-hover:translate-x-1 transition-transform" />
            </motion.button>
          </motion.div>

          {/* Features Section */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.7 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-24 px-4"
          >
            {[
              {
                icon: Eye,
                title: "Observation",
                desc: "What does the text say?",
                color: "var(--color-observation)",
                bg: "var(--color-observation-light)"
              },
              {
                icon: BookOpen,
                title: "Interpretation",
                desc: "What does it mean?",
                color: "var(--color-interpretation)",
                bg: "var(--color-interpretation-light)"
              },
              {
                icon: Heart,
                title: "Application",
                desc: "How does it apply to me?",
                color: "var(--color-accent)",
                bg: "var(--bg-elevated)"
              }
            ].map((feature, idx) => (
              <motion.div
                key={idx}
                whileHover={{ y: -5 }}
                className="p-6 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-surface)] shadow-sm hover:shadow-md transition-all"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 text-white shadow-lg"
                  style={{ backgroundColor: feature.color }}
                >
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-serif font-bold text-[var(--text-primary)] mb-2">{feature.title}</h3>
                <p className="text-[var(--text-muted)]">{feature.desc}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* Recent Studies Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="pb-20"
          >
            <div className="flex items-center justify-between mb-8 px-4 sm:px-0">
              <h2 className="text-xl sm:text-2xl font-serif font-semibold text-[var(--text-primary)]">
                Recent Studies
              </h2>
              {savedStudies && savedStudies.length > 0 && (
                <motion.button
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/saved')}
                  className="text-sm font-medium text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] transition-colors flex items-center gap-1 tap-target"
                >
                  View all
                  <ChevronRight className="h-4 w-4" />
                </motion.button>
              )}
            </div>

            {isLoading ? (
              <div className="flex justify-center py-16">
                <LoadingSpinner />
              </div>
            ) : recentStudies.length > 0 ? (
              <motion.div
                variants={staggerContainer}
                initial="initial"
                animate="animate"
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
              >
                {recentStudies.map((study, index) => (
                  <motion.div
                    key={study.id}
                    variants={cardEntrance}
                    custom={index}
                    whileHover={cardHover}
                    whileTap={cardTap}
                    className="will-animate"
                  >
                    <Card
                      className="
                      h-full cursor-pointer
                      hover:shadow-lg hover:border-[var(--color-accent)]/30
                      transition-all duration-200
                      group
                      tap-target
                    "
                      onClick={() => handleStudyClick(study.id)}
                    >
                      <CardContent className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-[var(--text-primary)] mb-2 group-hover:text-[var(--color-accent)] transition-colors line-clamp-2">
                              {study.reference}
                            </h3>
                            <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                              <Calendar className="h-3 w-3" />
                              <span>{formatDate(study.savedAt)}</span>
                            </div>
                          </div>
                          <ChevronRight className="h-5 w-5 text-[var(--text-muted)] group-hover:text-[var(--color-accent)] group-hover:translate-x-1 transition-all flex-shrink-0" />
                        </div>

                        {study.provider && (
                          <div className="pt-2 border-t border-[var(--border-color)]">
                            <span className="inline-flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)]"></span>
                              {study.provider}
                            </span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <Card className="text-center py-16">
                <CardContent>
                  <div className="mx-auto w-16 h-16 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center mb-4">
                    <Plus className="h-8 w-8 text-[var(--text-muted)]" />
                  </div>
                  <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
                    No Studies Yet
                  </h3>
                  <p className="text-[var(--text-muted)] mb-6">
                    Get started by creating your first Bible study
                  </p>
                  <button
                    onClick={() => setShowWizard(true)}
                    className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] rounded-lg transition-colors"
                  >
                    <Scroll className="h-4 w-4" />
                    Create Study
                  </button>
                </CardContent>
              </Card>
            )}
          </motion.div>

          {/* Creation Wizard Modal */}
          {showWizard && <CreateStudyWizard onClose={() => setShowWizard(false)} />}
        </div>
    </ScrollContainer>
  );
}
