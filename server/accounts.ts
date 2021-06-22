import * as db from './databaseFunctions';

export const loadUserInfo = async (req, res) => {
    const name = req.query.name;
    console.log(`Username: ${name}`);
    const query = 'select * from users where username=$1';
    const values = [name];
    const data = await db.query(query, values);
    //console.log(Object.getOwnPropertyNames(data.rows[0]));
    const c = data.rows[0].created_at;
    const ca = `{"joined": "${c}"}`;
    console.log(ca)
    // FIXME: get user's profile pic, joined date, and list of friends
    res.send(ca);
}

export const logUserOut = async (req, res) => {
    // FIXME: make sure that the user being logged out is the user requesting the log out
    // FIXME: this is currently a flaw in our authflow
    const cookie = req.cookies.sessionID.sessionid;
    const user = req.cookies.sessionID.user;
    // delete user session
    if (db.exists(cookie)) db.del(cookie);
    // return status code
    res.send(JSON.stringify({"status":"logged out"}));
}