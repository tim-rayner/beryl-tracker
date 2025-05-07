import { StationStatus } from './dtos/station';
import { handleNearMe } from './lib/handlers/nearme';
import { sendSummaryEmail } from './lib/handlers/sendSummaryEmail';

export default {
	async scheduled(controller, env, ctx) {
		await sendSummaryEmail(env, 52.6416, 1.30084);
	},

	async fetch(request: Request, env: Env, ctx: ExecutionContext) {
		const url = new URL(request.url);
		const path = url.pathname;

		if (path === '/stations' || path === '/stations/') {
			const stationId = url.searchParams.get('stationId');
			const gbfsUrl = 'https://beryl-gbfs-production.web.app/v2_2/Norwich/station_status.json';
			const res = await fetch(gbfsUrl);
			const data = await res.json();
			const stations = data.data.stations as StationStatus[];

			if (stationId) {
				const station = stations.find((s) => s.station_id === stationId);
				if (!station) {
					return new Response(JSON.stringify({ error: 'Station not found' }), { status: 404 });
				}
				return new Response(JSON.stringify(station), {
					headers: { 'Content-Type': 'application/json' },
				});
			}

			return new Response(JSON.stringify(stations), {
				headers: { 'Content-Type': 'application/json' },
			});
		}

		// nearme?lat=52.64163&lon=1.30084
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
