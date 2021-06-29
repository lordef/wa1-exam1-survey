import { Row, Col, ListGroup, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { useHistory } from "react-router-dom";


function AdminSurveys(props) {
    const { admin, surveyList } = props;

    return (
        <>
            <Title admin={admin} />
            <SurveyList surveys={surveyList} {...props} />
        </>
    )
};

function Title(props) {
    const { admin } = props;
    return (
        <>
            <Col>
                <h1>{admin.username + `'s Surveys`}</h1>
            </Col>
            <br />
            <Row as='h4'>
                <Col>Survey</Col>
                <Col>Number of compilations</Col>
            </Row>
        </>
    )
};

function SurveyList(props) {

    return (
        <ListGroup as="ul" variant="flush">
            {
                props.surveys && props.surveys.map(survey =>
                    <SurveyRow key={survey.sID+survey.title} survey={survey} {...props} />
                )
            }
        </ListGroup>
    )
};


function SurveyRow(props) {
    const { survey, setSurvey } = props;

    const history = useHistory();

    const handleSubmit = (event) => {
        setSurvey(survey);

        /* Redirect to the route of the survey selected */
        history.push('/admin/surveys/survey');

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
                        {
                            survey.nCompilations === 0 ?
                                'Click to view questions of this survey'
                                :
                                'Click to view results of this survey'
                        }
                    </Tooltip>
                }
            >

                {/* <ListGroup.Item as='a' key={props.survey.sID} action onClick={handleShow}> */}
                <ListGroup.Item as='a' key={'li_' + survey.sID}
                    action onClick={() => handleSubmit(survey)}>
                    {/* <h5> {survey.title} </h5> */}
                    <Row as='h5'>
                        <Col>{survey.title}</Col>
                        <Col>{survey.nCompilations}</Col>
                    </Row>
                </ListGroup.Item>

            </OverlayTrigger>
        </>
    )
}

export default AdminSurveys;
