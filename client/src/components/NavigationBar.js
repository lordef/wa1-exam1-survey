
import '../App.css';
import { iconLogo, iconLogoText, iconLogin } from './icons';

import { Link } from "react-router-dom";
import { Button, Navbar, Nav } from 'react-bootstrap';
import { useState } from 'react';
import { LoginModal, LogoutModal } from './Login';


function NavigationBar(props) {

    const { doLogIn, admin, doLogOut } = props;

    /* State variable for opening and closing the LoginModal */
    const [showModal, setShowModal] = useState(false);
    const handleCloseModal = () => setShowModal(false);
    const handleShowModal = () => setShowModal(true);

    return (
        <Navbar bg="skydriver" expand="sm" variant="dark" fixed="top" /* className='d-flex justify-content-sm-between' */>

            <Navbar.Brand className="mr-1" /* href="/" */>
                <Link to="/">
                    {iconLogo}
                    {iconLogoText}
                </Link>
            </Navbar.Brand>


            <Nav className="ml-auto" variant="pills" defaultActiveKey="/admin/surveys" >

                {
                    admin &&
                    <>
                        <Nav.Item>
                            <Link to="/admin/surveys">
                                <Button className={'mr-2'}>
                                    View results
                                </Button>
                            </Link>
                        </Nav.Item>

                        <Nav.Item>
                            <Link to="/admin/surveys/new">
                                <Button className={'mr-2'}>
                                    New Survey
                                </Button>
                            </Link>
                        </Nav.Item>
                    </>
                }


                <Nav.Item>
                    <Nav.Link onClick={() => handleShowModal()} >
                        {iconLogin}
                        {
                            !admin ?
                                <>{' Admin area'}</>
                                :
                                <>{' ' + admin.username + ' area'}</>
                        }
                        {/* <PersonCircle size="30" /> */}
                    </Nav.Link>
                </Nav.Item>
            </Nav>

            {
                !admin ?
                    <LoginModal showModal={showModal} handleCloseModal={handleCloseModal}
                        doLogIn={doLogIn}
                    />
                    :
                    <LogoutModal showModal={showModal} handleCloseModal={handleCloseModal}
                        admin={admin} doLogOut={doLogOut}
                    />
            }

        </Navbar >
    );
}




export default NavigationBar;