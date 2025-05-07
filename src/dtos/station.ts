export type VehicleTypeAvailable = {
	vehicle_type_id: string;
	count: number;
};

export type StationStatus = {
	station_id: string;
	num_bikes_available: number;
	num_docks_available: number;
	is_installed: boolean;
	is_renting: boolean;
	is_returning: boolean;
	last_reported: number; // Unix timestamp
	vehicle_types_available: VehicleTypeAvailable[];
};

export type StationInformation = {
	station_id: string;
	name: string;
	lat: number;
	lon: number;
	capacity: number;
	rental_uris: {
		android: string;
		ios: string;
	};
};
