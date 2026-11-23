import { Box, Stack, Typography } from '@mui/material';
import 'leaflet/dist/leaflet.css';
import { useMemo } from 'react';
import { MapContainer, Marker, Polyline, Popup, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import { z } from 'zod';

import type { CollectedRecord } from '../types';
import { recordPayload } from '../types';
import { EmptyData } from '../shared/DataPanel';

type LocationPoint = {
  latitude: number;
  longitude: number;
  timestamp?: string;
  label: string;
};

const LocationSchema = z
  .object({
    latitude: z.coerce.number().min(-90).max(90).optional(),
    lat: z.coerce.number().min(-90).max(90).optional(),
    longitude: z.coerce.number().min(-180).max(180).optional(),
    lon: z.coerce.number().min(-180).max(180).optional(),
    location: z
      .object({
        latitude: z.coerce.number().min(-90).max(90).optional(),
        lat: z.coerce.number().min(-90).max(90).optional(),
        longitude: z.coerce.number().min(-180).max(180).optional(),
        lon: z.coerce.number().min(-180).max(180).optional(),
      })
      .passthrough()
      .optional(),
    timestamp: z.string().optional(),
    collected_at: z.string().optional(),
    label: z.string().optional(),
  })
  .passthrough();

function parsePoint(record: CollectedRecord): LocationPoint | null {
  const payload = recordPayload(record);
  const parsed = LocationSchema.safeParse(payload);
  if (!parsed.success) return null;
  const latitude =
    parsed.data.latitude ??
    parsed.data.lat ??
    parsed.data.location?.latitude ??
    parsed.data.location?.lat;
  const longitude =
    parsed.data.longitude ??
    parsed.data.lon ??
    parsed.data.location?.longitude ??
    parsed.data.location?.lon;
  if (latitude === undefined || longitude === undefined) return null;

  return {
    latitude,
    longitude,
    timestamp: record.collected_at ?? parsed.data.collected_at ?? parsed.data.timestamp,
    label: parsed.data.label ?? record.data_type ?? 'location',
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

export function LocationHistoryMap({ records }: { records: CollectedRecord[] }) {
  const points = useMemo(() => {
    return (records ?? [])
      .map(parsePoint)
      .filter((point): point is LocationPoint => Boolean(point))
      .sort((left, right) => (left.timestamp ?? '').localeCompare(right.timestamp ?? ''));
  }, [records]);

  if (points.length === 0) {
    return <EmptyData>No location history has been collected for this system.</EmptyData>;
  }

  const center = points[Math.floor(points.length / 2)] ?? points[0];
  const latLngs = points.map((point) => [point.latitude, point.longitude] as [number, number]);

  return (
    <Stack spacing={2}>
      <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
        <MapContainer
          center={[center.latitude, center.longitude]}
          zoom={12}
          style={{ height: 280, width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {latLngs.length > 1 ? (
            <Polyline
              positions={latLngs}
              pathOptions={{ color: '#2563eb', weight: 3, opacity: 0.8 }}
            />
          ) : null}
          {points.map((point, index) => (
            <Marker
              key={`${point.timestamp ?? index}-${point.latitude}-${point.longitude}`}
              position={[point.latitude, point.longitude]}
              icon={markerIcon}
            >
              <Popup>
                <Typography variant="subtitle2">{point.label}</Typography>
                <Typography variant="body2">{formatTimestamp(point.timestamp)}</Typography>
                <Typography variant="body2">
                  {point.latitude.toFixed(3)}, {point.longitude.toFixed(3)}
                </Typography>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </Box>
      <Stack spacing={1}>
        {points.map((point, index) => (
          <Box
            key={`${point.timestamp ?? index}-${point.latitude}-${point.longitude}`}
            sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, alignItems: 'center' }}
          >
            <Box>
              <Typography variant="subtitle2">{point.label}</Typography>
              <Typography variant="body2" color="text.secondary">
                {formatTimestamp(point.timestamp)}
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              {point.latitude.toFixed(3)}, {point.longitude.toFixed(3)}
            </Typography>
          </Box>
        ))}
      </Stack>
    </Stack>
  );
}
