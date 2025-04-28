import maplibregl from 'maplibre-gl';

let map: maplibregl.Map | null = null;
let markers: maplibregl.Marker[] = [];

const PIN_IMAGES = {
  red: 'https://vpbhdyylesqgyxclhvan.supabase.co/storage/v1/object/public/pictures/PinyMap/red-dot.png',
  green: 'https://vpbhdyylesqgyxclhvan.supabase.co/storage/v1/object/public/pictures/PinyMap/green-dot.png',
  blue: 'https://vpbhdyylesqgyxclhvan.supabase.co/storage/v1/object/public/pictures/PinyMap/blue-dot.png'
};

// Poland's center coordinates
const POLAND_CENTER: [number, number] = [19.4803, 52.0692];

export const initializeMap = (container: HTMLElement, center: [number, number] = POLAND_CENTER): maplibregl.Map => {
  // Remove existing map if any
  if (map) {
    map.remove();
  }

  // Create new map
  map = new maplibregl.Map({
    container,
    style: 'https://tiles.openfreemap.org/styles/liberty',
    center: center,
    zoom: 6.2
  });

  return map;
};

export const clearMarkers = () => {
  markers.forEach(marker => marker.remove());
  markers = [];
};

export const addMarker = (position: [number, number], color: 'red' | 'green' | 'blue', tooltipContent?: string): maplibregl.Marker => {
  if (!map) throw new Error('Map not initialized');

  const el = document.createElement('div');
  el.className = 'custom-marker';
  el.style.width = '32px';
  el.style.height = '32px';
  el.style.backgroundImage = `url(${PIN_IMAGES[color]})`;
  el.style.backgroundSize = 'contain';
  el.style.backgroundRepeat = 'no-repeat';
  el.style.backgroundPosition = 'center';
  el.style.transform = 'translate(-50%, -50%)';

  const marker = new maplibregl.Marker({
    element: el,
    anchor: 'center'
  })
  .setLngLat(position)
  .addTo(map);

  if (tooltipContent) {
    const popup = new maplibregl.Popup({
      closeButton: false,
      closeOnClick: true,
      maxWidth: '300px'
    })
    .setHTML(tooltipContent);

    marker.setPopup(popup);
  }

  markers.push(marker);
  return marker;
};

export const fitMapToBounds = (padding?: number) => {
  if (!map || markers.length === 0) return;

  const bounds = new maplibregl.LngLatBounds();
  
  markers.forEach(marker => {
    bounds.extend(marker.getLngLat());
  });

  map.fitBounds(bounds, {
    padding: padding || 50,
    maxZoom: 7
  });
};