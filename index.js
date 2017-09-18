#!/usr/bin/env node
const SMTPServer = require('smtp-server').SMTPServer;
const simpleParser = require('mailparser').simpleParser;
const express = require("express");
const _ = require("lodash");
const cli = require('cli').enable('catchall');


const config = cli.parse({
  smtpPort: ['s', 'SMTP port to listen on', 'number', 1025],
  httpPort: ['h', 'HTTP port to listen on', 'number', 1080],
  whitelist: ['w', 'Only accept e-mails from these adresses. Accepts multiple e-mails comma-separated', 'string'],
  max: ['m', 'Max number of e-mails to keep', 'number', 100]
});

const whitelist = config.whitelist ? config.whitelist.split(',') : [];

const mails = [];

const server = new SMTPServer({
  authOptional: true,
  onMailFrom(address, session, cb) {
    if (whitelist.length == 0 || whitelist.indexOf(address.address) !== -1) {
      cb();
    } else {
      cb(new Error('Invalid email from: ' + address.address));
    }
  },
  onData(stream, session, callback) {
    simpleParser(stream).then(
      mail => {
        cli.debug(JSON.stringify(mail));

        mails.unshift(mail);

        //trim list of emails if necessary
        while (mails.length > config.max) {
          mails.pop();
        }

        callback();
      },
      callback
    );
  }
});

server.on('error', err => {
  cli.error(err);
});

server.listen(config.smtpPort);

const app = express();

app.get('/emails', (req, res) => {
  res.json(mails);
});

app.get('/emails/:address', (req, res) => {
  res.json(mails.filter(mail => _.some(mail.to.value, to => to.address === req.params.address)));
});

app.get('/emails/:address/last', (req, res) => {
  const address = req.params.address;
  const lastEmail = mails.find(mail => _.some(mail.to.value, to => to.address === address));
  if (lastEmail) {
    res.json(lastEmail);
  } else {
    res.status(404).json({
      message: `No email found for address '${address}'`
    });
  }
});

app.listen(config.httpPort, () => {
  cli.info("HTTP server listening on port " + config.httpPort + ", e-mails are available on /emails.");
});

cli.info("SMTP server listening on port " + config.smtpPort);
