# @brightspace-ui/logging

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
# lint & run headless unit tests
npm test

# unit tests only
npm run test:headless

# debug or run a subset of local unit tests
npm run test:headless:watch
```

## Versioning & Releasing

This repo is configured to use `semantic-release`. Commits prefixed with `fix:` and `feat:` will trigger patch and minor releases when merged to `main`.

To learn how to create major releases and release from maintenance branches, refer to the [semantic-release GitHub Action](https://github.com/BrightspaceUI/actions/tree/main/semantic-release) documentation.
