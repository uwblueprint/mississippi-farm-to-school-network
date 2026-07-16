declare module '@mapbox/mapbox-gl-geocoder' {
	import type { IControl, Map } from 'mapbox-gl';

	export default class MapboxGeocoder implements IControl {
		constructor(options?: Record<string, unknown>);
		onAdd(map: Map): HTMLElement;
		onRemove(): void;
	}
}
