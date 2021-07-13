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
	let query: string = 'select username, password from users where username=$1';
	let values: Array<string> = [user];
	const resp = await db.query(query, values);
	if (resp && resp.rows) { 
		// extract user credentials from the user table
		const { username, password } = resp.rows[0];
		//console.log(resp.rows[0].username);
		//console.log(resp.rows[0].password);
		const matched = await checkHashes(oldpassword, password);
		if (matched) {
			// user is authenticated; reset password
			// run bcrypt on the newpassword
			// construct an update query to update the user's record
			const salted = await computeSaltedHashedPass(newpassword);
			//console.log(`Resetting password to salted password: ${salted}`);
			query = 'update users set password=$1 where username=$2 and password=$3';
			values = [salted, user, password];
			const resp2 = await db.query(query, values);
			console.log(resp2);
			if (resp2 && resp2.rows) {
				console.log(`Rows: ${resp2.rows}`);
			}
			res.status(200).end();
		} else	
			res.status(400).end(); // user entered an incorrect password
	} else
		res.status(400).end();
}

export const deleteAccount = async (req, res) => {
	const { username, password } = req.body;
	const { user, sessionid } = req.cookies.sessionID;
	// FIXME: ensure that the user is who they say they are and are currently logged in (i.e. check the redis cache)
	//console.log(`Username: '${username}'\nPassword: '${password}'\nUser: '${user}'`);
	if (user != username) {
		// a user is requesting deletion of another user's account; do not authorize
		res.status(403).end();
	} else {
		//console.log(`Username: ${username}\nPassword: ${password}`);
		//console.log(user);
		// pull user and credentials from the database
		let query = 'select username, password from users where username=$1';
		let values = [username];
		const resp = await db.query(query, values);
		if (resp && resp.rows && resp.rows.length) {
			const hashed = resp.rows[0]["password"];
			console.log(`Hashed: ${hashed}`);
			//const computedPass = await computeSaltedHashedPass(password);
			// compare the passwords. if they match, user is authenticated
			const matched = await checkHashes(password, hashed);
			if (matched) {
				// found user
				query = 'delete from users where username=$1';
				// delte the user from the database
				// FIXME: what else do we have to do? How do we handle their messages, channels, friends, profile picture??
				const deleted = await db.query(query, values);
				if (deleted && deleted.rows) {
					// user has been deleted; now delete the user session
					if (db.exists(sessionid)) db.del(sessionid);
					res.status(200).end();
				} else
					res.status(400).end();
			} else
				res.status(403).end();
		} else {
			// user doesn't exist
			res.status(400).end();
		}
	}
}

export const loadUserInfo = async (req, res) => {
	const { user } = req.cookies.sessionID;
    const name = req.query.name;
    console.log(`Username: ${name}`);
    let query = 'select * from users where username=$1';
    let values = [name];
    let data = await db.query(query, values);
	const created_at = data.rows.length ? data.rows[0].created_at : null;
	const profile = data.rows.length ? data.rows[0].profile : null;
	// construct query for finding all friends
	query = "select friend2 as friend from friendships where friend1=$1 and status='Friended' union select friend1 from friendships where friend2=$2 and status='Friended'";
	console.log(`Checking for ${name}`);
	values = [name, name];
	data = await db.query(query, values);
	console.log(`Data:`);
	console.log(data);
	let friends = JSON.stringify(data.rows);
	console.log(`Friends: ${friends}`);
	//query = "select friend2 as pendingfriend from friendships where friend1=$1 and status='Pending' union select friend1 from friendships where friend2=$2 and status='Pending'";
	query = "select friend2 as pending from friendships where friend1=$1 and friend2=$2 and status='Pending'";
	values = [user, name];
	const pending = await db.query(query, values);
	console.log(`Created at: ${created_at}`);
	query = 'select channelname from members where username=$1';
	values = [name];
	const channels = await db.query(query, values);
	if (!profile) {
        const date = `{"user": "${user}", "created_at": "${created_at}", "profile": ${null}, "friends": ${friends}, "pending": ${JSON.stringify(pending.rows)}, "channels": ${JSON.stringify(channels)}}`;
        res.status(200).send(date);
    } else {
        // read user's profile from the disk
        const pic = await readProfileFromDisk(profile);
        const date = `{"user": "${user}", "created_at": "${created_at}", "profile": "${pic}", "friends": ${friends}, "pending": ${JSON.stringify(pending.rows)}, "channels": ${JSON.stringify(channels)}}`;
        res.status(200).send(date);
    }
}

export const uploadUserProfile = async (req, res) => {
	/* save a user's profile photo to disk */
	const { user } = req.cookies.sessionID;
	const image = req.file["buffer"];
	try {
		// compute the SHA256 hash of the image
		const hash = await hashFile(image);
		// save profile photo on disk
		// FIXME: programmatically set image file extension
		const written = await writeProfileToDisk(hash, image, 'jpg');
		// read the data (we should instead read the image variable)
		const profile = await readProfileFromDisk(hash);
		// insert hash into the document table
		const result = await insertProfileIntoDB(user, hash);
		//console.log(`Written: ${written}\nResult: ${result}`);
		if (written && result)
			res.status(200).send(JSON.stringify({"profile": profile}));
		else
			res.status(400).end();
	} catch (error) {
		res.status(400).end();
	}
}

const insertProfileIntoDB = async (user, hash) => {
	/* insert the profile hash into the user record */
	const values = [hash, user]
	const query = `update users set profile=$1 where username=$2`;
	if (await validateQuery(values, alphaSpaceRegex)) {
		try {
			const rows = await db.query(query, values);
			if (rows) return true;
            return false;
		} catch (error) {
			return false;
		}
	} else
		return false;
}

export const readProfileFromDisk = async (profile) => {
	const dir = `./data/profiles/`;
	const fileRegex = new RegExp(`${profile}\.(png|jpg|jpeg)`);
	return new Promise((resolve, reject) => {
		fs.readdir(dir, (err, files) => {
			if (!files || err) resolve(null);
			const file = files.filter(ff => { return ff.match(fileRegex) });
			if (!file || file.toString() == "") resolve(null);
			const path = `./data/profiles/${file.toString()}`;
			fs.access(path, err => {
				if (err) resolve(null);
				fs.readFile(path, 'base64', (err, data) => {
					if (err) resolve(null);
					resolve(data);
				});
			});
		});
	});
}

const writeProfileToDisk = async (hash, file, ext) => {
    return new Promise((resolve, reject) => {
        fs.writeFile(`./data/profiles/${hash}.${ext}`, file, err => {
            if (err) resolve(null);
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
    const cookie = req.cookies.sessionID.sessionid;
    // delete user session
    if (db.exists(cookie)) db.del(cookie);
    // return status code
    res.status(200).end();
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