import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';

interface QueuedJob {
  id: string;
  title: string;
  company: string;
  location: string;
  url: string;
  employment_type: string;
  last_crawled_at: string;
  monitoring_priority: number;
  days_since_last_check: number;
}

interface MonitoringQueueResponse {
  total_jobs: number;
  returned_jobs: number;
  jobs: QueuedJob[];
}

interface MonitoringQueueProps {
  apiToken?: string;
  refreshTrigger?: number;
  limit?: number;
}

export default function MonitoringQueue({ apiToken, refreshTrigger, limit = 20 }: MonitoringQueueProps) {
  const [queue, setQueue] = useState<MonitoringQueueResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchQueue = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (limit) params.set('limit', String(limit));

      const response = await fetch(`/api/jobs/monitoring-queue?${params.toString()}`, {
        headers: {
          ...(apiToken ? { 'Authorization': `Bearer ${apiToken}` } : {})
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch monitoring queue: ${response.status} ${response.statusText}`);
      }

      const result: MonitoringQueueResponse = await response.json();
      setQueue(result);
    } catch (error) {
      console.error('Failed to fetch monitoring queue:', error);
      setError(error instanceof Error ? error.message : 'Failed to load queue');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, [refreshTrigger, limit]);

  const getPriorityBadge = (priority: number) => {
    if (priority >= 8) return <Badge variant="destructive" className="text-xs">High</Badge>;
    if (priority >= 5) return <Badge variant="default" className="text-xs">Medium</Badge>;
    return <Badge variant="secondary" className="text-xs">Low</Badge>;
  };

  const formatLastChecked = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffHours / 24);

      if (diffDays > 0) return `${diffDays}d ago`;
      if (diffHours > 0) return `${diffHours}h ago`;
      return 'Recently';
    } catch {
      return 'Unknown';
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Monitoring Queue</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchQueue}
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : 'Refresh'}
          </Button>
        </div>
        {queue && (
          <div className="text-sm text-muted-foreground">
            {queue.total_jobs} jobs need monitoring, showing {queue.returned_jobs}
          </div>
        )}
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="text-sm text-red-600 p-3 bg-red-50 border border-red-200 rounded">
            <div className="font-medium">Failed to load queue</div>
            <div>{error}</div>
            <Button variant="outline" size="sm" className="mt-2" onClick={fetchQueue}>
              Try Again
            </Button>
          </div>
        ) : isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : queue?.jobs?.length ? (
          <div className="space-y-3">
            {queue.jobs.map((job) => (
              <div key={job.id} className="border rounded-lg p-3 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm truncate">
                        <a 
                          href={`/admin/jobs/${encodeURIComponent(job.id)}`}
                          className="text-blue-600 hover:text-blue-900 hover:underline"
                        >
                          {job.title || 'Untitled Job'}
                        </a>
                      </h4>
                      {getPriorityBadge(job.monitoring_priority)}
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>{job.company || '—'} • {job.location || '—'}</div>
                      <div className="flex items-center gap-3">
                        <span>Last checked: {formatLastChecked(job.last_crawled_at)}</span>
                        {job.days_since_last_check > 0 && (
                          <span>({job.days_since_last_check} days ago)</span>
                        )}
                        {job.employment_type && (
                          <Badge variant="outline" className="text-xs">
                            {job.employment_type}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex-shrink-0 ml-2">
                    <a
                      href={job.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:text-blue-900"
                    >
                      View Job ↗
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-6">
            <div className="text-sm">No jobs in monitoring queue</div>
            <div className="text-xs mt-1">All jobs are up to date</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}