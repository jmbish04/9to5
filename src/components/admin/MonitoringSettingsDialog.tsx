import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Settings, Loader2 } from 'lucide-react';
import { updateJobMonitoring } from '@/lib/api';

interface Job {
  id: string;
  daily_monitoring_enabled?: boolean;
  monitoring_frequency_hours?: number;
}

interface MonitoringSettingsDialogProps {
  job: Job;
  onUpdate?: (job: Job) => void;
  trigger?: React.ReactNode;
}

export function MonitoringSettingsDialog({ job, onUpdate, trigger }: MonitoringSettingsDialogProps) {
  const [open, setOpen] = useState(false);
  const [enabled, setEnabled] = useState(job.daily_monitoring_enabled ?? false);
  const [frequency, setFrequency] = useState(job.monitoring_frequency_hours ?? 24);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (open) {
      setEnabled(job.daily_monitoring_enabled ?? false);
      setFrequency(job.monitoring_frequency_hours ?? 24);
      setError('');
    }
  }, [open, job]);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    
    try {
      const updatedJob = await updateJobMonitoring(job.id, {
        daily_monitoring_enabled: enabled,
        monitoring_frequency_hours: frequency
      });
      
      onUpdate?.(updatedJob);
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update monitoring settings');
    } finally {
      setSaving(false);
    }
  };

  const frequencyOptions = [
    { value: 1, label: 'Every hour' },
    { value: 2, label: 'Every 2 hours' },
    { value: 4, label: 'Every 4 hours' },
    { value: 6, label: 'Every 6 hours' },
    { value: 12, label: 'Every 12 hours' },
    { value: 24, label: 'Daily' },
    { value: 48, label: 'Every 2 days' },
    { value: 168, label: 'Weekly' }
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <Settings className="w-4 h-4" />
            Settings
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Monitoring Settings</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="monitoring-enabled">Daily Monitoring</Label>
              <div className="text-sm text-gray-600">
                Enable automatic job posting monitoring
              </div>
            </div>
            <Switch
              id="monitoring-enabled"
              checked={enabled}
              onCheckedChange={setEnabled}
            />
          </div>

          {enabled && (
            <div className="space-y-2">
              <Label htmlFor="frequency">Check Frequency</Label>
              <select
                id="frequency"
                value={frequency}
                onChange={(e) => setFrequency(Number(e.target.value))}
                className="w-full p-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {frequencyOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label} ({option.value}h)
                  </option>
                ))}
              </select>
              <div className="text-xs text-gray-500">
                How often should we check for changes to this job posting
              </div>
            </div>
          )}

          {error && (
            <div className="text-red-600 text-sm p-3 border border-red-200 rounded-md bg-red-50">
              {error}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Settings'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}