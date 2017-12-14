#!/usr/bin/env node
const SMTPServer = require('smtp-server').SMTPServer;
const simpleParser = require('mailparser').simpleParser;
const express = require("express");
const path = require("path");
const _ = require("lodash");
const moment = require("moment");
const cli = require('cli').enable('catchall');


const config = cli.parse({
  'smtp-port': ['s', 'SMTP port to listen on', 'number', 1025],
  'http-port': ['h', 'HTTP port to listen on', 'number', 1080],
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

server.listen(config['smtp-port']);

const app = express();

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

const buildDir = path.join(__dirname, 'build');

app.use(express.static(buildDir));

function emailFilter(filter) {
  return email => {
    if (filter.since || filter.until) {
      const date = moment(email.date);
      if (filter.since && date.isBefore(filter.since)) {
        return false;
      }
      if (filter.until && date.isAfter(filter.until)) {
        return false;
      }
    }

    if (filter.to && _.every(email.to.value, to => to.address !== filter.to)) {
      return false;
    }

    if (filter.from && _.every(email.from.value, from => from.address !== filter.from)) {
      return false;
    }

    return true;
  }
}

app.get('/api/emails', (req, res) => {
  res.json(mails.filter(emailFilter(req.query)));
});

app.delete('/api/emails', (req, res) => {
    mails.length = 0;
    res.send();
});

app.listen(config['http-port'], () => {
  cli.info("HTTP server listening on port " + config['http-port']);
});

cli.info("SMTP server listening on port " + config['smtp-port']);
