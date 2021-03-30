import * as db from './databaseFunctions';

export const queryFriend = async (req, res) => {
	const { username } = req.body;
	console.log(username);
	// FIXME: input validation
	const userReg = /^[a-z0-9]{4,32}$/i;
	const user = username.substring(1);
	if (!user.match(userReg)) {
		res.send(JSON.stringify({"status": "failed"}));
	} else {
		// query the user
		const query = 'select username from users where username ~* $1';
		const values = [user];
		const users = await db.query(query, values);
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

const checkForUser = async (req, res) => {
	
}
