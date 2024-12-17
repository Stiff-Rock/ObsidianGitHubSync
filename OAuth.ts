import * as http from 'http';
import * as url from 'url';

export class OAuth {
	private clientId = 'Iv23liLv46rull2EbJvq';
	private clientSecret = '07b9eb44912a1fdd273f8ae9bfe3f6e05a0a1a0a';
	private redirectUri = 'http://localhost:3000/callback';

	// Step 1: Redirect user to GitHub for authorization
	async redirectToGitHubAuth() {
		const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${this.clientId}&redirect_uri=${this.redirectUri}&scope=repo`;
		window.open(githubAuthUrl, "_blank");

		this.startServer();
	}

	startServer() {
		http.createServer((req, res) => {
			const pathname = url.parse(req.url || '').pathname;

			if (pathname === '/callback') {
				this.handleCallback(req, res);
			} else {
				res.writeHead(200, { 'Content-Type': 'text/html' });
				res.end('<h1>Welcome to GitHub OAuth Flow</h1>');
			}
		}).listen(3000, () => {
			console.log('Server is listening on http://localhost:3000');
		});
	}

	// Step 2: Handle the callback from GitHub after user authorizes
	async handleCallback(req: http.IncomingMessage, res: http.ServerResponse) {
		const query = url.parse(req.url || '', true).query;
		const code = query.code as string;

		if (code) {
			try {
				const accessToken = await this.exchangeCodeForAccessToken(code);
				console.log(accessToken)

				res.writeHead(200, { 'Content-Type': 'text/html' });
				res.end(`<h1>OAuth Success! Access Token: ${accessToken}</h1>`);
			} catch (error) {
				console.error('Error exchanging code for access token:', error);
				res.writeHead(500, { 'Content-Type': 'text/html' });
				res.end('<h1>Failed to exchange code for access token</h1>');
			}
		} else {
			console.error('Authorization code not found.');
			res.writeHead(400, { 'Content-Type': 'text/html' });
			res.end('<h1>Authorization code not found.</h1>');
		}
	}

	// Step 3: Exchange authorization code for access token
	private async exchangeCodeForAccessToken(code: string): Promise<string | null> {
		const response = await fetch('https://github.com/login/oauth/access_token', {
			method: 'POST',
			headers: {
				'Accept': 'application/json',
			},
			body: new URLSearchParams({
				client_id: this.clientId,
				client_secret: this.clientSecret,
				code: code,
				redirect_uri: this.redirectUri,
			}),
		});

		// Check if the response status is OK (200)
		if (!response.ok) {
			const errorData = await response.json();
			console.error('Error exchanging code for token:', errorData);
			return null;
		}

		// Parse the response as JSON
		const data = await response.json();

		if (data.access_token) {
			return data.access_token;
		} else {
			console.error('Failed to get access token:', data);
			return null;
		}
	}


	// Step 4: Use the access token to make authenticated requests to GitHub API
	async fetchUserData(accessToken: string) {
		const response = await fetch('https://api.github.com/user', {
			headers: {
				'Authorization': `Bearer ${accessToken}`,
			},
		});

		const userData = await response.json();
		return userData;
	}
}
