//https://beryl-tracker-gbfs.beryl-tracker-gbfs.workers.dev/
import { FreeFloatingVehicle, NearbyVehicles } from '../../dtos/free';
import { getNearbySnapshot } from '../functions/getNearbySnapshot';

export async function sendSummaryEmail(env: Env, lat: number, lon: number, location: string): Promise<void> {
	let data;

	try {
		data = await getNearbySnapshot(lat, lon, location);
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
				from: 'beryl-tracker@timrayner.com',
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
	const { nearby_stations, nearby_free_vehicles } = data;

	const now = new Date(new Date().toLocaleString('en-GB', { timeZone: 'Europe/London' }));
	const hours = now.getHours();
	let greeting = 'Hello';
	if (hours < 12) greeting = 'morning';
	else if (hours < 17) greeting = 'afternoon';
	else greeting = 'evening';

	const formattedDate = now.toLocaleDateString('en-GB', {
		weekday: 'long',
		day: 'numeric',
		month: 'long',
		year: 'numeric',
	});

	const sortedStations = [...nearby_stations].sort((a, b) => a.distance - b.distance);
	let primaryStation = sortedStations[0];
	if (primaryStation.numberOfScooters === 0) {
		const fallback = sortedStations.find((s) => s.numberOfScooters > 0);
		if (fallback) primaryStation = fallback;
	}

	const stationSection = `
		<h2 style="color:#003B4A;font-size:18px;margin-bottom:6px;">Closest Station</h2>
		<div style="background:#F9FAF8;padding:14px;border-radius:10px;margin-bottom:20px;border:1px solid #E0E0E0;">
			<strong style="font-size:16px;">${primaryStation.name}</strong><br/>
			<span style="color:#333;">${primaryStation.numberOfBikes} bikes &bull; ${primaryStation.numberOfScooters} scooters</span><br/>
			<span style="font-size:0.9em;color:#777;">${metersToMiles(primaryStation.distance)} miles away</span>
		</div>
	`;

	const vehiclesList = nearby_free_vehicles
		.map((v: FreeFloatingVehicle) => {
			const label = `${formatVehicleName(v)} – ${metersToMiles(v.distance)} miles away`;
			const link = `https://maps.google.com/?q=${v.lat},${v.lon}`;
			return `<li style="margin-bottom:8px;"><a href="${link}" target="_blank" rel="noopener noreferrer" style="color:#77C043;text-decoration:none;">${label}</a></li>`;
		})
		.join('');

	return `
		<div style="max-width:600px;width:100%;margin:0 auto;background-color:#ffffff;">
		  <div style="background-color:#00e3c2;padding:16px 24px;">
		    <h1 style="color:#000000;font-size:24px;margin:0;">Your Beryl Snapshot</h1>
		  </div>
		  <div style="font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;padding:24px;color:#333;font-size:16px;line-height:1.6;">
			<p style="margin-top:0;margin-bottom:6px;">Good ${greeting},</p>
			<p style="margin:0 0 20px;">Here's your Beryl snapshot for <strong>${formattedDate}</strong>. Let's see what's nearby this ${greeting}:</p>
			${stationSection}
			<h2 style="color:#003B4A;font-size:18px;margin-bottom:6px;">Free-floating Vehicles</h2>
			<ul style="padding-left:20px;margin-top:8px;margin-bottom:24px;">${vehiclesList}</ul>
			<p style="font-size:0.9em;color:#999;">Powered by <a href="https://timrayner.com" style="color:#77C043;">Tim Rayner's</a> custom Beryl Tracker• <a href="https://beryl-tracker-gbfs.beryl-tracker-gbfs.workers.dev/" style="color:#77C043;">Live feed</a></p>
		  </div>
		</div>
	`;
}
