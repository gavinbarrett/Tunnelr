export const loadAccount = async (req, res) => {
    const { username } = req.body;
    // FIXME: get user's profile pic, joined date, and list of friends
    res.send(JSON.stringify({'status': 'success'}));
}