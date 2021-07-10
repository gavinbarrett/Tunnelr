import * as React from 'react';
import { useHistory } from 'react-router-dom';
import { Footer } from './Footer';
import { ErrorMessage } from './ErrorMessage';
import { UserInfo } from '../UserInfo';
import { Messages } from '../Messages';
import './sass/Contact.scss';

const ReturnAddress = ({updateReturnAddr}) => {
    return (<>
        <label for="return-addr">{"Return Address"}</label>
        <input name="return-addr" id="return-addr" placeholder={"enter a return address"} onChange={event => updateReturnAddr(event.target.value)}/>
        </>);
}

export const Contact = ({updateLandingMessage}) => {
    const { user, loggedIn } = React.useContext(UserInfo);
    const [subject, updateSubject] = React.useState('');
    const [emailBody, updateEmailBody] = React.useState('');
    const [returnAddr, updateReturnAddr] = React.useState('');
    const [errorDisplayed, updateErrorDisplayed] = React.useState(false);
    const { updateErrorMessage } = React.useContext(Messages);
    const history = useHistory();

    React.useEffect(() => {
        window.scrollTo({top: 0, left: 0, behavior: 'smooth'});
    }, []);

    const validSubjectBody = () => {
        if (subject && subject.match(/^[a-z0-9\s]{4,64}$/i)) {
            if (emailBody && emailBody.match(/^[a-z0-9\s,\.!\?\$\(\):;'"@#%\+=]{6,400}$/i))
                return true;
            else {
                updateErrorMessage('Please enter a valid email body');
                updateErrorDisplayed(true);
                return false;
            }
        } else {
            updateErrorMessage('Please enter an email subject');
            updateErrorDisplayed(true);
            return false;
        }
    }

    const validReturnAddr = () => {
        console.log(`returnaddr: ${returnAddr}`);
        if (returnAddr != '' && returnAddr.match(/^[a-z0-9]+@[a-z0-9]+\.[a-z0-9]+$/))
            return true;
        else
            return false;
    }

    const sendEmail = async () => {
        // send an email to Tunnelr's support line
        if (loggedIn) {
            // already have user's email
            if (validSubjectBody()) {
                // send to /emailfromuser
                const resp = await fetch('/emailfromuser', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({"subject": subject, "emailbody": emailBody})});
                if (resp.status == 200) {
                    updateLandingMessage('Thank you. Your email has been sent to support.');
                    setTimeout(() => updateLandingMessage(''), 3000);
                    history.push('/');
                } else {
                    updateErrorMessage('Could not send email');
                    updateErrorDisplayed(true);
                }
            }
        } else {
            if (validSubjectBody() && validReturnAddr()) {
                // send to /emailfromoutside
                const resp = await fetch('/emailfromoutside', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({"subject": subject, "emailbody": emailBody, "returnaddr": returnAddr})});
                console.log(resp);
                if (resp.status == 200) {
                    updateLandingMessage('Thank you. Your email has been sent to support.');
                    setTimeout(() => updateLandingMessage(''), 3000);
                    history.push('/');
                } else {
                    updateErrorMessage('Could not send email');
                    updateErrorDisplayed(true);
                }
            }
        }
    }

    return (<><div id="contact-page">
        <div id="contact-box">
            <div id="contact-error">
                <ErrorMessage displayed={errorDisplayed} updateDisplayed={updateErrorDisplayed}/>
            </div>
            {user && loggedIn ? '' : <ReturnAddress updateReturnAddr={updateReturnAddr}/>}
            <label for="subject">{"Subject"}</label>
            <input name="subject" id="subject" placeholder={"enter subject here"} onChange={event => updateSubject(event.target.value)}/>
            <label for="email">{"Email Body"}</label>
            <textarea name="email" id="email-body" placeholder={"enter your email here"} onChange={event => updateEmailBody(event.target.value)}></textarea>
            <button onClick={sendEmail}>{"Send Email"}</button>
        </div>
    </div>
    <Footer/></>);
}