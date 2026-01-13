import { useEffect, useRef, useMemo } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface LocationPickerProps {
  latitude: number;
  longitude: number;
  onLocationChange: (lat: number, lng: number) => void;
}

function MapCenterUpdater({ latitude, longitude }: { latitude: number; longitude: number }) {
  const map = useMap();
  const prevCoordsRef = useRef({ lat: latitude, lng: longitude });
  
  useEffect(() => {
    const prevCoords = prevCoordsRef.current;
    const distance = Math.sqrt(
      Math.pow(latitude - prevCoords.lat, 2) + Math.pow(longitude - prevCoords.lng, 2)
    );
    
    if (distance > 0.001) {
      map.flyTo([latitude, longitude], 16, { duration: 1 });
      prevCoordsRef.current = { lat: latitude, lng: longitude };
    }
  }, [latitude, longitude, map]);
  
  return null;
}

function DraggableMarker({ 
  latitude, 
  longitude, 
  onLocationChange 
}: LocationPickerProps) {
  const markerRef = useRef<L.Marker>(null);

  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker != null) {
          const latlng = marker.getLatLng();
          onLocationChange(latlng.lat, latlng.lng);
        }
      },
    }),
    [onLocationChange]
  );

  useMapEvents({
    click(e) {
      onLocationChange(e.latlng.lat, e.latlng.lng);
    },
  });

  return (
    <Marker
      draggable={true}
      eventHandlers={eventHandlers}
      position={[latitude, longitude]}
      ref={markerRef}
      icon={markerIcon}
    />
  );
}

export default function LocationPicker({ 
  latitude, 
  longitude, 
  onLocationChange 
}: LocationPickerProps) {
  return (
    <div className="w-full h-[200px] rounded-lg overflow-hidden border border-border">
      <MapContainer
        center={[latitude, longitude]}
        zoom={16}
        scrollWheelZoom={true}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapCenterUpdater latitude={latitude} longitude={longitude} />
        <DraggableMarker
          latitude={latitude}
          longitude={longitude}
          onLocationChange={onLocationChange}
        />
      </MapContainer>
    </div>
  );
}
