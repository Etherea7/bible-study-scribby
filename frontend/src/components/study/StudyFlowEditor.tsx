/**
 * StudyFlowEditor - Displays and allows editing of study flow sections
 *
 * Shows each passage section with its purpose/focus, allowing users to:
 * - View the structure of the study
 * - Edit section purposes (for future AI regeneration with context)
 * - See question counts per section
 */

import { useState } from 'react';
import { ListOrdered, ChevronDown, ChevronRight, Edit2, Check, X, Tag, FileText, BookMarked } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { EditableThemeList } from './EditableThemeList';
import { EditableTextField } from '../ui/EditableTextField';
import { EditableCrossReferences } from './EditableCrossReferences';
import type { StudyFlowItem, StudyFlowContext, EditableCrossReference, EditableStudyFlowSection } from '../../types';

interface StudyFlowEditorProps {
  studyFlow: StudyFlowItem[] | EditableStudyFlowSection[];
  flowContext?: StudyFlowContext;
  onFlowContextChange?: (context: StudyFlowContext) => void;
  editable?: boolean;

  // New props for moved components
  keyThemes?: string[];
  summary?: string;
  crossReferences?: EditableCrossReference[];
  passageContext?: string; // For AI context

  // Handlers
  onUpdateSummary?: (value: string) => void;
  onAddTheme?: (theme: string) => void;
  onUpdateTheme?: (index: number, value: string) => void;
  onRemoveTheme?: (index: number) => void;
  onAddCrossReference?: (reference: string, note: string) => void;
  onUpdateCrossReference?: (id: string, updates: Partial<EditableCrossReference>) => void;
  onRemoveCrossReference?: (id: string) => void;
}

export function StudyFlowEditor({
  studyFlow,
  flowContext,
  onFlowContextChange,
  editable = false,
  keyThemes = [],
  summary = '',
  crossReferences = [],
  passageContext,
  onUpdateSummary,
  onAddTheme,
  onUpdateTheme,
  onRemoveTheme,
  onAddCrossReference,
  onUpdateCrossReference,
  onRemoveCrossReference,
}: StudyFlowEditorProps) {
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set([0]));
  const [editingSection, setEditingSection] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');

  const toggleSection = (index: number) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedSections(newExpanded);
  };

  const startEditing = (index: number, currentPurpose: string) => {
    setEditingSection(index);
    setEditValue(currentPurpose);
  };

  const saveEdit = (index: number) => {
    if (onFlowContextChange && flowContext) {
      const newContext = { ...flowContext };
      if (newContext.sectionPurposes[index]) {
        newContext.sectionPurposes[index].purpose = editValue;
        onFlowContextChange(newContext);
      }
    }
    setEditingSection(null);
    setEditValue('');
  };

  const cancelEdit = () => {
    setEditingSection(null);
    setEditValue('');
  };

  // Get purpose for a section from flow context, or generate a default
  const getSectionPurpose = (_item: StudyFlowItem | EditableStudyFlowSection, index: number): string => {
    if (flowContext?.sectionPurposes[index]?.purpose) {
      return flowContext.sectionPurposes[index].purpose;
    }
    // Default purpose based on section heading
    return `Study the passage and understand its meaning`;
  };

  return (
    <div className="space-y-6">
      {/* 1. Key Themes */}
      {editable && onAddTheme && onUpdateTheme && onRemoveTheme && (
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <Tag className="h-5 w-5 text-[var(--color-interpretation)]" />
            <CardTitle>Key Themes</CardTitle>
          </CardHeader>
          <CardContent>
            <EditableThemeList
              themes={keyThemes}
              onUpdate={onUpdateTheme}
              onRemove={onRemoveTheme}
              onAdd={onAddTheme}
            />
          </CardContent>
        </Card>
      )}

      {/* 2. Summary */}
      {editable && onUpdateSummary && (
        <Card variant="elevated">
          <CardHeader className="flex flex-row items-center gap-2">
            <FileText className="h-5 w-5 text-[var(--text-muted)]" />
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <EditableTextField
              value={summary}
              onChange={onUpdateSummary}
              multiline
              displayClassName="text-[var(--text-secondary)] leading-relaxed"
              placeholder="Enter a summary of the passage..."
              enableAiToolbar
              context={passageContext}
            />
          </CardContent>
        </Card>
      )}

      {/* 3. Study Flow */}
      <Card className="h-full">
        <CardHeader>
          <CardTitle as="h3" className="flex items-center gap-2 text-lg">
            <ListOrdered className="h-5 w-5 text-[var(--color-interpretation)]" />
            <StudyFlowTitle editable={editable} />
          </CardTitle>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            {editable
              ? 'Edit section purposes to guide question generation'
              : 'Overview of the study structure'}
          </p>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            {studyFlow.map((item, index) => {
              const isExpanded = expandedSections.has(index);
              const isEditing = editingSection === index;
              const purpose = getSectionPurpose(item, index);

              return (
                <div
                  key={index}
                  className="border border-[var(--border-color)] rounded-lg overflow-hidden"
                >
                  {/* Section Header */}
                  <button
                    onClick={() => toggleSection(index)}
                    className="
                      w-full flex items-center justify-between
                      px-4 py-3
                      bg-[var(--bg-elevated)]
                      hover:bg-[var(--bg-surface)]
                      transition-colors
                      text-left
                    "
                  >
                    <div className="flex items-center gap-3">
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-[var(--text-muted)]" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-[var(--text-muted)]" />
                      )}
                      <div>
                        <span className="text-xs font-medium text-[var(--color-interpretation)] uppercase tracking-wide">
                          Section {index + 1}
                        </span>
                        <p className="font-medium text-[var(--text-primary)] font-serif">
                          {item.passage_section}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-[var(--text-muted)] bg-[var(--bg-main)] px-2 py-1 rounded">
                      {'questions' in item ? item.questions.length : 0} questions
                    </span>
                  </button>

                  {/* Section Details */}
                  {isExpanded && (
                    <div className="px-4 py-3 border-t border-[var(--border-color)] bg-[var(--bg-surface)]">
                      <p className="text-sm font-medium text-[var(--text-secondary)] mb-2">
                        {item.section_heading}
                      </p>

                      {/* Purpose/Focus */}
                      <div className="mt-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">
                            Section Purpose
                          </span>
                          {editable && !isEditing && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                startEditing(index, purpose);
                              }}
                              className="text-xs text-[var(--color-observation)] hover:text-[var(--color-observation-dark)] flex items-center gap-1"
                            >
                              <Edit2 className="h-3 w-3" />
                              Edit
                            </button>
                          )}
                        </div>

                        {isEditing ? (
                          <div className="space-y-2">
                            <textarea
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="
                                w-full px-3 py-2
                                text-sm
                                bg-[var(--bg-elevated)]
                                border border-[var(--color-observation)]
                                rounded-lg
                                focus:ring-2 focus:ring-[var(--color-observation)]/30
                                resize-none
                              "
                              rows={2}
                              placeholder="Describe the purpose of this section..."
                              autoFocus
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => saveEdit(index)}
                                className="text-xs px-2 py-1 bg-[var(--color-observation)] text-white rounded flex items-center gap-1"
                              >
                                <Check className="h-3 w-3" />
                                Save
                              </button>
                              <button
                                onClick={cancelEdit}
                                className="text-xs px-2 py-1 bg-[var(--bg-elevated)] text-[var(--text-secondary)] rounded flex items-center gap-1"
                              >
                                <X className="h-3 w-3" />
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-[var(--text-secondary)] italic">
                            {purpose}
                          </p>
                        )}
                      </div>

                      {/* Connection to next section */}
                      {item.connection && index < studyFlow.length - 1 && (
                        <div className="mt-3 pt-3 border-t border-[var(--border-color)]/50">
                          <span className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">
                            Connection
                          </span>
                          <p className="text-sm text-[var(--text-muted)] mt-1">
                            {item.connection}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {studyFlow.length === 0 && (
            <div className="text-center py-8 text-[var(--text-muted)]">
              <ListOrdered className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Generate a study to see the flow structure</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 4. Cross References */}
      {editable && onAddCrossReference && onUpdateCrossReference && onRemoveCrossReference && (
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <BookMarked className="h-5 w-5 text-[var(--color-interpretation)]" />
            <CardTitle>Cross References</CardTitle>
          </CardHeader>
          <CardContent>
            <EditableCrossReferences
              references={crossReferences}
              onUpdate={onUpdateCrossReference}
              onRemove={onRemoveCrossReference}
              onAdd={onAddCrossReference}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StudyFlowTitle({ editable }: { editable: boolean }) {
  return <>{editable ? 'Study Flow & Structure' : 'Study Flow'}</>;
}
