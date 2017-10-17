
# Fake STMP Server

Fake SMTP Server is a fake SMTP server for development teams to test emails sent from the development and staging 
environments without spamming real customers.

## API

Received mails are listed on `http://localhost:1080/api/emails by default, and looks like this:

```json
[
  {
    "attachments": [],
    "headers": {},
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

    GET http://localhost:1080/api/emails?from=joe@example.com&to=bob@example.com&since=2017-09-18T12:00:00Z&until=2017-09-19T00:00:00Z

You can also filter emails by recipient directly in the path: 

    GET http://localhost:1080/api/emails/:address

Example:

    GET http://localhost:1080/api/emails/bob@example.com?since=2017-09-18T12:00:00Z

## Web interface

Go to:

    GET http://localhost:1080

Or

    GET http://localhost:1080/:address

## Install

```bash
  npm install -g fake-smtp-server
```

## Usage

    Usage:
      fake-smtp-server [OPTIONS] [ARGS]
    
    Options: 
      -s, --smtp-port [NUMBER] SMTP port to listen on (Default is 1025)
      -h, --http-port [NUMBER] HTTP port to listen on (Default is 1080)
      -w, --whitelist STRING Only accept e-mails from these adresses. 
                             Accepts multiple e-mails comma-separated.
      -m, --max [NUMBER]     Max number of e-mails to keep (Default is 10)
