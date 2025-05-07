import { FreeFloatingVehicle } from '../../dtos/free';
import { StationInformation, StationStatus } from '../../dtos/station';

export async function handleNearMe(request: Request): Promise<Response> {
	const url = new URL(request.url);
	const lat = parseFloat(url.searchParams.get('lat') || '');
	const lon = parseFloat(url.searchParams.get('lon') || '');

	if (isNaN(lat) || isNaN(lon)) {
		return jsonResponse({ error: 'Missing or invalid lat/lon query params' }, 400);
	}

	const infoUrl = 'https://beryl-gbfs-production.web.app/v2_2/Norwich/station_information.json';
	const statusUrl = 'https://beryl-gbfs-production.web.app/v2_2/Norwich/station_status.json';
	const freeBikesUrl = 'https://beryl-gbfs-production.web.app/v2_2/Norwich/free_bike_status.json';

	try {
		const [infoRes, statusRes, freeBikeRes] = await Promise.all([fetch(infoUrl), fetch(statusUrl), fetch(freeBikesUrl)]);

		const infoData = await infoRes.json();
		const statusData = await statusRes.json();
		const freeBikeData = await freeBikeRes.json();

		const stations: StationInformation[] = infoData.data.stations;
		const statuses: StationStatus[] = statusData.data.stations;

		// Closest stations within 0.75 miles (~1207 meters), top 5
		const stationsWithStatus = stations
			.map((station) => {
				const distance = haversineDistance(lat, lon, station.lat, station.lon);
				if (distance > 800) return null;

				const status = statuses.find((s) => s.station_id === station.station_id);
				if (!status) return null;

				const vehicleTypes = status.vehicle_types_available || [];
				let numberOfAvailableVehicles = 0;
				let numberOfBikes = 0;
				let numberOfEBikes = 0;
				let numberOfScooters = 0;
				for (const vt of vehicleTypes) {
					numberOfAvailableVehicles += vt.count || 0;
					if (vt.vehicle_type_id === 'beryl_bike') numberOfBikes = vt.count || 0;
					if (vt.vehicle_type_id === 'bbe') numberOfEBikes = vt.count || 0;
					if (vt.vehicle_type_id === 'scooter') numberOfScooters = vt.count || 0;
				}

				return {
					name: station.name,
					lat: station.lat,
					lon: station.lon,
					distance,
					numberOfAvailableVehicles,
					numberOfBikes,
					numberOfEBikes,
					numberOfScooters,
				};
			})
			.filter(Boolean)
			.sort((a, b) => a!.distance - b!.distance)
			.slice(0, 5);

		// Closest free-floating vehicles within 1 mile (~1609 meters), top 5
		const vehicles: FreeFloatingVehicle[] = freeBikeData.data.bikes
			.map((bike: any) => {
				const distance = haversineDistance(lat, lon, bike.lat, bike.lon);
				if (distance > 1207.1) return null;

				return {
					bike_id: bike.bike_id,
					is_reserved: bike.is_reserved,
					is_disabled: bike.is_disabled,
					vehicle_type_id: bike.vehicle_type_id,
					lat: bike.lat,
					lon: bike.lon,
					current_range_meters: bike.current_range_meters ?? 0,
					distance,
				};
			})
			.filter(Boolean)
			.sort((a: FreeFloatingVehicle, b: FreeFloatingVehicle) => a.distance - b.distance)
			.slice(0, 5) as FreeFloatingVehicle[];

		return jsonResponse({
			nearby_stations: stationsWithStatus,
			nearby_free_vehicles: vehicles,
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
