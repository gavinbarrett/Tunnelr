import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import * as db from './databaseFunctions';

const expiry: number = 60 * 60 // 60 minutes

export const authenticateUser = async (req, res, next) => {
	/* Check for user */
	if (!req.cookies.sessionID) {
		res.status(401).send(JSON.stringify({"status": "failed"}));
	} else {
		const user = req.cookies.sessionID.user;
		const id = req.cookies.sessionID.sessionid;
		const keys = db.exists(id);
		// FIXME: ensure queried user is associated with Redis entry
		keys ? next() : res.status(401).send(JSON.stringify({"status": "failed"}));
	}
}

export const retrieveSession = async (req, res) => {
	/* Retrieve user session */
	if (req.cookies.sessionID) {
		//console.log("Trying to retrieve");
		const { user, sessionid } = req.cookies.sessionID;
		//console.log(`User: ${user}\nSessionID: ${sessionid}`);
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

export const signUserIn = async (req, res) => {
	const { user, pass } = req.body;
	if (await validateQueries([user, pass], [/^[a-z0-9]+$/i, /^[a-z0-9]+$/i])) {
		// check database for username
		const added = await checkForUser(user);
		if (added.rows.length !== 0) {	// return failed sign up attempt if user already exists
			// extract hashed password
			const hashed = added.rows[0].password;
			// FIXME: validate bcrypt
			const matched = await checkHashes(pass, hashed);
			console.log(matched);
			if (matched) {
				console.log(`Signing in ${user}`);
				const id = await createSessionID();
				const clientData = {
					user: user,
					sessionid: id
				};
				// set session id
				db.set(id, user, 'EX', expiry);
				res.cookie("sessionID", clientData, { maxAge: 1000 * expiry, /*secure: true,*/ httpOnly: true, sameSite: true});
				res.send(JSON.stringify({"status": user}));
				// FIXME set cookie to return to user
			} else {
				console.log("failed");
				res.send(JSON.stringify({"status": "failed"}));
			}
		} else {		// 
			res.send(JSON.stringify({"status": "failed"}));
		}
	} else {
		res.send(JSON.stringify({"status": "failed"}));
	}
}

export const signUserUp = async (req, res) => {
	/* Attempt to sign the user up */
	const { user, pass, email } = req.body;
	// attempt to sign user up if credentials are valid
	if (await validateQueries([user, pass, email], [/^[a-z0-9]+$/i, /^[a-z0-9]+$/i, /^[a-z0-9]+@[a-z0-9]+\.[a-z]+$/i])) {
		// check database for username
		const added = await checkForUser(user);
		if (added.rows.length !== 0)	// return failed sign up attempt if user already exists
			res.send(JSON.stringify({"status": "failed"}));
		else {		// 
			// if the user doesn't exist, attempt to sign them up
			const userAdded = addUser(user, pass, email);
			if (userAdded) {
				console.log(`Signing up new user ${user}`);
				const id = await createSessionID();
				const clientData = {
					user: user,
					sessionid: id
				};
				// set session id
				db.set(id, user, 'EX', expiry);
				res.cookie("sessionID", clientData, { maxAge: 1000 * expiry, /*secure: true,*/ httpOnly: true, sameSite: true});
				res.send(JSON.stringify({"status": user}));
			} else {
				res.send(JSON.stringify({"status": "failed"}));
			}
			// FIXME: generate a user session id

			// FIXME: set the session id in the cookie and return it along with a successful status code
		}
	} else {
		res.send(JSON.stringify({"status": "failed"}));
	}
}

const checkForUser = async user => {
	/* Check the database for the existence of a user */
	const query = 'select * from users where username=$1';
	const values = [user];
	return await db.query(query, values);
	//if (rows.rows.length !== 0) return true;
	//else return false;
}

const checkHashes = async (password, hashed) => {
	return new Promise(resolve => {
		bcrypt.compare(password, hashed, (err, hash) => {
			if (err) resolve(false);
			else resolve(hash);
		});
	});
}

const validateQueries = async (queries, regexes) => {
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

const computeSaltedHashedPass = async pass => {
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