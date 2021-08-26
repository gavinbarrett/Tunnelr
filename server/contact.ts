import * as nodemailer from 'nodemailer';
import * as db from './databaseFunctions';
import { QueryResult } from 'pg';
import { Request, Response } from 'express';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.MAILADDRESS,
        pass: process.env.MAILPW,
    }
});

export const emailFromUser = async (req: Request, res: Response) => {
    const { subject, emailbody } = req.body;
    const { user } = req.cookies.sessionID;
    console.log(`Subject: ${subject}\nEmail: ${emailbody}`);
    const query: string = 'select email from users where username=$1';
    const values: Array<string> = [user];
    const resp: QueryResult = await db.query(query, values);
    if (resp.rowCount) {
        const { email } = resp.rows[0];
        let mailConfig = {
            from: process.env.MAILADDRESS,
            to: process.env.MAILADDRESS,
            subject: subject,
            text: emailbody + `\n\nReturn email: ${email}.`
        };
        transporter.sendMail(mailConfig, (err, info) => {
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

export const emailFromOutside = (req: Request, res: Response) => {
    const { subject, emailbody, returnaddr } = req.body;
    console.log(`Subject: ${subject}\nEmail: ${emailbody}\nReturn: ${returnaddr}`);
    if (!subject.match(/^[a-z0-9 ]+$/)) {
        console.log('subject did not match');
        res.status(400).end();
    } else if (!returnaddr.match(/^[a-z0-9]+@[a-z0-9]+\.[a-z0-9]+$/)) {
        console.log('return addr did not match');
        res.status(400).end();
    } else {
        console.log('attempting to send email');
        let mailConfig = {
            from: process.env.MAILADDRESS,
            to: process.env.MAILADDRESS,
            subject: subject,
            text: emailbody + `\n\nReturn email: ${returnaddr}.`
        };
        transporter.sendMail(mailConfig, (err, info) => {
            if (err) {
                console.log(`Error sending email: ${err}`);
                res.status(400).end();
            } else {
                console.log(`Mail sent: ${info.response}`);
                res.status(200).end();
            }
        });
    }
}