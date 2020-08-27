const fs = require('fs');

class Helper {

	checkIfDefined(property) {
		return this[property] ? true : false;
	}

	deleteFile(fileName) {
		fs.unlinkSync(fileName);
	}

	getRepoName() {
		return `${this.githubOrg}/${this.shortName}`; // BrightspaceUI/element or BrightspaceUILabs/element
	}

	getShortName() {
		return this.shortName;
	}

	moveFile(source, destination) {
		fs.renameSync(source, destination);
	}

	replaceText(fileName, original, replacement) {
		const data = fs.readFileSync(fileName, 'utf8');
		const result = data.replace(new RegExp(original, 'g'), replacement);
		fs.writeFileSync(fileName, result, 'utf8');
	}

	setDerivedProperties() {
		this.shortName = this.shortName.toLowerCase();
		this.shortNameCaps = this.shortName.replace(/-([a-z])/g, (g) => { return g[1].toUpperCase(); });
		this.shortNameCaps = this.shortNameCaps.charAt(0).toUpperCase() + this.shortNameCaps.slice(1);
		this.githubOrg = this.type === 'official' ? 'BrightspaceUI' : 'BrightspaceUILabs';
		this.orgName = this.type === 'official' ? '@brightspace-ui' : '@brightspace-ui-labs';
		this.packageName = `${this.orgName}/${this.shortName}`; // @brightspace-ui/element or @brightspace-ui-labs/element
		this.type = this.type === 'labs' ? 'labs-' : '';
		this.name = `d2l-${this.type}${this.shortName}`; // d2l-labs-element or d2l-element
	}

	setProperty(name, value) {
		this[name] = value;
	}

	updateFiles(path) {
		if (fs.existsSync(path)) {
			const files = fs.readdirSync(path);
			files.forEach((file) => {
				const currentPath = `${path}/${file}`;
				if (fs.lstatSync(currentPath).isDirectory()) {
					this.updateFiles(currentPath);
				} else {
					this._replaceTextWithConfigs(currentPath);
				}
			});
		}
	}

	updateLocalizationInfo() {
		let localizeExtends, localizeMixin, localizeResources, localizedDemo;
		if (this.localization === 'yes') {
			localizeExtends = 'LocalizeMixin(LitElement)';
			localizeMixin = '\nimport { LocalizeMixin } from \'@brightspace-ui/core/mixins/localize-mixin.js\';';
			localizedDemo = '\n\t\t\t<div>Localization Example: ${this.localize(\'myLangTerm\')}</div>';

			if (this.localizationResources === 'static') {
				localizeResources = `\n\tstatic async getLocalizeResources(langs) {
		const langResources = {
			'en': { 'myLangTerm': 'I am a localized string!' }
		};

		for (let i = 0; i < langs.length; i++) {
			if (langResources[langs[i]]) {
				return {
					language: langs[i],
					resources: langResources[langs[i]]
				};
			}
		}

		return null;
	}\n`;
			} else {
				// dynamic
				const enFileContents = 'export const val = {\n\t\'myLangTerm\': \'I am a dynamically imported localized string!\'\n};\n';
				fs.mkdirSync('locales');
				fs.writeFileSync('locales/en.js', enFileContents);

				localizeResources = `\n\tstatic async getLocalizeResources(langs) {
		for await (const lang of langs) {
			let translations;
			switch (lang) {
				case 'en':
					translations = await import('./locales/en.js');
					break;
			}

			if (translations && translations.val) {
				return {
					language: lang,
					resources: translations.val
				};
			}
		}

		return null;
	}\n`;
			}
		} else {
			localizeExtends = 'LitElement';
			localizeMixin = '';
			localizeResources = '';
			localizedDemo = '';
		}

		this.replaceText('_element.js', '<%= extends %>', localizeExtends);
		this.replaceText('_element.js', '<%= localizeMixin %>', localizeMixin);
		this.replaceText('_element.js', '<%= localizeResources %>', localizeResources);
		this.replaceText('_element.js', '<%= localizedDemo %>', localizedDemo);
	}

	updateLabsChecklist() {
		let checklist = '';
		if (this.type === 'labs-') {
			checklist = `> Note: this is a ["labs" component](https://github.com/BrightspaceUI/guide/wiki/Component-Tiers). While functional, these tasks are prerequisites to promotion to BrightspaceUI "official" status:
>
> - [ ] [Design organization buy-in](https://github.com/BrightspaceUI/guide/wiki/Before-you-build#working-with-design)
> - [ ] [design.d2l entry](http://design.d2l/)
> - [ ] [Architectural sign-off](https://github.com/BrightspaceUI/guide/wiki/Before-you-build#web-component-architecture)
> - [ ] [Continuous integration](https://github.com/BrightspaceUI/guide/wiki/Testing#testing-continuously-with-travis-ci)
> - [ ] [Cross-browser testing](https://github.com/BrightspaceUI/guide/wiki/Testing#cross-browser-testing-with-sauce-labs)
> - [ ] [Unit tests](https://github.com/BrightspaceUI/guide/wiki/Testing#testing-with-polymer-test) (if applicable)
> - [ ] [Accessibility tests](https://github.com/BrightspaceUI/guide/wiki/Testing#automated-accessibility-testing-with-axe)
> - [ ] [Visual diff tests](https://github.com/BrightspaceUI/visual-diff)
> - [ ] [Localization](https://github.com/BrightspaceUI/guide/wiki/Localization) with Serge (if applicable)
> - [ ] Demo page
> - [ ] README documentation

`;
		}
		this.replaceText('_README.md', '<%= labsChecklist %>', checklist);
	}

	updatePublishInfo() {
		let deployInfo, publishInfo, readmeInfo;
		if (this.publish === 'yes') {
			deployInfo = `  - REPO_NAME=${this.shortName}
  - OWNER_NAME=${this.githubOrg}
deploy:
  - provider: npm
    email: d2ltravisdeploy@d2l.com
    skip_cleanup: true
    api_key:
      # d2l-travis-deploy: ...
    on:
      tags: true
      repo: ${this.getRepoName()}`;
			publishInfo = `"publishConfig": { "access": "public" },\n  "files": [ "${this.shortName}.js" ]`;
			readmeInfo = ', create a tag, and trigger a deployment to NPM.';
		} else {
			deployInfo = '';
			publishInfo = '"private": true';
			readmeInfo = ' and create a tag.';
		}
		this.replaceText('_package.json', '<%= publishInfo %>', publishInfo);
		this.replaceText('_travis.yml', '<%= deployInfo %>', deployInfo);
		this.replaceText('_README.md', '<%= readmeDeployment %>', readmeInfo);
	}

	_replaceTextWithConfigs(fileName) {
		if (fileName.indexOf('configure-repo.js') !== -1
			|| fileName.indexOf('configure-helper.js') !== -1
			|| fileName.indexOf('.git') !== -1
			|| fileName.indexOf('node_modules') !== -1) {
			return;
		}
		const data = fs.readFileSync(fileName, 'utf8');

		const result = data.replace(/<%= name %>/g, this.name)
			.replace(/<%= shortName %>/g, this.shortName)
			.replace(/<%= shortNameCaps %>/g, this.shortNameCaps)
			.replace(/<%= packageName %>/g, this.packageName)
			.replace(/<%= description %>/g, this.description)
			.replace(/<%= codeowner %>/g, this.codeowner)
			.replace(/<%= githubOrg %>/g, this.githubOrg);
		fs.writeFileSync(fileName, result, 'utf8');
	}
}

module.exports = Helper;
