import * as nodemailer from 'nodemailer';
import * as db from './databaseFunctions';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.MAILADDRESS,
        pass: process.env.MAILPW,
    }
});

export const emailFromUser = async (req, res) => {
    const { subject, emailbody } = req.body;
    const { user } = req.cookies.sessionID;
    console.log(`Subject: ${subject}\nEmail: ${emailbody}`);
    const query = 'select email from users where username=$1';
    const values = [user];
    const resp = await db.query(query, values);
    if (resp && resp.rows) {
        const { email } = resp.rows[0];
        let mailConfig = {
            from: process.env.MAILADDRESS,
            to: process.env.MAILADDRESS,
            subject: subject,
            text: emailbody + `\n\nReturn email: ${email}.`
        };
        const sent = transporter.sendMail(mailConfig, (err, info) => {
            if (err) {
                console.log(`Error sending email: ${err}`);
                res.status(400).end();
            } else {
                console.log(`Mail sent: ${info.response}`);
                res.status(200).end();
            }
        });
    } else {
        console.log(`Couldn't find email.`);
        res.status(403).end();
    }
}

export const emailFromOutside = (req, res) => {
    const { subject, emailbody, returnaddr } = req.body;
    console.log(`Subject: ${subject}\nEmail: ${emailbody}\nReturn: ${returnaddr}`);
    res.status(200).end();
}