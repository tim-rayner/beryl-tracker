//https://beryl-tracker-gbfs.beryl-tracker-gbfs.workers.dev/
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
	console.log('RESEND key exists?', Boolean(env.RESEND_API_KEY));

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

function formatEmail(data: any): string {
	const stations = data.nearby_stations
		.map((s: any) => `<li><strong>${s.name}</strong>: ${s.numberOfBikes} bikes, ${s.numberOfScooters} scooters</li>`)
		.join('');

	const vehicles = data.nearby_free_vehicles.map((v: any) => `<li>${v.vehicle_type_id} — ${Math.round(v.distance)}m away</li>`).join('');

	return `
		<h2>Beryl Tracker - Morning Snapshot</h2>
		<h3>Nearest Stations</h3>
		<ul>${stations}</ul>
		<h3>Free-floating Vehicles</h3>
		<ul>${vehicles}</ul>
	`;
}
