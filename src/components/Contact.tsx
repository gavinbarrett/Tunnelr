import * as React from 'react';
import { useHistory } from 'react-router-dom';
import { Footer } from './Footer';
import { UserAuth } from '../UserAuth';
import './sass/Contact.scss';

const ReturnAddress = ({updateReturnAddr}) => {
    return (<>
        <label for="return-addr">{"Return Address"}</label>
        <input name="return-addr" id="return-addr" placeholder={"enter a return address"} onChange={event => updateReturnAddr(event.target.value)}/>
        </>);
}

export const Contact = ({updateLandingMessage}) => {
    const { user, loggedIn } = React.useContext(UserAuth);
    const [subject, updateSubject] = React.useState('');
    const [emailBody, updateEmailBody] = React.useState('');
    const [returnAddr, updateReturnAddr] = React.useState('');
    const [error, updateError] = React.useState('');
    const history = useHistory();

    const changeSubject = event => updateSubject(event.target.value);
    const changeEmailBody = event => updateEmailBody(event.target.value);

    const validSubjectBody = () => {
        if (subject && subject.match(/^[a-z0-9\s]{4,64}$/)) {
            if (emailBody && emailBody.match(/^[a-z0-9\s]{6,400}$/)) {
                return true;
            } else {
                updateError('Please enter a valid email body');
                return false;
            }
        } else {
            console.log('subject does not match');
            updateError('Please enter an email subject');
            return false;
        }
    }

    const validReturnAddr = () => {
        console.log(`returnaddr: ${returnAddr}`);
        if (returnAddr != '' && returnAddr.match(/^[a-z0-9]+@[a-z0-9]+\.[a-z0-9]+$/)) {
            console.log('matched');
            return true;
        } else {
            console.log('returning false');
            return false;
        }
    }

    const sendEmail = async () => {
        console.log(`Subject: ${subject}`);
        console.log(`Body: ${emailBody}`);
        console.log(`User: ${user}\nLoggedIn: ${loggedIn}`);
        // already have user's email
        // /emailFromUser
        if (loggedIn) {
            if (validSubjectBody()) {
                // send to /emailfromuser
                const resp = await fetch('/emailfromuser', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({"subject": subject, "emailbody": emailBody})});
                console.log(resp);
                if (resp.status == 200) {
                    updateLandingMessage('Thank you. Your email has been sent to support.');
                    setTimeout(() => updateLandingMessage(''), 3000);
                } else {
                    updateError('Could not send email');
                    setTimeout(() => updateError(''), 3000);
                }
            } else {
                // throw error
                updateError('Invalid email info');
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
                    updateError('Could not send email');
                    setTimeout(() => updateError(''), 3000);
                }
            } else {
                // throw error
                updateError('Invalid email info');
            }
        }
    }

    return (<><div id="contact-page">
        <div id="contact-box">
            {error}
            {user && loggedIn ? '' : <ReturnAddress updateReturnAddr={updateReturnAddr}/>}
            <label for="subject">{"Subject"}</label>
            <input name="subject" id="subject" placeholder={"enter subject here"} onChange={changeSubject}/>
            <label for="email">{"Email Body"}</label>
            <textarea name="email" id="email-body" placeholder={"enter your email here"} onChange={changeEmailBody}></textarea>
            <button onClick={sendEmail}>{"Send Email"}</button>
        </div>
    </div>
    <Footer/></>);
}