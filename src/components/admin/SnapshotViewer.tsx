import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, FileText, Image, Download } from 'lucide-react';

interface SnapshotViewerProps {
  jobId: string;
  snapshotId: string;
  contentType: string;
  triggerText?: string;
}

export function SnapshotViewer({ jobId, snapshotId, contentType, triggerText = 'View Snapshot' }: SnapshotViewerProps) {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [open, setOpen] = useState(false);

  const isInlineSupported = contentType === 'text/html' || contentType === 'text/markdown';
  const isPdf = contentType === 'application/pdf';
  const isImage = contentType === 'image/png' || contentType === 'image/jpeg';

  const loadContent = async () => {
    if (!isInlineSupported) return;
    
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/jobs/${encodeURIComponent(jobId)}/snapshots/${encodeURIComponent(snapshotId)}/content`);
      if (!response.ok) {
        throw new Error(`Failed to load content: ${response.statusText}`);
      }
      const text = await response.text();
      setContent(text);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load content');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenNewTab = () => {
    const url = `/api/jobs/${encodeURIComponent(jobId)}/snapshots/${encodeURIComponent(snapshotId)}/content`;
    window.open(url, '_blank');
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-red-600 p-4 border border-red-200 rounded-md bg-red-50">
          <p>Error loading content: {error}</p>
        </div>
      );
    }

    if (contentType === 'text/html') {
      return (
        <div 
          className="prose prose-sm max-w-none p-4 border border-gray-200 rounded-md bg-gray-50 max-h-96 overflow-auto"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      );
    }

    if (contentType === 'text/markdown') {
      return (
        <pre className="whitespace-pre-wrap text-sm p-4 border border-gray-200 rounded-md bg-gray-50 max-h-96 overflow-auto">
          {content}
        </pre>
      );
    }

    return null;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          {triggerText}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Snapshot Viewer</DialogTitle>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {contentType === 'text/html' && <><FileText className="w-3 h-3 mr-1" />HTML</>}
                {contentType === 'text/markdown' && <><FileText className="w-3 h-3 mr-1" />MD</>}
                {contentType === 'application/pdf' && <><Download className="w-3 h-3 mr-1" />PDF</>}
                {(contentType === 'image/png' || contentType === 'image/jpeg') && <><Image className="w-3 h-3 mr-1" />IMG</>}
              </Badge>
              {(isPdf || isImage) && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleOpenNewTab}
                  className="gap-2"
                >
                  <ExternalLink className="w-3 h-3" />
                  Open in New Tab
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden">
          {isInlineSupported ? (
            <div className="h-full overflow-auto">
              {open && !content && !loading && loadContent()}
              {renderContent()}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              {isPdf && (
                <>
                  <Download className="w-12 h-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">PDF Document</h3>
                  <p className="text-gray-600 mb-4">PDF files will open in a new tab for viewing.</p>
                </>
              )}
              {isImage && (
                <>
                  <Image className="w-12 h-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Image Snapshot</h3>
                  <p className="text-gray-600 mb-4">Image files will open in a new tab for viewing.</p>
                </>
              )}
              <Button onClick={handleOpenNewTab} className="gap-2">
                <ExternalLink className="w-4 h-4" />
                Open in New Tab
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}