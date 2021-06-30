import * as fs from 'fs';
import * as crypto from 'crypto';
import * as stream from 'stream';
import { checkHashes, computeSaltedHashedPass } from './authServer';
import * as db from './databaseFunctions';

// regular expressions for database input validation
const alphaSpaceRegex = /^[a-z0-9\s]+$/i; // alphanumeric + space

export const changePassword = async (req, res) => {
	const { oldpassword, newpassword } = req.body;
	const { user } = req.cookies.sessionID;
	console.log(`Received from ${user}:\nOld PW: ${oldpassword}\nNew PW: ${newpassword}`);
	let query = 'select username, password from users where username=$1';
	let values = [user];
	const resp = await db.query(query, values);
	if (resp && resp.rows) { 
		// extract user credentials from the user table
		const { username, password } = resp.rows[0];
		console.log(resp.rows[0].username);
		console.log(resp.rows[0].password);
		const matched = await checkHashes(oldpassword, password);
		if (matched) {
			// user is authenticated; reset password
			// run bcrypt on the newpassword
			// construct an update query to update the user's record
			const salted = await computeSaltedHashedPass(newpassword);
			console.log(`Resetting password to salted password: ${salted}`);
			query = 'update users set password=$1 where username=$2 and password=$3';
			values = [salted, user, password];
			const resp2 = await db.query(query, values);
			console.log(resp2);
			if (resp2 && resp2.rows) {
				console.log(`Rows: ${resp2.rows}`);
			}
			res.send(JSON.stringify({"status": "success"}));
		} else {
			// user entered an incorrect password
			res.send(JSON.stringify({"status": "failed"}));
		}
	} else {
		res.send(JSON.stringify({"status": "failed"}));
	}
}

export const deleteAccount = async (req, res) => {
	const { username, password } = req.body;
	const { user } = req.cookies.sessionID;
	console.log(`Username: '${username}'\nPassword: '${password}'\nUser: '${user}'`);
	if (user != username) {
		// a user is requesting deletion of another user's account; do not authorize
		res.send(JSON.stringify({"status": "failed"}));
	} else {
		console.log(`Username: ${username}\nPassword: ${password}`);
		console.log(user);

		// pull user and credentials from the database
		let query = 'select username, password from users where username=$1';
		let values = [username];
		const resp = await db.query(query, values);
		if (resp && resp.rows && resp.rows.length) {
			const hashed = resp.rows[0]["password"];
			console.log(`Hashed: ${hashed}`);
			//const computedPass = await computeSaltedHashedPass(password);
			// compare the passwords. if they match, user is authenticated
			const f = await checkHashes(password, hashed);
			console.log(`F: ${f}`);
			if (f) {
				// found user
				query = 'delete from users where username=$1';
				// delte the user from the database
				// FIXME: what else do we have to do? How do we handle their messages, channels, friends??
				const r = await db.query(query, values);
				if (r && r.rows) {
					// user has been deleted; now delete the user session
					const cookie = req.cookies.sessionID.sessionid;
					if (db.exists(cookie)) db.del(cookie);
					res.send(JSON.stringify({"status": "success"}));
				} else {
					console.log('Could not delete user');
					res.send(JSON.stringify({"status": "failed"}));
				}
			} else {
				res.send(JSON.stringify({"status": "failed"}));
			}
		} else {
			// user doesn't exist
			res.send(JSON.stringify({"status": "failed"}));
		}
	}
}

export const loadUserInfo = async (req, res) => {
    const name = req.query.name;
    console.log(`Username: ${name}`);
    let query = 'select * from users where username=$1';
    const values = [name];
    let data = await db.query(query, values);

	const created_at = data.rows.length ? data.rows[0].created_at : null;
	const profile = data.rows.length ? data.rows[0].profile : null;

	// construct query for finding all friends
	query = `select friend2 as friend from friendships where friend1=$1 and status='Friended' intersect select friend1 from friendships where friend2=$1 and status='Friended'`;
	data = await db.query(query, values);
	let friends = JSON.stringify(data.rows);
	console.log(`Friends: ${friends}`);
	console.log(`Created at: ${created_at}`);
    if (!profile) {
        const date = `{"created_at": "${created_at}", "profile": "${null}", "friends": ${friends}}`;
        res.send(date);
    } else {
        // read user's profile from the disk
        const pic = await readProfileFromDisk(profile);
        const date = `{"created_at": "${created_at}", "profile": "${pic}", "friends": ${friends}}`;
        res.send(date);
    }
}

export const uploadUserProfile = async (req, res) => {
	/* save a user's profile photo to disk */
    console.log(req.cookies);
	const user = req.cookies.sessionID['user'];
    console.log(req);
	const image = req.file["buffer"];
	try {
		// try to insert image file into the users table
		// FIXME: save to disk instead of inserting into the db; add the hash to the user record
		const hash = await hashFile(image);
		console.log(`Hash: ${hash}`);
		// save profile photo on disk
		// FIXME: programmatically set image file extension
		const written = await writeProfileToDisk(hash, image, 'jpg');
		const profile = await readProfileFromDisk(hash);
        console.log(`Image: ${image}`);
		// insert hash into the document table
		const result = await insertProfileIntoDB(user, hash);
		console.log(`Written: ${written}\nResult: ${result}`);
		if (written && result) {
			res.send(JSON.stringify({"status": "success", "profile": profile}));
		 } else {
			 res.send(JSON.stringify({"status": "null", "profile": "null"}));
		 }
	} catch (error) {
		console.log(`Error uploading file: ${error}`);
		res.send(JSON.stringify({"status": "failed"}));
	}
}

const insertProfileIntoDB = async (user, hash) => {
	/* insert the profile hash into the user record */
	const values = [hash, user]
	const query = `update users set profile=$1 where username=$2`;
	if (await validateQuery(values, alphaSpaceRegex)) {
		try {
			const rows = await db.query(query, values);
            console.log(rows);
			if (rows) return true;
            return false;
		} catch(error) {
			console.log(`Error inserting profile into db: ${error}`);
			return false;
		}
	} else {
		return false;
	}
}

const readProfileFromDisk = async (profile) => {
	const dir = `./data/profiles/`;
	console.log(`Profile: "${profile}"`);
	const fileRegex = new RegExp(`${profile}\.(png|jpg|jpeg)`);
	return new Promise((resolve, reject) => {
		fs.readdir(dir, (err, files) => {
			if (!files || err) resolve(null);
			else {
				const file = files.filter(ff => { return ff.match(fileRegex) });
				if (!file || file.toString() == "") resolve(null);
				const path = `./data/profiles/${file.toString()}`;
				fs.access(path, err => {
					if (err) {
						console.log(`Error accessing file: ${err}`);
						resolve(null);
					}
					fs.readFile(path, 'base64', (err, data) => {
						if (err) {
							console.log(`Error reading file: ${err}`);
							resolve(null);
						}
						resolve(data);
					});
				});
			}
		});
	});
}

const writeProfileToDisk = async (hash, file, ext) => {
    return new Promise((resolve, reject) => {
        fs.writeFile(`./data/profiles/${hash}.${ext}`, file, err => {
            if (err) {
                console.log(err);
                resolve(null);
            }
            console.log(`${hash}.${ext} written to disk.`);
            resolve(true);
        });
    });
}

const validateQuery = async (inputs, regex) => {
	return new Promise((resolve, reject) => {
		for (let i = 0; i < inputs.length; i++) {
			if (!inputs[i].match(regex))
				resolve(false);
		}
		resolve(true);
	});
}

export const logUserOut = async (req, res) => {
    // FIXME: make sure that the user being logged out is the user requesting the log out
    // FIXME: this is currently a flaw in our authflow
    const cookie = req.cookies.sessionID.sessionid;
    const user = req.cookies.sessionID.user;
    // delete user session
    if (db.exists(cookie)) db.del(cookie);
    // return status code
    res.send(JSON.stringify({"status": "logged out"}));
}

const hashFile = async (file) => {
	// compute the sha256 digest of a file
	return new Promise((resolve, reject) => {
		let str = new stream.Duplex();
		str.push(file);
		str.push(null);
		const shasum = crypto.createHash('sha256');
		str.on('error', err => { reject(err); });
		str.on('end', () => { resolve(shasum.digest('hex')); });
		str.pipe(shasum);
	});
}