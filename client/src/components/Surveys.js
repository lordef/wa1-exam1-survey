import { User } from '../model/model';

import { Row, Col, ListGroup, Modal, Button, Form, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { useHistory } from "react-router-dom";
import { useState } from 'react';


function Surveys(props) {
    return (
        <>
            <Title />
            <SurveyList surveys={props.surveyList} {...props} />
        </>
    )
};

function Title(props) {
    return (
        <>
            <Col>
                <h1>Surveys</h1>
            </Col>
            <br />
            <Row as='h4'>
                <Col>Survey</Col>
            </Row>
        </>
    )
};

function SurveyList(props) {

    return (
        <ListGroup as="ul" variant="flush">
            {
                props.surveys && props.surveys.map(survey =>
                    <SurveyRow key={survey.sID} survey={survey} {...props} />
                )
            }
        </ListGroup>
    )
};


function SurveyRow(props) {
    const { survey, addUserAndSelectSurvey, setSurvey } = props;

    /* State variable for opening and closing the Modal */
    const [show, setShow] = useState(false);
    const handleClose = () => setShow(false);
    const handleShow = (survey) => {
        setShow(true);
        reset();
        setSurvey(survey);
    }

    /*State variable for form*/
    const [name, setName] = useState();

    /* State variables for form validation */
    const [validated, setValidated] = useState(false);
    // const [errorMessage, setErrorMessage] = useState('');

    const history = useHistory();



    /* Resetting the Modal */
    const reset = () => {
        setName('');

        // setErrorMessage('');
        setValidated(false);
    }

    /* Submitting the Modal after validation */
    const handleSubmit = (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        if (form.checkValidity() === false) {
            event.stopPropagation();
        }

        // setErrorMessage('');
        setValidated(true);
        if (form.checkValidity() === true) {

            const u = new User(undefined, name);
            addUserAndSelectSurvey(u, survey);
            handleClose();

            /* Redirect to the route of the survey selected */
            history.push('/user/surveys/survey');
        }
    };


    /* Set-up OverlayTrigger placement prop  */
    const placement = 'bottom';

    return (
        <>

            <OverlayTrigger
                key={placement + survey.sID}
                placement={placement}
                overlay={
                    <Tooltip key={`tooltip-${placement}` + survey.sID}>
                        Click to fill out this survey
                    </Tooltip>
                }
            >

                {/* <ListGroup.Item as='a' key={props.survey.sID} action onClick={handleShow}> */}
                <ListGroup.Item as='a' key={'li_'+ survey.sID}
                    action onClick={() => handleShow(survey)}>
                    {/* <h5> {survey.title} </h5> */}
                    <Row as='h5'>
                        <Col>{survey.title}</Col>
                    </Row>
                </ListGroup.Item>

            </OverlayTrigger>


            <Modal show={show} onHide={handleClose}>

                <Modal.Header closeButton>
                    <Modal.Title>Survey: {survey.title} </Modal.Title>
                </Modal.Header>

                <Form noValidate validated={validated} onSubmit={handleSubmit}>
                    <Modal.Body>
                        <Form.Group controlId="formName">
                            <Form.Label>Name</Form.Label>
                            <Form.Control required type="text" placeholder="Enter your name" value={name} onChange={ev => setName(ev.target.value)} />
                            {/* 
                            <Form.Text className="text-muted">
                                We'll never share your email with anyone else.
                            </Form.Text> 
                            */}
                            <Form.Control.Feedback type="invalid"> Please provide a name. </Form.Control.Feedback>
                        </Form.Group>
                    </Modal.Body>

                    <Modal.Footer>
                        <Button variant='secondary' onClick={handleClose}>Cancel</Button>
                        <Button variant="primary" type="submit"> Submit </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

        </>
    )
}

export default Surveys;
