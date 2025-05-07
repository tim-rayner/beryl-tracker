import { getNearbySnapshot } from '../functions/getNearbySnapshot';

export async function handleNearMe(request: Request): Promise<Response> {
	const url = new URL(request.url);
	const lat = parseFloat(url.searchParams.get('lat') || '');
	const lon = parseFloat(url.searchParams.get('lon') || '');

	if (isNaN(lat) || isNaN(lon)) {
		return jsonResponse({ error: 'Missing or invalid lat/lon query params' }, 400);
	}

	try {
		const { nearby_stations, nearby_free_vehicles } = await getNearbySnapshot(lat, lon);
		return jsonResponse({
			nearby_stations,
			nearby_free_vehicles,
		});
	} catch (err) {
		return jsonResponse({ error: 'Failed to fetch GBFS data' }, 500);
	}
}

/**
 *
 * 📌 Why Use Haversine?
 * The Earth is roughly a sphere, so using simple flat-Earth (Euclidean) geometry gives inaccurate results over large distances or even city-scale precision. The Haversine formula accounts for the Earth's curvature.
 *
 */
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
	const R = 6371000;
	const toRad = (deg: number) => (deg * Math.PI) / 180;

	const dLat = toRad(lat2 - lat1);
	const dLon = toRad(lon2 - lon1);

	const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	return Number((R * c).toFixed(2));
}

function jsonResponse(data: unknown, status = 200): Response {
	return new Response(JSON.stringify(data), {
		status,
		headers: { 'Content-Type': 'application/json' },
	});
}
