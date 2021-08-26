import * as fs from 'fs';
import { Request, Response } from 'express'
import { QueryResult } from 'pg';
import { alphaNumRegex, fileRegex } from './regexp';
import * as db from './databaseFunctions';

export const uploadUserProfile = async (req: Request, res: Response) => {
	// FIXME: catch the user and file name. Insert the file name into the database (after checking name length)
		// But, how do we deal with duplicate file names?
	const profile: Express.Multer.File|undefined = req.file;
	const { user } = req.cookies.sessionID;
	if (!profile) {
		// if file doesn't exist or was filtered out, return 401
		res.status(401).end();
	} else {
		// file has been uploaded; file name is in req.file.originalname
		// update the user's fields in the user table to include this file name
		const filename: string = req.file.originalname;
		// insert the profile picture filename into the database
		const inserted: boolean = await insertProfileIntoDB(user, filename);
		// FIXME: return the profile picture as a base64 string
		if (inserted) {
			const base64File: string|null = await readProfileFromDisk(filename);
			res.status(200).end(JSON.stringify({"profile": base64File}));
		} else {
			res.status(401).end();
		}
	}
}

const insertProfileIntoDB = async (user: string, filename: string): Promise<boolean> => {
	/* insert the profile hash into the user record */
	const values: Array<string> = [filename, user];
	const regexps: Array<RegExp> = [fileRegex, alphaNumRegex];
	const query: string = `update users set profile=$1 where username=$2 returning profile`;
	if (await validateQuery(values, regexps)) {
		try {
			const resp: QueryResult = await db.query(query, values);
			if (resp.rowCount) return true;
            return false;
		} catch (error) {
			console.log(`Error: ${error}`);
			return false;
		}
	} else
		return false;
}

const validateQuery = async (inputs: Array<string>, regex: Array<RegExp>): Promise<boolean> => {
	return new Promise((resolve) => {
		for (let i = 0; i < inputs.length; i++) {
			if (!inputs[i].match(regex[i])) resolve(false);
		}
		resolve(true);
	});
}

export const readProfileFromDisk = async (profile: string): Promise<string|null> => {
	const dir: string = `./data/profiles/`;
	const profile_prefix: string = profile.split('.')[0];
	// split extension off of profile filename
	// put prefix into a regex to search through the list of profiles
	const fileRegex: RegExp = new RegExp(`${profile_prefix}\.(png|jpg|jpeg)`);
	console.log(`File Regex: ${fileRegex}`);
	console.log(`Looking for ${profile}`);
	return new Promise(resolve => {
		fs.readdir(dir, (err, files) => {
			if (!files || err) resolve(null);
			const file = files.filter(ff => ff.match(fileRegex));
			if (!file || file.toString() == "") resolve(null);
			const path: string = `./data/profiles/${file.toString()}`;
			fs.access(path, err => {
				if (err) resolve(null);
				fs.readFile(path, 'base64', (err, data) => {
					if (err) resolve(null);
					resolve(data);
				});
			});
		});
	});
}