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
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Edit2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { createTask, updateTask, listAgents } from "@/lib/api";
import * as z from "zod";
import type { components } from "@/lib/types/openapi";

type TaskConfig = components['schemas']['TaskConfig'];
type AgentConfig = components['schemas']['AgentConfig'];

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  agent_id: z.string().min(1, "Agent is required"),
  expected_output: z.string().min(1, "Expected output is required"),
  enabled: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

interface TaskFormProps {
  apiToken: string;
  task?: TaskConfig;
  onSuccess?: () => void;
}

export function CreateTaskButton({ apiToken, onSuccess }: { apiToken: string; onSuccess?: () => void }) {
  return <TaskForm apiToken={apiToken} onSuccess={onSuccess} />;
}

export function EditTaskButton({ apiToken, task, onSuccess }: { apiToken: string; task: TaskConfig; onSuccess?: () => void }) {
  return <TaskForm apiToken={apiToken} task={task} onSuccess={onSuccess} />;
}

function TaskForm({ apiToken, task, onSuccess }: TaskFormProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [agents, setAgents] = useState<AgentConfig[]>([]);
  const [loadingAgents, setLoadingAgents] = useState(true);
  const isEdit = !!task;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: task?.name || "",
      description: task?.description || "",
      agent_id: task?.agent_id || "",
      expected_output: task?.expected_output || "",
      enabled: task?.enabled !== false,
    },
  });

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const url = new URL(window.location.href);
        const agentList = await listAgents(url.origin, apiToken);
        setAgents(agentList.filter(agent => agent.enabled)); // Only show enabled agents
      } catch (error) {
        console.error('Failed to load agents:', error);
      } finally {
        setLoadingAgents(false);
      }
    };

    if (open) {
      fetchAgents();
    }
  }, [open, apiToken]);

  const onSubmit = async (data: FormValues) => {
    setLoading(true);
    try {
      const url = new URL(window.location.href);
      
      if (isEdit && task) {
        await updateTask(url.origin, apiToken, task.id, data);
      } else {
        await createTask(url.origin, apiToken, data);
      }
      
      form.reset();
      setOpen(false);
      onSuccess?.();
      window.location.reload(); // Simple refresh for now
    } catch (error) {
      console.error('Failed to save task:', error);
      // In a real app, you'd show a proper error message
    } finally {
      setLoading(false);
    }
  };

  // Generate agent options for select
  const agentOptions = agents.map(agent => ({
    label: `${agent.name} (${agent.role})`,
    value: agent.id
  }));

  if (agents.length === 0 && !loadingAgents) {
    agentOptions.push({
      label: "No enabled agents found",
      value: ""
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={isEdit ? "outline" : "default"} size={isEdit ? "sm" : "default"}>
          {isEdit ? <Edit2 className="h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
          {isEdit ? "" : "Create Task"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Task" : "Create New Task"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Task name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="agent_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Agent *</FormLabel>
                    <FormControl>
                      <Select
                        options={loadingAgents ? [{ label: "Loading agents...", value: "" }] : agentOptions}
                        value={field.value}
                        onChange={field.onChange}
                      />
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
                      placeholder="What should this task do?"
                      className="resize-none"
                      rows={3}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="expected_output"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Expected Output *</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe what the output should look like"
                      className="resize-none"
                      rows={3}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="enabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Enabled</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Allow this task to be used in workflows
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
              <Button type="submit" disabled={loading || loadingAgents}>
                {loading ? "Saving..." : (isEdit ? "Update Task" : "Create Task")}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}