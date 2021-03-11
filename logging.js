
const _isFiniteNumber = (val) => val !== null && isFinite(val) && !isNaN(val);

const dataLoggingEndpointAttribute = 'data-logging-endpoint';
const defaultThrottleRateMs = 60000;

export class ServerLogger {

	constructor(batchSize, batchTime) {
		this._batchSize = batchSize;
		this._batchTime = batchTime;
		this._logs = [];
		window.addEventListener('unload', this._onUnload.bind(this));
	}

	logBatch(logs) {
		clearTimeout(this._batchTimeout);
		this._loggerPromise = this._loggerPromise || this._provisionLoggerEndpoint(false);
		this._logs = [...this._logs, ...logs];
		while (this._logs.length >= this._batchSize) {
			const batch = this._logs.slice(0, this._batchSize);
			this._logs = this._logs.slice(this._batchSize, this._logs.length);
			this._log(batch);
		}
		if (this._logs.length > 0) {
			this._batchTimeout = setTimeout(() => {
				this._log(this._logs);
				this._logs = [];
			}, this._batchTime);
		}
	}

	async _log(logs) {
		let options = {
			method: 'POST',
			mode: 'cors',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(logs)
		};
		try {
			let logger = await this._loggerPromise;
			const resp = await window.fetch(logger.Endpoint, options);
			if (resp.status === 410) {
				// endpoint has expired so force refresh
				this._loggerPromise = this._provisionLoggerEndpoint(true);
				logger = await this._loggerPromise;
				options = { ...options, mode: 'no-cors' };
				window.fetch(logger.Endpoint, options);
			}
		} catch (err) {
			console.error(err, logs);
		}
	}

	async _onUnload() {
		clearTimeout(this._batchTimeout);
		if (!this._loggerPromise && !navigator || !navigator.sendBeacon) {
			return;
		}
		if (this._logs.length > 0) {
			try {
				const logger = await this._loggerPromise;
				const data = JSON.stringify(this._logs);
				navigator.sendBeacon(logger.Endpoint, data);
			} catch (err) {
				console.error(err, this._logs);
			}
		}
	}

	async _provisionLoggerEndpoint(reload) {
		const htmlEle = document.getElementsByTagName('html')[0];
		if (!htmlEle) {
			throw new Error(`Failed to locate top-level HTML element for ${dataLoggingEndpointAttribute}`);
		}
		const provisionEndpoint = htmlEle.getAttribute(dataLoggingEndpointAttribute);
		if (!provisionEndpoint) {
			throw new Error(`Missing ${dataLoggingEndpointAttribute} attribute on top-level HTML element`);
		}
		const response = await window.fetch(provisionEndpoint, reload ? { cache: 'reload' } : {});
		return response.json();
	}
}

export class LogBuilder {
	constructor(appId) {
		this._log = { appId: String(appId) };
	}

	withLocation() {
		if (window.location && window.location.href) {
			this._log.location = String(window.location.href);
		}
		return this;
	}

	withError(error) {
		if (!error || !(error instanceof Error)) {
			return this;
		}
		this._log.error = {};
		if (error.message) {
			this._log.error.message = String(error.message);
		}
		if (error.name) {
			this._log.error.name = String(error.name);
		}
		if (error.description) {
			this._log.error.description = String(error.description);
		}
		if (_isFiniteNumber(error.number)) {
			this._log.error.number = Number(error.number);
		}
		if (error.fileName) {
			this._log.error.fileName = String(error.fileName);
		}
		if (_isFiniteNumber(error.lineNumber)) {
			this._log.error.lineNumber = Number(error.lineNumber);
		}
		if (_isFiniteNumber(error.columnNumber)) {
			this._log.error.columnNumber = Number(error.columnNumber);
		}
		if (error.stack) {
			this._log.error.stack = String(error.stack);
		}
		return this;
	}

	withLegacyError(message, source, lineno, colno) {
		this._log.legacyError = {};
		if (message) {
			this._log.legacyError.message = String(message);
		}
		if (source) {
			this._log.legacyError.source = String(source);
		}
		if (_isFiniteNumber(lineno)) {
			this._log.legacyError.lineno = Number(lineno);
		}
		if (_isFiniteNumber(colno)) {
			this._log.legacyError.colno = Number(colno);
		}
		return this;
	}

	withMessage(message) {
		if (message instanceof Object) {
			this._log.message = JSON.stringify(message);
		} else if (message) {
			this._log.message = String(message);
		}
		return this;
	}

	build() {
		return Object.freeze(this._log);
	}
}

export class LoggingClient {
	constructor(appId, logger, opts) {
		this._appId = appId;
		this._logger = logger;
		this._shouldThrottle = opts ? !!opts.shouldThrottle : false;

		this._uniqueLogs = new Map();
	}

	log(developerMessage) {
		this.logBatch([developerMessage]);
	}

	logBatch(developerMessages) {
		const logs = developerMessages.map(developerMessage => new LogBuilder(this._appId)
			.withMessage(developerMessage)
			.withLocation()
			.build()
		).filter(this._throttle.bind(this));
		if (logs.length > 0) {
			this._logger.logBatch(logs);
		}
	}

	error(error, developerMessage) {
		this.errorBatch([{ error, developerMessage }]);
	}

	errorBatch(errors) {
		const logs = errors.map(({ error, developerMessage }) => new LogBuilder(this._appId)
			.withError(error)
			.withMessage(developerMessage)
			.withLocation()
			.build()
		).filter(this._throttle.bind(this));
		if (logs.length > 0) {
			this._logger.logBatch(logs);
		}
	}

	legacyError(message, source, lineno, colno, error, developerMessage) {
		this.legacyErrorBatch([{ message, source, lineno, colno, error, developerMessage }]);
	}

	legacyErrorBatch(legacyErrors) {
		const logs = legacyErrors.map(({ message, source, lineno, colno, error, developerMessage }) => new LogBuilder(this._appId)
			.withLegacyError(message, source, lineno, colno)
			.withError(error)
			.withMessage(developerMessage)
			.withLocation()
			.build()
		).filter(this._throttle.bind(this));
		if (logs.length > 0) {
			this._logger.logBatch(logs);
		}
	}

	_throttle(log) {
		if (!this._shouldThrottle) {
			return true;
		}

		const now = new Date().getTime();
		const key = JSON.stringify(log);
		const lastLogged = this._uniqueLogs.get(key);
		if (lastLogged === undefined || now - lastLogged >= defaultThrottleRateMs) {
			this._uniqueLogs.set(key, now);
			return true;
		} else {
			return false;
		}
	}
}
