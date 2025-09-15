import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { zodResolver } from "@hookform/resolvers/zod";
import { Play, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { executeWorkflow } from "@/lib/api";
import * as z from "zod";
import type { operations } from "@/lib/types/openapi";

type ExecuteWorkflowResponse = operations['executeWorkflow']['responses']['200']['content']['application/json'];

const formSchema = z.object({
  context: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface WorkflowExecutionProps {
  apiToken: string;
  workflowId: string;
  workflowName: string;
}

export function WorkflowExecutionButton({ apiToken, workflowId, workflowName }: WorkflowExecutionProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ExecuteWorkflowResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      context: "",
    },
  });

  const onSubmit = async (data: FormValues) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const url = new URL(window.location.href);
      const context = data.context ? JSON.parse(data.context) : {};
      
      const executionResult = await executeWorkflow(url.origin, apiToken, workflowId, { context });
      setResult(executionResult);
    } catch (error) {
      console.error('Failed to execute workflow:', error);
      setError(error instanceof Error ? error.message : 'Failed to execute workflow');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    form.reset();
    setResult(null);
    setError(null);
  };

  const formatDuration = (started: string, completed: string) => {
    const startTime = new Date(started).getTime();
    const endTime = new Date(completed).getTime();
    const duration = endTime - startTime;
    
    if (duration < 1000) {
      return `${duration}ms`;
    } else if (duration < 60000) {
      return `${(duration / 1000).toFixed(1)}s`;
    } else {
      return `${(duration / 60000).toFixed(1)}m`;
    }
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      setOpen(newOpen);
      if (!newOpen) {
        reset();
      }
    }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Play className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Execute Workflow: {workflowName}</DialogTitle>
          <DialogDescription>
            {result ? 'Execution completed' : 'Configure and run this workflow'}
          </DialogDescription>
        </DialogHeader>

        {!result && !error && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="context"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Context (JSON)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder={`Optional context data as JSON, e.g.:
{
  "user_id": "123",
  "job_requirements": "Senior React Developer",
  "company": "Tech Corp"
}`}
                        className="resize-none font-mono text-sm"
                        rows={8}
                        {...field} 
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <Clock className="mr-2 h-4 w-4 animate-spin" />
                      Executing...
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      Execute Workflow
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        )}

        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-700">
                <AlertCircle className="h-5 w-5" />
                Execution Failed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-600">{error}</p>
              <div className="mt-4">
                <Button onClick={reset} variant="outline">
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {result && (
          <div className="space-y-4">
            {/* Execution Summary */}
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-700">
                  <CheckCircle className="h-5 w-5" />
                  Execution Completed Successfully
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Execution ID:</span> {result.execution_id}
                  </div>
                  <div>
                    <span className="font-medium">Status:</span>{' '}
                    <Badge variant={result.status === 'completed' ? 'default' : 'secondary'}>
                      {result.status}
                    </Badge>
                  </div>
                  <div>
                    <span className="font-medium">Started:</span> {new Date(result.started_at).toLocaleString()}
                  </div>
                  <div>
                    <span className="font-medium">Duration:</span> {formatDuration(result.started_at, result.completed_at)}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Task Results */}
            <div className="space-y-3">
              <h3 className="font-medium">Task Results</h3>
              {result.task_results.map((taskResult, index) => (
                <Card key={taskResult.task_id} className="relative">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-medium text-blue-700">
                          {index + 1}
                        </div>
                        <CardTitle className="text-base">{taskResult.task_name}</CardTitle>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={taskResult.status === 'completed' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {taskResult.status}
                        </Badge>
                        <span className="text-xs text-neutral-500">
                          {taskResult.execution_time_ms}ms
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      <div>
                        <div className="text-xs font-medium text-neutral-600">Agent</div>
                        <div className="text-sm">{taskResult.agent_name}</div>
                      </div>
                      <div>
                        <div className="text-xs font-medium text-neutral-600">Output</div>
                        <div className="text-sm text-neutral-700 bg-neutral-50 p-2 rounded border">
                          {taskResult.output}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Final Output */}
            <Card>
              <CardHeader>
                <CardTitle>Final Output</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm bg-neutral-50 p-4 rounded border font-mono whitespace-pre-wrap">
                  {result.final_output}
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end space-x-2">
              <Button onClick={reset} variant="outline">
                Execute Again
              </Button>
              <Button onClick={() => setOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}