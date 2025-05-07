export type StationWithStatus = {
	name: string;
	lat: number;
	lon: number;
	distance: number;
	numberOfAvailableVehicles: number;
	numberOfBikes: number;
	numberOfEBikes: number;
	numberOfScooters: number;
};

export type FreeFloatingVehicle = {
	bike_id: string;
	is_reserved: boolean;
	is_disabled: boolean;
	vehicle_type_id: string;
	lat: number;
	lon: number;
	current_range_meters: number;
	distance: number;
};

export type NearbyVehicles = {
	nearby_stations: StationWithStatus[];
	nearby_free_vehicles: FreeFloatingVehicle[];
};
