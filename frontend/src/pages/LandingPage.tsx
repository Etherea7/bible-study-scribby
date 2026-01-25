import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Scroll, Calendar, ChevronRight, Plus } from 'lucide-react';
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
    <div className="min-h-screen bg-[var(--bg-main)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <motion.div
          initial="initial"
          animate="animate"
          variants={heroContainer}
          className="pt-16 pb-12 text-center"
        >
          <motion.div variants={heroItem} className="mb-6">
            <motion.div
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.3 }}
              className="inline-block mb-4"
            >
              <img
                src="/scribby-logo.png"
                alt="Scribby"
                className="h-24 w-24 sm:h-28 sm:w-28 object-contain drop-shadow-lg"
              />
            </motion.div>
          </motion.div>

          <motion.h1
            variants={heroItem}
            className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold text-[var(--text-primary)] mb-4 tracking-tight px-4"
          >
            Meet{' '}
            <span className="bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-hover)] bg-clip-text text-transparent">
              Scribby
            </span>
          </motion.h1>

          <motion.p
            variants={heroItem}
            className="text-xl sm:text-2xl text-[var(--text-secondary)] mb-2 font-serif px-4"
          >
            Your Bible Study Companion
          </motion.p>

          <motion.p
            variants={heroItem}
            className="text-base sm:text-lg text-[var(--text-muted)] mb-10 max-w-2xl mx-auto leading-relaxed px-4"
          >
            Let Scribby guide you through creating observation, interpretation, and application
            questions for any Bible passage. Craft meaningful expository studies with AI assistance.
          </motion.p>

          <motion.button
            variants={heroItem}
            whileHover={buttonHover}
            whileTap={buttonTap}
            onClick={() => setShowWizard(true)}
            className="
              group relative inline-flex items-center gap-3 px-6 sm:px-8 py-3 sm:py-4
              text-base sm:text-lg font-semibold text-white
              bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-hover)]
              rounded-xl shadow-lg
              overflow-hidden
              will-animate
              tap-target
            "
          >
            <span className="absolute inset-0 bg-gradient-to-r from-[var(--color-accent-hover)] to-[var(--color-accent)] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <Scroll className="h-5 w-5 sm:h-6 sm:w-6 relative z-10" />
            <span className="relative z-10">Create New Study</span>
            <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 relative z-10 group-hover:translate-x-1 transition-transform" />
          </motion.button>
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
      </div>

      {/* Creation Wizard Modal */}
      {showWizard && <CreateStudyWizard onClose={() => setShowWizard(false)} />}
    </div>
  );
}
