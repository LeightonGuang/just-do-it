import type { JSX } from "react";
import { ChevronDown } from "lucide-react";

interface EndpointCardProps {
  id: string;
  method: string;
  path: string;
  description: string;
  parameters?: Array<{ name: string; type: string; required?: boolean; description?: string }>;
  requestBody?: {
    properties: Array<{ name: string; type: string; required?: boolean; description?: string }>;
    required?: string[];
  };
  responses?: Record<number, { description: string; schema?: Record<string, unknown> }>;
}

export const EndpointCard: React.FC<EndpointCardProps> = ({
  id,
  method,
  path,
  description,
  parameters,
  requestBody,
  responses,
}) => {
  return (
    <details id={id} className="group border border-border bg-card">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 [&::-webkit-details-marker]:hidden">
        <div className="flex min-w-0 items-center gap-3">
        <span
          className={`px-3 py-1 rounded text-sm font-bold ${
            method === "GET"
            ? "bg-success-background text-success"
              : method === "POST"
              ? "bg-primary/10 text-primary"
              : method === "PATCH"
              ? "bg-yellow-100 text-yellow-800"
              : method === "DELETE"
              ? "bg-danger-background text-danger"
              : "bg-background text-text-muted"
          }`}
        >
          {method}
        </span>
          <code className="truncate border border-border bg-background px-2 py-1 font-mono text-sm">{path}</code>
        </div>
        <span className="shrink-0 text-text-muted transition-transform group-open:rotate-180"><ChevronDown className="size-4"/></span>
      </summary>

      <div className="border-t border-border p-6">

      <p className="mb-4 text-sm text-text-muted">{description}</p>

      {parameters && parameters.length > 0 && (
        <div className="mb-4">
          <h4 className="mb-2 text-sm font-semibold">Query Parameters</h4>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-1 px-2">Name</th>
                <th className="text-left py-1 px-2">Type</th>
                <th className="text-left py-1 px-2">Required</th>
                <th className="text-left py-1 px-2">Description</th>
              </tr>
            </thead>
            <tbody>
              {parameters.map((param) => (
                <tr key={param.name} className="border-b last:border-0">
                  <td className="py-1 px-2 font-mono">{param.name}</td>
                  <td className="px-2 py-1 text-text-muted">{param.type}</td>
                  <td className="py-1 px-2">
                    {param.required ? (
                      <span className="text-red-600 font-semibold">Yes</span>
                    ) : (
                      <span className="text-green-600">No</span>
                    )}
                  </td>
                  <td className="px-2 py-1 text-text-muted">{param.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {requestBody && (
        <div className="mb-4">
          <h4 className="mb-2 text-sm font-semibold">Request Body</h4>
          <pre className="overflow-x-auto border border-border bg-background p-3 font-mono text-xs">
            {JSON.stringify(requestBody, null, 2)}
          </pre>
        </div>
      )}

      {responses && Object.keys(responses).length > 0 && (
        <div>
          <h4 className="mb-2 text-sm font-semibold">Responses</h4>
          <div className="space-y-2">
            {Object.entries(responses).map(([status, data]) => (
              <div key={status} className="border border-border bg-background p-3">
                <span className="text-sm font-semibold">{status}</span>
                <p className="mt-1 text-xs text-text-muted">{data.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      </div>
    </details>
  );
};
