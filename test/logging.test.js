import { aTimeout, expect } from '@open-wc/testing';
import { LogBuilder, LoggingClient, ServerLogger } from '../logging.js';
import sinon from 'sinon';

describe('logging', () => {

	describe('LogBuilder', () => {

		describe('appId', () => {

			it('should include app ID', () => {
				const log = new LogBuilder('my-app-id').build();
				expect(log.appId).to.equal('my-app-id');
			});

			it('should convert app ID to string', () => {
				const log = new LogBuilder(12325).build();
				expect(log.appId).to.equal('12325');
			});
		});

		describe('location', () => {

			it('should include location', () => {
				const log = new LogBuilder('my-app-id').withLocation().build();
				expect(log.location).to.not.be.empty;
			});
		});

		describe('message', () => {

			it('should not include message by default', () => {
				const log = new LogBuilder('my-app-id').build();
				expect(log.message).to.be.undefined;
			});

			[null, undefined, ''].forEach(message => {
				it(`should not include '${message}' message`, () => {
					const log = new LogBuilder('my-app-id').withMessage(message).build();
					expect(log.message).to.be.undefined;
				});
			});

			it('should include message', () => {
				const log = new LogBuilder('my-app-id').withMessage('this is my message').build();
				expect(log.message).to.equal('this is my message');
			});

			it('should convert object message to JSON string', () => {
				const log = new LogBuilder('my-app-id').withMessage({ a: 123, b: 'message' }).build();
				expect(log.message).to.equal('{"a":123,"b":"message"}');
			});

			it('should convert message to string', () => {
				const log = new LogBuilder('my-app-id').withMessage(23432).build();
				expect(log.message).to.equal('23432');
			});

		});

		describe('error', () => {

			[null, undefined, 'a', 435].forEach(error => {
				it(`should not include invalid '${error}' error`, () => {
					const log = new LogBuilder('my-app-id').withError(error).build();
					expect(log.error).to.be.undefined;

				});
			});

			it('should include error properties', () => {
				try {
					throw new Error('This went bad');
				} catch (error) {
					const log = new LogBuilder('my-app-id').withError(error).build();
					expect(log.error.name).to.equal(error.name);
					expect(log.error.message).to.equal(error.message);
					expect(log.error.fileName).to.equal(error.fileName);
					expect(log.error.description).to.equal(error.description);
					expect(log.error.number).to.equal(error.number);
					expect(log.error.lineNumber).to.equal(error.lineNumber);
					expect(log.error.columnNumber).to.equal(error.columnNumber);
					expect(log.error.stack).to.equal(error.stack);
				}
			});

		});

		describe('legacy error', () => {

			it('should include legacy error properties', () => {

				const message = 'This went bad';
				const source = 'logging.js';
				const lineno = 43;
				const colno = 12;

				const log = new LogBuilder('my-app-id').withLegacyError(message, source, lineno, colno).build();
				expect(log.legacyError.message).to.equal(message);
				expect(log.legacyError.source).to.equal(source);
				expect(log.legacyError.lineno).to.equal(lineno);
				expect(log.legacyError.colno).to.equal(colno);
			});

		});

	});

	describe('LoggingClient', () => {

		describe('Throttling Off', () => {

			describe('log', () => {

				it('should log message', (done) => {

					const mockLogger = {
						logBatch: (logs) => {
							expect(logs.length).to.equal(1);

							const log = logs[0];
							expect(log.appId).to.equal('my-app-id');
							expect(log.message).to.equal('this is my message I want to log');

							expect(client._uniqueLogs).to.be.empty;
							done();
						}
					};
					const client = new LoggingClient('my-app-id', mockLogger);
					client.log('this is my message I want to log');
				});

				it('should log message batch', (done) => {

					const messages = ['this is my message I want to log', 'second message', 'third message'];
					const mockLogger = {
						logBatch: (logs) => {
							expect(logs.length).to.equal(messages.length);

							for (let i = 0; i < messages.length; i += 1) {
								const log = logs[i];
								const message = messages[i];
								expect(log.appId).to.equal('my-app-id');
								expect(log.message).to.equal(message);
							}

							expect(client._uniqueLogs).to.be.empty;
							done();
						}
					};
					const client = new LoggingClient('my-app-id', mockLogger);
					client.logBatch(messages);
				});

			});

			describe('error', () => {

				it('should log error', (done) => {

					const error = new Error('An error occurred');
					const message = 'My custom message to go along with it';
					const mockLogger = {
						logBatch: (logs) => {
							expect(logs.length).to.equal(1);

							const log = logs[0];
							expect(log.appId).to.equal('my-app-id');
							expect(log.message).to.equal(message);
							expect(log.error.name).to.equal(error.name);
							expect(log.error.message).to.equal(error.message);
							expect(log.error.fileName).to.equal(error.fileName);
							expect(log.error.description).to.equal(error.description);
							expect(log.error.number).to.equal(error.number);
							expect(log.error.lineNumber).to.equal(error.lineNumber);
							expect(log.error.columnNumber).to.equal(error.columnNumber);
							expect(log.error.stack).to.equal(error.stack);

							expect(client._uniqueLogs).to.be.empty;
							done();
						}
					};
					const client = new LoggingClient('my-app-id', mockLogger);
					client.error(error, message);
				});

				it('should log error batch', (done) => {

					const errors = [
						{ error: new Error('First error occurred'), developerMessage: 'My first message' },
						{ error: new Error('Second error occurred'), developerMessage: 'My second message' },
						{ error: new Error('Third error occurred'), developerMessage: 'My third message' }
					];
					const mockLogger = {
						logBatch: (logs) => {
							expect(logs.length).to.equal(errors.length);

							for (let i = 0; i < errors.length; i += 1) {
								const log = logs[i];
								const { error, developerMessage } = errors[i];
								expect(log.appId).to.equal('my-app-id');
								expect(log.message).to.equal(developerMessage);
								expect(log.error.name).to.equal(error.name);
								expect(log.error.message).to.equal(error.message);
								expect(log.error.fileName).to.equal(error.fileName);
								expect(log.error.description).to.equal(error.description);
								expect(log.error.number).to.equal(error.number);
								expect(log.error.lineNumber).to.equal(error.lineNumber);
								expect(log.error.columnNumber).to.equal(error.columnNumber);
								expect(log.error.stack).to.equal(error.stack);
							}

							expect(client._uniqueLogs).to.be.empty;
							done();
						}
					};
					const client = new LoggingClient('my-app-id', mockLogger);
					client.errorBatch(errors);
				});

			});

			describe('legacy error', () => {

				it('should log legacy error', (done) => {

					const message = 'The error message';
					const source = 'logging.js';
					const lineno = 102;
					const colno = 23;
					const error = new Error('An error occurred');
					const developerMessage = 'My custom message to go along with it';

					const mockLogger = {
						logBatch: (logs) => {
							expect(logs.length).to.equal(1);

							const log = logs[0];
							expect(log.appId).to.equal('my-app-id');
							expect(log.message).to.equal(developerMessage);
							expect(log.legacyError.message).to.equal(message);
							expect(log.legacyError.source).to.equal(source);
							expect(log.legacyError.lineno).to.equal(lineno);
							expect(log.legacyError.colno).to.equal(colno);
							expect(log.error.name).to.equal(error.name);
							expect(log.error.message).to.equal(error.message);
							expect(log.error.fileName).to.equal(error.fileName);
							expect(log.error.description).to.equal(error.description);
							expect(log.error.number).to.equal(error.number);
							expect(log.error.lineNumber).to.equal(error.lineNumber);
							expect(log.error.columnNumber).to.equal(error.columnNumber);
							expect(log.error.stack).to.equal(error.stack);

							expect(client._uniqueLogs).to.be.empty;
							done();
						}
					};
					const client = new LoggingClient('my-app-id', mockLogger);
					client.legacyError(message, source, lineno, colno, error, developerMessage);
				});

				it('should log legacy error batch', (done) => {

					const legacyErrors = [
						{ message: 'First error message', source: 'logging.js', lineno: 102, colno: 23, error: new Error('First error occurred'), developerMessage: 'My first message' },
						{ message: 'Second error message', source: 'logging.js', lineno: 45, colno: 12, error: new Error('Second error occurred'), developerMessage: 'My second message' },
						{ message: 'Third error message', source: 'logging.js', lineno: 2, colno: 19, error: new Error('Third error occurred'), developerMessage: 'My third message' },
					];
					const mockLogger = {
						logBatch: (logs) => {
							expect(logs.length).to.equal(legacyErrors.length);

							for (let i = 0; i < legacyErrors.length; i += 1) {
								const log = logs[i];
								const { message, source, lineno, colno, error, developerMessage } = legacyErrors[i];
								expect(log.appId).to.equal('my-app-id');
								expect(log.message).to.equal(developerMessage);
								expect(log.legacyError.message).to.equal(message);
								expect(log.legacyError.source).to.equal(source);
								expect(log.legacyError.lineno).to.equal(lineno);
								expect(log.legacyError.colno).to.equal(colno);
								expect(log.error.name).to.equal(error.name);
								expect(log.error.message).to.equal(error.message);
								expect(log.error.fileName).to.equal(error.fileName);
								expect(log.error.description).to.equal(error.description);
								expect(log.error.number).to.equal(error.number);
								expect(log.error.lineNumber).to.equal(error.lineNumber);
								expect(log.error.columnNumber).to.equal(error.columnNumber);
								expect(log.error.stack).to.equal(error.stack);
							}

							expect(client._uniqueLogs).to.be.empty;
							done();
						}
					};
					const client = new LoggingClient('my-app-id', mockLogger);
					client.legacyErrorBatch(legacyErrors);
				});

			});
		});

		describe('Throttling On', () => {

		});
	});

	describe('ServerLogger', () => {

		let logger;
		let batchTime;
		let provisioningEndpoint;
		let fetchStub;

		beforeEach(() => {

			batchTime = 150;
			logger = new ServerLogger(3, batchTime);

			provisioningEndpoint = '/test/provisioning/endpoint';
			const htmlEle = document.getElementsByTagName('html')[0];
			htmlEle.setAttribute('data-logging-endpoint', provisioningEndpoint);

			fetchStub = sinon.stub(window, 'fetch');

			let callCount = 0;
			fetchStub.withArgs(provisioningEndpoint).resolves({
				json: () => Promise.resolve({ Endpoint: `/test/endpoint/${callCount++}` })
			});
		});

		afterEach(() => {
			fetchStub.restore();
		});

		describe('batching', () => {

			beforeEach(() => {
				fetchStub.resolves({ ok: true });
			});

			it('should log immediately when batch size is reached', async() => {

				logger.logBatch([{ message: '1' }, { message: '2' }]);
				logger.logBatch([{ message: '3' }]);

				await aTimeout(0);
				expect(fetchStub).to.have.been.calledTwice;
				const options = fetchStub.getCall(1).args[1];
				expect(options.body).to.equal(JSON.stringify([{ message: '1' }, { message: '2' }, { message: '3' }]));
			});

			it('should batch logs if the batch size isnt reached', async() => {

				logger.logBatch([{ message: '1' }, { message: '2' }]);

				await aTimeout(batchTime);
				await aTimeout(0);
				expect(fetchStub).to.have.been.calledTwice;
				const options = fetchStub.getCall(1).args[1];
				expect(options.body).to.equal(JSON.stringify([{ message: '1' }, { message: '2' }]));
			});

			it('should send multiple batches when batch size is reached', async() => {

				logger.logBatch([{ message: '1' }, { message: '2' }]);
				logger.logBatch([{ message: '3' }, { message: '4' }, { message: '5' }, { message: '6' }, { message: '7' }, { message: '8' }, { message: '9' }]);

				await aTimeout(0);
				expect(fetchStub).to.have.been.callCount(4);

				for (let i = 0; i < 3; i += 1) {
					const options = fetchStub.getCall(i + 1).args[1];
					expect(options.body).to.equal(JSON.stringify([{ message: `${3 * i + 1}` }, { message: `${3 * i + 2}` }, { message: `${3 * i + 3}` }]));
				}
			});

			it('should send batch followed by wait if batch size isnt reached again', async() => {

				logger.logBatch([{ message: '1' }, { message: '2' }]);
				logger.logBatch([{ message: '3' }, { message: '4' }]);

				await aTimeout(0);
				expect(fetchStub).to.have.been.calledTwice;
				const options1 = fetchStub.getCall(1).args[1];
				expect(options1.body).to.equal(JSON.stringify([{ message: '1' }, { message: '2' }, { message: '3' }]));

				await aTimeout(batchTime);
				await aTimeout(0);
				expect(fetchStub).to.have.been.calledThrice;
				const options2 = fetchStub.getCall(2).args[1];
				expect(options2.body).to.equal(JSON.stringify([{ message: '4' }]));
			});

		});

		describe('endpoint expiration', () => {

			it('should not refresh the endpoint if fetch succeeds', async() => {

				fetchStub.onCall(1).resolves({ ok: true });

				logger.logBatch([{ message: '1' }, { message: '2' }, { message: '3' }]);

				await aTimeout(0);
				expect(fetchStub).to.have.been.calledTwice;
			});

			it('should refresh the endpoint if fetch fails with gone', async() => {

				fetchStub.onCall(1).resolves({ status: 410 });
				fetchStub.onCall(3).resolves({ ok: true });

				logger.logBatch([{ message: '1' }, { message: '2' }, { message: '3' }]);

				await aTimeout(0);
				expect(fetchStub).to.have.been.callCount(4);

				const [endpoint1, options1] = fetchStub.getCall(1).args;
				expect(endpoint1).to.equal('/test/endpoint/0');
				expect(options1.body).to.equal(JSON.stringify([{ message: '1' }, { message: '2' }, { message: '3' }]));
				expect(options1.mode).to.equal('cors');

				const [endpoint2, options2] = fetchStub.getCall(3).args;
				expect(endpoint2).to.equal('/test/endpoint/1');
				expect(options2.body).to.equal(JSON.stringify([{ message: '1' }, { message: '2' }, { message: '3' }]));
				expect(options2.mode).to.equal('no-cors');
			});

			it('should only refresh once even if the second fetch fails with gone', async() => {

				fetchStub.resolves({ status: 410 });

				logger.logBatch([{ message: '1' }, { message: '2' }, { message: '3' }]);

				await aTimeout(0);
				expect(fetchStub).to.have.been.callCount(4);

				const [endpoint1, options1] = fetchStub.getCall(1).args;
				expect(endpoint1).to.equal('/test/endpoint/0');
				expect(options1.body).to.equal(JSON.stringify([{ message: '1' }, { message: '2' }, { message: '3' }]));
				expect(options1.mode).to.equal('cors');

				const [endpoint2, options2] = fetchStub.getCall(3).args;
				expect(endpoint2).to.equal('/test/endpoint/1');
				expect(options2.body).to.equal(JSON.stringify([{ message: '1' }, { message: '2' }, { message: '3' }]));
				expect(options2.mode).to.equal('no-cors');
			});

		});

		describe('unload', () => {
			let beaconStub;

			beforeEach(() => {
				beaconStub = sinon.stub(navigator, 'sendBeacon');
			});

			afterEach(() => {
				beaconStub.restore();
			});

			it('should send remaining logs as beacon on unload', async() => {

				logger.logBatch([{ message: '1' }, { message: '2' }]);

				window.dispatchEvent(new Event('unload'));

				await aTimeout(0);

				expect(beaconStub).to.have.been.calledOnce;
				const [endpoint, data] = beaconStub.getCall(0).args;

				expect(endpoint).to.equal('/test/endpoint/0');
				expect(data).to.equal(JSON.stringify([{ message: '1' }, { message: '2' }]));
			});

		});

	});

});
