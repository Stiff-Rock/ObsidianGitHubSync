import express from 'express';
import axios from 'axios';
import querystring from 'querystring';

const app = express();
const clientId = 'Iv23liLv46rull2EbJvq';
const clientSecret = '07b9eb44912a1fdd273f8ae9bfe3f6e05a0a1a0a';
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
		res.send(<h1>OAuth Success! Access Token: ${accessToken}</h1>);

		// Send the access token to the client (e.g., store in session or send via a message)
	} catch (error) {
		console.error('Error exchanging code for access token:', error);
		res.status(500).send('Failed to exchange code for access token');
	}
});

app.listen(3000, () => {
	console.log('Server is running on http://localhost:3000');
});
