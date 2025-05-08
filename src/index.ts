import { handleNearMe } from './lib/handlers/nearme';
import { sendSummaryEmail } from './lib/handlers/sendSummaryEmail';
import { handleStations } from './lib/handlers/stations';

export default {
	async scheduled(controller, env, ctx) {
		await sendSummaryEmail(env, 52.6416, 1.30084);
	},

	async fetch(request: Request, env: Env, ctx: ExecutionContext) {
		const url = new URL(request.url);
		const path = url.pathname;

		// /stations?location=Norwich&stationId=2100
		if (path === '/stations' || path === '/stations/') {
			return handleStations(request);
		}

		// nearme?location=Norwich&lat=52.64163&lon=1.30084
		if (path === '/nearme' || path === '/nearme/') {
			return handleNearMe(request);
		}

		// testing emailer
		if (url.pathname === '/test-email') {
			await sendSummaryEmail(env, 52.6416, 1.30084);
			return new Response('Test email sent');
		}

		if (path === '/' || path === '') {
			return new Response(
				JSON.stringify({
					endpoints: {
						'/stations': 'Get all stations or filter by stationId',
						'/nearme': 'Get 5 closest stations to a lat/lon',
						'/': 'This help message',
					},
				}),
				{
					headers: { 'Content-Type': 'application/json' },
				}
			);
		}

		return new Response(JSON.stringify({ error: 'Not found' }), {
			status: 404,
			headers: { 'Content-Type': 'application/json' },
		});
	},
} satisfies ExportedHandler<Env>;
