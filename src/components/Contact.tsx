import * as React from 'react';
import { Footer } from './Footer';
import { UserAuth } from '../UserAuth';
import './sass/Contact.scss';

const ReturnAddress = ({updateReturnAddr}) => {
    return (<>
        <label for="return-addr">{"Return Address"}</label>
        <input name="return-addr" id="return-addr" placeholder={"enter a return address"} onChange={event => updateReturnAddr(event.target.value)}/>
        </>);
}

export const Contact = () => {
    const { user, loggedIn } = React.useContext(UserAuth);
    const [subject, updateSubject] = React.useState('');
    const [emailBody, updateEmailBody] = React.useState('');
    const [returnAddr, updateReturnAddr] = React.useState('');

    const changeSubject = event => updateSubject(event.target.value);
    const changeEmailBody = event => updateEmailBody(event.target.value);

    const validEmailInfo = async () => {
        if (!subject.match(/^[a-z0-9 ]{4,64}$/)) {
            if (!emailBody.match()) {
                // FIXME: send email
                if (!loggedIn && !returnAddr.match(/^[a-z0-9]+@[a-z0-9]\.[a-z0-9]$/)) {
                    return true;
                } else if (!loggedIn) {
                    // no match for return address
                    return false;
                }
                return true;
            } else {
                return false;
            }
        } else {
            return false;
        }
    }

    const sendEmail = async () => {
        console.log(`Subject: ${subject}`);
        console.log(`Body: ${emailBody}`);
        console.log(`User: ${user}\nLoggedIn: ${loggedIn}`);
        if (user && loggedIn) {
            // already have user's email
            // /emailFromUser
            if (validEmailInfo()) {
                const resp = await fetch('/emailfromuser', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({"subject": subject, "emailbody": emailBody})});
                console.log(resp);
            } else
                console.log('Email info not valid');
        } else {
            if (validEmailInfo()) {
                const resp = await fetch('/emailfromuser', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({"subject": subject, "emailbody": emailBody, "returnaddr": returnAddr})});
                console.log(resp);
            } else 
                console.log('Email info not valid');
        }
    }

    return (<><div id="contact-page">
        <div id="contact-box">
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