import { DataPanel } from '../shared/DataPanel';
import type { CollectedRecord } from '../types';
import { LocationHistoryMap } from './LocationHistoryMap';

export function LocationDashboard({ records }: { records: CollectedRecord[] }) {
  return (
    <DataPanel title="Location history" subtitle="Reported coordinates over time">
      <LocationHistoryMap records={records} />
    </DataPanel>
  );
}
