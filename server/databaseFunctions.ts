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

export const query = (text: string, values: Array<string>) => {
	return pool.query(text, values);
}

export const get = (id: number) => {
	return redisClient.get(id);
}

export const set = (id: string, user: string, type: string, exp: number) => {
	return redisClient.set(id, user, type, exp);
}

export const del = (id: string) => {
	return redisClient.del(id);
}

export const exists = (id: string) => {
	return redisClient.exists(id);
}

export const xadd = (channelName: string, payload: string) => {
	return redisClient.xadd(channelName, "*", "payload", payload)
}

export const xread = (channelName: string, id: number) => {
	return redisClient.xread("BLOCK", 10, "STREAMS", channelName, id);
}