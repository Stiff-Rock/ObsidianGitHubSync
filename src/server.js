import express from 'express';
import axios from 'axios';
import querystring from 'querystring';

require('dotenv').config();

const app = express();
const clientSecret = process.env.CLIENT_SECRET;
const clientId = process.env.CLIENT_ID;
const redirectUri = 'http://localhost:3000/callback';

app.get('/callback', async (req, res) => {
	const { code } = req.query;

	if (!code) {
		return res.status(400).send('No code received.');
	}

	try {
		const response = await axios.post('https://github.com/login/oauth/access_token', querystring.stringify({
			client_id: clientId,
			client_secret: clientSecret,
			code,
			redirect_uri: redirectUri
		}), {
			headers: { 'Accept': 'application/json' }
		});

		const accessToken = response.data.access_token;
		res.send(`OAuth Success! Access Token: ${accessToken}`);

	} catch (error) {
		console.error('Error exchanging code for access token:', error);
		res.status(500).send('Failed to exchange code for access token');
	}
});

app.listen(3000, () => {
	console.log('Server is running on http://localhost:3000');
});
