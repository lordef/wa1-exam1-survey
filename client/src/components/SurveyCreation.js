import { Col, Row, Button, Form, Card, Alert, InputGroup, FormControl, Spinner } from 'react-bootstrap';
import { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';

import { Answer, Question, Survey } from '../model/model';
import { Message } from '../model/utility';
import API from '../API';
import { iconDelete } from './icons';


function SurveyCreation(props) {
    const { survey, setSurvey, admin, setMessage, addSurveyToSurveyList } = props;
    // Survey(sID, title, adID, questions = [], nCompilations = 0) {

    const [title, setTitle] = useState('');
    const [questionList, setQuestionList] = useState(
        [
            new Question(undefined, '', 0, 0, 1, [new Answer(undefined, '', undefined)], undefined)
        ]
    );

    const [submitSurvey, setSubmitSurvey] = useState();
    const [validated, setValidated] = useState();

    const [loading, setLoading] = useState(false);


    const history = useHistory();

    const [errMessage, setErrMessage] = useState();


    /******* useEffects *******/
    /* Initial page set-up */
    useEffect(() => {
        setMessage('');
        setSurvey(new Survey(undefined, '', admin.adID, []));
    },
        []
    );

    /* Final upload */ /* it can be done in App.js */
    useEffect(() => {
        if (submitSurvey) {
            /* Function to store the survey info */
            API.addSurvey(survey)
                .then(() => {
                    setMessage(new Message('Thank you, ' + admin.username + '! Your new survey is successfully stored!', 'success'));
                    addSurveyToSurveyList(survey);

                    setLoading(false);

                    /* Redirect to the route of the surveys */
                    history.push('/admin/surveys/');
                }
                )
                .catch(err => {
                    setErrMessage(new Message("Impossible to store your survey! Please, try again later..."));
                    console.error(err);
                });
        }
    },
        [submitSurvey]
    );
    /**************************/


    /* Adding a question to questionList */
    const addQuestionToQuestionList = () => {
        let questions = [...questionList];
        questions.push(new Question(undefined, '', 0, 0, 1, [new Answer(undefined, '', undefined)], undefined));
        setQuestionList(questions);
    }

    /* Remove a question to questionList */
    const removeQuestionFromQuestionList = (qIndex) => {
        let questions = [...questionList];
        questions.splice(qIndex, 1);
        setQuestionList(questions);
    }

    /* Move a question inside questionList */
    const moveQuestionInQuestionList = (qIndex, move = 'up') => {
        let questions = [...questionList];
        let newIndex;
        move === 'up' ? newIndex = qIndex - 1 : newIndex = qIndex + 1;
        // const prevAnsIndex = qIndex - 1; 
        [questions[qIndex], questions[newIndex]] = [questions[newIndex], questions[qIndex]];
        setQuestionList(questions);
    }

    /* Update a question of questionList */
    const updateQuestionInQuestionList = (q, qIndex) => {
        let questions = [...questionList];
        questions[qIndex] = new Question(undefined, q.title, q.type, q.min, q.max, q.answers, undefined);
        setQuestionList(questions);
    }

    /* Submitting the Survey after validation */
    const handleSubmit = (event) => {
        // stop event default and propagation
        event.preventDefault();
        event.stopPropagation();

        const form = event.currentTarget;

        // check if form is valid using HTML constraints
        if (form.checkValidity() === false) {
            setValidated(true); // enables bootstrap validation error report
            setErrMessage(new Message('See errors above. When you fix them, close this message and try to Create the Survey again'));
            event.stopPropagation();
        }

        if (form.checkValidity() === true) {
            setErrMessage('');
            setSurvey(new Survey(undefined, title, admin.adID, questionList, 0));
            setLoading(true);
            setSubmitSurvey(true);
        }
    };


    return (
        <>
            <h1>New Survey</h1>

            <br />

            <Form noValidate validated={validated} onSubmit={handleSubmit} key={'SurveyForm'}>

                <TitleCard title={title} setTitle={setTitle} />

                <br />

                {
                    questionList.map((question, index) =>
                        <div key={'divQC' + index} >
                            <QuestionCard key={'QC_' + index}
                                question={question} qIndex={index} qLength={questionList.length}
                                removeQuestionFromQuestionList={removeQuestionFromQuestionList}
                                moveQuestionInQuestionList={moveQuestionInQuestionList}
                                updateQuestionInQuestionList={updateQuestionInQuestionList}
                            />
                            <br />
                        </div>
                    )
                }

                <Button onClick={addQuestionToQuestionList}>
                    <b>+ </b> Add question
                </Button>

                <br />

                {errMessage &&
                    <Row key={'row_alert_SuveyCreation'} className="justify-content-center">
                        <br />
                        <Alert key={'alert_SuveyCreation'} variant={errMessage.type} onClose={() => setErrMessage('')} dismissible >
                            {errMessage.msg}
                        </Alert>
                    </Row>
                }

                <br />

                <Row className="justify-content-center">
                    {
                        loading ?
                            <Button variant="primary" disabled size='lg'>
                                <Spinner
                                    as="span"
                                    animation="grow"
                                    size="sm"
                                    role="status"
                                    aria-hidden="true"
                                />
                                Loading...
                            </Button>
                            :
                            <Button variant="primary" type="submit" size='lg'>
                                Create Survey
                            </Button>
                    }


                </Row>

                <br />

            </Form>
        </>
    )

};

function TitleCard(props) {
    const { title, setTitle } = props;

    const onChange = (event) => {
        const newTitle = event.target.value;
        //VALIDATION done with react bootstrap validation

        // Update survey title
        setTitle(newTitle);
    }

    return (
        <Card>
            <Card.Header></Card.Header>
            <Card.Body>
                <Card.Title as='h4'>Title</Card.Title>
                <Form.Group>
                    <Form.Control required size="lg" type="text" placeholder="Enter survey title..."
                        value={title} onChange={ev => onChange(ev)}
                    />
                    <Form.Control.Feedback type="invalid"> Please provide a survey title. </Form.Control.Feedback>
                </Form.Group>
            </Card.Body>
            <Card.Footer></Card.Footer>
        </Card>
    )
};


function QuestionCard(props) {
    const { question, qIndex, qLength, removeQuestionFromQuestionList, moveQuestionInQuestionList, updateQuestionInQuestionList } = props;
    // Question(qID, title, type, min = 0, max = '', answers = [], sID) {

    const questionType = ['Closed-answer question', 'Open-ended question'];
    const TYPE = { CLOSED: 0, OPEN: 1 };

    const onChange = (q) => {
        updateQuestionInQuestionList(q, qIndex);
    }

    return (
        <Card key={'card_' + qIndex} /* className="text-center" */>
            <Card.Header as="h5" key={'card-header_' + qIndex}>
                <Row>

                    <Col className={'mx-auto'}>
                        {`Question ${qIndex + 1}`}
                    </Col>

                    <Button disabled={qLength === 1} /* disabled there is only a question */
                        key={'btn_del_q_' + qIndex} variant='outline-danger' onClick={() => removeQuestionFromQuestionList(qIndex)}
                        className={'mr-2'}
                    >
                        {iconDelete}
                        {' Delete question'}
                        {/* <b> - </b> */}
                    </Button>

                    <Button disabled={qIndex === 0}
                        key={'btn_up_q_' + qIndex} variant='outline-primary' onClick={() => moveQuestionInQuestionList(qIndex, 'up')}
                        className={'mr-2'}
                    >
                        Move question <b>up </b>
                    </Button>

                </Row>
            </Card.Header>

            <Card.Body key={'card-body_' + qIndex}>
                <Form.Group controlId={'QCForm1_' + qIndex}>
                    <Row>
                        <Col className='col-8'>
                            <Card.Title>Title</Card.Title>
                            <Form.Control required type="text" placeholder="Enter Question title..."
                                value={question.title} onChange={ev => onChange(new Question(question.qID, ev.target.value, question.type, question.min, question.max, question.answers, question.sID))}
                            />
                            <Form.Control.Feedback type="invalid"> Please provide a question title. </Form.Control.Feedback>
                        </Col>

                        <Col>
                            <Card.Title>Type</Card.Title>
                            {/* <Form.Label>Question type</Form.Label> */}
                            <Form.Control required as='select' value={question.type === TYPE.CLOSED ? questionType[0] : questionType[1]} onChange={ev => onChange(new Question(question.qID, question.title, ev.target.value === questionType[0] ? TYPE.CLOSED : TYPE.OPEN, question.min, question.max, question.answers, question.sID))} >
                                {questionType.map(type =>
                                    <option key={'qt' + type}>
                                        {type}
                                    </option>
                                )}
                            </Form.Control>
                        </Col>
                    </Row>
                </Form.Group>

                {
                    question.type === 0 && /* if question is CLOSED => insert closed answers */
                    <div key={'dicAMC_' + qIndex}>
                        <Card.Title>Closed answers</Card.Title>
                        <AnswersMultipleChoice key={'AMC_' + qIndex}
                            question={question} qIndex={qIndex} onChange={onChange} />

                    </div>

                }
            </Card.Body>

            <Card.Footer /* className="text-muted" */>
                <Form.Group controlId={'QCForm2_' + qIndex}>
                    {
                        question.type === 0 ?
                            /* CLOSED question */
                            <>
                                <InputGroup className="mb-3">

                                    <InputGroup.Prepend>
                                        <InputGroup.Text id="inputGroupMin-sizing-default">
                                            Minimum number of answers
                                        </InputGroup.Text>
                                    </InputGroup.Prepend>

                                    <FormControl
                                        required
                                        key={'min_' + qIndex}
                                        className='col-1'
                                        aria-label="Default"
                                        aria-describedby="inputGroupMin-sizing-default"
                                        type='number'
                                        placeholder='Min'
                                        min={0}
                                        max={question.answers.length}
                                        value={question.min}
                                        onChange={ev => onChange(new Question(question.qID, question.title, question.type, ev.target.value, question.max, question.answers, question.sID))}
                                    />
                                    <Form.Control.Feedback type="invalid"> Please provide a minimum number of answers.</Form.Control.Feedback>

                                </ InputGroup>

                                <InputGroup className="mb-3">

                                    <InputGroup.Prepend>
                                        <InputGroup.Text id="inputGroupMax-sizing-default">
                                            Maximum number of answers
                                        </InputGroup.Text>
                                    </InputGroup.Prepend>

                                    <FormControl
                                        className='col-1'
                                        key={'max_' + qIndex}
                                        aria-label="Default"
                                        aria-describedby="inputGroupMax-sizing-default"
                                        required
                                        type='number'
                                        placeholder='Max'
                                        min={1}
                                        max={question.answers.length}
                                        value={question.max}
                                        onChange={ev => onChange(new Question(question.qID, question.title, question.type, question.min, ev.target.value, question.answers, question.sID))}
                                    />
                                    <Form.Control.Feedback type="invalid"> Please provide a maximum number of answers.</Form.Control.Feedback>


                                </InputGroup>

                                <Form.Text className="text-muted">
                                    We recommend to create closed answers first, then set Minimum and Maximum numbers of them.
                                </Form.Text>
                            </>
                            :
                            /* OPEN question */
                            <Form.Check type="switch" id={"switch-mandatory" + qIndex} label="Mandatory"
                                checked={question.min}
                                onChange={ev => onChange(new Question(question.qID, question.title, question.type, ev.target.checked ? 1 : 0, ev.target.value, question.answers, question.sID))}

                            />
                    }

                    <Button disabled={qIndex === qLength - 1}
                        key={'btn_down_q_' + qIndex} variant='outline-primary' onClick={() => moveQuestionInQuestionList(qIndex, 'down')}
                        style={{ float: 'right' }}>
                        {/* {iconDown} */}
                        Move question <b>down</b>
                    </Button>

                </Form.Group>
            </Card.Footer>
        </Card >
    )
};


function AnswersMultipleChoice(props) {
    const { question, qIndex, onChange } = props;

    // const [answerTextList, setAnswerTextList] = useState(['']);

    const onChangeAnswer = (value, ansIndex) => {
        let answers = [...question.answers];
        answers[ansIndex] = new Answer(undefined, value, undefined);
        const newQ = new Question(question.qID, question.title, question.type, question.min, question.max, answers, question.sID);
        onChange(newQ, qIndex);
    }

    const addAnswer = () => {
        let answers = [...question.answers];
        answers.push(new Answer(undefined, '', undefined));
        const newQ = new Question(question.qID, question.title, question.type, question.min, question.max, answers, question.sID);
        onChange(newQ, qIndex);
    }

    const removeAnswer = (ansIndex) => {
        let answers = [...question.answers];
        answers.splice(ansIndex, 1);
        const newQ = new Question(question.qID, question.title, question.type, question.min, question.max, answers, question.sID);
        onChange(newQ, qIndex);
    }

    const moveAnswer = (ansIndex, move = 'up') => {
        let answers = [...question.answers];
        let newIndex;
        move === 'up' ? newIndex = ansIndex - 1 : newIndex = ansIndex + 1;

        [answers[ansIndex], answers[newIndex]] = [answers[newIndex], answers[ansIndex]];
        const newQ = new Question(question.qID, question.title, question.type, question.min, question.max, answers, question.sID);
        onChange(newQ, qIndex);
    }

    

    return (
        <>

            <Form.Group controlId={'AMCForm_' + qIndex}>
                {
                    question.answers.map((ans, index) =>
                        <InputGroup className="mb-3" key={'IG_ans' + qIndex + index}>

                            <InputGroup.Prepend>
                                <InputGroup.Checkbox disabled aria-label="Checkbox for following text input" />
                            </InputGroup.Prepend>

                            <FormControl required
                                key={'text_in_ans_' + qIndex + index}
                                aria-label="Text input with checkbox" className='col-5'
                                value={ans.text} onChange={ev => onChangeAnswer(ev.target.value, index)}
                                className={'mr-1'} />
                            <Form.Control.Feedback type="invalid" >Please provide an answer.</Form.Control.Feedback>

                            <Button disabled={index === 0} 
                                key={'btn_del_ans_' + qIndex + index} variant='danger' onClick={() => removeAnswer(index)}
                                className={'mr-2'}>
                                {iconDelete}
                                {/* <b> - </b> */}
                            </Button>

                            <Button disabled={index === 0} 
                                key={'btn_up_ans_' + qIndex + index} variant='primary' onClick={() => moveAnswer(index, 'up')}
                                className={'mr-2'}>
                                {/* {iconUp} */}
                                <b> up </b>
                            </Button>

                            <Button disabled={index === question.answers.length - 1} 
                                key={'btn_down_ans_' + qIndex + index} variant='primary' onClick={() => moveAnswer(index, 'down')}
                                className={'mr-2'}>
                                {/* {iconDown} */}
                                <b> down </b>
                            </Button>


                        </InputGroup>
                    )

                }


            </Form.Group>

            <Button key={'btn_plus_' + qIndex} variant='primary' onClick={addAnswer}>
                <b>+ </b> Add answer
            </Button>

        </>
    )
}


export default SurveyCreation;
