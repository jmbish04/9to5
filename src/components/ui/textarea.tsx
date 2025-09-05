import * as React from 'react';
export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`min-h-[120px] w-full rounded-md border border-neutral-300 p-3 text-sm ${props.className || ''}`} />;
}
