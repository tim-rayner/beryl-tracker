//https://beryl-tracker-gbfs.beryl-tracker-gbfs.workers.dev/
import { FreeFloatingVehicle, NearbyVehicles, StationWithStatus } from '../../dtos/free';
import { getNearbySnapshot } from '../functions/getNearbySnapshot';

export async function sendSummaryEmail(env: Env, lat: number, lon: number): Promise<void> {
	let data;

	try {
		data = await getNearbySnapshot(lat, lon);
	} catch (err) {
		console.error('Failed to fetch GBFS data:', err);
		return;
	}

	const html = formatEmail(data);

	try {
		const res = await fetch('https://api.resend.com/emails', {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${env.RESEND_API_KEY}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				from: 'onboarding@resend.dev',
				to: 'tim.rayner2020@gmail.com',
				subject: 'Your Morning Beryl Snapshot',
				html,
			}),
		});

		const text = await res.text();

		if (!res.ok) {
			console.error(`Resend failed: [${res.status}] ${text}`);
			return;
		}

		console.log('Resend success:', text);
	} catch (err) {
		console.error('Resend fetch error:', err);
	}
}

const formatVehicleName = (vehicle: FreeFloatingVehicle) => {
	if (vehicle.vehicle_type_id === 'bbe') {
		return 'Electric Bike';
	}

	if (vehicle.vehicle_type_id === 'bb') {
		return 'Bike';
	}

	if (vehicle.vehicle_type_id === 'scooter') {
		return 'Scooter';
	}

	return 'Unknown';
};

const metersToMiles = (meters: number) => {
	return (meters * 0.000621371).toFixed(2);
};

function formatEmail(data: NearbyVehicles): string {
	const stations = data.nearby_stations
		.map((s: StationWithStatus) => `<li><strong>${s.name}</strong>: ${s.numberOfBikes} bikes, ${s.numberOfScooters} scooters</li>`)
		.join('');

	const vehicles = data.nearby_free_vehicles
		.map((v: FreeFloatingVehicle) => `<li>${formatVehicleName(v)} — ${metersToMiles(v.distance)} miles away</li>`)
		.join('');

	return `
		<h2>Beryl Tracker - Morning Snapshot</h2>
		<h3>Nearest Stations</h3>
		<ul>${stations}</ul>
		<h3>Free-floating Vehicles</h3>
		<ul>${vehicles}</ul>
	`;
}
