import { Plugin, PluginSettingTab, App, Setting, Notice, Tasks, TextComponent, ButtonComponent, ToggleComponent } from 'obsidian';

class GitSettings {
}

export default class GitSync extends Plugin {
	settings: GitSettings;

	async onload() {

		this.app.workspace.on('quit', (tasks: Tasks) => {
			tasks.add(async () => {
			});
		});
	}

	async onunload() {
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

class GitSyncSettingTab extends PluginSettingTab {
	plugin: GitSync;

	constructor(app: App, plugin: GitSync) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		// Repository Remote Url

		// GitHub Username

		// GitHub Personal Acces Token

		// Create repository button

		// Toggle commit interval

		// Fetch button

		// Push button

		// Delete repository button
	}
}
