import { getNearbySnapshot } from '../functions/getNearbySnapshot';
import { getCityFromRequest } from '../helpers/getCityFromRequest';

export async function handleNearMe(request: Request): Promise<Response> {
	const url = new URL(request.url);
	const lat = parseFloat(url.searchParams.get('lat') || '');
	const lon = parseFloat(url.searchParams.get('lon') || '');
	const location = getCityFromRequest(request);

	if (isNaN(lat) || isNaN(lon)) {
		return jsonResponse({ error: 'Missing or invalid lat/lon query params' }, 400);
	}

	try {
		const { nearby_stations, nearby_free_vehicles } = await getNearbySnapshot(lat, lon, location);
		return jsonResponse({
			nearby_stations,
			nearby_free_vehicles,
		});
	} catch (err) {
		return jsonResponse({ error: 'Failed to fetch GBFS data' }, 500);
	}
}

function jsonResponse(data: unknown, status = 200): Response {
	return new Response(JSON.stringify(data), {
		status,
		headers: { 'Content-Type': 'application/json' },
	});
}
