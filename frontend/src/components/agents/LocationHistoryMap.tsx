import { Box, Stack, Typography } from '@mui/material';
import 'leaflet/dist/leaflet.css';
import { useMemo } from 'react';
import { MapContainer, Marker, Polyline, Popup, TileLayer } from 'react-leaflet';
import L from 'leaflet';

type LocationPoint = {
  latitude: number;
  longitude: number;
  timestamp?: string;
  label: string;
};

function parsePoint(record: any): LocationPoint | null {
  const payload = record?.payload ?? {};
  const latitude = payload.latitude ?? payload.lat ?? payload.location?.latitude ?? payload.location?.lat;
  const longitude = payload.longitude ?? payload.lon ?? payload.location?.longitude ?? payload.location?.lon;

  if (latitude === undefined || longitude === undefined || latitude === null || longitude === null) {
    return null;
  }

  const parsedLatitude = Number(latitude);
  const parsedLongitude = Number(longitude);

  if (Number.isNaN(parsedLatitude) || Number.isNaN(parsedLongitude)) {
    return null;
  }

  return {
    latitude: parsedLatitude,
    longitude: parsedLongitude,
    timestamp: record?.collected_at ?? payload.collected_at ?? payload.timestamp,
    label: record?.data_type ?? 'location',
  };
}

function formatTimestamp(timestamp?: string) {
  if (!timestamp) return 'Unknown time';
  const parsed = new Date(timestamp);
  if (Number.isNaN(parsed.getTime())) {
    return timestamp;
  }
  return parsed.toLocaleString();
}

const markerIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export function LocationHistoryMap({ records }: { records: any[] }) {
  const points = useMemo(() => {
    return (records ?? [])
      .map(parsePoint)
      .filter((point): point is LocationPoint => Boolean(point))
      .sort((left, right) => (left.timestamp ?? '').localeCompare(right.timestamp ?? ''));
  }, [records]);

  if (points.length === 0) {
    return <Typography color="text.secondary">No location history yet.</Typography>;
  }

  const center = points[Math.floor(points.length / 2)] ?? points[0];
  const latLngs = points.map((point) => [point.latitude, point.longitude] as [number, number]);

  return (
    <Stack spacing={2}>
      <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
        <MapContainer center={[center.latitude, center.longitude]} zoom={12} style={{ height: 280, width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {latLngs.length > 1 ? <Polyline positions={latLngs} pathOptions={{ color: '#2563eb', weight: 3, opacity: 0.8 }} /> : null}
          {points.map((point, index) => (
            <Marker key={`${point.timestamp ?? index}-${point.latitude}-${point.longitude}`} position={[point.latitude, point.longitude]} icon={markerIcon}>
              <Popup>
                <Typography variant="subtitle2">{point.label}</Typography>
                <Typography variant="body2">{formatTimestamp(point.timestamp)}</Typography>
                <Typography variant="body2">{point.latitude.toFixed(3)}, {point.longitude.toFixed(3)}</Typography>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </Box>
      <Stack spacing={1}>
        {points.map((point, index) => (
          <Box key={`${point.timestamp ?? index}-${point.latitude}-${point.longitude}`} sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, alignItems: 'center' }}>
            <Box>
              <Typography variant="subtitle2">{point.label}</Typography>
              <Typography variant="body2" color="text.secondary">{formatTimestamp(point.timestamp)}</Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">{point.latitude.toFixed(3)}, {point.longitude.toFixed(3)}</Typography>
          </Box>
        ))}
      </Stack>
    </Stack>
  );
}
