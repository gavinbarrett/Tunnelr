import { checkHashes, computeSaltedHashedPass } from './authServer';
import { readProfileFromDisk } from './profile';
import * as db from './databaseFunctions';
import { QueryResult } from 'pg';
import { Request, Response } from 'express';

export const changePassword = async (req: Request, res: Response) => {
	const { oldpassword, newpassword } = req.body;
	const { user } = req.cookies.sessionID;
	console.log(`Received from ${user}:\nOld PW: ${oldpassword}\nNew PW: ${newpassword}`);
	let query: string = 'select username, password from users where username=$1';
	let values: Array<string> = [user];
	let resp: QueryResult = await db.query(query, values);
	if (resp.rowCount) { 
		// extract user credentials from the user table
		const { username, password } = resp.rows[0];
		//console.log(resp.rows[0].username);
		//console.log(resp.rows[0].password);
		const matched: string = await checkHashes(oldpassword, password);
		if (matched) {
			// user is authenticated; reset password
			// run bcrypt on the newpassword
			// construct an update query to update the user's record
			const salted: string = await computeSaltedHashedPass(newpassword);
			//console.log(`Resetting password to salted password: ${salted}`);
			query = 'update users set password=$1 where username=$2 and password=$3';
			values = [salted, user, password];
			resp = await db.query(query, values);
			console.log(resp);
			if (resp.rowCount) {
				console.log(`Rows: ${resp.rows}`);
			}
			res.status(200).end();
		} else	
			res.status(400).end(); // user entered an incorrect password
	} else
		res.status(400).end();
}

export const loadUserInfo = async (req: Request, res: Response) => {
	const { user } = req.cookies.sessionID;
    const name: string = req.query.name.toString();
    console.log(`Username: ${name}`);
    let query: string = 'select * from users where username=$1';
    let values: Array<string> = [name];
    let data: QueryResult = await db.query(query, values);
	const created_at: string|null = data.rows.length ? data.rows[0].created_at : null;
	const profile: string|null = data.rows.length ? data.rows[0].profile : null;
	// construct query for finding all friends
	query = "select friend2 as friend from friendships where friend1=$1 and status='Friended' union select friend1 from friendships where friend2=$2 and status='Friended'";
	console.log(`Checking for ${name}`);
	values = [name, name];
	data = await db.query(query, values);
	console.log(`Data:`);
	console.log(data);
	let friends: string = JSON.stringify(data.rows);
	console.log(`Friends: ${friends}`);
	//query = "select friend2 as pendingfriend from friendships where friend1=$1 and status='Pending' union select friend1 from friendships where friend2=$2 and status='Pending'";
	query = "select friend2 as pending from friendships where friend1=$1 and friend2=$2 and status='Pending'";
	values = [user, name];
	const pending: QueryResult = await db.query(query, values);
	console.log(`Created at: ${created_at}`);
	query = 'select channelname from members where username=$1';
	values = [name];
	const channels: QueryResult = await db.query(query, values);
	if (!profile) {
        const date: string = `{"user": "${user}", "created_at": "${created_at}", "profile": ${null}, "friends": ${friends}, "pending": ${JSON.stringify(pending.rows)}, "channels": ${JSON.stringify(channels)}}`;
        res.status(200).send(date);
    } else {
        // read user's profile from the disk
        const pic: string|null = await readProfileFromDisk(profile);
        const date: string = `{"user": "${user}", "created_at": "${created_at}", "profile": "${pic}", "friends": ${friends}, "pending": ${JSON.stringify(pending.rows)}, "channels": ${JSON.stringify(channels)}}`;
        res.status(200).send(date);
    }
}

export const logUserOut = async (req: Request, res: Response) => {
    const cookie: string = req.cookies.sessionID.sessionid;
    // delete user session
    if (await db.exists(cookie)) await db.del(cookie);
    // return status code
    res.status(200).end();
}

export const deleteAccount = async (req: Request, res: Response) => {
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
		let query: string = 'select username, password from users where username=$1';
		let values: Array<string> = [username];
		const resp: QueryResult = await db.query(query, values);
		if (resp.rowCount) {
			const hashed: string = resp.rows[0]["password"];
			console.log(`Hashed: ${hashed}`);
			//const computedPass = await computeSaltedHashedPass(password);
			// compare the passwords. if they match, user is authenticated
			const matched: string = await checkHashes(password, hashed);
			if (matched) {
				// found user
				query = 'delete from users where username=$1';
				// delte the user from the database
				// FIXME: what else do we have to do? How do we handle their messages, channels, friends, profile picture??
				const deleted: QueryResult = await db.query(query, values);
				if (deleted.rowCount) {
					// user has been deleted; now delete the user session
					if (await db.exists(sessionid)) await db.del(sessionid);
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