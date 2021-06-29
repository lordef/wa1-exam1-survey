import { Form, Button, Alert, Modal } from 'react-bootstrap';
import { useState } from 'react';
import { useHistory } from 'react-router-dom';

function LoginModal(props) {
  const { doLogIn, showModal, handleCloseModal } = props;

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const history = useHistory();

  const handleSubmit = (event) => {
    event.preventDefault();
    setErrorMessage('');
    const credentials = { username, password };

    // basic validation
    let valid = true;
    if (username === '' || password === '' /* || password.length < 6 */) {
      valid = false;
      setErrorMessage('Username and password cannot be empty.');
      setShowError(true);
    }

    if (valid) {
      handleCloseModal();
      doLogIn(credentials)
      .then(()=>history.push('/admin/surveys'))
        .catch((err) => {
          setErrorMessage(err);
          setShowError(true);
        })
    }


  };


  return (

    <Modal centered show={showModal} onHide={handleCloseModal}>

      <Form onSubmit={handleSubmit}>
        <Modal.Header>
          <Modal.Title>Admin area</Modal.Title>
        </Modal.Header>
        <Modal.Body>

          <Alert dismissible show={showError} onClose={() => setShowError(false)} variant="danger">
            {errorMessage}
          </Alert>

          <Form.Group controlId="username">
            <Form.Label>Username</Form.Label>
            <Form.Control required type="text" placeholder="Enter username" value={username} onChange={ev => setUsername(ev.target.value)} />
          </Form.Group>

          <Form.Group controlId="password">
            <Form.Label>Password</Form.Label>
            <Form.Control required type="password" placeholder="Password" value={password} onChange={(ev) => setPassword(ev.target.value)} />
          </Form.Group>

        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}> Cancel </Button>
          <Button variant="primary" type="submit"> Login </Button>

        </Modal.Footer>

      </Form>
    </Modal>
  );
}

function LogoutModal(props) {
  const { admin, doLogOut, showModal, handleCloseModal } = props;

  const history = useHistory();

  const handleSubmit = (event) => {
    event.preventDefault();
    handleCloseModal();
    doLogOut();

    /* Redirect to the route of the surveys */
    history.push('/user/surveys/');
  };

  return (

    <Modal centered show={showModal} onHide={handleCloseModal}>

      <Form onSubmit={handleSubmit}>
        <Modal.Header>
          <Modal.Title>{admin.username + ' area'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>

          {/* 
          <Alert dismissible show={showError} onClose={() => setShowError(false)} variant="danger">
            {errorMessage}
          </Alert> 
          */}

          {'Username: ' + admin.username}

        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}> Cancel </Button>
          {<Button variant="danger" type="submit"> Logout </Button>}
        </Modal.Footer>

      </Form>
    </Modal>
  );
}

export { LoginModal, LogoutModal };


