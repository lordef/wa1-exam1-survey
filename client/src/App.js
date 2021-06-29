import './App.css';
//HINT: npm install bootstrap@4.6.0 react-bootstrap
import 'bootstrap/dist/css/bootstrap.min.css';
import { Container, Row, Col, Alert, Spinner } from 'react-bootstrap';
import { BrowserRouter as Router, Route, Redirect, Switch } from 'react-router-dom';
import { useEffect, useState } from 'react';

import NavigationBar from './components/NavigationBar'
import Surveys from './components/Surveys';
import SurveyCompilation from './components/SurveyCompilation';
import AdminSurveys from './components/AdminSurveys';
import SurveyVisualization from './components/SurveyVisualization';
import SurveyCreation from './components/SurveyCreation';
import { Admin, Survey, User } from './model/model';
import API from './API';
import { Message } from './model/utility';



function App() {

  /* State variable for USER */
  /* surveyList as state variable */
  const [surveyList, setSurveyList] = useState([]);
  const addSurveyToSurveyList = (newSurvey) => {
    setSurveyList(oldList => [...oldList, newSurvey])
    setDirty(true);
  };

  const [user, setUser] = useState(new User(undefined, ''));

  const [survey, setSurvey] = useState(new Survey(undefined, '', undefined));
  /***************************/

  /* State variables for ADMIN */
  /* LoggedIn as state variable */
  const [loggedIn, setLoggedIn] = useState(false);
  const [admin, setAdmin] = useState();
  /*****************************/

  /* State variables for feedback */
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [dirty, setDirty] = useState(false);



  /******* useEffects *******/
  // Check if admin is authenticated
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // here you have the user info, if already logged in
        const retAdmin = await API.getUserInfo();
        const admin = new Admin(retAdmin.id, retAdmin.username);
        setAdmin(admin);
        setLoggedIn(true);
      } catch (err) {
        console.log(err.error); // mostly unauthenticated user
      }
    };
    checkAuth();
  }, []);


  /* Initial load */
  useEffect(() => {
    if (!loggedIn) {
      /* Function to retrieve the surveyList*/
      API.loadSurveys().then(result => { /* result is the surveyList from server */
        setSurveyList(result);
        setLoading(false);
      })
        .catch(err => {
          setMessage(new Message("Impossible to load surveys! Please, try again later..."));
          console.error(err);
        });

    } else {
      /* Function to retrieve the surveyList for a certain ADMIN*/
      API.loadSurveysByAdminId(admin.adID).then(result => { /* result is the surveyList from server */
        setSurveyList(result);
        setLoading(false);
      })
        .catch(err => {
          setMessage(new Message("Impossible to load your surveys! Please, try again later..."));
          console.error(err);
        });
    }
  },
    [loggedIn]
  );

  /* Reload after survey creation*/
  useEffect(() => {
    if (loggedIn && dirty) {
      /* Function to retrieve the surveyList for a certain ADMIN*/
      API.loadSurveysByAdminId(admin.adID).then(result => { /* result is the surveyList from server */
        setSurveyList(result);
        setLoading(false);
        setDirty(false);
      })
        .catch(err => {
          setMessage(new Message("Impossible to load your surveys! Please, try again later..."));
          console.error(err);
        });
    }
  },
    [dirty]
  );

  /**************************/


  /* USER functions */
  /* Update current user state variable and select survey */
  const addUserAndSelectSurvey = (newUser, survey) => {
    setUser(newUser);
    setSurvey(survey);
  }
  /***************/


  /* ADMIN functions */
  const doLogIn = async (credentials) => {
    try {
      const retAdmin = await API.logIn(credentials);
      const admin = new Admin(retAdmin.id, retAdmin.username);
      setAdmin(admin);
      setLoggedIn(true);

      /* setIsCheckingAuth(false); */
      // setMessage({ msg: `Welcome, ${admin}!`, type: 'success' });
      setMessage(new Message(`Welcome, ${admin.username}!`, 'success'));

    } catch (err) {
      // setMessage({ msg: err, type: 'danger' });
      setMessage(new Message(err));

    }
  }

  const doLogOut = async () => {
    setMessage("");
    await API.logOut();
    setAdmin('');
    setLoggedIn(false);
  }

  /***************/


  return (
    <Router>
      <Container fluid>
        <NavigationBar doLogIn={doLogIn} admin={admin} doLogOut={doLogOut} />


        <Row className="below-nav">

          <Col className="below-nav-col">
            {message &&
              <Row className="justify-content-center">
                <Alert variant={message.type} onClose={() => setMessage('')} dismissible>{message.msg}</Alert>
              </Row>}


            <Switch>

              <Route exact path="/">
                {
                  !loggedIn ?
                    <Redirect to="/user/surveys" />
                    :
                    <Redirect to="/admin/surveys" />
                }

              </Route>

              {/* USER Routes */} 
              <Route exact path="/user/surveys">
                {
                  loading ?
                    <Row className="justify-content-center">
                      <Spinner animation="border" variant="primary" />
                      <h5>Please wait, loading surveys...</h5>
                    </Row>
                    :
                    <>
                      {
                        !loggedIn ?
                          <Surveys surveyList={surveyList} addUserAndSelectSurvey={addUserAndSelectSurvey} setSurvey={setSurvey} />
                          :
                          <Redirect to='/' />
                      }
                    </>
                }
              </Route>

              <Route exact path="/user/surveys/survey">
                {
                  !loggedIn && user.name ?
                    <SurveyCompilation user={user} survey={survey}
                      setUser={setUser} setSurvey={setSurvey} setMessage={setMessage} />
                    :
                    <Redirect to={"/"} />
                }
              </Route>

              {/* ADMIN Routes */}
              <Route exact path="/admin/surveys">
                {
                  loading ?
                    <Row className="justify-content-center">
                      <Spinner animation="border" variant="primary" />
                      <h5>Please wait, loading surveys...</h5>
                    </Row>
                    :
                    <>
                      {
                        loggedIn ?
                          <AdminSurveys admin={admin} surveyList={surveyList} addUserAndSelectSurvey={addUserAndSelectSurvey} setSurvey={setSurvey} />
                          :
                          <Redirect to='/' />
                      }
                    </>
                }
              </Route>

              <Route exact path="/admin/surveys/survey">
                {
                  loggedIn ?
                    <SurveyVisualization user={user} survey={survey} setUser={setUser} setSurvey={setSurvey} />
                    :
                    <Redirect to={"/"} />
                }
              </Route>

              <Route exact path="/admin/surveys/new">
                {loggedIn ?
                  <SurveyCreation survey={survey} setSurvey={setSurvey} admin={admin} setMessage={setMessage}
                    addSurveyToSurveyList={addSurveyToSurveyList}
                  />
                  :
                  <Redirect to='' />
                }

              </Route>


              <Redirect to="/user/surveys" />

            </Switch>
          </Col>
        </Row>
      </Container>
    </Router>
  );
}

export default App;
