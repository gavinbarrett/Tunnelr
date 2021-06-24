import * as db from './databaseFunctions';

export const queryFriend = async (req, res) => {
	// search the user database for friends
	const { username } = req.body;
	console.log(`In QF: ${username}`);
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