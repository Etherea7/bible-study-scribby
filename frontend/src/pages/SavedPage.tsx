import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Trash2, Download, Upload, ArrowLeft, BookMarked, Save, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import {
  useSavedStudies,
  useDeleteSavedStudy,
  useExportSavedStudies,
  useClearSavedStudies,
  useImportSavedStudies,
} from '../hooks/useSavedStudies';

interface ImportResult {
  success: boolean;
  imported: number;
  skipped: number;
  errors: Array<{
    index: number;
    reference?: string;
    error: string;
  }>;
}

export function SavedPage() {
  const { data: savedStudies, isLoading, error } = useSavedStudies();
  const deleteMutation = useDeleteSavedStudy();
  const exportMutation = useExportSavedStudies();
  const clearMutation = useClearSavedStudies();
  const importMutation = useImportSavedStudies();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const handleExport = () => {
    exportMutation.mutate();
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImportResult(null);
      importMutation.mutate(file, {
        onSuccess: (result) => {
          setImportResult(result);
          // Clear the file input so the same file can be selected again if needed
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        },
        onError: (err) => {
          setImportResult({
            success: false,
            imported: 0,
            skipped: 0,
            errors: [{ index: -1, error: err.message }],
          });
        },
      });
    }
  };

  const dismissImportResult = () => {
    setImportResult(null);
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to delete all saved studies? This cannot be undone.')) {
      clearMutation.mutate();
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Delete this saved study?')) {
      deleteMutation.mutate(id);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-full">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link to="/" className="btn-back">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-[var(--text-primary)] font-serif">
                Saved Studies
              </h1>
              <p className="text-sm text-[var(--text-muted)]">Your saved Bible studies for export</p>
            </div>
          </div>

          <div className="flex gap-2">
            {/* Hidden file input for import */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />
            <Button
              variant="secondary"
              size="sm"
              onClick={handleImportClick}
              loading={importMutation.isPending}
            >
              <Upload className="h-4 w-4 mr-1.5" />
              Import JSON
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleExport}
              loading={exportMutation.isPending}
              disabled={!savedStudies || savedStudies.length === 0}
            >
              <Download className="h-4 w-4 mr-1.5" />
              Export JSON
            </Button>
            {savedStudies && savedStudies.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                loading={clearMutation.isPending}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                Clear All
              </Button>
            )}
          </div>
        </div>

        {/* Import Result Notification */}
        {importResult && (
          <div className={`mb-6 p-4 rounded-lg border ${importResult.imported > 0
            ? 'bg-green-700 border-green-600 dark:bg-green-900/40 dark:border-green-700'
            : 'bg-red-700 border-red-600 dark:bg-red-900/40 dark:border-red-700'
            }`}>
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                {importResult.imported > 0 ? (
                  <CheckCircle className="h-5 w-5 text-white dark:text-green-300 mt-0.5" />
                ) : (
                  <XCircle className="h-5 w-5 text-white dark:text-red-300 mt-0.5" />
                )}
                <div>
                  <p className={`font-medium ${importResult.imported > 0
                    ? 'text-white dark:text-green-100'
                    : 'text-white dark:text-red-100'
                    }`}>
                    {importResult.imported > 0
                      ? `Import Complete: ${importResult.imported} imported${importResult.skipped > 0 ? `, ${importResult.skipped} skipped` : ''}`
                      : 'Import Failed'
                    }
                  </p>

                  {importResult.imported > 0 && importResult.skipped === 0 && (
                    <p className="text-sm text-green-100 dark:text-green-200 mt-1">
                      All {importResult.imported} {importResult.imported === 1 ? 'study was' : 'studies were'} imported successfully.
                    </p>
                  )}

                  {importResult.errors.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm font-medium text-amber-100 dark:text-amber-200 mb-1">
                        Issues encountered:
                      </p>
                      <ul className="text-sm text-amber-100 dark:text-amber-200 list-disc list-inside space-y-1">
                        {importResult.errors.slice(0, 5).map((err, i) => (
                          <li key={i}>
                            {err.index >= 0 && (
                              <span className="font-mono text-xs mr-1">[{err.index + 1}]</span>
                            )}
                            {err.reference && <strong>"{err.reference}": </strong>}
                            {err.error}
                          </li>
                        ))}
                        {importResult.errors.length > 5 && (
                          <li className="text-amber-200 dark:text-amber-300">
                            ...and {importResult.errors.length - 5} more issues
                          </li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={dismissImportResult}
                className={`text-sm font-medium ${importResult.imported > 0
                  ? 'text-green-100 hover:text-white dark:text-green-300 dark:hover:text-green-100'
                  : 'text-red-100 hover:text-white dark:text-red-300 dark:hover:text-red-100'
                  }`}
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="mb-6 p-4 rounded-lg bg-blue-700 dark:bg-blue-900/40 border border-blue-600 dark:border-blue-700">
          <p className="text-sm text-white dark:text-blue-100 font-medium">
            <strong>Tip:</strong> Export your saved studies as JSON to transfer them to other browsers or devices.
            Use Import to restore previously exported studies.
          </p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <Card className="border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-800">
            <CardContent>
              <p className="text-red-700 dark:text-red-300">
                Error loading saved studies: {error.message}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!isLoading && savedStudies && savedStudies.length === 0 && (
          <Card variant="elevated" className="text-center">
            <CardContent className="py-16">
              <div className="mx-auto w-16 h-16 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center mb-6">
                <BookMarked className="h-8 w-8 text-[var(--text-muted)]" />
              </div>
              <h3 className="text-xl font-semibold text-[var(--text-primary)] font-serif mb-2">
                No Saved Studies
              </h3>
              <p className="text-[var(--text-muted)] mb-6 max-w-sm mx-auto">
                Studies you save will appear here. Click "Save Study" on any study to add it to this list.
              </p>
              <Link to="/">
                <Button>Go to Study</Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Saved Studies List */}
        {savedStudies && savedStudies.length > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center gap-2">
              <Save className="h-5 w-5 text-[var(--color-accent)]" />
              <CardTitle>Saved Studies ({savedStudies.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-[var(--border-color)]">
                {savedStudies.map((item) => (
                  <div
                    key={item.id}
                    className="py-4 flex items-center justify-between group hover:bg-[var(--bg-elevated)]/50 -mx-6 px-6 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[var(--text-primary)] font-serif truncate">
                        {item.reference}
                      </p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <p className="text-sm text-[var(--text-muted)]">
                          Saved {formatDate(item.savedAt)}
                        </p>
                        {item.provider && (
                          <span className="text-xs bg-[var(--bg-elevated)] text-[var(--text-secondary)] px-2 py-0.5 rounded-full border border-[var(--border-color)]">
                            {item.provider}
                          </span>
                        )}
                      </div>
                      {item.study.purpose && (
                        <p className="text-sm text-[var(--text-secondary)] mt-1 truncate">
                          {item.study.purpose}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2 opacity-70 group-hover:opacity-100 transition-opacity ml-4">
                      <Link
                        to={`/editor?saved=${encodeURIComponent(item.id)}`}
                      >
                        <Button variant="secondary" size="sm">
                          View
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(item.id)}
                        loading={deleteMutation.isPending}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
