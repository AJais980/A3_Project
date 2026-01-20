const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { initializeSocketIO } = require('./lib/socketServer');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;

// Create Next.js app with proper configuration
const app = next({
	dev,
	hostname,
	port,
	// Enable Turbopack in both dev and production
	turbo: false,
	// Ensure we use the built files in production
	dir: '.',
	conf: {}
});
const handle = app.getRequestHandler();

console.log(`🚀 Starting server in ${dev ? 'DEVELOPMENT' : 'PRODUCTION'} mode`);

app.prepare().then(() => {
	const httpServer = createServer(async (req, res) => {
		try {
			const parsedUrl = parse(req.url, true);
			await handle(req, res, parsedUrl);
		} catch (err) {
			console.error('Error occurred handling', req.url, err);
			res.statusCode = 500;
			res.end('internal server error');
		}
	});

	// Initialize Socket.IO using the centralized handler
	const io = initializeSocketIO(httpServer);

	httpServer
		.once('error', (err) => {
			console.error(err);
			process.exit(1);
		})
		.listen(port, () => {
			console.log(`> Ready on http://${hostname}:${port}`);
		});
});
