import { useQuery } from "@tanstack/react-query";
import { InboxIcon, MailWarningIcon } from "lucide-react";
import type { ParsedMail } from "mailparser";
import {
  createSerializer,
  parseAsIsoDateTime,
  parseAsString,
  useQueryState,
} from "nuqs";
import { useState } from "react";

import { EmailRow } from "@/components/email-row";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

const filtersParams = {
  since: parseAsIsoDateTime,
  until: parseAsIsoDateTime,
  to: parseAsString,
  from: parseAsString,
};
// type Filters = inferParserType<typeof filtersParams>;
const serialize = createSerializer(filtersParams);

const EmailList = () => {
  const [activeEmail, setActiveEmail] = useState<string | null>(null);

  const [since, _setSince] = useQueryState("since", parseAsIsoDateTime);
  const [until, _setUntil] = useQueryState("until", parseAsIsoDateTime);
  const [to, _setTo] = useQueryState("to");
  const [from, _setFrom] = useQueryState("from");

  const {
    data: emails,
    error,
    isLoading,
    isError,
  } = useQuery<ParsedMail[]>({
    queryKey: ["api/emails" + serialize({ since, until, to, from })],
  });

  const handleToggle = (email: ParsedMail) => () => {
    if (activeEmail === email.messageId) {
      setActiveEmail(null);
    } else {
      setActiveEmail(email.messageId ?? null);
    }
  };

  if (isError) {
    return (
      <div className="flex flex-col flex-1">
        <Alert variant="destructive">
          <MailWarningIcon />
          <AlertTitle>Failed to load emails</AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (!emails || emails.length === 0) {
    return (
      <div className="w-full text-sm flex flex-row gap-2 items-center justify-center my-4 flex-1">
        <InboxIcon />
        <span>Empty mailbox</span>
      </div>
    );
  }

  return (
    <div className="w-full border rounded-sm divide-y grid auto-rows-min">
      {emails.map((email) => (
        <EmailRow
          email={email}
          isOpen={activeEmail === email.messageId}
          onToggle={handleToggle(email)}
          key={email.messageId}
        />
      ))}
    </div>
  );
};

export { EmailList };
