import { useState } from 'react';
import { BookOpen, Sparkles } from 'lucide-react';
import { PassageSelector } from '../components/forms/PassageSelector';
import { PassageDisplay } from '../components/study/PassageDisplay';
import { StudyGuide } from '../components/study/StudyGuide';
import { LoadingOverlay } from '../components/ui/LoadingSpinner';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { useStudyGeneration } from '../hooks/useStudyGeneration';
import type { Study } from '../types';

export function HomePage() {
  const [currentStudy, setCurrentStudy] = useState<{
    reference: string;
    passage_text: string;
    study: Study;
    provider: string;
  } | null>(null);

  const generateMutation = useStudyGeneration();

  const handleGenerateStudy = async (
    book: string,
    chapter: number,
    startVerse?: number,
    endVerse?: number
  ) => {
    const result = await generateMutation.mutateAsync({
      book,
      chapter,
      start_verse: startVerse,
      end_verse: endVerse,
    });

    setCurrentStudy({
      reference: result.reference,
      passage_text: result.passage_text,
      study: result.study,
      provider: result.provider,
    });
  };

  return (
    <div className="min-h-screen bg-[var(--bg-main)]">
      {generateMutation.isPending && <LoadingOverlay />}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Passage Selector */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle as="h2" className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-[var(--color-observation)]" />
              Select a Passage
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <PassageSelector
              onSubmit={handleGenerateStudy}
              loading={generateMutation.isPending}
            />
          </CardContent>
        </Card>

        {/* Error Display */}
        {generateMutation.isError && (
          <Card className="mb-8 border-red-300 bg-red-50">
            <CardContent>
              <p className="text-red-700">
                {generateMutation.error?.message || 'An error occurred while generating the study.'}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Study Display */}
        {currentStudy && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Passage - Left Column */}
            <div className="lg:col-span-1">
              <PassageDisplay
                reference={currentStudy.reference}
                text={currentStudy.passage_text}
              />
            </div>

            {/* Study Guide - Right Column */}
            <div className="lg:col-span-2">
              <StudyGuide
                study={currentStudy.study}
                provider={currentStudy.provider}
              />
            </div>
          </div>
        )}

        {/* Empty State */}
        {!currentStudy && !generateMutation.isPending && (
          <Card variant="elevated" className="text-center">
            <CardContent className="py-16">
              <div className="mx-auto w-16 h-16 rounded-full bg-[var(--color-observation)]/10 flex items-center justify-center mb-6">
                <Sparkles className="h-8 w-8 text-[var(--color-observation)]" />
              </div>
              <h3 className="text-xl font-semibold text-[var(--text-primary)] font-serif mb-2">
                Begin Your Study
              </h3>
              <p className="text-[var(--text-muted)] max-w-md mx-auto">
                Select a Bible passage above to generate an AI-powered study guide with observation, interpretation, and application questions.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
