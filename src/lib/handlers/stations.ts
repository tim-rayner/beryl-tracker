import { StationStatus } from '../../dtos/station';
import { getCityFromRequest } from '../helpers/getCityFromRequest';

export async function handleStations(request: Request): Promise<Response> {
	const url = new URL(request.url);
	const location = getCityFromRequest(request);
	const stationId = url.searchParams.get('stationId');
	const gbfsUrl = `https://beryl-gbfs-production.web.app/v2_2/${location}/station_status.json`;
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
