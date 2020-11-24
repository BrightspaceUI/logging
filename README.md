# d2l-logging

[![NPM version](https://img.shields.io/npm/v/@brightspace-ui/logging.svg)](https://www.npmjs.org/package/@brightspace-ui/logging)

JavaScript client for sending logs to the Brightspace Logging service.

## Installation

To install from NPM:

```shell
npm install @brightspace-ui/logging
```

## Developing, Testing and Contributing

After cloning the repo, run `npm install` to install dependencies.

### Linting

```shell
# eslint
npm run lint
```

### Testing

```shell
# lint, unit test and visual-diff test
npm test

# lint only
npm run lint

# unit tests only
npm run test:headless

# debug or run a subset of local unit tests
# then navigate to `http://localhost:9876/debug.html`
npm run test:headless:watch
```

## Future Enhancements

Looking for an enhancement not listed here? Create a GitHub issue!

## Versioning, Releasing & Deploying

Releases use the [semantic-release](https://semantic-release.gitbook.io/) tooling and the [angular preset](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/conventional-changelog-angular) for commit message syntax. All version changes should obey [semantic versioning](https://semver.org/) rules.

Upon release, the version in `package.json` is updated, a tag and GitHub release is created and a new package will be deployed to NPM.

Commits prefixed with `feat` will trigger a minor release, while `fix` or `perf` will trigger a patch release. A commit containing `BREAKING CHANGE` will cause a major release to occur.

Other useful prefixes that will not trigger a release: `build`, `ci`, `docs`, `refactor`, `style` and `test`. More details in the [Angular Contribution Guidelines](https://github.com/angular/angular/blob/master/CONTRIBUTING.md#type).
