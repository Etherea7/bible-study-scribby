/**
 * FlowPanel - Study flow and outline panel for three-column layout
 *
 * Contains:
 * - Purpose Statement
 * - Context
 * - Key Themes
 * - Your Notes & Outline (study-level notes)
 * - Section Outline (with verse-range picker)
 * - "Generate Flow" button with notes option
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  Target,
  Map,
  Tag,
  List,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Wand2,
  ChevronDown,
  PenLine,
  Plus,
  Trash2,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { EditableTextField } from '../ui/EditableTextField';
import { EditableThemeList } from '../study/EditableThemeList';
import { MagicDraftButton } from './MagicDraftButton';
import { RichTextEditor } from '../ui/RichTextEditor';
import { SectionVerseRangePicker, type ParsedReference } from './SectionVerseRangePicker';
import { SortableFlowComponent } from './SortableFlowComponent';
import {
  draftPurposeStatement,
  draftHistoricalContext,
  draftKeyThemes,
  generateStudyFlow,
} from '../../api/enhanceClient';
import { parseReference } from '../../utils/formatReference';
import { getVerseCount } from '../../utils/bibleData';
import type { EditableStudyFull } from '../../types';

interface FlowPanelProps {
  reference: string;
  passageText: string;
  study: EditableStudyFull;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onUpdatePurpose: (value: string) => void;
  onUpdateContext: (value: string) => void;
  onUpdateStudyNotes: (value: string) => void;
  onAddTheme: (theme: string) => void;
  onUpdateTheme: (index: number, value: string) => void;
  onRemoveTheme: (index: number) => void;
  onAddSection: (passageSection: string, heading: string) => void;
  onRemoveSection: (sectionId: string) => void;
  onScrollToSection?: (sectionId: string) => void;
  // Batch update for "Generate All"
  onBatchUpdate?: (updates: {
    purpose?: string;
    context?: string;
    themes?: string[];
    sections?: Array<{ passageSection: string; heading: string }>;
  }) => void;
}

export function FlowPanel({
  reference,
  passageText,
  study,
  isCollapsed = false,
  onToggleCollapse,
  onUpdatePurpose,
  onUpdateContext,
  onUpdateStudyNotes,
  onAddTheme,
  onUpdateTheme,
  onRemoveTheme,
  onAddSection,
  onRemoveSection,
  onScrollToSection,
  onBatchUpdate,
}: FlowPanelProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [showGenerateMenu, setShowGenerateMenu] = useState(false);
  const [showAddSection, setShowAddSection] = useState(false);

  // Individual draft loading states
  const [draftingPurpose, setDraftingPurpose] = useState(false);
  const [draftingContext, setDraftingContext] = useState(false);
  const [draftingThemes, setDraftingThemes] = useState(false);

  // Component order for drag-and-drop
  type FlowComponent = 'purpose' | 'context' | 'themes' | 'notes' | 'sections';
  const [componentOrder, setComponentOrder] = useState<FlowComponent[]>(() => {
    // Try to restore from localStorage
    const saved = localStorage.getItem('flowPanel.componentOrder');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // Ignore parse errors
      }
    }
    return ['purpose', 'context', 'themes', 'notes', 'sections'];
  });

  // Persist component order to localStorage
  useEffect(() => {
    localStorage.setItem('flowPanel.componentOrder', JSON.stringify(componentOrder));
  }, [componentOrder]);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setComponentOrder((items) => {
        const oldIndex = items.indexOf(active.id as FlowComponent);
        const newIndex = items.indexOf(over.id as FlowComponent);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  // Parse the reference for the verse range picker
  const parsedRef = parseReference(reference);
  const passageRange: ParsedReference | null = parsedRef
    ? {
      book: parsedRef.book,
      startChapter: parsedRef.startChapter,
      startVerse: parsedRef.startVerse ?? 1,
      endChapter: parsedRef.endChapter ?? parsedRef.startChapter,
      endVerse: parsedRef.endVerse ?? getVerseCount(parsedRef.book, parsedRef.endChapter ?? parsedRef.startChapter),
    }
    : null;

  // Handle "Generate Flow Only" - generates purpose, context, themes, and sections
  const handleGenerateFlowOnly = async (useNotes: boolean = false) => {
    setIsGenerating(true);
    setGenerateError(null);
    setShowGenerateMenu(false);

    try {
      const userNotes = useNotes ? study.studyNotes : undefined;
      const flow = await generateStudyFlow(reference, passageText, userNotes);

      if (onBatchUpdate) {
        onBatchUpdate({
          purpose: flow.purpose,
          context: flow.context,
          themes: flow.themes,
          sections: flow.sections,
        });
      } else {
        // Fall back to individual updates
        if (flow.purpose) onUpdatePurpose(flow.purpose);
        if (flow.context) onUpdateContext(flow.context);
        if (flow.themes) {
          flow.themes.forEach((theme) => onAddTheme(theme));
        }
        if (flow.sections) {
          flow.sections.forEach((s) => onAddSection(s.passageSection, s.heading));
        }
      }
    } catch (error) {
      console.error('Failed to generate flow:', error);
      setGenerateError(error instanceof Error ? error.message : 'Failed to generate');
    } finally {
      setIsGenerating(false);
    }
  };

  // Draft purpose statement
  const handleDraftPurpose = async () => {
    setDraftingPurpose(true);
    try {
      const purpose = await draftPurposeStatement(reference, passageText);
      onUpdatePurpose(purpose);
    } catch (error) {
      console.error('Failed to draft purpose:', error);
    } finally {
      setDraftingPurpose(false);
    }
  };

  // Draft context
  const handleDraftContext = async () => {
    setDraftingContext(true);
    try {
      const context = await draftHistoricalContext(reference, passageText);
      onUpdateContext(context);
    } catch (error) {
      console.error('Failed to draft context:', error);
    } finally {
      setDraftingContext(false);
    }
  };

  // Draft themes
  const handleDraftThemes = async () => {
    setDraftingThemes(true);
    try {
      const themes = await draftKeyThemes(reference, passageText);
      themes.forEach((theme) => onAddTheme(theme));
    } catch (error) {
      console.error('Failed to draft themes:', error);
    } finally {
      setDraftingThemes(false);
    }
  };

  const hasNotes = Boolean(study.studyNotes?.trim());

  if (isCollapsed) {
    return null;
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header with collapse toggle */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-color)] bg-[var(--bg-elevated)]">
        <div className="flex items-center gap-2">
          <List className="h-4 w-4 text-[var(--color-interpretation)]" />
          <span className="text-sm font-semibold text-[var(--text-primary)]">
            Study Flow
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Generate dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowGenerateMenu(!showGenerateMenu)}
              disabled={isGenerating}
              className="
                flex items-center gap-1.5 px-3 py-1.5
                text-xs font-medium
                text-white
                bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-hover)]
                hover:opacity-90
                rounded-lg
                disabled:opacity-50
                transition-all
              "
            >
              {isGenerating ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Wand2 className="h-3.5 w-3.5" />
              )}
              Generate
              <ChevronDown className="h-3 w-3" />
            </button>

            {showGenerateMenu && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="
                  absolute right-0 top-full mt-1 z-50
                  w-56
                  bg-[var(--bg-elevated)]
                  border border-[var(--border-color)]
                  rounded-lg shadow-lg
                  overflow-hidden
                "
              >
                <button
                  onClick={() => handleGenerateFlowOnly(false)}
                  className="
                    w-full px-3 py-2 text-left text-sm
                    text-[var(--text-primary)]
                    hover:bg-[var(--bg-surface)]
                    transition-colors
                  "
                >
                  <div className="font-medium">Generate Flow</div>
                  <div className="text-xs text-[var(--text-muted)]">
                    Purpose, context, themes, outline
                  </div>
                </button>
                {hasNotes && (
                  <button
                    onClick={() => handleGenerateFlowOnly(true)}
                    className="
                      w-full px-3 py-2 text-left text-sm
                      text-[var(--text-primary)]
                      hover:bg-[var(--bg-surface)]
                      border-t border-[var(--border-color)]
                      transition-colors
                    "
                  >
                    <div className="font-medium flex items-center gap-1.5">
                      <PenLine className="h-3.5 w-3.5 text-[var(--color-interpretation)]" />
                      Generate using my notes
                    </div>
                    <div className="text-xs text-[var(--text-muted)]">
                      Incorporate your notes into the outline
                    </div>
                  </button>
                )}
              </motion.div>
            )}
          </div>

          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="
                p-1.5 rounded-lg
                hover:bg-[var(--bg-surface)]
                text-[var(--text-muted)]
                hover:text-[var(--text-primary)]
                transition-colors
              "
              title="Collapse flow panel"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Error message */}
      {generateError && (
        <div className="mx-4 mt-3 px-3 py-2 text-xs text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-800">
          {generateError}
        </div>
      )}

      {/* Scrollable content with drag-and-drop */}
      <div className="flex-1 overflow-y-auto p-4 pl-8 space-y-4">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={componentOrder}
            strategy={verticalListSortingStrategy}
          >
            {componentOrder.map((componentId) => {
              switch (componentId) {
                case 'purpose':
                  return (
                    <SortableFlowComponent key="purpose" id="purpose">
                      <Card variant="default" className="border-[var(--border-color)]">
                        <CardHeader className="py-3">
                          <CardTitle className="flex items-center gap-2 text-sm">
                            <Target className="h-4 w-4 text-[var(--color-observation)]" />
                            Purpose
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0 pb-3">
                          <EditableTextField
                            value={study.purpose}
                            onChange={onUpdatePurpose}
                            placeholder="What will readers learn from this study?"
                            multiline
                            required
                          />
                          {!study.purpose && (
                            <div className="mt-2">
                              <MagicDraftButton
                                label="Draft"
                                variant="secondary"
                                size="sm"
                                isLoading={draftingPurpose}
                                onDraft={handleDraftPurpose}
                              />
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </SortableFlowComponent>
                  );

                case 'context':
                  return (
                    <SortableFlowComponent key="context" id="context">
                      <Card variant="default" className="border-[var(--border-color)]">
                        <CardHeader className="py-3">
                          <CardTitle className="flex items-center gap-2 text-sm">
                            <Map className="h-4 w-4 text-[var(--color-interpretation)]" />
                            Context
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0 pb-3">
                          <EditableTextField
                            value={study.context}
                            onChange={onUpdateContext}
                            placeholder="Historical and literary background..."
                            multiline
                          />
                          {!study.context && (
                            <div className="mt-2">
                              <MagicDraftButton
                                label="Draft"
                                variant="secondary"
                                size="sm"
                                isLoading={draftingContext}
                                onDraft={handleDraftContext}
                              />
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </SortableFlowComponent>
                  );

                case 'themes':
                  return (
                    <SortableFlowComponent key="themes" id="themes">
                      <Card variant="default" className="border-[var(--border-color)]">
                        <CardHeader className="py-3">
                          <CardTitle className="flex items-center gap-2 text-sm">
                            <Tag className="h-4 w-4 text-[var(--color-accent)]" />
                            Key Themes
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0 pb-3">
                          <EditableThemeList
                            themes={study.key_themes}
                            onUpdate={onUpdateTheme}
                            onRemove={onRemoveTheme}
                            onAdd={onAddTheme}
                            compact
                          />
                          {study.key_themes.length === 0 && (
                            <div className="mt-2">
                              <MagicDraftButton
                                label="Draft Themes"
                                variant="secondary"
                                size="sm"
                                isLoading={draftingThemes}
                                onDraft={handleDraftThemes}
                              />
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </SortableFlowComponent>
                  );

                case 'notes':
                  return (
                    <SortableFlowComponent key="notes" id="notes">
                      <Card variant="default" className="border-[var(--border-color)]">
                        <CardHeader className="py-3">
                          <CardTitle className="flex items-center gap-2 text-sm">
                            <PenLine className="h-4 w-4 text-[var(--color-interpretation)]" />
                            Your Notes & Outline
                            <span className="text-xs font-normal text-[var(--text-muted)]">
                              (optional)
                            </span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0 pb-3">
                          <RichTextEditor
                            value={study.studyNotes || ''}
                            onChange={onUpdateStudyNotes}
                            placeholder="Write your observations, main points, or outline for this passage. These notes can be used to guide AI generation..."
                            minHeight="120px"
                          />
                          {hasNotes && (
                            <p className="mt-1.5 text-xs text-[var(--text-muted)]">
                              Your notes will be available when generating the study flow.
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    </SortableFlowComponent>
                  );

                case 'sections':
                  return (
                    <SortableFlowComponent key="sections" id="sections">
                      <Card variant="default" className="border-[var(--border-color)]">
                        <CardHeader className="py-3">
                          <CardTitle className="flex items-center gap-2 text-sm">
                            <List className="h-4 w-4 text-[var(--color-observation)]" />
                            Sections
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0 pb-3">
                          {study.study_flow.length === 0 ? (
                            <p className="text-xs text-[var(--text-muted)] italic mb-3">
                              No sections yet. Use "Generate Flow" or add sections manually.
                            </p>
                          ) : (
                            <div className="space-y-1 mb-3">
                              {study.study_flow.map((section, index) => (
                                <div
                                  key={section.id}
                                  className="
                                    flex items-start gap-2
                                    px-2 py-1.5 rounded
                                    hover:bg-[var(--bg-surface)]
                                    group
                                  "
                                >
                                  <button
                                    onClick={() => onScrollToSection?.(section.id)}
                                    className="flex-1 text-left"
                                  >
                                    <div className="flex items-start gap-2">
                                      <span className="text-xs text-[var(--text-muted)] font-mono mt-0.5">
                                        {index + 1}.
                                      </span>
                                      <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium text-[var(--text-primary)] truncate">
                                          {section.section_heading}
                                        </div>
                                        <div className="text-xs text-[var(--text-muted)]">
                                          {section.passage_section}
                                        </div>
                                      </div>
                                    </div>
                                  </button>
                                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                      onClick={() => onScrollToSection?.(section.id)}
                                      className="p-1 rounded hover:bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                                      title="Go to section"
                                    >
                                      <ChevronRight className="h-3.5 w-3.5" />
                                    </button>
                                    {study.study_flow.length > 1 && (
                                      <button
                                        onClick={() => {
                                          if (window.confirm('Remove this section?')) {
                                            onRemoveSection(section.id);
                                          }
                                        }}
                                        className="p-1 rounded hover:bg-red-500/10 text-[var(--text-muted)] hover:text-red-500"
                                        title="Remove section"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Add Section */}
                          <AnimatePresence>
                            {showAddSection && passageRange ? (
                              <SectionVerseRangePicker
                                passageRange={passageRange}
                                existingSections={study.study_flow}
                                onAdd={(passageSection, heading) => {
                                  onAddSection(passageSection, heading);
                                  setShowAddSection(false);
                                }}
                                onCancel={() => setShowAddSection(false)}
                              />
                            ) : (
                              <button
                                onClick={() => setShowAddSection(true)}
                                className="
                                  w-full
                                  flex items-center justify-center gap-1.5
                                  px-3 py-2
                                  text-xs font-medium
                                  text-[var(--text-secondary)]
                                  hover:text-[var(--text-primary)]
                                  bg-[var(--bg-surface)]
                                  hover:bg-[var(--bg-elevated)]
                                  border border-dashed border-[var(--border-color)]
                                  hover:border-[var(--color-accent)]
                                  rounded-lg
                                  transition-colors
                                "
                              >
                                <Plus className="h-3.5 w-3.5" />
                                Add Section
                              </button>
                            )}
                          </AnimatePresence>
                        </CardContent>
                      </Card>
                    </SortableFlowComponent>
                  );

                default:
                  return null;
              }
            })}
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}
