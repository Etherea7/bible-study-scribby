import { Link } from 'react-router-dom';
import { Trash2, Download, ArrowLeft, Clock, History } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { useHistory, useDeleteHistory, useExportHistory, useClearHistory } from '../hooks/useHistory';

export function HistoryPage() {
  const { data: history, isLoading, error } = useHistory();
  const deleteMutation = useDeleteHistory();
  const exportMutation = useExportHistory();
  const clearMutation = useClearHistory();

  const handleExport = () => {
    exportMutation.mutate();
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
    <div className="min-h-screen bg-[var(--bg-main)]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-[var(--text-primary)] font-serif">
                Study History
              </h1>
              <p className="text-sm text-[var(--text-muted)]">Your past Bible studies</p>
            </div>
          </div>

          <div className="flex gap-2">
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
                        to={`/?ref=${encodeURIComponent(item.reference)}`}
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
