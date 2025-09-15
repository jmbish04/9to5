import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Edit2, X, GripVertical, ArrowUp, ArrowDown } from "lucide-react";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { createWorkflow, updateWorkflow, listTasks } from "@/lib/api";
import * as z from "zod";
import type { components } from "@/lib/types/openapi";

type WorkflowConfig = components['schemas']['WorkflowConfig'];
type TaskConfig = components['schemas']['TaskConfig'];

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  task_sequence: z.array(z.string()).min(1, "At least one task is required"),
  enabled: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

interface WorkflowFormProps {
  apiToken: string;
  workflow?: WorkflowConfig;
  onSuccess?: () => void;
}

export function CreateWorkflowButton({ apiToken, onSuccess }: { apiToken: string; onSuccess?: () => void }) {
  return <WorkflowForm apiToken={apiToken} onSuccess={onSuccess} />;
}

export function EditWorkflowButton({ apiToken, workflow, onSuccess }: { apiToken: string; workflow: WorkflowConfig; onSuccess?: () => void }) {
  return <WorkflowForm apiToken={apiToken} workflow={workflow} onSuccess={onSuccess} />;
}

function WorkflowForm({ apiToken, workflow, onSuccess }: WorkflowFormProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState<TaskConfig[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [availableTasks, setAvailableTasks] = useState<TaskConfig[]>([]);
  const isEdit = !!workflow;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: workflow?.name || "",
      description: workflow?.description || "",
      task_sequence: workflow?.task_sequence || [],
      enabled: workflow?.enabled !== false,
    },
  });

  const watchedTaskSequence = form.watch("task_sequence");

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const url = new URL(window.location.href);
        const taskList = await listTasks(url.origin, apiToken);
        setTasks(taskList);
        
        // Filter out tasks already in the sequence for the available list
        const selectedTaskIds = new Set(watchedTaskSequence);
        setAvailableTasks(taskList.filter(task => task.enabled && !selectedTaskIds.has(task.id)));
      } catch (error) {
        console.error('Failed to load tasks:', error);
      } finally {
        setLoadingTasks(false);
      }
    };

    if (open) {
      fetchTasks();
    }
  }, [open, apiToken, watchedTaskSequence]);

  const addTask = (taskId: string) => {
    const currentSequence = form.getValues("task_sequence");
    form.setValue("task_sequence", [...currentSequence, taskId]);
  };

  const removeTask = (index: number) => {
    const currentSequence = form.getValues("task_sequence");
    form.setValue("task_sequence", currentSequence.filter((_, i) => i !== index));
  };

  const moveTask = (fromIndex: number, toIndex: number) => {
    const currentSequence = form.getValues("task_sequence");
    const newSequence = [...currentSequence];
    const [movedItem] = newSequence.splice(fromIndex, 1);
    newSequence.splice(toIndex, 0, movedItem);
    form.setValue("task_sequence", newSequence);
  };

  const getTaskName = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    return task ? task.name : taskId;
  };

  const onSubmit = async (data: FormValues) => {
    setLoading(true);
    try {
      const url = new URL(window.location.href);
      
      if (isEdit && workflow) {
        await updateWorkflow(url.origin, apiToken, workflow.id, data);
      } else {
        await createWorkflow(url.origin, apiToken, data);
      }
      
      form.reset();
      setOpen(false);
      onSuccess?.();
      window.location.reload(); // Simple refresh for now
    } catch (error) {
      console.error('Failed to save workflow:', error);
      // In a real app, you'd show a proper error message
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={isEdit ? "outline" : "default"} size={isEdit ? "sm" : "default"}>
          {isEdit ? <Edit2 className="h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
          {isEdit ? "" : "Create Workflow"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Workflow" : "Create New Workflow"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Workflow name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description *</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="What does this workflow accomplish?"
                      className="resize-none"
                      rows={3}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <FormLabel>Task Sequence *</FormLabel>
              
              {/* Current Task Sequence */}
              <div className="space-y-2">
                {watchedTaskSequence.map((taskId, index) => (
                  <Card key={`${taskId}-${index}`} className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-medium text-blue-700">
                          {index + 1}
                        </div>
                        <Badge variant="outline">
                          {getTaskName(taskId)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => moveTask(index, Math.max(0, index - 1))}
                          disabled={index === 0}
                        >
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => moveTask(index, Math.min(watchedTaskSequence.length - 1, index + 1))}
                          disabled={index === watchedTaskSequence.length - 1}
                        >
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeTask(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
                
                {watchedTaskSequence.length === 0 && (
                  <Card className="p-4">
                    <div className="text-center text-neutral-500">
                      No tasks added yet. Select tasks from the available list below.
                    </div>
                  </Card>
                )}
              </div>

              {/* Available Tasks */}
              {!loadingTasks && availableTasks.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-medium text-neutral-600">Available Tasks</div>
                  <div className="grid grid-cols-2 gap-2">
                    {availableTasks.map((task) => (
                      <Card 
                        key={task.id} 
                        className="p-3 cursor-pointer hover:bg-neutral-50 transition-colors"
                        onClick={() => addTask(task.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-sm truncate">{task.name}</div>
                            <div className="text-xs text-neutral-500 truncate">{task.description}</div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              addTask(task.id);
                            }}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
              
              {!loadingTasks && availableTasks.length === 0 && watchedTaskSequence.length === 0 && (
                <Card className="p-4">
                  <div className="text-center text-red-600">
                    No enabled tasks available. Please create some tasks first.
                  </div>
                </Card>
              )}
            </div>

            <FormField
              control={form.control}
              name="enabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Enabled</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Allow this workflow to be executed
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading || loadingTasks}>
                {loading ? "Saving..." : (isEdit ? "Update Workflow" : "Create Workflow")}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}