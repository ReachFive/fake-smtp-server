import React, { Component } from 'react';
import {
  Button,
  Container,
  Card,
  CardHeader,
  Row,
  Col,
  Collapse,
  ListGroup,
  ListGroupItem
} from 'reactstrap';
import moment from 'moment';

function openAttachment (attachment) {
  var byteArray = new Uint8Array(attachment.content.data);
  var file = new Blob([byteArray], { type: attachment.contentType });
  var fileURL = URL.createObjectURL(file);
  window.open(fileURL);
}

function setupEmailWithDefaults(email) {
  if(!email.attachments) email.attachments = [];
  if(!email.date) email.date = new Date();
  if(!email.from) {
    email.from = { value: []}
    email.from.value[0] = {"name": "", "address" : "", "html": ""};
  }
  if(!email.to) {
    email.to = { value: []}
    email.to.value[0] = {"name": "", "address" : "", "html": ""};
  }
}


const Email = ({ email, isOpen, onToggle }) => {
  setupEmailWithDefaults(email);
  let from = email.from.value[0];
  let to = email.to.value[0];
  return (
    <Card>
      <CardHeader onClick={onToggle}>
        <Row>
          <Col className="px-2" md={4}>
            <div className="text-truncate">
              {from.name && from.name.length ? from.name : from.address}
            </div>
            <div className="text-truncate">
              {to.name && to.name.length ? to.name : to.address}
            </div>
          </Col>
          <Col className="px-2">
            {email.subject}
          </Col>
        </Row>
      </CardHeader>
      <Collapse isOpen={isOpen}>
        <ListGroup className="list-group-flush">
          <ListGroupItem>
            <strong>From:&nbsp;</strong>
            <span dangerouslySetInnerHTML={{ __html: email.from.html }} />
          </ListGroupItem>
          <ListGroupItem>
            <strong>To:&nbsp;</strong>
            <span dangerouslySetInnerHTML={{ __html: email.to.html }} />
          </ListGroupItem>
          <ListGroupItem>
            <strong>Date:&nbsp;</strong>
            <span title={moment(email.date).format('lll')}>{moment(email.date).fromNow()}</span>
          </ListGroupItem>
          <ListGroupItem>
            <strong>Subject:&nbsp;</strong>
            {email.subject}
          </ListGroupItem>
          <ListGroupItem hidden={email.attachments.length === 0}>
            <b>Attachments: </b>
            <div>
              {email.attachments.map(attachment => (
                <Button size="sm" className="mr-1" onClick={() => openAttachment(attachment)}>
                  {attachment.filename}
                </Button>
              ))}
            </div>
          </ListGroupItem>
        </ListGroup>
        <div className="card-body">
          <div dangerouslySetInnerHTML={{ __html: email.html || email.textAsHtml }} />
        </div>
      </Collapse>
    </Card>
  )
};

function removeTrailingSlash(url) {
  return url.replace(/\/$/, "");
}

const baseUrl = process.env.NODE_ENV === 'development'
  ? 'http://localhost:1080'
  : removeTrailingSlash(`${window.location.origin}${window.location.pathname}`);

class App extends Component {

  state = {
    emails: null,
    activeEmail: null
  };

  componentDidMount() {
      let request = {
          credentials: 'same-origin',
      };
      fetch(`${baseUrl}/api/emails`, request)
          .then(resp => resp.json())
          .then(emails => {
              this.setState({emails: emails});
          });
  }

  handleToggle = email => () => {
    if (this.state.activeEmail === email.messageId) {
      this.setState({ activeEmail: null });
    } else {
      this.setState({ activeEmail: email.messageId });
    }
  };

  render() {
    const isLoading = !this.state.emails;
    const isEmpty = !isLoading && this.state.emails.length === 0;
    const hasEmails = !isLoading && !isEmpty;
    return (
      <Container>
        <header>
          <h1 className="my-4">
            Emails
          </h1>
        </header>
        { hasEmails && this.state.emails.map(email => (
          <Email email={email}
                 isOpen={this.state.activeEmail === email.messageId}
                 onToggle={this.handleToggle(email)}
                 key={email.messageId} />
          ))
        }
        { isEmpty && (
          <div className="alert alert-info">
            Empty mailbox
          </div>
        ) }
      </Container>
    );
  }
}

export default App;
