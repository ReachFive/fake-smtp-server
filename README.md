
# Fake STMP Server

Fake SMTP Server is a fake SMTP server for development teams to test emails sent from the development and staging 
environments without spamming real customers.

Received mails are listed on `http://localhost:1080/emails by default, and looks like this:

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
  },
  ...
]
```

You can also filter emails by recipient: 

```
    GET http://localhost:1080/emails/:address
```

Or get the last sent email:

```
    GET http://localhost:1080/emails/:address/last
```


##Install

```bash
  git clone https://github.com/ReachFive/fake-smtp-server
```

##Usage

```
Usage:
  smtp-sink [OPTIONS] [ARGS]

Options: 
  -s, --smtpPort [NUMBER]SMTP port to listen on (Default is 1025)
  -h, --httpPort [NUMBER]HTTP port to listen on (Default is 1080)
  -w, --whitelist STRING Only accept e-mails from these adresses. Accepts 
                         multiple e-mails comma-separated 
  -m, --max [NUMBER]     Max number of e-mails to keep (Default is 10)
```

## LICENSE

(MIT license)

Copyright (c) 2017 ReachFive <contact@reach5.co>

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.