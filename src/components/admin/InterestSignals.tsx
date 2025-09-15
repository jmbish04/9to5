import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

interface InterestSignal {
  jobId: string;
  signal: 'interested' | 'not_now' | null;
  timestamp: string;
}

interface InterestSignalsProps {
  jobId: string;
  className?: string;
}

// Client-only storage for interest signals
// In a real implementation, this could sync to a backend later
const STORAGE_KEY = 'job_interest_signals';

function getStoredSignals(): Record<string, InterestSignal> {
  if (typeof window === 'undefined') return {};
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function storeSignal(jobId: string, signal: 'interested' | 'not_now' | null) {
  if (typeof window === 'undefined') return;
  
  try {
    const signals = getStoredSignals();
    
    if (signal === null) {
      delete signals[jobId];
    } else {
      signals[jobId] = {
        jobId,
        signal,
        timestamp: new Date().toISOString()
      };
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(signals));
    
    // Dispatch custom event for other components to listen to
    window.dispatchEvent(new CustomEvent('interestSignalChanged', {
      detail: { jobId, signal }
    }));
  } catch (error) {
    console.error('Failed to store interest signal:', error);
  }
}

export default function InterestSignals({ jobId, className = '' }: InterestSignalsProps) {
  const [currentSignal, setCurrentSignal] = useState<'interested' | 'not_now' | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Load initial signal from storage
    const signals = getStoredSignals();
    const signal = signals[jobId];
    setCurrentSignal(signal?.signal || null);

    // Listen for changes from other instances
    const handleSignalChange = (event: CustomEvent) => {
      if (event.detail.jobId === jobId) {
        setCurrentSignal(event.detail.signal);
      }
    };

    window.addEventListener('interestSignalChanged', handleSignalChange as EventListener);
    
    return () => {
      window.removeEventListener('interestSignalChanged', handleSignalChange as EventListener);
    };
  }, [jobId]);

  const handleSignal = async (signal: 'interested' | 'not_now' | null) => {
    setIsLoading(true);
    
    try {
      // Store locally
      storeSignal(jobId, signal);
      setCurrentSignal(signal);
      
      // TODO: Future sync to backend
      // await syncToBackend(jobId, signal);
      
    } catch (error) {
      console.error('Failed to update interest signal:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getSignalBadge = () => {
    switch (currentSignal) {
      case 'interested':
        return <Badge variant="default" className="text-xs bg-green-100 text-green-800">Interested</Badge>;
      case 'not_now':
        return <Badge variant="secondary" className="text-xs">Not Now</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {currentSignal ? (
        <div className="flex items-center gap-2">
          {getSignalBadge()}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleSignal(null)}
            disabled={isLoading}
            className="h-6 px-2 text-xs"
          >
            Clear
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSignal('interested')}
            disabled={isLoading}
            className="h-6 px-2 text-xs"
          >
            👍 Interested
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSignal('not_now')}
            disabled={isLoading}
            className="h-6 px-2 text-xs"
          >
            ⏭️ Not Now
          </Button>
        </div>
      )}
    </div>
  );
}

// Hook to get all stored interest signals
export function useInterestSignals() {
  const [signals, setSignals] = useState<Record<string, InterestSignal>>({});

  useEffect(() => {
    const loadSignals = () => {
      setSignals(getStoredSignals());
    };

    loadSignals();

    const handleSignalChange = () => {
      loadSignals();
    };

    window.addEventListener('interestSignalChanged', handleSignalChange);
    
    return () => {
      window.removeEventListener('interestSignalChanged', handleSignalChange);
    };
  }, []);

  return signals;
}

// Helper function to get interest counts
export function getInterestCounts(signals: Record<string, InterestSignal>) {
  const counts = {
    interested: 0,
    not_now: 0,
    total: 0
  };

  Object.values(signals).forEach(signal => {
    counts.total++;
    if (signal.signal === 'interested') counts.interested++;
    if (signal.signal === 'not_now') counts.not_now++;
  });

  return counts;
}