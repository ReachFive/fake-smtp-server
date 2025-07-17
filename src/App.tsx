import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BugIcon } from "lucide-react";
import { NuqsAdapter } from "nuqs/adapters/react";

import { EmailList } from "@/components/email-list";
import { SmtpDebugger } from "@/components/SmtpDebugger";
import { Toaster } from "@/components/ui/sonner";
import { removeTrailingSlash } from "@/lib/utils";

const baseUrl =
  process.env.NODE_ENV === "development"
    ? "http://localhost:1080"
    : removeTrailingSlash(
        `${window.location.origin}${window.location.pathname}`
      );

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: async ({ queryKey }) => {
        const resp = await fetch(`${baseUrl}/${queryKey[0]}`, {
          credentials: "same-origin",
        });
        return await resp.json();
      },
    },
  },
});

queryClient.setMutationDefaults(["api/emails"], {
  mutationFn: async (body) => {
    const resp = await fetch(`${baseUrl}/api/emails`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      credentials: "same-origin",
    });
    return await resp.json();
  },
});

const App = () => {
  return (
    <NuqsAdapter>
      <QueryClientProvider client={queryClient}>
        <div className="container m-auto">
          <div className="min-h-svh flex-1 flex-col gap-8 p-8 flex">
            <header className="flex items-center justify-between gap-2">
              <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-semibold tracking-tight">
                  Emails
                </h1>
                <p className="text-sm text-muted-foreground"></p>
              </div>
              <SmtpDebugger>
                <BugIcon className="w-4 h-4" />
                Debugger
              </SmtpDebugger>
            </header>
            <div className="flex flex-col gap-4 flex-1">
              <EmailList />
            </div>
          </div>
        </div>
        <Toaster />
      </QueryClientProvider>
    </NuqsAdapter>
  );
};

export default App;
