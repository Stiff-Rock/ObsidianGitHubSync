import { Plugin, PluginSettingTab, App, Setting, Notice, Tasks, TextComponent, ButtonComponent, ToggleComponent } from 'obsidian';
import { Octokit } from '@octokit/rest';
import { ChildProcessWithoutNullStreams, spawn } from 'child_process';

//TODO: USE OAuth Device Flow
class GitSettings {
	private _gitHubUsername: string = '';
	private _validGitHubUsername: boolean = false;

	private _gitHubPat: string = '';

	private _doAutoCommit: boolean = true;
	private _intervalTime: number = 60000;

	private _hasRepo: boolean = false;

	constructor(data?: Partial<GitSettings>) {
		if (data) {
			Object.assign(this, data);
		}
	}

	// gitHubUser getters and setters
	get gitHubUsername(): string {
		return this._gitHubUsername;
	}

	set gitHubUsername(value: string) {
		this._gitHubUsername = value;
	}

	// validGitHubUser getters and setters
	get validGitHubUsername(): boolean {
		return this._validGitHubUsername;
	}

	set validGitHubUsername(value: boolean) {
		this._validGitHubUsername = value;
	}

	// gitHubPat getters and setters
	get gitHubPat(): string {
		return this._gitHubPat;
	}

	set gitHubPat(value: string) {
		this._gitHubPat = value;
	}

	// doAutoCommit getters and setters
	get doAutoCommit(): boolean {
		return this._doAutoCommit;
	}

	set doAutoCommit(value: boolean) {
		this._doAutoCommit = value;
	}

	// intervalTime getters and setters
	get intervalTime(): number {
		return this._intervalTime;
	}

	set intervalTime(value: number) {
		this._intervalTime = value;
	}

	// hasRepo getters and setters
	get hasRepo(): boolean {
		return this._hasRepo;
	}

	set hasRepo(value: boolean) {
		this._hasRepo = value;
	}
}

export default class GitSync extends Plugin {
	settings: GitSettings;
	octokit: Octokit

	serverProcess: ChildProcessWithoutNullStreams;

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new GitSyncSettingTab(this.app, this));

		await this.startServer();

		this.app.workspace.onLayoutReady(async () => {

		});

		this.app.workspace.on('quit', (tasks: Tasks) => {
			tasks.add(async () => {
			});
		});
	}

	async startServer() {
		const basePath = (this.app.vault.adapter as any).basePath;
		const serverPath = `${basePath}/.obsidian/plugins/ObsidianGitHubSync/server.js`;

		this.serverProcess = spawn('node', [serverPath]);

		this.serverProcess.stdout.on('data', (data) => {
			console.log(`Server log: ${data}`);
		});

		this.serverProcess.stderr.on('data', (data) => {
			console.error(`Server error: ${data}`);
		});

		this.serverProcess.on('close', (code) => {
			console.log(`Server process exited with code ${code}`);
		});
	}

	async onunload() {
		this.serverProcess.kill('SIGINT');
	}

	async loadSettings() {
		let loadedSettings = await this.loadData();

		if (!loadedSettings) {
			this.settings = new GitSettings();
			console.log("No settings found, loading defaults")
		} else {
			this.settings = new GitSettings(); //TODO: GIVE PARAMETERS
			console.log("Settings loaded")
		}
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

//TODO: See if status bar is good idea on mobile
class GitSyncSettingTab extends PluginSettingTab {
	plugin: GitSync;

	logInToGitHub: ButtonComponent

	createRepoButton: ButtonComponent
	deleteRepoButton: ButtonComponent
	pushButton: ButtonComponent
	fetchButton: ButtonComponent

	autoCommitToggleButton: ToggleComponent
	intervalTimeText: TextComponent

	constructor(app: App, plugin: GitSync) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		//TODO: REVISE STYLES FOR MOBILE, is not consistent

		// logInToGitHub button
		new Setting(containerEl)
			.setName('Log In to GitHub')
			.addButton(async button => {
				this.createRepoButton = button;
				button.setButtonText('Log In')
				button.buttonEl.classList.add('git-sync-config-field')
				button.onClick(async _ => {
					const clientId = 'Iv23liLv46rull2EbJvq';
					const redirectUri = 'http://localhost:3000/callback';

					const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=repo`;
					window.open(githubAuthUrl, "_blank");
					await this.plugin.saveSettings();

				})
			})

		// Create repository button
		new Setting(containerEl)
			.setName('Create vault repository')
			.setDesc('Creates the local repository if not done yet')
			.addButton(async button => {
				this.createRepoButton = button;
				button.setButtonText('Create repository')
				button.buttonEl.classList.add('git-sync-config-field')
				button.onClick(async _ => {

					await this.plugin.saveSettings();
				})
			})

		// Toggle commit interval
		new Setting(containerEl)
			.setName('Auto Commit Timer')
			.setDesc('Sets auto-save interval in seconds. Empty input resets to default (60s), invalid values restore the last valid value.')
			.addText(text => {
				this.intervalTimeText = text;
				text.setValue('' + this.plugin.settings.intervalTime / 1000);
				text.inputEl.setAttribute("type", "number");
				text.inputEl.classList.add('git-sync-config-field');
				text.onChange(async (value) => {
					const intValue = parseInt(value, 10);

					if (value.trim() === "") {
						this.plugin.settings.intervalTime = 60000;
					} else if (isNaN(intValue) || !Number.isInteger(intValue) || intValue <= 0) {
						text.setValue('' + this.plugin.settings.intervalTime / 1000);
					} else {
						this.plugin.settings.intervalTime = intValue * 1000;
					}

					await this.plugin.saveSettings();

				})

				if (!this.plugin.settings.doAutoCommit)
					text.inputEl.disabled = true;
			})
			.addToggle(async toggle => {
				this.autoCommitToggleButton = toggle;
				toggle.setValue(this.plugin.settings.doAutoCommit)
				toggle.onChange(async (value) => {
					this.plugin.settings.doAutoCommit = value;
					this.intervalTimeText.inputEl.disabled = !value;

					await this.plugin.saveSettings();

				})
			});

		// Fetch button
		new Setting(containerEl)
			.setName('Fetch Vault')
			.setDesc('Checks for a new version of the vault and donwloads it')
			.addButton(async button => {
				this.fetchButton = button;
				button.setButtonText('Fetch')
				button.buttonEl.classList.add('git-sync-config-field')
				button.onClick(async _ => {

				})
			})

		// Push button
		new Setting(containerEl)
			.setName('Push Vault')
			.setDesc('Uploads the current state of the vault')
			.addButton(async button => {
				this.pushButton = button;
				button.setButtonText('Push')
				button.buttonEl.classList.add('git-sync-config-field')
				button.onClick(async _ => {

				})
			})

		// Delete repository button
		new Setting(containerEl)
			.setName('Delte repository')
			.setDesc('Deletes the local repository permanently')
			.addButton(async button => {
				this.deleteRepoButton = button;
				button.setButtonText('Delete')
				button.buttonEl.id = 'delete-btn';
				button.onClick(async _ => {

				})
			})
	}

	async checkGitHubUsername(username: string) {
		let message = 'Could not verify username';

		try {
			const response = await fetch(`https://api.github.com/users/${username}`);

			if (response.status === 200) {
				message = 'Username exists'
			} else if (response.status === 404) {
				message = 'Username does not exist'
			} else {
				message += ': ' + response.status;
			}
		} catch (error) {
			console.error('Error checking username:', error);
		} finally {
			new Notice(message, 4000);
		}
	}

	enabledFields: (HTMLInputElement | HTMLButtonElement | ToggleComponent)[] = [];

	async disableAllFields() {
		this.enabledFields = [];

		const fields = [
			this.createRepoButton.buttonEl,
			this.deleteRepoButton.buttonEl,
			this.pushButton.buttonEl,
			this.fetchButton.buttonEl,
			this.autoCommitToggleButton,
			this.intervalTimeText.inputEl
		]

		for (const field of fields) {
			if (!field.disabled) {
				this.enabledFields.push(field);
				field.disabled = true;
			}
		}

		document.body.style.cursor = "progress";
	}

	async enableAllFields() {
		for (const field of this.enabledFields) {
			field.disabled = false;
		}

		this.enabledFields = [];

		document.body.style.cursor = "default";
	}
}
