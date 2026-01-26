import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Trash2, Download, Upload, ArrowLeft, Clock, History, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { useHistory, useDeleteHistory, useExportHistory, useClearHistory, useImportHistory } from '../hooks/useHistory';
import type { ImportResult } from '../types';

export function HistoryPage() {
  const { data: history, isLoading, error } = useHistory();
  const deleteMutation = useDeleteHistory();
  const exportMutation = useExportHistory();
  const clearMutation = useClearHistory();
  const importMutation = useImportHistory();

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
            imported: { history: 0, passages: 0, studies: 0 },
            errors: [err.message],
          });
        },
      });
    }
  };

  const dismissImportResult = () => {
    setImportResult(null);
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear all history? This cannot be undone.')) {
      clearMutation.mutate();
    }
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Delete this history item?')) {
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
    <div className="min-h-screen bg-[var(--bg-main)] parchment-bg">
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link to="/" className="btn-back">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-[var(--text-primary)] font-serif">
                Study History
              </h1>
              <p className="text-sm text-[var(--text-muted)]">Your past Bible studies</p>
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
            >
              <Download className="h-4 w-4 mr-1.5" />
              Export JSON
            </Button>
            {history && history.length > 0 && (
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
          <div className={`mb-6 p-4 rounded-lg border ${
            importResult.success
              ? 'bg-green-50 border-green-200'
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                {importResult.success ? (
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                )}
                <div>
                  <p className={`font-medium ${
                    importResult.success ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {importResult.success ? 'Import Successful' : 'Import Failed'}
                  </p>
                  {importResult.success && (
                    <p className="text-sm text-green-700 mt-1">
                      Imported {importResult.imported.history} history items,{' '}
                      {importResult.imported.passages} passages,{' '}
                      {importResult.imported.studies} studies
                    </p>
                  )}
                  {importResult.errors && importResult.errors.length > 0 && (
                    <ul className="text-sm text-red-700 mt-1 list-disc list-inside">
                      {importResult.errors.slice(0, 5).map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                      {importResult.errors.length > 5 && (
                        <li>...and {importResult.errors.length - 5} more errors</li>
                      )}
                    </ul>
                  )}
                </div>
              </div>
              <button
                onClick={dismissImportResult}
                className={`text-sm ${
                  importResult.success
                    ? 'text-green-600 hover:text-green-800'
                    : 'text-red-600 hover:text-red-800'
                }`}
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <Card className="border-red-300 bg-red-50">
            <CardContent>
              <p className="text-red-700">
                Error loading history: {error.message}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!isLoading && history && history.length === 0 && (
          <Card variant="elevated" className="text-center">
            <CardContent className="py-16">
              <div className="mx-auto w-16 h-16 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center mb-6">
                <Clock className="h-8 w-8 text-[var(--text-muted)]" />
              </div>
              <h3 className="text-xl font-semibold text-[var(--text-primary)] font-serif mb-2">
                No Studies Yet
              </h3>
              <p className="text-[var(--text-muted)] mb-6 max-w-sm mx-auto">
                Your Bible study history will appear here once you generate your first study guide.
              </p>
              <Link to="/">
                <Button>Generate Your First Study</Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* History List */}
        {history && history.length > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center gap-2">
              <History className="h-5 w-5 text-[var(--color-observation)]" />
              <CardTitle>Recent Studies ({history.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-[var(--border-color)]">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className="py-4 flex items-center justify-between group hover:bg-[var(--bg-elevated)]/50 -mx-6 px-6 transition-colors"
                  >
                    <div>
                      <p className="font-medium text-[var(--text-primary)] font-serif">
                        {item.reference}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-sm text-[var(--text-muted)]">
                          {formatDate(item.timestamp)}
                        </p>
                        {item.provider && (
                          <span className="text-xs bg-[var(--bg-elevated)] text-[var(--text-secondary)] px-2 py-0.5 rounded-full border border-[var(--border-color)]">
                            {item.provider}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 opacity-70 group-hover:opacity-100 transition-opacity">
                      <Link
                        to={`/editor?ref=${encodeURIComponent(item.reference)}`}
                      >
                        <Button variant="secondary" size="sm">
                          View
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => item.id && handleDelete(item.id)}
                        loading={deleteMutation.isPending}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
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
