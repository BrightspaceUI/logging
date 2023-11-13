# @brightspace-ui/logging

[![NPM version](https://img.shields.io/npm/v/@brightspace-ui/logging.svg)](https://www.npmjs.org/package/@brightspace-ui/logging)

JavaScript client for sending logs to the Brightspace Logging service.

## Installation

To install from NPM:

```shell
npm install @brightspace-ui/logging
```

## Developing and Contributing

After cloning the repo, run `npm install` to install dependencies.

### Testing

To run the full suite of tests:

```shell
npm test
```

Alternatively, tests can be selectively run:

```shell
# eslint
npm run lint:eslint

# unit tests
npm run test:unit
```

### Versioning and Releasing

This repo is configured to use `semantic-release`. Commits prefixed with `fix:` and `feat:` will trigger patch and minor releases when merged to `main`.

To learn how to create major releases and release from maintenance branches, refer to the [semantic-release GitHub Action](https://github.com/BrightspaceUI/actions/tree/main/semantic-release) documentation.
