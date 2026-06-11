import { litConfig, setDirectoryConfigs, testingConfig } from 'eslint-config-brightspace';
export default setDirectoryConfigs(
	litConfig,
	{
		test: testingConfig
	}
);
