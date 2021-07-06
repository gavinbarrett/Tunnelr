import * as db from './databaseFunctions';

const establishDatabase = async () => {
    let query = "create table users (username varchar(64), password varchar(64), email varchar(64), profile varchar(64), created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, verified varchar(8) DEFAULT 'No')";
    let permissions = "grant all privileges on table users to gavin";
    let resp = await db.query(query, []);
    console.log(resp);
    query = "create table friendships (friend1 varchar(64), friend2 varchar(64), status varchar(8) default 'None')";
    permissions = "grant all privileges on table friendships to gavin";
    resp = await db.query(query, []);
    console.log(resp);
    query = "create table channels (channelname varchar(64), accesslevel varchar(7), accessmode varchar(3), credentials varchar(64), created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, user_count integer default 0)";
    permissions = "grant all privileges on table channels to gavin";
    resp = await db.query(query, []);
    console.log(resp);
}

export const checkForUserTables = async () => {
    const c = "select to_regclass('users')";
    const resp = await db.query(c, []);
    console.log(resp);
    if (resp.rows.length) {
            
    }
}