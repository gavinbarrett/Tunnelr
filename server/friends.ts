import * as db from './databaseFunctions';

export const addFriend = async (req, res) => {
	const { friend } = req.query;
	const { user } = req.cookies.sessionID;
	let query = 'select * from friendships where friend1=$1 and friend2=$2';
	let values = [user, friend];
	// check for friendship relation
	const resp = await db.query(query, values);
	if (resp && resp.rows && resp.rows.length) {
		// relation exists; use update query
		query = 'update friendships set status=$1 where friend1=$2 and friend2=$3';
		values = ['Friended', user, friend];
		// add friended status
		const r = await db.query(query, values);
		res.send(JSON.stringify({"status": "success", "friendstatus": "None"}));
	} else {
		// relation doesn't exist; insert relation
		query = 'insert into friendships (friend1, friend2, status) values ($1, $2, $3)';
		values = [user, friend, 'Friended'];
		// add friended status
		const r = await db.query(query, values);
		res.send(JSON.stringify({"status": "success", "friendstatus": "None"}));
	}
}

export const queryFriend = async (req, res) => {
	// search the user database for friends
	const { username } = req.body;
	// FIXME: input validation
	const userReg = /^[a-z0-9]{2,32}$/i;
	if (!username.match(userReg)) {
		res.send(JSON.stringify({"status": "failed"}));
	} else {
		// query the user
		const query = 'select username from users where username ~* $1';
		const values = [username];
		const users = await db.query(query, values);
		console.log(`Users: ${users}`);
		if (!users) {
			res.send(JSON.stringify({"status": "failed"}));
		} else {
			if (users.rows.length === 0) {
				res.send(JSON.stringify({"status": "failed"}));
			} else {
				res.send(JSON.stringify({"status": users.rows}));
			}
		}
	}
}

export const findAllUserFriends = async (req, res) => {
	/* retrieve all friends of a user */
	const { username } = req.body;
	console.log(`Username: ${username}`);
	const query = `select friend2 from friendships where friend1=$1 and status='Friended' intersect select friend1 from friendships where friend2=$1 and status='Friended'`;
	const values = [username];
	const resp = await db.query(query, values);
	console.log(resp.rows);
	res.send(JSON.stringify({"status": "success"}));
}