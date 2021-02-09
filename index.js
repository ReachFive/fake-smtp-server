#!/usr/bin/env node
const SMTPServer = require('smtp-server').SMTPServer;
const simpleParser = require('mailparser').simpleParser;
const express = require("express");
const basicAuth = require('express-basic-auth');
const path = require("path");
const _ = require("lodash");
const moment = require("moment");
const cli = require('cli').enable('catchall').enable('status');
const fs = require('fs');

const config = cli.parse({
  'smtp-port': ['s', 'SMTP port to listen on', 'number', 1025],
  'smtp-ip': [false, 'IP Address to bind SMTP service to', 'ip', '0.0.0.0'],
  'http-port': ['h', 'HTTP port to listen on', 'number', 1080],
  'http-ip': [false, 'IP Address to bind HTTP service to', 'ip', '0.0.0.0'],
  whitelist: ['w', 'Only accept e-mails from these adresses. Accepts multiple e-mails comma-separated', 'string'],
  max: ['m', 'Max number of e-mails to keep', 'number', 100],
  auth: ['a', 'Enable Authentication', 'string'],
  secure: [false, 'Enable Secure option (require SSL connection)'],
  keystore: [false, 'Path to PKCS12 keystore used for Secure option or when using STARTTLS', 'string'],
  passphrase: ['p', 'Passphrase for PKCS12 private key', 'string'],
  smtpAuth: [false, 'Enable SMTP authentication. Accepts a comma-separated list of username:password pairs that are permitted. Setting this makes authentication required', 'string'],
  headers: [false, 'Enable headers in responses'],
  hideTLS: [false, 'Hide TLS in feature list']
});

const whitelist = config.whitelist ? config.whitelist.split(',') : [];

let users = null;
if (config.auth && !/.+:.+/.test(config.auth)) {
    cli.error("Please provide authentication details in USERNAME:PASSWORD format");
    console.log(process.exit(1))
}
if (config.auth) {
  let authConfig = config.auth.split(":");
  users = {};
  users[authConfig[0]] = authConfig[1];
}

const smtpUsers = config.smtpAuth ? config.smtpAuth.split(',').map(up => up.split(":")) : null;

const mails = [];


const serverOptions = {
  authOptional: true,
  hideSTARTTLS: config.hideTLS,
  maxAllowedUnauthenticatedCommands: 1000,
  onMailFrom(address, session, cb) {
    if (whitelist.length == 0 || whitelist.indexOf(address.address) !== -1) {
      cb();
    } else {
      cb(new Error('Invalid email from: ' + address.address));
    }
  },
  onAuth(auth, session, callback) {
    cli.info('SMTP login for user: ' + auth.username);
    callback(null, {
      user: auth.username
    });
  },
  onData(stream, session, callback) {
    parseEmail(stream).then(
      mail => {
        cli.debug(JSON.stringify(mail, null, 2));

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
};

if (smtpUsers) {
  cli.info("Accepted SMTP users are " + smtpUsers);
  serverOptions.onAuth = smtpAuthCallback;
  serverOptions.authOptional = false;
}

if (config.secure) {
  serverOptions.secure = true;
}

if (config.keystore) {
  if (!fs.existsSync(config.keystore)) {
    cli.error(`Keystore ${config.keystore} did not exists`);
    console.log(process.exit(1));
  }

  serverOptions.pfx = fs.readFileSync(config.keystore);
  if (config.passphrase)
    serverOptions.passphrase = config.passphrase;
  else
    cli.warn('PFX option set without passphrase');
}

cli.info(`Options = ${JSON.stringify(serverOptions)}`);

const server = new SMTPServer(serverOptions);


function smtpAuthCallback(auth, session, callback) {
  const username = auth.username;
  const password = auth.password;

  cli.info(`${username} is trying to login with password ${password}`);

  if (smtpUsers.find(e => (e[0] === username && e[1] === password)))
    callback(null, {user: username});
  else
    callback(new Error('Invalid username or password'));
}


function formatHeaders(headers) {
  const result = {};
  for (const [key, value] of headers) {
    result[key] = value;
  }
  return result;
}

function parseEmail(stream) {
  return simpleParser(stream).then(email => {
    if (config.headers) {
      email.headers = formatHeaders(email.headers);
    } else {
      delete email.headers;
    }
    return email;
  });
}

server.on('error', err => {
  cli.error(err);
});

let state = '';

function startServer() {
  state = 'STARTING';
  server.listen(config['smtp-port'], config['smtp-ip'], () => { state = 'STARTED'; });
}

function stopServer() {
  state = 'STOPPING';
  server.close(() => { state = 'STOPPED'; });
}

startServer();

const app = express();

app.use(express.json());

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

if (users) {
    app.use(basicAuth({
        users: users,
        challenge: true
    }));
}

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
    if(Object.keys(req.query).length === 0) {
      mails.length = 0;
  } else {
      mails = mails.filter(emailFilter(req.query));
  }
    res.send();
});

app.get('/api/state', (req, res) => {
  res.json({'state': state});
});

app.put('/api/state', (req, res) => {
  json = req.body;
  if (json['state'] === 'START') {
    if (state === 'STOPPED') {
      startServer();
    }
    res.json({'state': state});
  } else if (json['state'] === 'STOP') {
    if (state === 'STARTED') {
      stopServer();
    }
    res.json({'state': state});
  } else {
    res.status(400).end();
  }
});

app.listen(config['http-port'], config['http-ip'], () => {
  cli.info("HTTP server listening on http://" + config['http-ip'] +  ":" + config['http-port']);
});

cli.info("SMTP server listening on " + config['smtp-ip'] + ":" + config['smtp-port']);
