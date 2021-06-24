import * as fs from 'fs';
import * as crypto from 'crypto';
import * as stream from 'stream';
import * as db from './databaseFunctions';

// regular expressions for database input validation
const alphaSpaceRegex = /^[a-z0-9\s]+$/i; // alphanumeric + space

export const loadUserInfo = async (req, res) => {
    const name = req.query.name;
    console.log(`Username: ${name}`);
    const query = 'select * from users where username=$1';
    const values = [name];
    const data = await db.query(query, values);
    const { created_at, profile } = data.rows[0];
	console.log(`Created at: ${created_at}`);
    if (!profile) {
        const date = `{"created_at": "${created_at}", "profile": "${null}"}`;
        res.send(date);
    } else {
        // read user's profile from the disk
        const pic = await readProfileFromDisk(profile);
        const date = `{"created_at": "${created_at}", "profile": "${pic}"}`;
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
        console.log(`user: ${user}`);
		// insert hash into the document table
		const result = await insertProfileIntoDB(user, hash);
		console.log(`Written: ${written}\nResult: ${result}`);
		if (written && result) {
			res.send(JSON.stringify({"status": "success"}));
		 } else {
			 res.send(JSON.stringify({"status": "null"}));
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