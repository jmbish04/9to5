import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Settings, Trash2, Clock } from "lucide-react";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { formatDistanceToNow } from "date-fns";
import * as z from "zod";

const formSchema = z.object({
  recipient_email: z.string().email("Invalid email address"),
  include_new_jobs: z.boolean().default(false),
  include_job_changes: z.boolean().default(false),
  include_statistics: z.boolean().default(false),
  frequency_hours: z.number().min(1, "Frequency must be at least 1 hour").max(168, "Frequency must be at most 7 days"),
});

type FormValues = z.infer<typeof formSchema>;

export type EmailConfig = {
  id: string;
  recipient_email: string;
  include_new_jobs: boolean;
  include_job_changes: boolean;
  include_statistics: boolean;
  frequency_hours: number;
  last_sent_at?: string;
};

interface EmailConfigManagerProps {
  apiToken: string;
}

export function EmailConfigManager({ apiToken }: EmailConfigManagerProps) {
  const [configs, setConfigs] = useState<EmailConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<EmailConfig | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      recipient_email: "",
      include_new_jobs: false,
      include_job_changes: false,
      include_statistics: false,
      frequency_hours: 24,
    },
  });

  const fetchConfigs = async () => {
    try {
      const url = new URL(window.location.href);
      const response = await fetch(`${url.origin}/api/email-config`, {
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setConfigs(data.email_configs || []);
      }
    } catch (error) {
      console.error('Failed to fetch email configs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, [apiToken]);

  const onSubmit = async (data: FormValues) => {
    try {
      const url = new URL(window.location.href);
      const method = editingConfig ? 'PUT' : 'POST';
      const body = editingConfig ? { ...data, id: editingConfig.id } : data;
      
      const response = await fetch(`${url.origin}/api/email-config`, {
        method,
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        await fetchConfigs();
        setIsDialogOpen(false);
        setEditingConfig(null);
        form.reset();
      }
    } catch (error) {
      console.error('Failed to save email config:', error);
    }
  };

  const handleEdit = (config: EmailConfig) => {
    setEditingConfig(config);
    form.reset({
      recipient_email: config.recipient_email,
      include_new_jobs: config.include_new_jobs,
      include_job_changes: config.include_job_changes,
      include_statistics: config.include_statistics,
      frequency_hours: config.frequency_hours,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this email configuration?')) {
      return;
    }

    try {
      const url = new URL(window.location.href);
      const response = await fetch(`${url.origin}/api/email-config`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      });

      if (response.ok) {
        await fetchConfigs();
      }
    } catch (error) {
      console.error('Failed to delete email config:', error);
    }
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingConfig(null);
    form.reset();
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-muted animate-pulse rounded" />
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Email Configurations</h2>
          <p className="text-muted-foreground">
            Manage email ingestion and notification settings
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={closeDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Configuration
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {editingConfig ? 'Edit Email Configuration' : 'Create Email Configuration'}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="recipient_email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Recipient Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="user@example.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="frequency_hours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Frequency (hours)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          max="168"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>
                        How often to check for emails (1-168 hours)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="include_new_jobs"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                          <FormLabel>Include New Jobs</FormLabel>
                          <FormDescription>
                            Process new job postings from emails
                          </FormDescription>
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

                  <FormField
                    control={form.control}
                    name="include_job_changes"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                          <FormLabel>Include Job Changes</FormLabel>
                          <FormDescription>
                            Process updates to existing job postings
                          </FormDescription>
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

                  <FormField
                    control={form.control}
                    name="include_statistics"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                          <FormLabel>Include Statistics</FormLabel>
                          <FormDescription>
                            Generate processing statistics in reports
                          </FormDescription>
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
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={closeDialog}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingConfig ? 'Update' : 'Create'}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {configs.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8 text-muted-foreground">
                <div className="text-lg font-medium mb-2">No email configurations</div>
                <div className="text-sm">
                  Create your first email configuration to start processing emails.
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          configs.map((config) => (
            <Card key={config.id}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{config.recipient_email}</CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <Clock className="h-4 w-4" />
                      Every {config.frequency_hours} hours
                      {config.last_sent_at && (
                        <span className="text-xs">
                          • Last sent {formatDistanceToNow(new Date(config.last_sent_at), { addSuffix: true })}
                        </span>
                      )}
                    </CardDescription>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(config)}
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(config.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {config.include_new_jobs && (
                    <Badge variant="secondary">New Jobs</Badge>
                  )}
                  {config.include_job_changes && (
                    <Badge variant="secondary">Job Changes</Badge>
                  )}
                  {config.include_statistics && (
                    <Badge variant="secondary">Statistics</Badge>
                  )}
                  {!config.include_new_jobs && !config.include_job_changes && !config.include_statistics && (
                    <Badge variant="outline">No features enabled</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}