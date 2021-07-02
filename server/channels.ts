import * as url from 'url';
import * as bcrypt from 'bcrypt';
import { checkHashes } from './authServer';
import * as db from './databaseFunctions';

export const addChannel = async (req, res) => {
	const { channelName, access, credentials, mode } = req.body;
	const user = req.cookies.sessionID.user;
	console.log(`Channel Name: ${channelName}`);
	console.log(`Access level: ${access}`);
	console.log(`Mode: ${mode}`);
	// FIXME: perform input validation on access and credentials fields
	// perform input validation
	const reg = /^@[a-z0-9]{5,32}$/i;
	if (!channelName.match(reg))
		res.status(400).end();
	else {
		// ensure channel doesn't already exist
		console.log(`Checking channel ${channelName}`);
		const exists = await checkForChannel(channelName);
		console.log(`Exists: ${exists.rows}`);
		if (exists && exists.rows.length !== 0) {
			console.log("Channel already exists");
			res.status(400).end();
		} else {
			const added = insertNewChannel(channelName, access, credentials, mode);
			if (added) {
				console.log(`Channel ${channelName} added.`);
				// FIXME: add user to channel
				const ir = await insertNewMember(channelName, user);
				if (!ir) {
					console.log('Could not add member to channel.');
					res.status(200).end();
				} else
					res.status(400).end();
			} else {
				console.log(`Couldn't add channel.`);
				res.status(400).end();
			}
		}
	}
}

export const loadChannels = async (req, res) => {
	const { user } = req.cookies.sessionID;
	if (!user.match(/^[a-z0-9]{2,32}$/i))
		res.send(JSON.stringify({"status": "failed"}));
	else {
		const query = 'select channelname from members where username=$1';
		const values = [user];
		const channels = await db.query(query, values);
		console.log(`Channels: ${channels.rows}`);
		if (channels && channels.rows.length !== 0)
			res.send(JSON.stringify({"status": channels.rows}));
		else
			res.send(JSON.stringify({"status": "failed"}));
	}
}

export const loadChannelInfo = async (req, res) => {
	const channelName = req.query.channelname;
	const user = req.cookies.sessionID.user;
	console.log(`Checking channel ${channelName} for user ${user}`);
	const exists = await checkForChannel(channelName);
	const member = await checkForMembership(user, channelName);
	console.log(`Exists: ${exists.rows}`);
	if (exists && exists.rows && exists.rows.length) {
		const channelname = exists.rows[0]['channelname'];
		const accesslevel = exists.rows[0]['accesslevel'];
		const accessmode = exists.rows[0]['accessmode'];
		const created_at = exists.rows[0]['created_at'];
		// FIXME: don't destructure in case the columns don't
		if (member && member.rows && member.rows.length) {
			const username = member.rows[0].username;
			const status = member.rows[0].status;
			const payload = `{"memberstat": "${status}", "name": "${channelname}", "access": "${accesslevel}", "mode": "${accessmode}", "created_at": "${created_at}"}`;
			console.log(payload);
			// FIXME: load all info from the channel - privacy level, privacy mode, date of creation, etc
			res.status(200).send(payload);
		} else {
			const payload = `{"memberstat": "NOT", "name": "${channelname}", "access": "${accesslevel}", "mode": "${accessmode}", "created_at": "${created_at}"}`;
			console.log(payload);
			// FIXME: load all info from the channel - privacy level, privacy mode, date of creation, etc
			res.status(200).send(payload);
		}
	} else
		res.status(400).send(JSON.stringify({"name": "failed"}));
}

export const getMessages = async (req, res) => {
	const uobj = url.parse(req.url);
	const pathname = uobj.pathname;
	const p = new URLSearchParams(uobj.search);
	const roomid = p.get("roomID");
	const allMessages = await db.xread(roomid, 0);
	if (!allMessages || allMessages.length === 0) res.send(JSON.stringify({"status": "none"}));
	else res.send(JSON.stringify({"status": allMessages[0]}));
}

export const getUpdatedMessages = async (req, res) => {
	const uobj = url.parse(req.url);
	const pathname = uobj.pathname;
	const p = new URLSearchParams(uobj.search);
	const channelName = p.get("roomID");
	const messageid = p.get("lastmessage");
	console.log(`channelName: ${channelName}`);
	console.log(`messageid: ${messageid}`);
	const newMessages = await db.xread(channelName, messageid);
	console.log(`Messages: ${newMessages}`);
	if (!newMessages || newMessages.length === 0) res.send(JSON.stringify({"status": "failed"}));
	else res.send(JSON.stringify({"status": newMessages}));
}

export const queryChannel = async (req, res) => {
	const { channelid } = req.body;
	console.log(channelid);
	// FIXME: input validation
	const channelReg = /^[a-z0-9]{5,32}$/i;
	const query = 'select channelName, accessLevel from channels where channelName ~* $1';
	const values = [channelid];
	const exists = await db.query(query, values);
	if (exists) {
		console.log(exists.rows);
		if (exists.rows.length === 0) {
			res.send(JSON.stringify({"status": "failed"}));
		} else {
			res.send(JSON.stringify({"status": exists.rows}));
		}
	} else {
		res.send(JSON.stringify({"status": "failed"}));
	}
}

const insertNewChannel = async (channelName, access, credentials, mode) => {
	// hash credentials
	const hashed = await hashChannelCredentials(credentials);
	console.log(hashed);
	let accessmode = '';
	if (access === 'Private') {
		if (mode === 'Password') accessmode = 'PSK';
		else accessmode = 'ACL';
	}
	const query = 'insert into channels (channelName, accessLevel, credentials, accessmode) values ($1, $2, $3, $4)'
	const values = [channelName, access, hashed, accessmode];
	try {
		const added = await db.query(query, values);
		if (!added) return false;
		else return true;
	} catch (err) {
		console.log(`Error adding channel: ${err}`);
		return false;
	}
}

const insertNewMember = async (channelname, user) => {
	const values = [channelname, user, 'MEMBER'];
	const query = `insert into members (channelname, username, status) values ($1, $2, $3)`;
	try {
		const added = await db.query(query, values);
		if (!added) return false;
		return true;
	} catch(err) {
		console.log(`Error adding member to channel: ${err}`);
		return false;
	}
}

export const joinPublicChannel = async (req, res) => {
	const { user } = req.cookies.sessionID;
	const { channel } = req.query;
	// check for channel's existence and extract its access level/mode
	// if it is public, then add user
	let query = 'select channelname, accesslevel, accessmode from channels where channelname=$1';
	let values = [channel];
	const resp = await db.query(query, values);
	if (resp && resp.rows) {
		query = 'insert into members (username, channelname, status) values ($1, $2, $3)';
		values = [user, channel, 'MEMBER'];
		const r = await db.query(query, values);
		// FIXME: increment the user_count in the channel table
		res.status(200).end();
	} else
		res.status(400).end();
}

export const joinPSKChannel = async (req, res) => {
	// join a channel protected with a pre-shared password
	const { user } = req.cookies.sessionID;
	const { password, channelname } = req.body;
	if (!password.match(/[a-z0-9]{0,64}/i))
		res.status(400).end();
	else {
		// check for channel's existence and extract its access level/mode
		// if it is PSK, extract password from req.body and check it against db pass
		// if they match, add user to db
		let query = 'select accesslevel, accessmode, credentials from channels where channelname=$1';
		let values = [channelname];
		const resp = await db.query(query, values);
		if (resp && resp.rows) {
			const { accesslevel, accessmode, credentials } = resp.rows[0];
			if (accesslevel == "Private" && accessmode == "PSK") {
				// FIXME: perform input validation on password; if valid, compare it to credentials
				const hashes = await checkHashes(password, credentials);
				if (hashes) {
					// hashes match; user is authenticated. add a record in the members table
					query = 'insert into members (username, channelname, status) values ($1, $2, $3)';
					values = [user, channelname, 'MEMBER'];
					const r = await db.query(query, values);
					res.status(200).end();
				} else
					res.status(403).end();
			} else
				res.status(400).end();
		} else
			res.status(400).end();
	}
}

export const joinACLChannel = async (req, res) => {
	const { user } = req.cookies.sessionID;
	// check for channel's existence and extract its access level/mode
	// if it is ACL, change user status to PENDING and notify the creator of the channel so they can confirm you
	const query = '';
	res.send(JSON.stringify({"status": "failed"}));
}

export const leaveChannel = async (req, res) => {
	const { user } = req.cookies.sessionID;
	const { channel } = req.query;
	console.log(`User: ${user}\nChannel: ${channel}`);
	// if user is a member of the channel, remove them. if that succeeds, return successful status code
	// else return failed code
	const r = await checkForMembership(user, channel);
	if (r && r.rows) {
		// remove user
		const query = 'delete from members where username=$1 and channelname=$2';
		const values = [user, channel];
		const resp = await db.query(query, values);
		console.log(`Resp: ${resp}`);
		res.status(200).end();
	} else {
		res.status(400).end();
	}
}

const hashChannelCredentials = async pass => {
	const rounds = 10;
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

export const checkForChannel = async (channelName) => {
	/* check if a channel exists */
	const query = `select channelname, accesslevel, accessmode, created_at from channels where channelname=$1`
	//const query = `select * from channels where channelname=$1`;
	const values = [channelName];
	return db.query(query, values);
}

export const checkForMembership = async (username, channelname) => {
	const query = `select * from members where username=$1 and channelname=$2`;
	const values = [username, channelname];
	return db.query(query, values);
}

export const checkForChannelExistence = async channelName => {
	/* check if a channel exists */
	const query = `select * from channels where channelname=$1`;
	const values = [channelName];
	return db.query(query, values);
}