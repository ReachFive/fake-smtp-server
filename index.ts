#!/usr/bin/env node
import bodyParser from "body-parser";
import cli from "cli";
import cors from "cors";
import { isAfter, isBefore } from "date-fns";
import express from "express";
import basicAuth from "express-basic-auth";
import { type AddressObject, type ParsedMail, simpleParser } from "mailparser";
import nodemailer from "nodemailer";
import type Mail from "nodemailer/lib/mailer";
import { type ParsedQs } from "qs";
import { SMTPServer, type SMTPServerDataStream } from "smtp-server";

cli.enable("catchall").enable("status");

type Config = {
  "smtp-port": number;
  "smtp-ip": string;
  "http-port": number;
  "http-ip": string;
  whitelist: string;
  max: number;
  auth: string;
  headers: boolean;
};

const config: Config = cli.parse({
  "smtp-port": ["s", "SMTP port to listen on", "number", 1025],
  "smtp-ip": [false, "IP Address to bind SMTP service to", "ip", "0.0.0.0"],
  "http-port": ["h", "HTTP port to listen on", "number", 1080],
  "http-ip": [false, "IP Address to bind HTTP service to", "ip", "0.0.0.0"],
  whitelist: [
    "w",
    "Only accept e-mails from these adresses. Accepts multiple e-mails comma-separated",
    "string",
  ],
  max: ["m", "Max number of e-mails to keep", "number", 100],
  auth: ["a", "Enable Authentication", "string"],
  headers: [false, "Enable headers in responses"],
});

const whitelist = config.whitelist ? config.whitelist.split(",") : [];

let users: Record<string, string> | null = null;
if (config.auth && !/.+:.+/.test(config.auth)) {
  cli.error(
    "Please provide authentication details in USERNAME:PASSWORD format"
  );
  console.log(process.exit(1));
}
if (config.auth) {
  let authConfig = config.auth.split(":");
  users = {};
  users[authConfig[0]] = authConfig[1];
}

const mails: ParsedMail[] = [
  {
    attachments: [],
    headers: new Map(),
    headerLines: [],
    html: "<p>Hello</p>",
    text: "Hello",
    subject: "Hello",
    from: {
      value: [{ address: "john.doe@example.com", name: "John Doe" }],
      html: "John Doe <john.doe@example.com>",
      text: "John Doe <john.doe@example.com>",
    },
    to: [
      {
        value: [{ address: "jane.doe@example.com", name: "Jane Doe" }],
        html: "Jane Doe <jane.doe@example.com>",
        text: "Jane Doe <jane.doe@example.com>",
      },
      {
        value: [{ address: "alice.doe@example.com", name: "Alice Doe" }],
        html: "Alice Doe <alice.doe@example.com>",
        text: "Alice Doe <alice.doe@example.com>",
      },
    ],
    date: new Date(),
    messageId: "1234567890",
    references: [],
  },
];

const server = new SMTPServer({
  authOptional: true,
  hideSTARTTLS: true,
  onMailFrom(address, _session, cb) {
    if (whitelist.length == 0 || whitelist.indexOf(address.address) !== -1) {
      cb();
    } else {
      cb(new Error("Invalid email from: " + address.address));
    }
  },
  onAuth(auth, _session, callback) {
    cli.info("SMTP login for user: " + auth.username);
    callback(null, {
      user: auth.username,
    });
  },
  onData(stream, _session, callback) {
    parseEmail(stream).then((mail) => {
      cli.debug(JSON.stringify(mail, null, 2));

      mails.unshift(mail);

      //trim list of emails if necessary
      while (mails.length > config.max) {
        mails.pop();
      }

      callback();
    }, callback);
  },
});

async function parseEmail(stream: SMTPServerDataStream) {
  const email = await simpleParser(stream);
  if (!config.headers) {
    email.headers.clear();
  }
  return email;
}

server.on("error", (err) => {
  cli.error(err.message);
});

server.listen(config["smtp-port"], config["smtp-ip"]);

const app = express();

app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded());
app.use(bodyParser.json());

if (users) {
  app.use(
    basicAuth({
      users: users,
      challenge: true,
    })
  );
}

app.use(express.static("dist"));

interface FilteredQuery extends ParsedQs {
  since?: string;
  until?: string;
  to?: string;
  from?: string;
}

function matchAddress(
  value: string,
  address?: AddressObject | AddressObject[]
) {
  return Array.isArray(address)
    ? address.some((a) => a.value.some((v) => v.address === value))
    : address?.value.some((v) => v.address === value) ?? false;
}

function emailFilter(filter: FilteredQuery) {
  return (email: ParsedMail) => {
    if (filter.since || filter.until) {
      if (filter.since && email.date && isBefore(email.date, filter.since)) {
        return false;
      }
      if (filter.until && email.date && isAfter(email.date, filter.until)) {
        return false;
      }
    }

    if (filter.to && !matchAddress(filter.to, email.to)) {
      return false;
    }

    if (filter.from && !matchAddress(filter.from, email.from)) {
      return false;
    }

    return true;
  };
}

app.get<"/api/emails", {}, {}, FilteredQuery>("/api/emails", (req, res) => {
  res.json(mails.filter(emailFilter(req.query)));
});

app.delete("/api/emails", (_, res) => {
  mails.length = 0;
  res.send();
});

app.post<"/api/emails", {}, {}, Mail.Options>(
  "/api/emails",
  async (req, res) => {
    try {
      // const account = await nodemailer.createTestAccount();

      const transporter = nodemailer.createTransport({
        host: config["smtp-ip"], // "smtp.ethereal.email",
        port: config["smtp-port"], // 587,
        secure: false, // upgrade later with STARTTLS
        // auth: {
        //   user: account.user, // generated user
        //   pass: account.pass, // generated password
        // },
      });

      const info = await transporter.sendMail(req.body);

      console.log("Message sent: %s", info.messageId);
      // Preview the stored message in Ethereal’s web UI
      // console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));

      res.send(info);
    } catch (error) {
      console.error(error);
    }

    res.send();
  }
);

app.listen(config["http-port"], config["http-ip"], () => {
  cli.info(
    "HTTP server listening on http://" +
      config["http-ip"] +
      ":" +
      config["http-port"]
  );
});

cli.info(
  "SMTP server listening on " + config["smtp-ip"] + ":" + config["smtp-port"]
);
