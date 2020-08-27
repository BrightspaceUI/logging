const Helper = require('./configure-helper.js');
const standardInput = process.stdin;
const standardOutput = process.stdout;
standardInput.setEncoding('utf-8');

const helper = new Helper();

console.log('\nConfiguring new LitElement repository. Respond to the following prompts about the new element.\n');
const prompts = [
	{ prompt: 'Short Name (e.g., button, dropdown)', property: 'shortName' },
	{ prompt: 'Description', property: 'description', default: '' },
	{ prompt: 'Codeowner (e.g., myaccountname)', property: 'codeowner', default: '' },
	{ prompt: 'Publish to NPM [yes | no]', property: 'publish', expected: ['yes', 'no'], default: 'yes' },
	{ prompt: 'Component Type [labs | official]', property: 'type', expected: ['labs', 'official'], default: 'labs' },
	{ prompt: 'Localization [yes | no]', property: 'localization', expected: ['yes', 'no'], default: 'no' },
	{ prompt: 'Localization Resources [static | dynamic]', property: 'localizationResources', expected: ['static', 'dynamic'], default: 'static'}
];

let counter = 0;
standardOutput.write(`? \x1B[1m${prompts[counter].prompt}\x1B[0m: `);

standardInput.on('data', (data) => {
	data = data.trim();
	if (!data) {
		if (prompts[counter].default !== undefined) {
			helper.setProperty(prompts[counter].property, prompts[counter].default);
			if (prompts[counter].property === 'localization') {
				counter += 2; // do not ask about localizationResources if localization is not being used
			} else {
				counter++;
			}
		} else {
			console.log('Required property. Please enter a value.');
		}
	} else if (prompts[counter].expected && !prompts[counter].expected.includes(data)) {
		console.log(`Property must be one of [${prompts[counter].expected}].`);
	} else {
		helper.setProperty(prompts[counter].property, data);
		if (prompts[counter].property === 'localization' && data === 'no') {
			counter += 2; // do not ask about localizationResources if localization is not being used
		} else {
			counter++;
		}
	}

	if (counter < prompts.length) {
		let promptString = `\x1B[1m${prompts[counter].prompt}\x1B[0m`;
		if (prompts[counter].default) {
			promptString += ` (${prompts[counter].default})`;
		}
		standardOutput.write(`? ${promptString}: `);
	} else {
		helper.setDerivedProperties();
		completeRepoSetup();
	}
});

function completeRepoSetup()  {

	console.log(`\n\x1B[1mPrompting complete. Configuring repo for ${helper.getRepoName()}\x1B[0m`);
	console.log('Filling in config values...');

	helper.updateFiles('./');
	const year = new Date().getFullYear().toString();
	helper.replaceText('LICENSE', '<%= year %>', year);
	helper.updatePublishInfo();
	helper.updateLocalizationInfo();
	helper.updateLabsChecklist();

	console.log('Moving files...');
	helper.moveFile('_element.js', `${helper.getShortName()}.js`);
	helper.moveFile('test/_element.test.js', `test/${helper.getShortName()}.test.js`);
	helper.moveFile('test/_element.visual-diff.html', `test/${helper.getShortName()}.visual-diff.html`);
	helper.moveFile('test/_element.visual-diff.js', `test/${helper.getShortName()}.visual-diff.js`);
	helper.moveFile('_travis.yml', '.travis.yml');
	helper.moveFile('_package.json', 'package.json');
	if (helper.checkIfDefined('codeowner')) {
		helper.moveFile('.CODEOWNERS', 'CODEOWNERS');
	} else {
		helper.deleteFile('.CODEOWNERS');
	}

	helper.deleteFile('README.md');
	helper.moveFile('_README.md', 'README.md');

	console.log(`\n\x1B[1mRepo for ${helper.getRepoName()} successfully configured.\x1B[0m`);
	process.exit();
}
