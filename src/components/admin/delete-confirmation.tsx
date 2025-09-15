import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { deleteAgent, deleteTask, deleteWorkflow } from "@/lib/api";

interface DeleteConfirmationProps {
  apiToken: string;
  type: 'agent' | 'task' | 'workflow';
  id: string;
  name: string;
  onSuccess?: () => void;
}

export function DeleteConfirmationButton({ apiToken, type, id, name, onSuccess }: DeleteConfirmationProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      const url = new URL(window.location.href);
      
      switch (type) {
        case 'agent':
          await deleteAgent(url.origin, apiToken, id);
          break;
        case 'task':
          await deleteTask(url.origin, apiToken, id);
          break;
        case 'workflow':
          await deleteWorkflow(url.origin, apiToken, id);
          break;
      }
      
      setOpen(false);
      onSuccess?.();
      window.location.reload(); // Simple refresh for now
    } catch (error) {
      console.error(`Failed to delete ${type}:`, error);
      // In a real app, you'd show a proper error message
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Trash2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete {type.charAt(0).toUpperCase() + type.slice(1)}</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete "{name}"? This action cannot be undone.
            {type === 'agent' && " Any tasks using this agent will be affected."}
            {type === 'task' && " Any workflows using this task will be affected."}
            {type === 'workflow' && " All execution history will be lost."}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={loading}>
            {loading ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}