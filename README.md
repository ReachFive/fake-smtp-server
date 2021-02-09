
# Fake SMTP Server

Fake SMTP Server is an email testing tool for QA & development teams. 
It allows manual testing in a web interface, and automated testing via an API.

## Docker image
[reachfive/fake-smtp-server](https://hub.docker.com/r/reachfive/fake-smtp-server)

## API

#### Listing all received emails

Received mails are listed on `http://localhost:1080/api/emails`, and looks like this:

```json
[
  {
    "attachments": [],
    "text": "Hi Bob!",
    "textAsHtml": "<p>Hi Bob!</p>",
    "subject": "Hi",
    "date": "2017-09-18T16:12:16.000Z",
    "to": {
      "value": [
        {
          "address": "bob@example.com",
          "name": "Bob"
        }
      ],
      "html": "<span class=\"mp_address_group\"><span class=\"mp_address_name\">Bob</span> &lt;<a href=\"mailto:bob@example.com\" class=\"mp_address_email\">bob@example.com</a>&gt;</span>",
      "text": "Bob <bob@example.com>"
    },
    "from": {
      "value": [
        {
          "address": "joe@example.com",
          "name": "Joe"
        }
      ],
      "html": "<span class=\"mp_address_group\"><span class=\"mp_address_name\">Joe</span> &lt;<a href=\"mailto:joe@example.com\" class=\"mp_address_email\">joe@example.com</a>&gt;</span>",
      "text": "Joe <joe@example.com>"
    },
    "messageId": "<1433879119.43.1505751136615@[10.143.108.87]>",
    "html": false
  }
]
```

You can filter emails with the following parameters:

 * `from`: filter sender
 * `to`: filter recipient
 * `since`: filter email date
 * `until`: filter email date
 
Example:

```
    GET http://localhost:1080/api/emails?from=joe@example.com&to=bob@example.com&since=2017-09-18T12:00:00Z&until=2017-09-19T00:00:00Z
```

##### Viewing headers in responses

By default, fake-smtp-server will not capture custom headers in emails. To enable headers, start the server with the `--headers` flag. If enabled, headers will be serialized as an object type. 

For reference for what headers look like, consult [Nodemailer's documentation](https://nodemailer.com/extras/mailparser/#headers-map), but keep in mind that the HTTP endpoint returns plain JSON objects rather than `Map`s.

#### Removing all received email

To remove all emails without restarting the server:
```
    DELETE http://localhost:1080/api/emails
``` 


## Web interface

Go to `http://localhost:1080`

## Install

```bash
  npm install -g fake-smtp-server
```

## Usage

```
Usage:
  fake-smtp-server [OPTIONS] [ARGS]

Options:
  -s, --smtp-port [NUMBER]  SMTP port to listen on (Default is 1025)
      --smtp-ip [IP]        IP Address to bind SMTP service to (Default is 0.0.0.0)
  -h, --http-port [NUMBER]  HTTP port to listen on (Default is 1080)
      --http-ip [IP]        IP Address to bind HTTP service to (Default is 0.0.0.0)
  -w, --whitelist STRING    Only accept e-mails from these adresses. Accepts
                            multiple e-mails comma-separated
  -m, --max [NUMBER]        Max number of e-mails to keep (Default is 100)
  -a, --auth STRING         Enable Authentication
      --secure              Enable Secure option (require SSL connection)
      --keystore STRING     Path to PKCS12 keystore used for Secure option or when
                            using STARTTLS
  -p, --passphrase STRING   Passphrase for PKCS12 private key
      --smtpAuth STRING     Enable SMTP authentication. Accepts a
                            comma-separated list of username:password pairs
                            that are permitted. Setting this makes
                            authentication required
      --headers             Enable headers in responses
  -k, --no-color            Omit color from output
      --debug               Show debug information
  -c, --catch               Catch unanticipated errors
      --save                Save attachements to disk when email is recieved
      --savepath            Location to save attachments
```

## Configure fake-smtp-server to run as a service at startup

These instructions below were tested on **Ubuntu 18.04 LTS** but they should work out of the box (or close to it) on any distribution using ***systemd*** and ***rsyslog***.

### Systemd service

#### Create the `fakesmtp.service` service unit
* `sudo vim /etc/systemd/system/fakesmtp.service` with the following content
```shell
[Unit]
Description=Fake SMTP service
After=network.target
StartLimitIntervalSec=0
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=fake-smtp-server

[Service]
Type=simple
Restart=always
RestartSec=1
ExecStart=/usr/local/bin/fake-smtp-server  # You can add extra options and arguments here

[Install]
WantedBy=multi-user.target
```

#### Make the new service launch on startup
* `sudo systemctl enable fakesmtp.service`

#### Start/Stop/Restart the service
* `sudo systemctl start fakesmtp.service`
* `sudo systemctl stop fakesmtp.service`
* `sudo systemctl restart fakesmtp.service`

### Logging using rsyslog

The output is recorded by default to `/var/log/syslog` but you can create a separate log file for your service (in this example, logs will be saved to `/var/log/fakesmtp.log`).

#### Create a new **rsyslog** config file
* `sudo vim /etc/rsyslog.d/fakesmtp.conf` with the following content:
```shell
if $programname == 'fake-smtp-server' then /var/log/fakesmtp.log
& stop
```

#### Restart **rsyslog** and then restart your shiny new fakesmtp service
* `systemctl restart rsyslog.service`
* `systemctl restart fakesmtp.service`
