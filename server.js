'use strict';

const path = require('path');
const PORT = process.env.PORT || 3001;


const express = require('express');
const morgan = require('morgan');  // logging middleware
const { check, validationResult } = require('express-validator'); // validation middleware
app.use(express.static("./client/build"));


const passport = require('passport'); // auth middleware
const LocalStrategy = require('passport-local').Strategy; // username and password for login
const session = require('express-session'); // session middleware
const { Survey, Question, Answer, User, Admin, User_Answer } = require("./model/model");
const { adminDAO } = require("./dao/admin-dao");
const { surveyDAO } = require("./dao/survey-dao");



/*****************************/
/*******Set up Passport*******/

// set up the "username and password" login strategy
// by setting a function to verify username and password
passport.use(new LocalStrategy((username, password, done) => {
  // verification callback for authentication
  adminDAO.getAdmin(username, password).then(user => {
    if (user)
      return done(null, user);
    else
      return done(null, false, { message: 'Incorrect username and/or password' });
  }).catch(err => {
    return done(err);
  });
}));


// serialize and de-serialize the user (user object <-> session)
// we serialize the user id and we store it in the session: the session is very small in this way
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// starting from the data in the session, we extract the current (logged-in) user
passport.deserializeUser((id, done) => {
  adminDAO.getAdminById(id)
    .then(user => {
      done(null, user); // this will be available in req.user
    }).catch(err => {
      done(err, null);
    });
});

/***END - Set up Passport*****/
/*****************************/

// Format express-validate errors as strings
const errorFormatter = ({ location, msg, param, value, nestedErrors }) => {
  return `${location}[${param}]: ${msg}`;
};


// init express
const app = new express();
// const port = 3001;

app.use(morgan('dev'));
app.use(express.json()); // parse the body in JSON format => populate req.body attributes

// custom middleware: check if a given request is coming from an authenticated user
const isLoggedIn = (req, res, next) => {
  if (req.isAuthenticated())
    return next();

  return res.status(401).json({ error: 'not authenticated' });
}

// set up the session
app.use(session({
  // by default, Passport uses a MemoryStore to keep track of the sessions
  secret: 'a secret sentence not to share with anybody and anywhere, used to sign the session ID cookie',
  resave: false,
  saveUninitialized: false
}));

// then, init passport
app.use(passport.initialize());
app.use(passport.session());


/**************************/
/******* ADMIN APIs *******/

// POST /sessions 
// login
app.post('/api/sessions', function (req, res, next) {
  passport.authenticate('local', (err, user, info) => {
    if (err)
      return next(err);
    if (!user) {
      // display wrong login messages
      return res.status(401).json(info);
    }
    // success, perform the login
    req.login(user, (err) => {
      if (err)
        return next(err);

      // req.user contains the authenticated user, we send all the user info back
      // this is coming from adminDAO.getUser()
      return res.json(req.user);
    });
  })(req, res, next);
});

// DELETE /sessions/current 
// logout
app.delete('/api/sessions/current', isLoggedIn, (req, res) => {
  req.logout();
  res.end();
});

// GET /sessions/current
// check whether the admin is logged in or not
app.get('/api/sessions/current', (req, res) => {
  if (req.isAuthenticated()) {
    res.status(200).json(req.user);
  }
  else
    res.status(401).json({ error: 'Unauthenticated admin!' });;
});

/**** ADMIN - Survey APIs ***/

//Retrieve a list of all the questions (with related answers) that fulfill a given survey id
//Useful for admin USER and  ADMIN, therefore it has not isLoggedIn middleware
app.get('/api/:user/surveys/:sID', async (req, res) => {

  const surveyID = req.params.sID;

  async function getQuestionsAndAnswers() {
    const questions = await surveyDAO.getQuestionsBySurveyId(surveyID);
    for (const q of questions) {
      if (q.type == 0) { /* 0: closed answer */

        const answers = await surveyDAO.getAnswersByQuestionId(q.qID);
        q.answers = answers;
      }
    }
    res.json(questions);
  }

  try {

    getQuestionsAndAnswers();

  } catch (error) {
    res.status(500).json(error);
  }
});

/* 
    Retrieve a list of surveys that fulfill a given admin id
      (by listing their title and number of received responses)
*/
app.get('/api/admin/:adID/surveys', isLoggedIn, (req, res) => {

  const adminID = req.params.adID;

  surveyDAO.getSurveysByAdminId(adminID)
    .then((surveys) => { res.json(surveys); })
    .catch((error) => { res.status(500).json(error); });
});


// Retrieve a list of users that fulfill a given survey id
app.get('/api/admin/surveys/:sID/users', isLoggedIn, (req, res) => {

  const surveyID = req.params.sID;

  surveyDAO.getUsersbySurveyId(surveyID)
    .then((users) => { res.json(users); })
    .catch((error) => { res.status(500).json(error); });
});

//NOT used, but can be useful for retrieving all possible answer for a closed question
// Retrieve all answers related to a questionID
// Useful for admin and user  
app.get('/api/:user/surveys/survey/questions/:qID/answers', (req, res) => {

  const questionID = req.params.qID;

  surveyDAO.getAnswersByQuestionId(questionID)
    .then((questions) => { res.json(questions); })
    .catch((error) => { res.status(500).json(error); });
});


// Retrieve a list of answers related to a certain user and survey
app.get('/api/admin/surveys/:sID/answers/:uID', isLoggedIn, (req, res) => {

  const userID = req.params.uID;
  const surveyID = req.params.sID;

  surveyDAO.getAnswersByUserIdAndSurveyId(userID, surveyID)
    .then((answers) => { res.json(answers); })
    .catch((error) => { res.status(500).json(error); });
});


//Create a new survey
app.post('/api/admin/surveys/new',
  isLoggedIn,
  [
    check('title').isLength({ min: 1 }),
    check('questions.*.title').isLength({ min: 1 }),
    check('questions.*.type').isBoolean(),
    check('questions.*.min').isInt({ min: 0 })
    // check('questions.*.max').isInt({ min: 1 })
  ],
  async (req, res) => {


    const errors = validationResult(req).formatWith(errorFormatter); // format error message
    if (!errors.isEmpty()) {
      // 422 Unprocessable Entity (WebDAV)
      return res.status(422).json({ error: errors.array().join(", ") }); // error message is a single string with all error joined together
    }


    const questions = req.body.questions.map(q => new Question(undefined, q.title, q.type, q.min, q.max, q.answers));

    const survey = new Survey(undefined, req.body.title, req.body.adID, questions);

    try {

      //VALIDATION
      req.body.questions.forEach(q => {
        if (q.type == 0) { /* 0: closed answer */
          if (q.answers) {
            if (!(q.min <= q.max && q.max <= q.answers.length)) {
              throw 'Minimum and/or Maximum answers constraints violated!';
            } else {
              q.answers.forEach(a => {
                if (!a.text || a.text.length < 1)
                  throw 'Answer text for a question not valid!';
              });
            }
          }
          else {
            throw 'Answers for question not found!';
          }
        }
        // else if (q.type == 1) { /* 1: closed answer */
        //   if (!(q.min <= q.max))
        //     throw 'Minimum and/or Maximum answers constraints violated!';
        // }

      })

      const retSurveyID = await surveyDAO.createSurvey(survey);
      // res.json(`Created new survey, id: ` + retSurveyID);

      questions.forEach(async (question) => {
        question.sID = retSurveyID;
        const retQuestionID = await surveyDAO.createQuestion(question);
        // res.json(`Created new question, id: ` + retQuestionID);

        if (question.type == 0) { /* 0: closed answer */
          const answers = question.answers.map(a => new Answer(undefined, a.text, retQuestionID));

          answers.forEach(async (answer) => {

            const retAnswerID = await surveyDAO.createAnswer(answer);
            // res.json(`Created new answer, id: ` + retAnswerID);
          })

        }

      });

      res.json(`Created new survey, id: ` + retSurveyID);



    } catch (error) {
      res.status(500).json(error);
    }
  });

//NOT used
//Insert a CLOSE-ended answer
app.post('/api/admin/surveys/survey', isLoggedIn, async (req, res) => {

  const answer = new Answer(undefined, req.body.text, req.body.qID);

  try {
    const retId = await surveyDAO.createAnswer(answer);
    // res.json(`Created new CLOSED answer: ` + retId);
    return res.json(retId);

  } catch (error) {
    res.status(500).json(error);
  }
});

/*** END -  ADMIN APIs ****/
/**************************/


/*************************/
/******* USER APIs *******/

//Retrieve the list of all the available surveys
app.get('/api/user/surveys', (req, res) => {

  surveyDAO.getSurveys()
    .then((surveys) => { res.json(surveys); })
    .catch((error) => { res.status(500).json(error); });

});

//Create a new User
app.post('/api/user/surveys', check(['name']).isLength({ min: 1 }), async (req, res) => {

  const errors = validationResult(req).formatWith(errorFormatter); // format error message
  if (!errors.isEmpty()) {
    // 422 Unprocessable Entity (WebDAV)
    return res.status(422).json({ error: errors.array().join(", ") }); // error message is a single string with all error joined together
  }

  const user = new User(undefined, req.body.name);
  try {
    const retId = await surveyDAO.createUser(user);
    // res.json(`Created new user, id: ` + retId);
    return res.json(retId);

  } catch (error) {
    res.status(500).json(error);
  }
});


//Retrieve a list of all the questions (with related answers) that fulfill a given survey id
// Declared in ADMIN section
/*
  app.get('/api/:user/surveys/:sID', async (req, res) => {
  });
*/


//Insert all answers related to a given CLOSED-answer from a user
app.post('/api/user/surveys/survey/answers/closed',
  [
    check('uID').isInt(),
    check('question.title').isLength({ min: 1 }),
    check('question.type').isBoolean(),
    check('question.min').isInt({ min: 0 }),
    check('question.max').isInt({ min: 1 }),
    check('question.answers').isArray().notEmpty(),
    check('question.answers.*.anID').isInt()

  ],
  async (req, res) => {


    const errors = validationResult(req).formatWith(errorFormatter); // format error message
    if (!errors.isEmpty()) {
      // 422 Unprocessable Entity (WebDAV)
      return res.status(422).json({ error: errors.array().join(", ") }); // error message is a single string with all error joined together
    }

    const userID = req.body.uID;
    // In this case, question.answers contains only answer IDs that are the only requested attribute for this transaction
    const answers = req.body.question.answers.map(a => new Answer(a.anID, a.text, a.qID));
    const q = req.body.question;
    const question = new Question(q.qID, q.title, q.type, q.min, q.max, answers);

    try {
      //VALIDATION for min and max conditions
      if (!(q.min <= q.max && q.max <= q.answers.length)) {
        throw 'Minimum and/or Maximum answers constraints violated!';
      }

      answers.forEach(async (a) => {
        const retUA = await surveyDAO.createUserAnswer(new User_Answer(userID, a.anID));
        // res.json(`Created new relation ` + retUA.toString());
      })

      res.json(`Created new relations User_Answer`);

    } catch (error) {
      res.status(500).json(error);
    }
  });

//Insert a OPEN-ended answer for a user
app.post('/api/user/surveys/survey/answers/open',
  [
    check('uID').isInt(),
    check('text').isLength({ min: 1, max: 200 }),
    check('qID').isInt()
  ],
  async (req, res) => {

    const errors = validationResult(req).formatWith(errorFormatter); // format error message
    if (!errors.isEmpty()) {
      // 422 Unprocessable Entity (WebDAV)
      return res.status(422).json({ error: errors.array().join(", ") }); // error message is a single string with all error joined together
    }

    const userID = req.body.uID;
    const answer = new Answer(undefined, req.body.text, req.body.qID);

    try {
      const retAnswerID = await surveyDAO.createAnswerAndUserAnswer(userID, answer);
      res.json(`Created new OPEN answer (id: ` + retAnswerID + ') for user (id: ' + userID + ')');
    } catch (error) {
      res.status(500).json(error);
    }
  });


/*** END -  USER APIs ****/
/*************************/


// activate the server
/*
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
*/

/* Endpoint to declare that any request that does not match any other endpoints send back the client React application index.html file */
app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, './client/build', 'index.html'));
});

// app.get('*', (req, res) => { res.redirect('index.html'); });

app.listen(PORT, () => console.log(`Server running on PORT: ${PORT}`));