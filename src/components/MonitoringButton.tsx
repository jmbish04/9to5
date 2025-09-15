import { useState } from 'react';
import { Button } from './ui/button';

interface DailyRunResponse {
  run_id: string;
  started_at: string;
  completed_at: string;
  jobs_checked: number;
  jobs_updated: number;
  errors_encountered: number;
  total_jobs_eligible: number;
  next_run_needed: boolean;
  error?: {
    code: string;
    message: string;
  };
}

interface MonitoringButtonProps {
  apiToken?: string;
  onRunComplete?: (result: DailyRunResponse) => void;
}

export default function MonitoringButton({ apiToken, onRunComplete }: MonitoringButtonProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [lastResult, setLastResult] = useState<DailyRunResponse | null>(null);

  const runDailyMonitoring = async () => {
    setIsRunning(true);
    setLastResult(null);

    try {
      const response = await fetch('/api/monitoring/daily-run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiToken ? { 'Authorization': `Bearer ${apiToken}` } : {})
        },
      });

      const result: DailyRunResponse = await response.json();
      setLastResult(result);
      
      if (onRunComplete) {
        onRunComplete(result);
      }

      // Refresh the page after a successful run to show updated data
      if (response.ok && !result.error) {
        setTimeout(() => window.location.reload(), 2000);
      }
    } catch (error) {
      console.error('Failed to run daily monitoring:', error);
      setLastResult({
        run_id: `error-${Date.now()}`,
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        jobs_checked: 0,
        jobs_updated: 0,
        errors_encountered: 1,
        total_jobs_eligible: 0,
        next_run_needed: false,
        error: {
          code: 'network_error',
          message: 'Failed to connect to monitoring service'
        }
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-3">
      <Button 
        onClick={runDailyMonitoring}
        disabled={isRunning}
        className={isRunning ? 'opacity-50 cursor-not-allowed' : ''}
      >
        {isRunning ? 'Running Monitoring...' : 'Run Daily Monitoring'}
      </Button>
      
      {lastResult && (
        <div className={`text-xs p-2 rounded border ${
          lastResult.error ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'
        }`}>
          {lastResult.error ? (
            <div>
              <div className="font-medium">Error: {lastResult.error.message}</div>
            </div>
          ) : (
            <div>
              <div className="font-medium">Monitoring run completed!</div>
              <div>Jobs checked: {lastResult.jobs_checked}</div>
              <div>Jobs updated: {lastResult.jobs_updated}</div>
              {lastResult.errors_encountered > 0 && (
                <div className="text-yellow-600">Errors: {lastResult.errors_encountered}</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}