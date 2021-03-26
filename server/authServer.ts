export const signUserIn = (req, res) => {
	const { user, pass } = req.body;
	console.log(`Username: ${user}\nPassword: ${pass}`);
	res.send(JSON.stringify({"status": "succeeded"}));
}
