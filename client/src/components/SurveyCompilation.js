import { Col, Row, Button, Form, Card, Alert, Spinner } from 'react-bootstrap';
import { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';

import { Answer, Question, Survey, User } from '../model/model';
import { Message } from '../model/utility';
import API from '../API';



function SurveyCompilation(props) {
    const { user, survey, setUser, setSurvey, setMessage } = props;
    const history = useHistory();


    /* Used to retrive questions from server */
    const TYPE = { CLOSED: 0, OPEN: 1 };


    /* Used to locally store answers to the quesitions */
    const [answerList, setAnswerList] = useState([]);
    const updateAnswerList = (value, index) => {
        const copy = [...answerList];
        copy[index] = value;
        setAnswerList(copy);
    };

    const [loading, setLoading] = useState(true);

    /* State variables for form validation */
    const [validated, setValidated] = useState(false);
    const [errMessage, setErrMessage] = useState('');
    const [submitAll, setSubmitAll] = useState(false);

    /******* useEffects *******/
    /* Initial load */
    useEffect(() => {
        setMessage('');

        /* Function to retrieve the questionList with related closed answers */
        API.loadQuestionsAndClosedAnswersBySurveyId('user', survey.sID)
            .then(result => { /* result is the questionList from server */
                setSurvey(new Survey(survey.sID, survey.title, survey.adID, result));
                // setLoading(false);

                /* Set answerList with the same length of questionList */
                const arr = new Array(result.length);
                setAnswerList(arr);

                setLoading(false);
            })
            .catch(err => {
                setErrMessage(new Message("Impossible to load questions! Please, try again later..."));
                console.error(err);
            });
    },
        []
    );

    /* Final upload */ /* it can be done in App.js */
    useEffect(() => {
        if (submitAll) {
            /* Function to store the user info */
            API.addUser(user)
                .then(userID => {
                    setUser(user => new User(userID, user.name));
                    // setLoading(false);
                    return userID;
                })
                .then((userID) => {
                    survey.questions.forEach((question, index) => {
                        if (question.type === TYPE.OPEN && answerList[index]) { /* only NOT empty answers are sent to the server */
                            if (answerList[index].text) {
                                API.addOpenAnswer(userID, answerList[index]);

                            }
                        } else if (question.type === TYPE.CLOSED && answerList[index]) { /* only NOT empty answers are sent to the server */
                            let answers = [];
                            answerList[index].forEach(a => {
                                if (a) { /* only NOT empty answers are sent to the server */
                                    answers.push(a);
                                }
                            });
                            const q = new Question(question.qID, question.title, question.type, question.min, question.max, answers, question.sID);
                            API.addClosedAnswer(userID, q);
                        }
                    })
                })
                .then(() => {
                    setLoading(false);
                    setMessage(new Message('Thank you, ' + user.name + '! Your responses are successfully stored!', 'success'));

                    /* Redirect to the route of the surveys */
                    history.push('/user/surveys/');
                })
                .catch(err => {
                    setErrMessage(new Message("Impossible to store your responses! Please, try again later..."));
                    console.error(err);
                });
        }
    },
        [submitAll]
    );

    /**************************/


    /* Submitting the Survey after validation */
    const handleSubmit = (event) => {
        // stop event default and propagation
        event.preventDefault();
        event.stopPropagation();

        const form = event.currentTarget;

        // check if form is valid using HTML constraints
        if (form.checkValidity() === false) {
            setValidated(true); // enables bootstrap validation error report
            setErrMessage(new Message('See errors above. When you fix them, close this message and try to Submit the Survey again.'));
            event.stopPropagation();
        }


        /* VALIDATION before submit */
        let atLeastOneAnswer = false;
        survey.questions.forEach((question, index) => {
            if (question.type === TYPE.OPEN && answerList[index]) { /* only NOT empty answers */
                if (answerList[index].text) {
                    return atLeastOneAnswer = true;
                }
            } else if (question.type === TYPE.CLOSED && answerList[index]) { /* only NOT empty answers */
                answerList[index].forEach(a => {
                    if (a) { /* only NOT empty answers */
                        return atLeastOneAnswer = true;
                    }
                });
            }
        })


        if (!atLeastOneAnswer) {
            setErrMessage(new Message('Provide at least an answer for submitting the survey'));

        }
        else if (form.checkValidity() === true) {
            setErrMessage('');
            setLoading(true);
            setSubmitAll(true);
        }
    };

    return (
        <>
            <Title user={user} surveyTitle={survey.title} />
            <br />

            {
                loading &&
                <Row className="justify-content-center">
                    <Spinner animation="border" variant="primary" />
                    <h5>Please wait, loading questions...</h5>
                </Row>
            }

            <Form noValidate validated={validated} onSubmit={handleSubmit} key={'OverallForm'}>

                {
                    !loading &&
                    survey.questions && survey.questions.map((question, index) =>
                        <div key={'divQL_' + question.qID}>

                            <QuestionCard key={'QC_' + question.qID}
                                question={question} TYPE={TYPE} qIndex={index} updateAnswerList={updateAnswerList}
                            />
                            <br />

                        </div>
                    )
                }

                {errMessage &&
                    <Row key={'row_alert_SuveyCompilation'} className="justify-content-center">
                        {/* <Col> */}
                        <br />
                        <Alert key={'alert_SuveyCompilation'} variant={errMessage.type} onClose={() => setErrMessage('')} dismissible >{errMessage.msg}</Alert>
                        {/* </Col> */}
                    </Row>
                }

                {
                    !loading &&
                    <Row className="justify-content-center">
                        <Button variant="primary" type="submit" >Submit Survey</Button>
                    </Row>
                }

                <br />
            </Form>



        </>
    )
};

function Title(props) {
    return (
        <>
            <Col>
                <h1>Survey: {props.surveyTitle}</h1>
            </Col>
            <Col>
                <h2>User: {props.user.name}</h2>
            </Col>
        </>
    )
};

function QuestionCard(props) {
    const { question, qIndex, updateAnswerList, TYPE } = props;

    return (
        <Card key={'card_' + question.qID}>
            <Card.Header as="h4" key={'card-header_' + question.qID}>{question.title}</Card.Header>
            <Card.Body key={'card-body_' + question.qID}>

                {
                    question.type === TYPE.CLOSED ?

                        <ClosedAnswer key={'CA_' + question.qID}
                            question={question} qIndex={qIndex} updateAnswerList={updateAnswerList}
                        />
                        :
                        <OpenAnswer key={'OA_' + question.qID}
                            question={question} qIndex={qIndex} updateAnswerList={updateAnswerList} />
                }

            </Card.Body>

            {
                question.type === TYPE.CLOSED ?
                    /* Closed answer */
                    <Card.Footer className="text-muted">
                        <Card.Text>
                            Minimum number of answers: {question.min}
                            <br />
                            Maximum number of answers: {question.max}
                        </Card.Text>
                    </Card.Footer>
                    :
                    /* Open answer */
                    <Card.Footer className="text-muted">
                        <Form.Group controlId={'formMandatory_' + question.qID}>
                            <Form.Check disabled type="switch" /* id={"switch-mandatory"+ question.qID} */ label="Mandatory" checked={question.min} /* onChange={ev => setIsImportant(ev.target.checked)} */ />
                        </Form.Group>
                    </Card.Footer>
            }

        </Card>
    )
}


function ClosedAnswer(props) {
    const { question, qIndex, updateAnswerList } = props;

    const [checkboxList, setCheckboxList] = useState(new Array(question.answers.length));
    const updateCheckboxListAndAnswerList = (value, index, qIndex) => {
        const copy = [...checkboxList];
        copy[index] = value;
        setCheckboxList(copy);
        updateAnswerList(copy, qIndex); /* Update of the element that contains the answers checked related to the Submit action*/
    };

    /* Variable state for validation */
    const [numOfCheckedAnswers, setNumOfCheckedAnswers] = useState(new Number(0));
    const [errorMessage, setErrorMessage] = useState();


    const handleToggle = (checked, index, answer) => {

        let num = numOfCheckedAnswers;
        if (checked) {
            num++;
            setNumOfCheckedAnswers(oldNum => oldNum + 1);
        } else {
            answer = undefined;
            num--;
            setNumOfCheckedAnswers(oldNum => oldNum - 1);
        }

        /* Update of the list of checked answers    */
        /* AND                                      */
        /* Update of the element that contains the answers checked related to the Submit action*/
        updateCheckboxListAndAnswerList(answer, index, qIndex);
    }

    return (
        <>
            <Form.Group className="m-0" controlId={"formBasicCheckbox_" + question.qID}>
                {
                    question.answers.map((a, index) =>
                        <Form.Check custom type="checkbox" id={"check-id_" + a.anID} key={"check-key_" + a.anID} label={a.text}
                            onChange={(ev) => handleToggle(ev.target.checked, index, a)}
                            /* Validation for min and max answers */
                            required={(numOfCheckedAnswers < question.min) ? true : false}
                            disabled={(numOfCheckedAnswers >= question.max) && !checkboxList.find(ans => ans === a)}
                        />
                    )
                }
            </Form.Group>

            {errorMessage &&
                <Row key={'row_alert_' + question.qID}>
                    <Col>
                        <br />
                        <Alert key={'alert_' + question.qID} variant={errorMessage.type} /* onClose={() => setMessage('')} dismissible  */>{errorMessage.msg}</Alert>
                    </Col>
                </Row>
            }
        </>
    )
}

function OpenAnswer(props) {
    const { question, qIndex, updateAnswerList } = props;

    const [text, setText] = useState('');
    const onChange = (newText) => {


        //simple validation in addition to the react bootstrap validation
        if (newText.charAt(0) === ' ') {
            alert('Start your response without any space');
        } else {
            setText(newText);

            const newAnswer = new Answer(undefined, newText, question.qID);
            updateAnswerList(newAnswer, qIndex);
        }

    }


    return (
        <Form.Group controlId={"responseArea_" + question.qID}>
            <Form.Label>Response</Form.Label>
            {/* <Form.Control required type="text" placeholder="Enter Description..." value={'description'} onChange={ev => setDescription(ev.target.value)} /> */}
            <Form.Control as="textarea" required={question.min}
                rows={3} placeholder="Enter Response..." maxLength={200} value={text} onChange={ev => onChange(ev.target.value)} />
            <Form.Control.Feedback type="invalid"> Please provide a response. </Form.Control.Feedback>
            <Form.Text muted>
                Response must be at most 200 characters long.
            </Form.Text>
        </Form.Group>
    )
}

export default SurveyCompilation;
