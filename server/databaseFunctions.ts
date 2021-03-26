import * as Redis from 'redis';
import { Pool } from 'pg';

const pool = new Pool({
	user: process.env.USER,
	host: process.env.HOST,
	database: "tunnelr",
	password: process.env.PW,
	port: 5432
});

const redisClient = Redis.createClient();
redisClient.on('error', err => { if (err) console.log(`Error: ${err}`) });

export const query = (text, values) => {
	return pool.query(text, values);
}

/*
module.exports = {
	// query DB
	query: (text, values) => pool.query(text, values),
	// get value from redis
	get: (id) => redisClient.get(id),
	// set value in redis for exp time
	set: (id, user, type, exp) => redisClient.set(id, user, type, exp),
	// delete key/value pair
	del: (id) => redisClient.del(id),
	// check is key exists
	exists: (id) => redisClient.exists(id),
}
*/
