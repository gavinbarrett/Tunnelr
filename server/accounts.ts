export const loadUserInfo = async (req, res) => {
    const { username } = req.body;
    console.log(`Username: ${username}`);
    // FIXME: get user's profile pic, joined date, and list of friends
    res.send(JSON.stringify({'status': 'success'}));
}