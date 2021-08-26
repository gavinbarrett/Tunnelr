import * as db from './databaseFunctions';
import { QueryResult } from 'pg';
import { Request, Response } from 'express';

export const addFriend = async (req: Request, res: Response) => {
	const { friend } = req.query;
	const { user } = req.cookies.sessionID;
	let query: string = 'select * from friendships where friend2=$1 and friend1=$2 and status=$3 or friend2=$2 and friend1=$1 and status=$3';
	let values: Array<string> = [user, friend, 'Pending'];
	// check for friendship relation
	const resp: QueryResult = await db.query(query, values);
	if (resp.rowCount) {
		// pending friendship relation exists; use update query
		// FIXME: update f1
		query = 'update friendships set status=$1 where friend2=$2 and friend1=$3';
		values = ['Friended', user, friend];
		// add friended status
		const r: QueryResult = await db.query(query, values);
		query = 'insert into friendships (friend1, friend2, status) values ($1, $2, $3)';
		values = [user, friend, 'Friended'];
		res.status(200).send(JSON.stringify({"friendstatus": "Friended"}));
	} else {
		// relation doesn't exist; insert relation
		query = 'insert into friendships (friend1, friend2, status) values ($1, $2, $3)';
		values = [user, friend, 'Pending'];
		// add friended status
		const r: QueryResult = await db.query(query, values);
		res.status(200).send(JSON.stringify({"friendstatus": "Pending"}));
	}
}

export const queryFriend = async (req: Request, res: Response) => {
	// search the user database for friends
	const { username } = req.body;
	// FIXME: input validation
	const userReg: RegExp = /^[a-z0-9]{2,32}$/i;
	if (!username.match(userReg)) {
		res.send(JSON.stringify({"status": "failed"}));
	} else {
		// query the user
		const query: string = 'select username from users where username ~* $1 and verified=$2';
		const values: Array<string> = [username, 'Verified'];
		const users: QueryResult = await db.query(query, values);
		console.log(`Users: ${users}`);
		if (!users) {
			res.send(JSON.stringify({"status": "failed"}));
		} else {
			if (!users.rowCount) {
				res.send(JSON.stringify({"status": "failed"}));
			} else {
				res.send(JSON.stringify({"status": users.rows}));
			}
		}
	}
}

export const findAllUserFriends = async (req: Request, res: Response) => {
	/* retrieve all friends of a user */
	const { username } = req.body;
	console.log(`Username: ${username}`);
	const query: string = "select friend2 as friend from friendships where friend1=$1 and status='Friended' union select friend1 from friendships where friend2=$2 and status='Friended'";
	const values: Array<string> = [username, username];
	const resp: QueryResult = await db.query(query, values);
	console.log(resp.rows);
	res.send(JSON.stringify({"status": "success"}));
}