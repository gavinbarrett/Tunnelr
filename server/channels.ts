import * as url from 'url';
import * as bcrypt from 'bcrypt';
import * as db from './databaseFunctions';

export const addChannel = async (req, res) => {
	const { channelName, access, credentials } = req.body;
	const user = req.cookies.sessionID.user;
	console.log(`Channel Name: ${channelName}`);
	console.log(`Access level: ${access}`);
	// FIXME: perform input validation on access and credentials fields
	// perform input validation
	const reg = /^@[a-z0-9]{5,32}$/i;
	if (!channelName.match(reg)) {
		res.send(JSON.stringify({"status": "failed"}));
	} else {
		// ensure channel doesn't already exist
		const exists = await checkForChannel(channelName);
		console.log(exists.rows);
		if (exists && exists.rows.length !== 0) {
			console.log("Channel already exists");
			res.send(JSON.stringify({"status": "failed"}));
		} else {
			const added = insertNewChannel(channelName, access, credentials);
			if (added) {
				console.log(`Channel ${channelName} added.`);
				// FIXME: add user to channel
				const ir = await insertNewMember(channelName, user);
				if (!ir) {
					console.log('Could not add member to channel.');
					res.send(JSON.stringify({"status": "success"}));
				} else {
					res.send(JSON.stringify({"status": "success"}));
				}
			} else {
				console.log(`Couldn't add channel.`);
				res.send(JSON.stringify({"status": "failed"}));
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

export const getMessages = async (req, res) => {
	const uobj = url.parse(req.url);
	const pathname = uobj.pathname;
	const p = new URLSearchParams(uobj.search);
	const roomid = p.get("roomID");
	const allMessages = await db.xread(roomid, 0);
	console.log(`Got messages: ${allMessages}`);
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

const insertNewChannel = async (channelName, access, credentials) => {
	// hash credentials
	const hashed = await hashChannelCredentials(credentials);
	console.log(hashed);
	const query = 'insert into channels (channelName, accessLevel, credentials) values ($1, $2, $3)'
	const values = [channelName, access, hashed];
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
	const values = [channelname, user];
	const query = `insert into members (channelname, username) values ($1, $2)`;
	try {
		const added = await db.query(query, values);
		if (!added) return false;
		return true;
	} catch(err) {
		console.log(`Error adding member to channel: ${err}`);
		return false;
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

export const checkForChannel = async channelName => {
	/* check if a channel exists */
	const query = 'select * from channels where channelName=$1';
	const values = [channelName];
	return db.query(query, values);
}