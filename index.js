import { LoggingClient, ServerLogger } from './logging.js';

// Max batch size based on Kinesis batch limit
const batchSize = 500;

// Send a log batch if nothing has logged for 5 seconds
const batchTime = 5000;

const serverLogger = new ServerLogger(batchSize, batchTime);
export function createClient(appId, opts) {
	return new LoggingClient(appId, serverLogger, opts);
}
