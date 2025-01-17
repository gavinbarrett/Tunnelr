import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import * as dotenv from 'dotenv';
import * as nodemailer from 'nodemailer';
import * as db from './databaseFunctions';
import { readProfileFromDisk } from './profile';
import { Query, QueryResult } from 'pg';

const expiry: number = 60 * 60 // 60 minute session
dotenv.config();

export const authorizeUser = async (req, res, next) => {
	/* Authenticate the user's session ID against the cache */
	if (!req.cookies.sessionID) {
		res.status(401).send(JSON.stringify({"status": "failed"}));
	} else {
		console.log(req.cookies.sessionID);
		const user = req.cookies.sessionID.user;
		console.log(`User: ${user}`);
		const id = req.cookies.sessionID.sessionid;
		const keys = db.exists(id);
		// FIXME: ensure queried user is associated with Redis entry
		keys ? next() : res.status(401).send(JSON.stringify({"status": "failed"}));
	}
}

export const authenticateUserForUser = async (req, res, next) => {
	/* Authenticate the user's session ID against the cache for one of the user's resources */
	if (!req.cookies.sessionID) {
		res.status(401).end();
	} else {
		console.log(req.cookies.sessionID);
		const user = req.cookies.sessionID.user;
		console.log(`User: ${user}`);
		const id = req.cookies.sessionID.sessionid;
		const keys = db.exists(id);
		// FIXME: ensure queried user is associated with Redis entry
		keys ? next() : res.status(401).end();
	}
}

const getInfo = async (user) => {
	let query: string = 'select username, profile, created_at from users where username=$1';
	let values: Array<string> = [user];
	const userData: QueryResult = await db.query(query, values);
	query = "select friend2 as friend from friendships where friend1=$1 and status='Friended' union select friend1 from friendships where friend2=$2 and status='Friended'";
	values = [user, user];
	const friends: QueryResult = await db.query(query, values);
	query = "select friend2 as friend from friendships where friend1=$1 and status='Pending'";
	values = [user];
	const pending: QueryResult = await db.query(query, values);
	query = 'select channelname from members where username=$1';
	values = [user];
	const channels: QueryResult = await db.query(query, values);
	return { userData, friends, pending, channels };
}

const establishSession = async (user, res) => {
	const id = await createSessionID();
	const clientData = {
		user: user,
		sessionid: id
	};
	// FIXME: check for profile picture, friends, channels
	const info = await getInfo(user);
	const { created_at, profile } = info.userData.rows[0];
	console.log(`Created at: ${created_at}`);
	console.log(`Profile: ${profile}`);
	// set session id
	db.set(id, user, 'EX', expiry);
	// set cookie data
	res.cookie("sessionID", clientData, { maxAge: 1000 * expiry, /*secure: true, httpOnly: true, sameSite: true*/});
	if (profile) {
		const pic = await readProfileFromDisk(profile);
		const data: string = `{"user": "${user}", "created_at": "${created_at}", "friends": ${JSON.stringify(info.friends.rows)}, "pending": ${JSON.stringify(info.pending.rows)}, "channels": ${JSON.stringify(info.channels.rows)}, "profile": "${pic}"}`;
		res.status(200).send(data);
	} else {
		const data: string = `{"user": "${user}", "created_at": "${created_at}", "friends": ${JSON.stringify(info.friends.rows)}, "pending": ${JSON.stringify(info.pending.rows)}, "channels": ${JSON.stringify(info.channels.rows)}, "profile": ${null}}`;
		res.status(200).send(data);
	}
}

export const retrieveSession = async (req, res) => {
	/* Retrieve user session */
	if (req.cookies.sessionID) {
		console.log(req.cookies.sessionID);
		const { user, sessionid } = req.cookies.sessionID;
		const session: QueryResult = await checkForSession(sessionid);
		console.log(`Session: ${session}`);
		if (session) {
			const info = await getInfo(user);
			const { created_at, profile } = info.userData.rows[0];
			if (profile) {
				const pic = await readProfileFromDisk(profile);
				const data = `{"user": "${user}", "created_at": "${created_at}", "friends": ${JSON.stringify(info.friends.rows)}, "pending": ${JSON.stringify(info.pending.rows)}, "channels": ${JSON.stringify(info.channels.rows)}, "profile": "${pic}"}`;
				res.status(200).send(data);
			} else {
				const data = `{"user": "${user}", "created_at": "${created_at}", "friends": ${JSON.stringify(info.friends.rows)}, "pending": ${JSON.stringify(info.pending.rows)}, "channels": ${JSON.stringify(info.channels.rows)}, "profile": ${null}}`;
				res.status(200).send(data);
			}
		} else
			res.status(400).end();
	} else
		res.status(400).end();
}

const checkForSession = async id => {
	try {
		const session: QueryResult = await db.get(id);
		if (session)
			return session;
		return null;
	} catch(err) {
		return null;
	}
}

export const authenticate = async (user, pass, res) => {
	const added: QueryResult = await checkForUser(user);
	if (added.rowCount) {	// return failed sign up attempt if user already exists
		// extract hashed password
		const hashed: string = added.rows[0].password;
		console.log(`Pass: ${pass}\nHashed: ${hashed}`);
		// FIXME: validate bcrypt
		const matched: string = await checkHashes(pass, hashed);
		console.log(`Matched: ${matched}`);
		if (matched) {
			console.log(`Signing in ${user}`);
			// send all data to the client
			establishSession(user, res);
		} else
			res.status(400).send(JSON.stringify({"status": "failed"}));
	} else
		res.status(400).send(JSON.stringify({"status": "failed"}));
}

export const signUserIn = async (req, res) => {
	const { user, pass } = req.body;
	if (await validQueries([user, pass], [/^[a-z0-9]+$/i, /^[a-z0-9]+$/i]))
		authenticate(user, pass, res);
	else
		res.status(400).send(JSON.stringify({"status": "failed"}));
}

// send email with nodemailer to the user's email
// add user x to the users table but give them Verified(x) = 'Pending'
// send user back to the landing page, and give them a message telling them to verify by email
// on 

export const signUserUp = async (req, res) => {
	/* Attempt to sign the user up */
	const { user, pass, email } = req.body;
	console.log(`Signing up user: ${user}\nPassword: ${pass}\nemail: ${email}`);
	// attempt to sign user up if credentials are valid
	if (await validQueries([user, pass, email], [/^[a-z0-9]+$/i, /^[a-z0-9]+$/i, /^[a-z0-9]+@[a-z0-9]+\.[a-z]+$/i])) {
		// check database for username
		const added: QueryResult = await checkForUser(user);
		if (added.rows.length) {	// return failed sign up attempt if user already exists
			console.log(`User ${user} exists in the system`);
			res.status(406).end();
		} else { // 
			// if the user doesn't exist, attempt to sign them up
			const useradded = await addUser(user, pass, email);
			if (useradded) {
				console.log(`Signing up new user ${user}. Awaiting verification.`);
				const sent:boolean = await sendMail(user, email);
				console.log(`Sent: ${sent}`);
				if (sent) {
					console.log(`Sent email to ${email}`);
					res.status(200).send(JSON.stringify({"user": user}));
				} else {
					console.log('Could not send mail');
					res.status(406).end();
				}
			} else
				res.status(406).end();
		}
	} else {
		res.status(400).end();
	}
}

const sendMail = async (user, email): Promise<boolean> => {
	const transporter = nodemailer.createTransport({
		service: 'gmail',
		auth: {
			user: process.env.MAILADDRESS,
			pass: process.env.MAILPW,
		},
		port: 25,
		tls: {
			rejectUnauthorized: true
		}
	});
	const verifyID: string = await createSessionID();
	const safeID: string = encodeURIComponent(verifyID);
	db.set(verifyID, user, 'EX', expiry);
	// FIXME: instead of directing to ?user=user, put a session key in redis and send it to the user
	// the user will click on this link and the backend will process the require to make sure it's legitimate
	// we won't be able to use normal session keys because I'm currently encoding them in base64. Maybe use base32?
	let end = `${process.env.VERIFY_ENDPOINT}/verifyaccount?id=${safeID}`;
	console.log(`Sending user to endpoint: ${end}`);
	let mailConfig = {
		from: process.env.MAIL,
		to: email,
		subject: 'Verification Required for Tunnelr',
		html: `<p>Please click <a href="${end}">here</a> to verify your account</p>`
	};
	const info = await transporter.sendMail(mailConfig);
	if (info.rejected.length) {
		console.log(`Error sending email: ${Object.getOwnPropertyNames(info)}`);
		console.log(info.accepted);
		console.log(info.rejected);
		console.log(info.response);
		return false;
	} else {
		console.log(`Mail sent to <${email}>: ${info.response}`);
		return true;
	}
}

export const verifyAccount = async (req, res) => {
	//console.log('Attempting to verify an account sent to an email link.');
	const { id } = req.query;
	const user = await db.get(id);
	console.log(`Verifying ${user} with id: ${id}`);
	if (!user) {
		res.status(400).redirect('/');
	} else {
		//console.log(`Verifying ${user}`);
		let query: string = 'select username from users where username=$1 and verified=$2';
		let values: Array<string> = [user, 'No'];
		const resp = await db.query(query, values);
		if (resp && resp.rows) {
			// need to verify user
			query = 'update users set verified=$1 where username=$2';
			values = ['Verified', user];
			const r = await db.query(query, values);
			// remove verification id from cache
			db.del(id);
			if (r) {
				res.status(200).redirect('/');
			} else {
				res.status(200).send('Could not verify');
			}
		} else {
			// remove verification id from cache
			db.del(id);
			res.status(200).send('Already verified');
		}
	}
}

const checkForUser = async (user): Promise<QueryResult> => {
	/* Check the database for a verified user */
	const query: string = 'select * from users where username=$1 and verified=$2';
	const values: Array<string> = [user, 'Verified'];
	return db.query(query, values);
}

export const checkHashes = async (password, hashed): Promise<string> => {
	return new Promise(resolve => {
		bcrypt.compare(password, hashed, (err, hash) => {
			if (err) resolve('');
			else resolve(hash);
		});
	});
}

const validQueries = async (queries, regexes): Promise<boolean> => {
	/* Ensure the query string passes the regex validation */
	return new Promise(resolve => {
		queries.map((value, idx) => {
			if (!value.match(regexes[idx])) {
				resolve(false);
				return;
			}
		});
		// return true; all valued passed input validation
		resolve(true);
	});
}

export const computeSaltedHashedPass = async (pass): Promise<string> => {
	/* Generate a salted hash of the user submitted password */
	const rounds: number = 10;
	return new Promise((resolve, reject) => {
		bcrypt.genSalt(rounds, (err, salt) => {
			if (err) reject(err);
			else {
				bcrypt.hash(pass, salt, (err, hash) => {
					if (err) reject(err);
					else resolve(hash);
				});
			}
		});
	});
}

const addUser = async (user, pass, email): Promise<boolean> => {
	/* Add a user to the Tunnelr database */
	const hashed: string = await computeSaltedHashedPass(pass);
	console.log(`Computed hash: ${hashed}`);
	const query: string = 'insert into users (username, password, email) values ($1, $2, $3)';
	const values: Array<string> = [user, hashed, email];
	try {
		const added: QueryResult = await db.query(query, values);
		if (!added) return false;
		else return true;
	} catch(err) {
		return false;
	}
}

const createSessionID = async (): Promise<string> => {
	/* return 64 bytes of entropy encoded in base64 to be used as a session ID */
	return new Promise(resolve => {
		resolve(crypto.randomBytes(64).toString('base64'));
	});
}