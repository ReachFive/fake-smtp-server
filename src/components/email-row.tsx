import { format, formatDistanceToNow, formatISO } from "date-fns";
import type { Attachment, ParsedMail } from "mailparser";

import { Address } from "@/components/address";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@/components/ui/table";
import { ArrowRightIcon } from "lucide-react";

function openAttachment(attachment: Attachment) {
  var byteArray = new Uint8Array(attachment.content);
  var file = new Blob([byteArray], { type: attachment.contentType });
  var fileURL = URL.createObjectURL(file);
  window.open(fileURL);
}

interface EmailProps {
  email: ParsedMail;
  isOpen: boolean;
  onToggle: () => void;
}

const EmailRow = ({ email, isOpen, onToggle }: EmailProps) => {
  return (
    <Collapsible
      open={isOpen}
      onOpenChange={onToggle}
      className="group/collapsible grid grid-cols-[2fr_3fr_1fr]"
    >
      <div
        className="grid grid-cols-subgrid col-span-3 items-center px-4 py-2 hover:bg-muted group-data-[state=open]/collapsible:bg-muted cursor-pointer"
        onClick={onToggle}
      >
        <div className="flex flex-row md:flex-col gap-1 flex-1">
          <span className="truncate text-sm" aria-description="From">
            <Address address={email.from} />
          </span>
          <span
            className="truncate text-sm flex flex-row gap-1 items-start"
            aria-description="To"
          >
            <ArrowRightIcon
              className="w-6 h-6 py-1 inline-flex"
              aria-description="To"
            />
            <Address address={email.to} className="flex flex-col" />
          </span>
        </div>
        <div className="font-semibold flex-2" aria-description="Subject">
          {email.subject}
        </div>
        <div
          className="text-muted-foreground text-sm self-start text-right"
          aria-description="Date"
        >
          {email.date &&
            formatDistanceToNow(email.date, {
              includeSeconds: true,
              addSuffix: true,
            })}
        </div>
      </div>

      <CollapsibleContent className="border-t grid col-span-3">
        <Table>
          <TableBody>
            <TableRow>
              <TableHead>From</TableHead>
              <TableCell>
                <Address address={email.from} />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableHead>To</TableHead>
              <TableCell>
                <Address
                  address={email.to}
                  className="flex flex-row gap-1 flex-wrap"
                />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableCell className="whitespace-break-spaces">
                {email.date && (
                  <time dateTime={formatISO(email.date)}>
                    {format(email.date, "PPPPpppp")}
                  </time>
                )}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableHead>Subject</TableHead>
              <TableCell>{email.subject}</TableCell>
            </TableRow>
            {email.attachments.length > 0 && (
              <TableRow>
                <TableHead>Attachments</TableHead>
                <TableCell>
                  <div className="flex flex-row flex-wrap gap-2">
                    {email.attachments.map((attachment) => (
                      <Button
                        size="sm"
                        onClick={() => openAttachment(attachment)}
                      >
                        {attachment.filename}
                      </Button>
                    ))}
                  </div>
                </TableCell>
              </TableRow>
            )}
            <TableRow>
              <TableCell colSpan={3} aria-description="Body">
                <div
                  dangerouslySetInnerHTML={{
                    __html: email.html
                      ? email.html
                      : email.textAsHtml ?? email.text ?? "",
                  }}
                />
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CollapsibleContent>
    </Collapsible>
  );
};

export { EmailRow };
