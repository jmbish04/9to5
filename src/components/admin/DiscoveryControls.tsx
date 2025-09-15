import { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';

interface DiscoveryRunResponse {
  run_id: string;
  status: string;
}

interface MonitoringRunResponse {
  run_id: string;
  status: string;
}

interface DiscoveryControlsProps {
  apiToken?: string;
  onRunComplete?: (result: any) => void;
}

export default function DiscoveryControls({ apiToken, onRunComplete }: DiscoveryControlsProps) {
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [lastDiscoveryResult, setLastDiscoveryResult] = useState<DiscoveryRunResponse | null>(null);
  const [lastMonitoringResult, setLastMonitoringResult] = useState<MonitoringRunResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runDiscovery = async () => {
    setIsDiscovering(true);
    setError(null);
    setLastDiscoveryResult(null);

    try {
      const response = await fetch('/api/runs/discovery', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiToken ? { 'Authorization': `Bearer ${apiToken}` } : {})
        },
        body: JSON.stringify({})
      });

      if (!response.ok) {
        throw new Error(`Failed to start discovery: ${response.status} ${response.statusText}`);
      }

      const result: DiscoveryRunResponse = await response.json();
      setLastDiscoveryResult(result);
      
      if (onRunComplete) {
        onRunComplete(result);
      }
    } catch (error) {
      console.error('Failed to run discovery:', error);
      setError(error instanceof Error ? error.message : 'Failed to start discovery');
    } finally {
      setIsDiscovering(false);
    }
  };

  const runMonitoring = async () => {
    setIsMonitoring(true);
    setError(null);
    setLastMonitoringResult(null);

    try {
      const response = await fetch('/api/runs/monitor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiToken ? { 'Authorization': `Bearer ${apiToken}` } : {})
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to start monitoring: ${response.status} ${response.statusText}`);
      }

      const result: MonitoringRunResponse = await response.json();
      setLastMonitoringResult(result);
      
      if (onRunComplete) {
        onRunComplete(result);
      }
    } catch (error) {
      console.error('Failed to run monitoring:', error);
      setError(error instanceof Error ? error.message : 'Failed to start monitoring');
    } finally {
      setIsMonitoring(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Discovery & Monitoring Controls</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Discovery Controls */}
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <h4 className="font-medium text-sm">Job Discovery</h4>
              <p className="text-xs text-muted-foreground">Find new job opportunities</p>
            </div>
            <Button 
              onClick={runDiscovery}
              disabled={isDiscovering}
              size="sm"
            >
              {isDiscovering ? 'Running...' : 'Start Discovery'}
            </Button>
          </div>

          {/* Monitoring Controls */}
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <h4 className="font-medium text-sm">Job Monitoring</h4>
              <p className="text-xs text-muted-foreground">Check existing jobs for changes</p>
            </div>
            <Button 
              onClick={runMonitoring}
              disabled={isMonitoring}
              size="sm"
              variant="secondary"
            >
              {isMonitoring ? 'Running...' : 'Start Monitoring'}
            </Button>
          </div>

          {/* Results Display */}
          {(lastDiscoveryResult || lastMonitoringResult || error) && (
            <div className="space-y-2">
              {error && (
                <div className="text-xs p-2 rounded border bg-red-50 border-red-200 text-red-700">
                  <div className="font-medium">Error</div>
                  <div>{error}</div>
                </div>
              )}
              
              {lastDiscoveryResult && (
                <div className="text-xs p-2 rounded border bg-blue-50 border-blue-200 text-blue-700">
                  <div className="font-medium">Discovery Started</div>
                  <div>Run ID: {lastDiscoveryResult.run_id}</div>
                  <div>Status: <Badge variant="secondary" className="text-xs">{lastDiscoveryResult.status}</Badge></div>
                </div>
              )}
              
              {lastMonitoringResult && (
                <div className="text-xs p-2 rounded border bg-green-50 border-green-200 text-green-700">
                  <div className="font-medium">Monitoring Started</div>
                  <div>Run ID: {lastMonitoringResult.run_id}</div>
                  <div>Status: <Badge variant="secondary" className="text-xs">{lastMonitoringResult.status}</Badge></div>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}