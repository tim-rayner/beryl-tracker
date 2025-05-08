export function getCityFromRequest(request: Request): string {
	const url = new URL(request.url);
	const location = url.searchParams.get('location');
	return location || 'Norwich';
}
