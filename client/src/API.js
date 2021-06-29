import { Answer, Question, Survey, User } from "./model/model";

const url = 'http://localhost:3000';


/*************************/
/******* USER APIs *******/

//Retrieve the list of all the available surveys
async function loadSurveys() {
    let surveys = [];    /* Creation of a list of surveys for storing data from server */

    // call GET
    const response = await fetch(url + '/api/user/surveys');
    let surveysJson = await response.json();

    if (response.ok) {
        surveysJson.forEach(s => {
            surveys = [...surveys, new Survey(s.sID, s.title, s.adID)];
        });
        return surveys;
    } else
        throw surveysJson;

}

//Create a new User
async function addUser(newUser) {

    const response = await fetch(url + '/api/user/surveys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', },
        body: JSON.stringify(newUser),
    });

    if (response.ok) {
        const userID = await response.json();
        return userID;
    }
    else {
        try {
            const errDetail = await response.json();
            throw errDetail.message;
        }
        catch (err) {
            throw err;
        }
    }
}

//Insert a CLOSED-answer for a user 
async function addClosedAnswer(userID, question) {
    const body = { "uID": userID, "question": question };

    fetch(url + '/api/user/surveys/survey/answers/closed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', },
        body: JSON.stringify(body),
    })
        .catch(() => { return ({ error: "Cannot communicate with the server." }) }); // connection errors
}


//Insert a OPEN-ended answer for a user
async function addOpenAnswer(userID, answer) {
    const body = { "uID": userID, "text": answer.text, "qID": answer.qID };

    fetch(url + '/api/user/surveys/survey/answers/open', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', },
        body: JSON.stringify(body),
    })
        .catch(() => { return ({ error: "Cannot communicate with the server." }) }); // connection errors
}

/*** END -  USER APIs ****/
/*************************/


/**************************/
/******* ADMIN APIs *******/

/**** ADMIN - Session APIs ***/

async function logIn(credentials) {
    let response = await fetch(url + '/api/sessions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
    });
    if (response.ok) {
        const admin = await response.json();
        return admin;
    }
    else {
        try {
            const errDetail = await response.json();
            throw errDetail.message;
        }
        catch (err) {
            throw err;
        }
    }
}

async function logOut() {
    await fetch(url + '/api/sessions/current', { method: 'DELETE' });
}

async function getUserInfo() {
    const response = await fetch(url + '/api/sessions/current');
    const userInfo = await response.json();
    if (response.ok) {
        return userInfo;
    } else {
        throw userInfo;  // an object with the error coming from the server
    }
}


/**** ADMIN - Survey APIs ***/

/* 
    Retrieve a list of surveys that fulfill a given admin id
      (by listing their title and number of received responses)
*/
async function loadSurveysByAdminId(adminID) {
    let surveys = [];    /* Creation of a list of surveys for storing data from server */

    // call GET
    const response = await fetch(url + '/api/admin/' + adminID + '/surveys');
    let surveysJson = await response.json();

    if (response.ok) {
        surveysJson.forEach(s => {
            // surveys = [...surveys, new Task(t.id, t.description, t.important == 1, t.private == 1, t.deadline, t.completed)];
            surveys = [...surveys, new Survey(s.sID, s.title, adminID, [], s.nCompilations)];
        });
        return surveys;
    } else
        throw surveysJson;

}


// Retrieve a list of users that fulfill a given survey id
async function loadUsersbySurveyId(surveyID) {
    let users = [];    /* Creation of a list of surveys for storing data from server */

    // call GET
    const response = await fetch(url + '/api/admin/surveys/' + surveyID + '/users');
    let usersJson = await response.json();

    if (response.ok) {
        usersJson.forEach(u => {
            // surveys = [...surveys, new Task(t.id, t.description, t.important == 1, t.private == 1, t.deadline, t.completed)];
            users = [...users, new User(u.uID, u.name)];
        });
        return users;
    } else
        throw usersJson;

}


//Retrieve a list of all the questions that fulfill a given survey id
// Useful for ADMIN and USER
async function loadQuestionsAndClosedAnswersBySurveyId(userType = 'user', surveyID) {
    let questions = [];    /* Creation of a list of questions for storing data from server */

    // call GET
    const response = await fetch(url + '/api/' + userType + '/surveys/' + surveyID);
    let questionsJson = await response.json();

    if (response.ok) {
        questionsJson.forEach(q => {
            // surveys = [...surveys, new Task(t.id, t.description, t.important == 1, t.private == 1, t.deadline, t.completed)];
            // let answers = q.answers.map(a => new Answer(a.anID, a.text, a.qID));
            questions = [...questions, new Question(q.qID, q.title, q.type, q.min, q.max, q.answers, q.sID)];
        });
        return questions;
    } else
        throw questionsJson;

}


// Retrieve all answers related to a questionID
// Useful for admin and user  
async function loadAnswersByQuestionId(userType = 'user', questionID) {
    let answers = [];    /* Creation of a list of questions for storing data from server */

    // call GET
    const response = await fetch(url + '/api/' + userType + '/surveys/survey/questions/' + questionID + '/answers');
    let answersJson = await response.json();

    if (response.ok) {
        answersJson.forEach(a => {
            // surveys = [...surveys, new Task(t.id, t.description, t.important == 1, t.private == 1, t.deadline, t.completed)];
            answers = [...answers, new Answer(a.anID, a.text, a.qID)];
        });
        return answers;
    } else
        throw answersJson;
}


// Retrieve a list of answers related to a certain user and survey
async function loadAnswersByUserIdAndSurveyId(userID, surveyID) {
    let answers = [];    /* Creation of a list of questions for storing data from server */

    // call GET
    const response = await fetch(url + '/api/admin/surveys/'+ surveyID +'/answers/' + userID);
    let answersJson = await response.json();

    if (response.ok) {
        answersJson.forEach(a => {
            // surveys = [...surveys, new Task(t.id, t.description, t.important == 1, t.private == 1, t.deadline, t.completed)];
            answers = [...answers, new Answer(a.anID, a.text, a.qID)];
        });
        return answers;
    } else
        throw answersJson;
}


//Create a new survey
async function addSurvey(survey) {
    fetch(url + '/api/admin/surveys/new', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', },
        body: JSON.stringify(survey),
    })
        .catch(() => { return ({ error: "Cannot communicate with the server." }) }); // connection errors
}


/*** END -  ADMIN APIs ****/
/**************************/



const API = {
    /* USER APIs: */
    loadSurveys, addUser, addClosedAnswer, addOpenAnswer,
    /* ADMIN APIs: */
    logIn, logOut, getUserInfo,
    loadSurveysByAdminId, loadUsersbySurveyId, loadQuestionsAndClosedAnswersBySurveyId, loadAnswersByQuestionId, loadAnswersByUserIdAndSurveyId, addSurvey
}
export default API;