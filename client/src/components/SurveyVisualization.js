import { Col, Row, Form, Card, Pagination, Alert, Spinner } from 'react-bootstrap';
import { useState, useEffect } from 'react';

import { Survey, User } from '../model/model';
import { Message } from '../model/utility';
import API from '../API';


function SurveyVisualization(props) {
    const { user, survey, setUser, setSurvey } = props;

    const [loading, setLoading] = useState(true);

    const TYPE = { CLOSED: 0, OPEN: 1 };

    /* Used to locally store users related to the current survey */
    const [userList, setUserList] = useState([]);
    const [userAnswerList, setUserAnswerList] = useState([]);
    const [userIndex, setUserIndex] = useState(0);
    const increaseUserIndex = () => {
        setLoading(true);
        const numOfUsers = userList.length;
        let currentIndex = userIndex;
        currentIndex++;
        if (currentIndex === numOfUsers) {
            currentIndex = 0;
        }
        setUserIndex(currentIndex);
        setUser(userList[currentIndex]);
        return currentIndex;
    };

    const decreaseUserIndex = () => {
        setLoading(true);
        const numOfUsers = userList.length;
        let currentIndex = userIndex;
        currentIndex--;
        if (currentIndex === -1) {
            currentIndex = numOfUsers - 1;
        }
        setUserIndex(currentIndex);
        setUser(userList[currentIndex]);
        return currentIndex;
    };


    /* State variables for form validation */
    const [errMessage, setErrMessage] = useState('');

    /******* useEffects *******/
    /* Initial load */
    useEffect(() => {
        /* Function to retrieve the questionList with related closed answers */
        API.loadQuestionsAndClosedAnswersBySurveyId('admin', survey.sID)
            .then(result => { /* result is the questionList from server */

                setSurvey(new Survey(survey.sID, survey.title, survey.adID, result, survey.nCompilations));

            })
            .then(() => {
                API.loadUsersbySurveyId(survey.sID)
                    .then(users => {
                        setUserList(users);
                        // setUserIndex(0); /* disabled because UserIndex is setted to zero at mount time */

                        if (users[0] !== undefined) { //return the first user if exists
                            const u = new User(users[0].uID, users[0].name);
                            setUser(u);
                            return u.uID;
                        }
                    })
                    .then((firstUserID) => {
                        if (firstUserID) {
                            API.loadAnswersByUserIdAndSurveyId(firstUserID, survey.sID)
                                .then(answers => {
                                    setUserAnswerList(answers);
                                    setLoading(false);
                                })
                        } else {
                            // setErrMessage(new Message("User list for this survey is empty..."));
                            setUserAnswerList([]);
                            setLoading(false);
                        }
                    })
            })
            .catch(err => {
                setErrMessage(new Message("Impossible to load questions and answers! Please, try again later..."));
                console.error(err);
            });
    },
        []
    );

    /* Load asnwerList of a certain user and survey */
    useEffect(() => {
        if (userList[userIndex]) {
            /* Function to retrieve the answerList related to a certain user and survey */
            API.loadAnswersByUserIdAndSurveyId(user.uID, survey.sID)
                .then(answers => { /* result is the user answerList from server */
                    setUserAnswerList(answers);
                    // setUser(userList[userIndex]); /* disabled because setUser is used in increaseUserIndex and decreaseUserIndex functions */

                    setLoading(false);
                })
                .catch(err => {
                    setErrMessage(new Message("Impossible to load answers of the user with userID: " + userList[userIndex].uID + "! Please, try again later..."));
                    console.error(err);
                });
        }
    },
        [userIndex]
    );
    /**************************/

    return (
        <>
            <Title user={user} surveyTitle={survey.title} userList={userList}
                loading={loading} userListLength={userList.length} />

            {
                loading ?
                    <Row className="justify-content-center">
                        <Spinner animation="border" variant="primary" />
                        <h5>Please wait, loading answers...</h5>
                    </Row>

                    :
                    <>

                        <UserPagination user={user} userList={userList} survey={survey}
                            userIndex={userIndex} setUserIndex={setUserIndex}
                            decreaseUserIndex={decreaseUserIndex} increaseUserIndex={increaseUserIndex}
                        />

                        <br />

                        <Form noValidate key={'OverallForm'}>

                            {
                                survey.questions && survey.questions.map((question, index) =>
                                    <div key={'divQL_' + question.qID}>
                                        <QuestionCard key={'QC_' + question.qID}
                                            question={question} TYPE={TYPE}
                                            userAnswerList={userAnswerList}
                                            userListLength={userList.length} />
                                        <br />
                                    </div>
                                )
                            }

                            <br />
                        </Form>
                    </>
            }
            {errMessage &&
                <Row key={'row_alert_SuveyCompilation'} className="justify-content-center">
                    <br />
                    <Alert key={'alert_error_SuveyCompilation'} variant={errMessage.type} onClose={() => setErrMessage('')} dismissible >{errMessage.msg}</Alert>
                </Row>
            }

        </>
    )
};

function Title(props) {
    const { surveyTitle, user, userListLength } = props;

    return (
        <>
            <Col>
                <h1>Survey: {surveyTitle}</h1>
            </Col>
            {props.user && userListLength !== 0 &&
                <Col>
                    <h2>User: {user.name}</h2>
                </Col>
            }

        </>
    )
};

function UserPagination(props) {
    const { user, userList, userIndex, setUserIndex, decreaseUserIndex, increaseUserIndex, survey } = props;

    return (
        <>
            {user &&
                (
                    userList.length === 0 || userList.length === 1 ?
                        <Row key={'alert_row_User_SurveyVisualization'} className="justify-content-end">
                            {
                                userList.length === 0 ?
                                    <Alert key={'alert_noUser'} variant={'warning'} >
                                        {'No user submitted this survey'}
                                    </Alert>
                                    :
                                    <Alert key={'alert_singleUser_SurveyVisualization'} variant={'primary'} >
                                        {user.name + ' is the only user who submitted this survey'}
                                    </Alert>
                            }


                        </ Row>
                        :
                        <>
                            <Row key={'row_nCompilations'} className="justify-content-end" >
                                <h4>{'Total number of compilations ' + survey.nCompilations}</h4>
                            </Row>
                            <Row key={'row_userPagination'} className="justify-content-end">
                                <Pagination size={'lg'} >
                                    <Pagination.Prev disabled={userIndex === 0} onClick={() => decreaseUserIndex()} >
                                        Previous user
                                    </Pagination.Prev>

                                    {/* Useful for viewing all available users                                
                                {
                                    userList.map((u, index) => u stands for user
                                        <Pagination.Item
                                            key={'PI_' + index}
                                            active={u.uID === user.uID}
                                            onClick={() => setUserIndex(index)}>
                                            {index}
                                        </Pagination.Item>
                                    )
                                } 
                                */}

                                    {/* Current user index */}
                                    <Pagination.Item key={'PI_' + userIndex} active >
                                        {userIndex + 1}
                                    </Pagination.Item>

                                    <Pagination.Next disabled={userIndex === userList.length - 1} onClick={() => increaseUserIndex()}>
                                        Next user
                                    </Pagination.Next>
                                </Pagination>
                            </Row>
                        </>
                )
            }


        </>
    )
};


function QuestionCard(props) {
    const { question, TYPE, userAnswerList, userListLength } = props;

    return (
        <Card key={'card_' + question.qID}>
            <Card.Header as="h4" key={'card-header_' + question.qID}>{question.title}</Card.Header>
            <Card.Body key={'card-body_' + question.qID}>

                {
                    question.type === TYPE.CLOSED ?

                        <ClosedAnswer key={'CA_' + question.qID}
                            question={question}
                            userAnswerList={userAnswerList}
                        />
                        :
                        <OpenAnswer key={'OA_' + question.qID}
                            question={question}
                            userAnswerList={userAnswerList}
                            userListLength={userListLength}
                        />
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
    const { question, userAnswerList } = props;

    /* 
        Section to handle message that warn about not given answers - 
        used useEffect to avoid "Too many re-renders" of the Alert component below" 
    */
    const message = new Message('User did not answer to this question', 'primary');
    const [showMessage, setShowMessage] = useState(false);
    const [atLeastOneCheckedAnswer, setAtLeastOneCheckedAnswer] = useState(false);

    useEffect(() => {
        if (showMessage) {
            setAtLeastOneCheckedAnswer(true);
        }
    }, [showMessage])

    const isChecked = (anID) => {
        const checked = userAnswerList.find(ans => ans.anID === anID);
        if (checked && !showMessage) {
            setShowMessage(true);
        }
        return checked;
    }
    /**********************************************/

    return (
        <>
            <Form.Group className="m-0" controlId={"formBasicCheckbox_" + question.qID}>
                {
                    question.answers.map((a, index) =>
                        <Form.Check custom type="checkbox" id={"check-id_" + a.anID} key={"check-key_" + a.anID} label={a.text}
                            disabled
                            defaultChecked={isChecked(a.anID)}
                        />
                    )
                }
            </Form.Group>

            {
                !atLeastOneCheckedAnswer && userAnswerList.length !== 0 &&
                <>
                    <br />
                    <Row key={'CA_row_alert_' + question.qID} className="justify-content-center">
                        <Alert key={'CA_alert_' + question.qID} variant={message.type}  >
                            {message.msg}
                        </Alert>
                    </Row>
                </>
            }
        </>
    )
}

function OpenAnswer(props) {
    const { question, userAnswerList, userListLength } = props;

    const userAnswer = userAnswerList.find(ans => ans.qID === question.qID);
    const [text, setText] = useState(userAnswer ? userAnswer.text : '');

    const message = new Message('User did not answer to this question', 'primary');

    return (
        <>
            <Form.Group controlId={"responseArea_" + question.qID}>
                <Form.Label>Response</Form.Label>
                {/* <Form.Control required type="text" placeholder="Enter Description..." value={'description'} onChange={ev => setDescription(ev.target.value)} /> */}
                <Form.Control as="textarea" disabled required={question.min} rows={3} placeholder="Enter Response..." maxLength={200} value={text} />
                <Form.Control.Feedback type="invalid"> Please provide a response. </Form.Control.Feedback>
                <Form.Text muted>
                    Response must be at most 200 characters long.
                </Form.Text>
            </Form.Group>

            {
                !text && userListLength !== 0 &&
                <Row key={'OA_row_alert_' + question.qID} className="justify-content-center">

                    <Alert key={'OA_alert_' + question.qID} variant={message.type}  >
                        {message.msg}
                    </Alert>
                </Row>
            }


        </>

    )
}

export default SurveyVisualization;
