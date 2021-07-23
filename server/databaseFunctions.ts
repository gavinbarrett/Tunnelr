import * as Redis from 'ioredis';
import { Pool } from 'pg';

const pool = new Pool({
	user: 'postgres',
	host: 'localhost',
	database: "tunnelr",
	password: '',
	port: 5432
});

const redisClient = new Redis({
	host: 'localhost',
	port: 6379,
	password: ''
});
//redisClient.on('error', err => { if (err) console.log(`Error: ${err}`) });

export const query = (text, values) => {
	return pool.query(text, values);
}

export const get = id => {
	return redisClient.get(id);
}

export const set = (id, user, type, exp) => {
	return redisClient.set(id, user, type, exp);
}

export const del = id => {
	return redisClient.del(id);
}

export const exists = id => {
	return redisClient.exists(id);
}

export const xadd = (channelName, payload) => {
	return redisClient.xadd(channelName, "*", "payload", payload)
}

export const xread = (channelName, id) => {
	return redisClient.xread("BLOCK", 10, "STREAMS", channelName, id);
}