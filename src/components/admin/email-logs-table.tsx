import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/admin/data-table";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";

export type EmailLog = {
  id: string;
  created_at: string;
  from_email: string;
  subject: string;
  job_links_extracted: number;
  jobs_processed: number;
  notes?: string;
};

const columnHelper = createColumnHelper<EmailLog>();

const columns: ColumnDef<EmailLog>[] = [
  columnHelper.accessor("created_at", {
    header: "Date",
    cell: (info) => {
      const date = new Date(info.getValue());
      return (
        <div className="text-sm">
          <div className="font-medium">
            {date.toLocaleDateString()}
          </div>
          <div className="text-muted-foreground">
            {formatDistanceToNow(date, { addSuffix: true })}
          </div>
        </div>
      );
    },
  }),
  columnHelper.accessor("from_email", {
    header: "From Email",
    cell: (info) => (
      <div className="font-mono text-sm">
        {info.getValue()}
      </div>
    ),
  }),
  columnHelper.accessor("subject", {
    header: "Subject",
    cell: (info) => (
      <div className="max-w-xs truncate" title={info.getValue()}>
        {info.getValue()}
      </div>
    ),
  }),
  columnHelper.accessor("job_links_extracted", {
    header: "Links Extracted",
    cell: (info) => (
      <Badge variant="secondary">
        {info.getValue()}
      </Badge>
    ),
  }),
  columnHelper.accessor("jobs_processed", {
    header: "Jobs Processed",
    cell: (info) => {
      const value = info.getValue();
      const extracted = info.row.original.job_links_extracted;
      const variant = value === extracted ? "default" : value > 0 ? "secondary" : "destructive";
      
      return (
        <Badge variant={variant}>
          {value}
        </Badge>
      );
    },
  }),
  columnHelper.accessor("notes", {
    header: "Notes",
    cell: (info) => {
      const notes = info.getValue();
      if (!notes) return <span className="text-muted-foreground">—</span>;
      
      return (
        <div className="max-w-xs truncate text-sm" title={notes}>
          {notes}
        </div>
      );
    },
  }),
];

interface EmailLogsTableProps {
  emailLogs: EmailLog[];
  isLoading?: boolean;
}

export function EmailLogsTable({ emailLogs, isLoading = false }: EmailLogsTableProps) {
  const table = useReactTable({
    data: emailLogs,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-muted animate-pulse rounded" />
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-muted animate-pulse rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (emailLogs.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <div className="text-lg font-medium mb-2">No email logs found</div>
        <div className="text-sm">
          Email logs will appear here when emails are processed.
        </div>
      </div>
    );
  }

  return <DataTable table={table} />;
}