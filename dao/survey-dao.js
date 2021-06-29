'use strict';

/* DB STRUCTURE - LOGICAL DATA MODEL:

  survey(sID, title, adID)
  question(qID, title, type, min, max, sID)
  admin(adID, username, phash)
  answer(anID, text, qID)
  user(uID, name)
  user_answer(uID, anID)

*/

const { Survey, Question, Answer, User, Admin, User_Answer } = require("../model/model");

const sqlite = require("sqlite3");

const db = new sqlite.Database('surveys.db', (err) => { if (err) throw err; });


/******************************/
/**********ADMIN dao***********/

/* 
    View the list of surveys published by this administrator
*/
function getAllSurveysByAdminId(adminId) {
  return new Promise((resolve, reject) => {
    const sql = ` SELECT s.sID, s.title
                  FROM survey as s
                  WHERE s.adID = ? `;
    db.all(sql, [adminId], (err, rows) => {
      if (err)
        reject(err);
      else {
        const surveys = rows.map(record => new Survey(record.sID, record.title, adminId));
        resolve(surveys);
      }
    });
  });
};

/* 
    View the list of surveys published by this administrator, 
    by listing their title and number of received responses.    
*/
function getSurveysWithCompilationsByAdminId(adminId) {
  return new Promise((resolve, reject) => {
    const sql = ` SELECT s.sID, s.title, count(distinct ua.uID) as nCompilations
                  FROM survey as s, question as q, answer as a, user_answer as ua
                  WHERE s.sID = q.sID AND q.qID = a.qID AND a.anID = ua.anID
                    AND s.adID = ? 
                  GROUP BY s.sID`;
    db.all(sql, [adminId], (err, rows) => {
      if (err)
        reject(err);
      else {
        const surveys = rows.map(record => new Survey(record.sID, record.title, adminId, [], record.nCompilations));
        resolve(surveys);
      }
    });
  });
};

/* 
    View the list of surveys published by this administrator, 
    by listing their title and number of received responses.
    
    N.B.: Surveys with number of compilations equal to zero INCLUDED.    
*/
function getSurveysByAdminId(adminID) {
  return new Promise(async (resolve, reject) => {
    try {
      let surveys = await getAllSurveysByAdminId(adminID);
      let surveysWithCompilations = await getSurveysWithCompilationsByAdminId(adminID);

      /* Add nCompilations to surveys */
      surveys.forEach(s => {
        let foundSurveyWC = surveysWithCompilations.filter(sWC => sWC.sID === s.sID);
        if (foundSurveyWC[0]) {
          s.nCompilations = foundSurveyWC[0].nCompilations;
        } else {
          s.nCompilations = 0;
        }
      });

      resolve(surveys);

    } catch (error) {
      // console.error(error);
      reject(error);
      return;
    }
  });
}

/******/

/* 
By selecting one of these surveys, 
allow navigation through the answers given by the users. 
The page will show the name of the user, 
followed by all given responses. 
The page will allow navigating (forward/backward) across the received responses.
*/
/* Questions are equal for all the users of a given survey */
function getQuestionsBySurveyId(surveyID) {
  return new Promise((resolve, reject) => {
    // question(qID, title, type, min, max, sID)
    const sql = ` SELECT *
                  FROM question
                  WHERE sID = ?`;
    db.all(sql, [surveyID], (err, rows) => {
      if (err)
        reject(err);
      else {
        const questions = rows.map(record => new Question(record.qID, record.title, record.type, record.min, record.max, [], surveyID));
        resolve(questions);
      }
    });
  });
}


function getUsersbySurveyId(surveyID) {
  return new Promise((resolve, reject) => {
    const sql = ` SELECT distinct u.uID, name
                  FROM user as u, user_answer as ua, answer as a, question as q, survey as s
                  WHERE u.uID = ua.uID AND ua.anID = a.anID AND a.qID = q.qID AND q.sID = s.sID 
                    AND s.sID = ?`;
    db.all(sql, [surveyID], (err, rows) => {
      if (err)
        reject(err);
      else {
        const users = rows.map(record => new User(record.uID, record.name));
        resolve(users);
      }
    });
  });
}

//NOT used, but can be useful for retrieving all possible asnwer for a closed question
/* Answers related to a questionID */
function getAnswersByQuestionId(questionID) {
  return new Promise((resolve, reject) => {
    //answer(anID, text, qID)
    const sql = ` SELECT *
                  FROM answer
                  WHERE qID = ?`;
    db.all(sql, [questionID], (err, rows) => {
      if (err)
        reject(err);
      else {
        const answers = rows.map(record => new Answer(record.anID, record.text, questionID));
        resolve(answers);
      }
    });
  });
}


/* Answers related to a certain user and survey */
function getAnswersByUserIdAndSurveyId(userID, surveyID) {
  return new Promise((resolve, reject) => {
    //answer(anID, text, qID)
    const sql = ` SELECT an.anID, an.text, an.qID
                  FROM user_answer as ua, answer as an, question as q
                  WHERE ua.anID = an.anID AND an.qID = q.qID 
                    AND ua.uID = ?
                    AND q.sID = ? `;
    db.all(sql, [userID, surveyID], (err, rows) => {
      if (err)
        reject(err);
      else {
        const answers = rows.map(record => new Answer(record.anID, record.text, record.qID));
        resolve(answers);
      }
    });
  });
}

/******/

/* 
    Create a new survey, by defining its title and questions.
      - Creating a new question (by collecting all required information and options for that question).
*/
function createSurvey(survey) {
  return new Promise((resolve, reject) => {
    //survey(sID, title, adID)
    const sql = `INSERT INTO survey(title, adID) VALUES(?, ?)`;
    db.run(sql, [survey.title, survey.adID], function (err) {
      if (err) {
        reject(err);
        return;
      }
      resolve(this.lastID);
    });
  });
}


function createQuestion(question) {
  return new Promise((resolve, reject) => {
    // question(qID, title, type, min, max, sID)
    const sql = `INSERT INTO question(title, type, min, max, sID) VALUES(?, ?, ?, ?, ?)`;
    db.run(sql, [question.title, question.type, question.min, question.max, question.sID], function (err) {
      if (err) {
        reject(err);
        return;
      }
      resolve(this.lastID);
    });
  });
}


function createAnswer(answer) {
  return new Promise((resolve, reject) => {
    //answer(anID, text, qID)
    const sql = `INSERT INTO answer(text, qID) VALUES(?, ?)`;
    db.run(sql, [answer.text, answer.qID], function (err) {
      if (err) {
        reject(err);
        return;
      }
      resolve(this.lastID);
    });
  });
}

/*******END - ADMIN dao********/
/******************************/


/******************************/
/**********USER dao***********/
/*
    From the main page, a user may choose one of the published surveys, 
    and start responding to it.
*/
function getSurveys() {
  return new Promise((resolve, reject) => {
    const sql = ` SELECT *
                  FROM survey `;
    db.all(sql, (err, rows) => {
      if (err)
        reject(err);
      else {
        const surveys = rows.map(record => new Survey(record.sID, record.title, record.adID));
        resolve(surveys);
      }
    });
  });
};

/* 
    Initially he/she must insert their name (free text field), 
    and then he/she may proceed to giving answers.
*/
function createUser(user) {
  return new Promise((resolve, reject) => {
    //user(uID, name)
    const sql = `INSERT INTO user(name) VALUES(?)`;
    db.run(sql, [user.name], function (err) {
      if (err) {
        reject(err);
        return;
      }
      resolve(this.lastID);
    });
  });
}

/*
    Each question will clearly show its validity constraints (min/max/mandatory). 
    The survey may be submitted only if all constraints are satisfied.
*/
//use getQuestionsBySurveyId

/*
    Once the survey is submitted, it may no longer be modified, 
    and the user is brought back to the main page.
*/
//Useful for CLOSED-answer questions
function createUserAnswer(userAnswer) {
  return new Promise((resolve, reject) => {
    // user_answer(uID, anID)
    const sql = `INSERT INTO user_answer(uID, anID) VALUES(?, ?)`;
    db.run(sql, [userAnswer.uID, userAnswer.anID], function (err) {
      if (err) {
        reject(err);
        return;
      }
      resolve(userAnswer);
    });
  });
}

//Useful for OPEN-ended questions
function createAnswerAndUserAnswer(userID, answer) {
  return new Promise(async (resolve, reject) => {
    try {
      let answerID = await createAnswer(answer);
      await createUserAnswer(new User_Answer(userID, answerID));

      resolve(answerID);

    } catch (error) {
      // console.error(error);
      reject(error);
      return;
    }
  });
}


/*******END - USER dao********/
/******************************/


const surveyDAO = { getSurveysByAdminId, getQuestionsBySurveyId, getUsersbySurveyId, getAnswersByQuestionId, getAnswersByUserIdAndSurveyId, createSurvey, createQuestion, createAnswer, getSurveys, createUser, createUserAnswer, createAnswerAndUserAnswer };
module.exports = { surveyDAO };


