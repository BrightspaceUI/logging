# d2l-logging

[![NPM version](https://img.shields.io/npm/v/@brightspace-ui/logging.svg)](https://www.npmjs.org/package/@brightspace-ui/logging)
[![Build status](https://travis-ci.com/@brightspace-ui/logging.svg?branch=master)](https://travis-ci.com/@brightspace-ui/logging)

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

## Versioning, Releasing & Deploying

All version changes should obey [semantic versioning](https://semver.org/) rules.

Include either `[increment major]`, `[increment minor]` or `[increment patch]` in your merge commit message to automatically increment the `package.json` version and create a tag.
