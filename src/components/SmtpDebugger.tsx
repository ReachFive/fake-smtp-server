import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Loader2, SendIcon } from "lucide-react";
import type Mail from "nodemailer/lib/mailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";

const formSchema = z.object({
  from: z.string(),
  to: z.string(),
  subject: z.string().min(1),
  text: z.string().min(1),
});

const SmtpDebugger = ({
  children,
  ...props
}: React.ComponentProps<typeof Button>) => {
  const [isOpen, setOpen] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      from: "",
      to: "",
      subject: "",
      text: "",
    },
  });

  const { mutateAsync, isPending } = useMutation<
    SMTPTransport.SentMessageInfo,
    Error,
    Mail.Options
  >({
    mutationKey: ["api/emails"],
  });

  const { refetch } = useQuery({ queryKey: ["api/emails"] });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      await mutateAsync(values);
      await refetch(); // refresh email list
      setOpen(false);
      toast.success("Email sent successfully!");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : typeof error === "string"
          ? error
          : "An error occurred"
      );
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button {...props}>{children}</Button>
      </SheetTrigger>
      <SheetContent>
        <ScrollArea className="h-full">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <SheetHeader>
                <SheetTitle>SMTP Debugger</SheetTitle>
                <SheetDescription>
                  Send a test email to the SMTP Server
                </SheetDescription>
              </SheetHeader>

              <div className="grid flex-1 auto-rows-min gap-6 px-4">
                <FormField
                  control={form.control}
                  name="from"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>From</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Example app <no-reply@example.com>"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        The e-mail address of the sender. All e-mail addresses
                        can be plain "sender@server.com" or formatted "Sender
                        Name &lt;sender@server.com&gt;"
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="to"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>To</FormLabel>
                      <FormControl>
                        <Input placeholder="user@example.com" {...field} />
                      </FormControl>
                      <FormDescription>
                        Comma separated list or an array of recipients e-mail
                        addresses that will appear on the To
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subject</FormLabel>
                      <FormControl>
                        <Input placeholder="Hello from tests" {...field} />
                      </FormControl>
                      <FormDescription>
                        The subject of the e-mail
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="text"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Text</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="This message was sent from a Node.js integration test."
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        The plaintext version of the message
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <SheetFooter>
                <Button type="submit" disabled={isPending}>
                  {isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <SendIcon className="w-4 h-4" />
                  )}
                  Send
                </Button>
                <SheetClose asChild>
                  <Button variant="outline">Close</Button>
                </SheetClose>
              </SheetFooter>
            </form>
          </Form>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

export { SmtpDebugger };
