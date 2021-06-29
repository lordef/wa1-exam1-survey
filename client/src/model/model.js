// 'use strict';

/* DB STRUCTURE - LOGICAL DATA MODEL:

  survey(sID, title, adID)
  question(qID, title, type, min, max, sID)
  admin(adID, username, phash)
  answer(anID, text, qID)
  user(uID, name)
  user_answer(uID, anID)

*/

// survey(sID, title, adID)
function Survey(sID, title, adID, questions = [], nCompilations = 0) {
  this.sID = sID;
  this.title = title;
  this.adID = adID;
  this.questions = questions;
  this.nCompilations = nCompilations;

  this.toString = () => {
    return `Survey: Id: ${this.sID}, ` +
      `Title: ${this.title}, adminID: ${this.adID}, Questions: ${this.questions}, ` +
      `nCompilations: ${this.nCompilations}`;
  }
}

// question(qID, title, type, min, max, sID)
function Question(qID, title, type, min = 0, max = '', answers = [], sID) {
  this.qID = qID;
  this.title = title;
  this.type = type; /* 0:closed, 1:open                     */
  this.min = min;   /* 0:optional, 1:mandatory              */
  this.max = type == 0 ? max : null;   /* 1:single-choice, >1:multiple-choice  */
  
  this.answers = answers;
  this.sID = sID;   /* 1:single-choice, >1:multiple-choice  */
  /* 
    types of questions: 
    - min = 0, max = 1 → optional question, single-choice 
    - min = 1, max = 1 → mandatory question, single-choice 
    - min = 0, max > 1 → optional question, multiple-choice 
    - min = 1, max > 1 → mandatory question, multiple-choice
  */

  this.toString = () => {
    return `Question: Id: ${this.qID}, ` +
      `Title: ${this.title}, Type: ${this.type}, Min: ${this.min}, ` +
      `Max: ${this.max}, Answers: ${this.answers} , SurveyID: ${this.sID}`;
  }
}

// answer(anID, text, qID)
function Answer(anID, text, qID) {
  this.anID = anID;
  this.text = text;
  this.qID = qID;

  this.toString = () => {
    return `Answer: Id: ${this.anID}, ` +
      `Text: ${this.text}, QuestionID: ${this.qID}`;
  }
}

// user(uID, name)
function User(uID, name) {
  this.uID = uID;
  this.name = name;

  this.toString = () => {
    return `User: Id: ${this.uID}, Name: ${this.name}`;
  }
}

// admin(adID, username, phash)
function Admin(adID, username, phash = '') {
  this.adID = adID;
  this.username = username;
  this.phash = phash;

  this.toString = () => {
    return `Admin: Id: ${this.adID}, Username: ${this.username}, pHash : ${this.phash}`;
  }
}

// user_answer(uID, anID)
function User_Answer(uID, anID) {
  this.uID = uID;
  this.anID = anID;

  this.toString = () => {
    return `User_Answer: UserId: ${this.uID}, AnswerId: ${this.anID}`;
  }
}


module.exports = { Survey, Question, Answer, User, Admin, User_Answer };