import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import * as dotenv from 'dotenv';
import * as nodemailer from 'nodemailer';
import * as db from './databaseFunctions';

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

const establishSession = async (user, res) => {
	const id = await createSessionID();
	const clientData = {
		user: user,
		sessionid: id
	};
	// set session id
	db.set(id, user, 'EX', expiry);
	// set cookie data
	res.cookie("sessionID", clientData, { maxAge: 1000 * expiry, /*secure: true,*/ httpOnly: true, sameSite: true});
	res.send(JSON.stringify({"status": user}));
}

export const retrieveSession = async (req, res) => {
	/* Retrieve user session */
	if (req.cookies.sessionID) {
		//console.log("Trying to retrieve");
		const { user, sessionid } = req.cookies.sessionID;
		const session = await checkForSession(sessionid);
		console.log(`Session: ${session}`);
		if (session)
			res.send(JSON.stringify({"status": user}));
		else
			res.send(JSON.stringify({"status": "failed"}));
	} else {
		//console.log("No cookies found.");
		res.send(JSON.stringify({"status": "failed"}));
	}
}

const checkForSession = async id => {
	try {
		const session = await db.get(id);
		//console.log(`Checked session: ${session}`);
		if (session)
			return session;
		return null;
	} catch(err) {
		//console.log(`Error occurred: ${err}`);
		return null;
	}
}

export const authenticate = async (user, pass, res) => {
	const added = await checkForUser(user);
	if (added.rows.length !== 0) {	// return failed sign up attempt if user already exists
		// extract hashed password
		const hashed = added.rows[0].password;
		// FIXME: validate bcrypt
		const matched = await checkHashes(pass, hashed);
		console.log(matched);
		if (matched) {
			console.log(`Signing in ${user}`);
			// FIXME: check for profile picture, friends, channels
			let query = 'select username, profile, created_at from users where username=$1';
			let values = [user];
			const userData = await db.query(query, values);
			query = "select friend2 as friend from friendships where friend1=$1 and status='Friended' union select friend1 from friendships where friend2=$2 and status='Friended'";
			values = [user, user];
			console.log(userData.rows);
			const friends = await db.query(query, values);
			console.log(friends.rows);
			query = 'select channelname from members where username=$1';
			values = [user];
			const channels = await db.query(query, values);
			console.log(channels.rows);

			// FIXME: check for profile; if it exists, read it from disk
			// send all data to the client
			establishSession(user, res);
			// FIXME set cookie to return to user
		} else
			res.send(JSON.stringify({"status": "failed"}));
	} else {
		res.send(JSON.stringify({"status": "failed"}));
	}
}

export const signUserIn = async (req, res) => {
	const { user, pass } = req.body;
	if (await validQueries([user, pass], [/^[a-z0-9]+$/i, /^[a-z0-9]+$/i]))
		authenticate(user, pass, res);
	else
		res.send(JSON.stringify({"status": "failed"}));
}

// send email with nodemailer to the user's email
// add user x to the users table but give them Verified(x) = 'Pending'
// send user back to the landing page, and give them a message telling them to verify by email
// on 

export const signUserUp = async (req, res) => {
	/* Attempt to sign the user up */
	const { user, pass, email } = req.body;
	// attempt to sign user up if credentials are valid
	if (await validQueries([user, pass, email], [/^[a-z0-9]+$/i, /^[a-z0-9]+$/i, /^[a-z0-9]+@[a-z0-9]+\.[a-z]+$/i])) {
		// check database for username
		const added = await checkForUser(user);
		if (added.rows.length !== 0)	// return failed sign up attempt if user already exists
			res.send(JSON.stringify({"status": "failed"}));
		else {		// 
			// if the user doesn't exist, attempt to sign them up
			if (addUser(user, pass, email)) {
				console.log(`Signing up new user ${user}. Awaiting verification.`);
				const sent = sendMail(user, email);
				// establish session
				// establishSession(user, res);
				if (sent) {
					res.send(JSON.stringify({"status": user}));
				} else {
					res.send(JSON.stringify({"status": "failed"}));
				}
			} else {
				res.send(JSON.stringify({"status": "failed"}));
			}
		}
	} else {
		res.send(JSON.stringify({"status": "failed"}));
	}
}

const sendMail = async (user, email) => {
	const transporter = nodemailer.createTransport({
		service: 'gmail',
		auth: {
			user: process.env.MAILADDRESS,
			pass: process.env.MAILPW,
		}
	});
	console.log(process.env.MAILADDRESS);
	console.log(process.env.MAILPW);
	let mailConfig = {
		from: process.env.MAIL,
		to: email,
		subject: 'Verification Required for Tunnelr',
		html: `<p>Please click <a href="http://localhost:5555/verifyaccount?user=${user}">here</a> to verify your account</p>`
	};
	transporter.sendMail(mailConfig, (err, info) => {
		if (err) {
			console.log(`Error sending email: ${err}`);
			return true;
		} else {
			console.log(`Mail sent: ${info.response}`);
			return false;
		}
	});
}

export const verifyAccount = async (req, res) => {
	console.log('Attempting to verify an account sent to an email link.');
	const { user } = req.query;
	console.log(`Verifying ${user}`);
	let query = 'select username from users where username=$1 and verified=$2';
	let values = [user, 'No'];
	const resp = await db.query(query, values);
	if (resp && resp.rows) {
		// need to verify user
		query = 'update users set verified=$1 where username=$2';
		values = ['Verified', user];
		const r = await db.query(query, values);
		if (r && r.rows) {
			res.status(200).redirect('/');
		} else {
			res.status(200).send('Could not verify');
		}
	} else {
		res.status(200).send('Already verified');
	}
}

const checkForUser = async user => {
	/* Check the database for the existence of a user */
	const query = 'select * from users where username=$1';
	const values = [user];
	return await db.query(query, values);
}

export const checkHashes = async (password, hashed) => {
	return new Promise(resolve => {
		bcrypt.compare(password, hashed, (err, hash) => {
			if (err) resolve(false);
			else resolve(hash);
		});
	});
}

const validQueries = async (queries, regexes) => {
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

export const computeSaltedHashedPass = async pass => {
	/* Generate a salted hash of the user submitted password */
	const rounds = 10;
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

const addUser = async (user, pass, email) => {
	/* Add a user to the Tunnelr database */
	const hashed = await computeSaltedHashedPass(pass);
	console.log(hashed);
	const query = 'insert into users (username, password, email) values ($1, $2, $3)';
	const values = [user, hashed, email];
	try {
		const added = await db.query(query, values);
		if (!added) return false;
		else return true;
	} catch(err) {
		console.log(`Error: ${err}`);
		return false;
	}
}

const createSessionID = async () => {
	/* return 64 bytes of entropy encoded in base64 to be used as a session ID */
	return new Promise(resolve => {
		resolve(crypto.randomBytes(64).toString('base64'));
	});
}