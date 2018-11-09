import React, {Component} from 'react';
import {Card, CardHeader, Col, Collapse, Container, ListGroup, ListGroupItem, Row} from 'reactstrap';
import moment from 'moment';

const Email = ({email, isOpen, onToggle}) => {
  let from = email.from.value[0];
  let to = email.to.value[0];
  return (
      <Card>
        <CardHeader onClick={onToggle}>
          <Row>
            <Col className="px-2" md={2}>
              {moment(email.date).format('YYYY-MM-DD HH:mm:ss')}
            </Col>
            <Col className="px-2" md={4}>
              <div className="text-truncate" title={from.name}>
                {from.address}
              </div>

            </Col>
            <Col className="px-2" md={6}>
              <div className="text-truncate">
                {email.subject}
              </div>
            </Col>
          </Row>
        </CardHeader>
        <Collapse isOpen={isOpen}>
          <ListGroup className="list-group-flush">
            <ListGroupItem>
              <strong>From:&nbsp;</strong>
              <span dangerouslySetInnerHTML={{__html: email.from.html}}/>
            </ListGroupItem>
            <ListGroupItem>
              <strong>To:&nbsp;</strong>
              <span dangerouslySetInnerHTML={{__html: email.to.html}}/>
            </ListGroupItem>
            <ListGroupItem>
              <strong>Subject:&nbsp;</strong>
              {email.subject}
            </ListGroupItem>
          </ListGroup>
          <div className="card-body">
            <div dangerouslySetInnerHTML={{__html: email.html || email.textAsHtml}}/>
          </div>
          <ListGroup className="list-group-flush" hidden={email.attachments.length === 0}>
            <ListGroupItem>
              <b>Attachments: </b>{email.attachments.map(attachment => attachment.filename).join(', ')}
            </ListGroupItem>
          </ListGroup>
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
      this.setState({activeEmail: null});
    } else {
      this.setState({activeEmail: email.messageId});
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
          {hasEmails && this.state.emails.map(email => (
              <Email email={email}
                     isOpen={this.state.activeEmail === email.messageId}
                     onToggle={this.handleToggle(email)}
                     key={email.messageId}/>
          ))
          }
          {isEmpty && (
              <div className="alert alert-info">
                Empty mailbox
              </div>
          )}
        </Container>
    );
  }
}

export default App;
