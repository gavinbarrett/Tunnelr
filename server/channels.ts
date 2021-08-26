import * as url from 'url';
import * as bcrypt from 'bcrypt';
import { checkHashes } from './authServer';
import * as db from './databaseFunctions';
import { QueryResult } from 'pg';
import { Request, Response } from 'express';

export const addChannel = async (req: Request, res: Response) => {
	const { channelName, access, credentials, mode } = req.body;
	const user: string = req.cookies.sessionID.user;
	// FIXME: perform input validation on access and credentials fields
	// perform input validation
	const reg: RegExp = /^@[a-z0-9]{5,32}$/i;
	if (!channelName.match(reg))
		res.status(400).end();
	else {
		// ensure channel doesn't already exist
		const exists = await checkForChannel(channelName);
		if (exists && exists.rows.length !== 0) {
			res.status(400).end();
		} else {
			const added = insertNewChannel(channelName, access, credentials, mode);
			if (added) {
				// FIXME: add user to channel
				const userAdded = await insertNewMember(channelName, user);
				if (userAdded) {
					console.log('Could not add member to channel.');
					res.status(400).end();
				} else
					res.status(200).end();
			} else {
				res.status(400).end();
			}
		}
	}
}

export const loadChannels = async (req: Request, res: Response) => {
	const { user } = req.cookies.sessionID;
	if (!user.match(/^[a-z0-9]{2,64}$/i))
		res.status(400).end();
	else {
		const query: string = 'select channelname from members where username=$1';
		const values: Array<string> = [user];
		const channels: QueryResult = await db.query(query, values);
		if (channels.rowCount)
			res.status(200).send(JSON.stringify({"channels": channels.rows}));
		else
			res.status(400).end();
	}
}

export const loadChannelInfo = async (req: Request, res: Response) => {
	const channelName = req.query.channelname;
	const user: string = req.cookies.sessionID.user;
	const exists = await checkForChannel(channelName.toString());
	const member = await checkForMembership(user, channelName.toString());
	if (exists.rowCount) {
		const channelname = exists.rows[0]['channelname'];
		const accesslevel = exists.rows[0]['accesslevel'];
		const accessmode = exists.rows[0]['accessmode'];
		const created_at = exists.rows[0]['created_at'];
		// FIXME: don't destructure in case the columns don't
		if (member.rowCount) {
			const username: string = member.rows[0].username;
			const status: string = member.rows[0].status;
			const payload: string = `{"memberstat": "${status}", "name": "${channelname}", "access": "${accesslevel}", "mode": "${accessmode}", "created_at": "${created_at}"}`;
			// FIXME: load all info from the channel - privacy level, privacy mode, date of creation, etc
			res.status(200).send(payload);
		} else {
			const payload = `{"memberstat": "NOT", "name": "${channelname}", "access": "${accesslevel}", "mode": "${accessmode}", "created_at": "${created_at}"}`;
			// FIXME: load all info from the channel - privacy level, privacy mode, date of creation, etc
			res.status(200).send(payload);
		}
	} else
		res.status(400).send(JSON.stringify({"name": "failed"}));
}

export const getMessages = async (req: Request, res: Response) => {
	const uobj = url.parse(req.url);
	const pathname = uobj.pathname;
	const p = new URLSearchParams(uobj.search);
	const roomid = p.get("roomID");
	const allMessages = await db.xread(roomid, 0);
	if (!allMessages || allMessages.length === 0) res.send(JSON.stringify({"status": "none"}));
	else res.send(JSON.stringify({"status": allMessages[0]}));
}

export const getUpdatedMessages = async (req: Request, res: Response) => {
	const uobj = url.parse(req.url);
	const pathname = uobj.pathname;
	const p = new URLSearchParams(uobj.search);
	const channelName: string = p.get("roomID");
	const messageid: number = parseInt(p.get("lastmessage"));
	const newMessages = await db.xread(channelName, messageid);
	if (!newMessages || newMessages.length === 0) res.send(JSON.stringify({"status": "failed"}));
	else res.send(JSON.stringify({"status": newMessages}));
}

export const queryChannel = async (req: Request, res: Response) => {
	const { channelid } = req.body;
	// FIXME: input validation
	const channelReg: RegExp = /^[a-z0-9]{5,32}$/i;
	const query: string = 'select channelName, accessLevel from channels where channelName ~* $1';
	const values: Array<string> = [channelid];
	const exists: QueryResult = await db.query(query, values);
	if (exists) {
		if (exists.rowCount) {
			res.send(JSON.stringify({"status": "failed"}));
		} else {
			res.send(JSON.stringify({"status": exists.rows}));
		}
	} else {
		res.send(JSON.stringify({"status": "failed"}));
	}
}

const insertNewChannel = async (channelName: string, access: string, credentials: string, mode: string) => {
	// hash credentials
	const hashed: string|null = await hashChannelCredentials(credentials);
	//console.log(hashed);
	let accessmode: string = '';
	if (access === 'Private') {
		if (mode === 'Password') accessmode = 'PSK';
		else accessmode = 'ACL';
	}
	const query: string = 'insert into channels (channelName, accessLevel, credentials, accessmode) values ($1, $2, $3, $4)'
	const values: Array<string> = [channelName, access, hashed, accessmode];
	try {
		const added: QueryResult = await db.query(query, values);
		if (!added) return false;
		else return true;
	} catch (err) {
		//console.log(`Error adding channel: ${err}`);
		return false;
	}
}

const insertNewMember = async (channelname: string, user: string) => {
	const values: Array<string> = [channelname, user, 'MEMBER'];
	const query: string = `insert into members (channelname, username, status) values ($1, $2, $3)`;
	try {
		const added: QueryResult = await db.query(query, values);
		if (!added) return false;
		return true;
	} catch(err) {
		//console.log(`Error adding member to channel: ${err}`);
		return false;
	}
}

export const joinPublicChannel = async (req: Request, res: Response) => {
	const { user } = req.cookies.sessionID;
	const { channel } = req.query;
	// check for channel's existence and extract its access level/mode
	// if it is public, then add user
	let query: string = 'select channelname, accesslevel, accessmode from channels where channelname=$1';
	let values: Array<string> = [channel.toString()];
	const resp: QueryResult = await db.query(query, values);
	if (resp.rowCount) {
		query = 'insert into members (username, channelname, status) values ($1, $2, $3)';
		values = [user, channel.toString(), 'MEMBER'];
		const r: QueryResult = await db.query(query, values);
		// FIXME: increment the user_count in the channel table
		res.status(200).end();
	} else
		res.status(400).end();
}

export const joinPSKChannel = async (req: Request, res: Response) => {
	// join a channel protected with a pre-shared password
	const { user } = req.cookies.sessionID;
	const { password, channelname } = req.body;
	if (!password.match(/[a-z0-9]{0,64}/i))
		res.status(400).end();
	else {
		// check for channel's existence and extract its access level/mode
		// if it is PSK, extract password from req.body and check it against db pass
		// if they match, add user to db
		let query: string = 'select accesslevel, accessmode, credentials from channels where channelname=$1';
		let values: Array<string> = [channelname];
		const resp: QueryResult = await db.query(query, values);
		if (resp.rowCount) {
			const { accesslevel, accessmode, credentials } = resp.rows[0];
			if (accesslevel == "Private" && accessmode == "PSK") {
				// FIXME: perform input validation on password; if valid, compare it to credentials
				const hashes: string = await checkHashes(password, credentials);
				if (hashes) {
					// hashes match; user is authenticated. add a record in the members table
					query = 'insert into members (username, channelname, status) values ($1, $2, $3)';
					values = [user, channelname, 'MEMBER'];
					const r: QueryResult = await db.query(query, values);
					res.status(200).end();
				} else
					res.status(403).end();
			} else
				res.status(400).end();
		} else
			res.status(400).end();
	}
}

export const joinACLChannel = async (req: Request, res: Response) => {
	const { user } = req.cookies.sessionID;
	// check for channel's existence and extract its access level/mode
	// if it is ACL, change user status to PENDING and notify the creator of the channel so they can confirm you
	const query: string = '';
	res.send(JSON.stringify({"status": "failed"}));
}

export const leaveChannel = async (req: Request, res: Response) => {
	const { user } = req.cookies.sessionID;
	const { channel } = req.query;
	//console.log(`User: ${user}\nChannel: ${channel}`);
	// if user is a member of the channel, remove them. if that succeeds, return successful status code
	// else return failed code
	const membership = await checkForMembership(user, channel.toString());
	if (membership.rowCount) {
		// remove user
		const query: string = 'delete from members where username=$1 and channelname=$2';
		const values: Array<string> = [user, channel];
		const resp: QueryResult = await db.query(query, values);
		res.status(200).end();
	} else {
		res.status(400).end();
	}
}

const hashChannelCredentials = async (pass: string): Promise<string|null> => {
	const rounds: number = 10;
	return new Promise(resolve => {
		bcrypt.genSalt(rounds, (err, salt) => {
			if (err) resolve(null);
			else {
				bcrypt.hash(pass, salt, (err, hash) => {
					if (err) resolve(null);
					else resolve(hash);
				});
			}
		})
	});
}

export const checkForChannel = async (channelName: string): Promise<QueryResult> => {
	/* check if a channel exists */
	const query: string = `select channelname, accesslevel, accessmode, created_at from channels where channelname=$1`
	//const query = `select * from channels where channelname=$1`;
	const values: Array<string> = [channelName];
	return db.query(query, values);
}

export const checkForMembership = async (username: string, channelname: string): Promise<QueryResult> => {
	const query: string = `select * from members where username=$1 and channelname=$2`;
	const values: Array<string> = [username, channelname];
	return db.query(query, values);
}

export const checkForChannelExistence = async (channelName: string): Promise<QueryResult> => {
	/* check if a channel exists */
	const query: string = `select * from channels where channelname=$1`;
	const values: Array<string> = [channelName];
	return db.query(query, values);
}