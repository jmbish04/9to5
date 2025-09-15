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
import { useState } from "react";
import { useForm } from "react-hook-form";
import { createAgent, updateAgent } from "@/lib/api";
import * as z from "zod";
import type { components } from "@/lib/types/openapi";

type AgentConfig = components['schemas']['AgentConfig'];

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  role: z.string().min(1, "Role is required"),
  goal: z.string().min(1, "Goal is required"),
  backstory: z.string().min(1, "Backstory is required"),
  llm: z.string().min(1, "LLM model is required"),
  system_prompt: z.string().optional(),
  max_tokens: z.number().min(1, "Max tokens must be at least 1").max(32000, "Max tokens cannot exceed 32,000"),
  temperature: z.number().min(0, "Temperature must be at least 0").max(2, "Temperature cannot exceed 2"),
  enabled: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

interface AgentFormProps {
  apiToken: string;
  agent?: AgentConfig;
  onSuccess?: () => void;
}

const LLM_OPTIONS = [
  { label: "GPT-4", value: "gpt-4" },
  { label: "GPT-4 Turbo", value: "gpt-4-turbo" },
  { label: "GPT-3.5 Turbo", value: "gpt-3.5-turbo" },
  { label: "Claude 3 Opus", value: "claude-3-opus" },
  { label: "Claude 3 Sonnet", value: "claude-3-sonnet" },
  { label: "Claude 3 Haiku", value: "claude-3-haiku" },
];

export function CreateAgentButton({ apiToken, onSuccess }: { apiToken: string; onSuccess?: () => void }) {
  return <AgentForm apiToken={apiToken} onSuccess={onSuccess} />;
}

export function EditAgentButton({ apiToken, agent, onSuccess }: { apiToken: string; agent: AgentConfig; onSuccess?: () => void }) {
  return <AgentForm apiToken={apiToken} agent={agent} onSuccess={onSuccess} />;
}

function AgentForm({ apiToken, agent, onSuccess }: AgentFormProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const isEdit = !!agent;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: agent?.name || "",
      role: agent?.role || "",
      goal: agent?.goal || "",
      backstory: agent?.backstory || "",
      llm: agent?.llm || "gpt-4",
      system_prompt: agent?.system_prompt || "",
      max_tokens: agent?.max_tokens || 4000,
      temperature: agent?.temperature || 0.7,
      enabled: agent?.enabled !== false,
    },
  });

  const onSubmit = async (data: FormValues) => {
    setLoading(true);
    try {
      const url = new URL(window.location.href);
      
      if (isEdit && agent) {
        await updateAgent(url.origin, apiToken, agent.id, data);
      } else {
        await createAgent(url.origin, apiToken, data);
      }
      
      form.reset();
      setOpen(false);
      onSuccess?.();
      window.location.reload(); // Simple refresh for now
    } catch (error) {
      console.error('Failed to save agent:', error);
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
          {isEdit ? "" : "Create Agent"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Agent" : "Create New Agent"}</DialogTitle>
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
                      <Input placeholder="Agent name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Job Matcher, Content Creator" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="goal"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Goal *</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="What should this agent accomplish?"
                      className="resize-none"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="backstory"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Backstory *</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Background context for the agent"
                      className="resize-none"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="system_prompt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>System Prompt</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Optional system prompt override"
                      className="resize-none"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="llm"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>LLM Model *</FormLabel>
                    <FormControl>
                      <Select
                        options={LLM_OPTIONS}
                        value={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="max_tokens"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Tokens *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="1"
                        max="32000"
                        {...field} 
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="temperature"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Temperature *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0"
                        max="2"
                        step="0.1"
                        {...field} 
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="enabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Enabled</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Allow this agent to be used in tasks and workflows
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
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : (isEdit ? "Update Agent" : "Create Agent")}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}