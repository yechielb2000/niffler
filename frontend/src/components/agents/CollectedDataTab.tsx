import { Box, Grid, List, ListItemButton, ListItemText, Paper, Typography } from '@mui/material';
import { useState } from 'react';

interface CollectedDataTabProps {
  data: any[];
}

export function CollectedDataTab({ data }: CollectedDataTabProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(data.length > 0 ? 0 : null);

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={4}>
        <Paper sx={{ bgcolor: '#0b0f19', maxHeight: '520px', overflow: 'auto', border: '1px solid #1e293b' }}>
          <List dense disablePadding>
            {data.map((item, index) => (
              <ListItemButton
                key={item.id ?? `${item.data_type}-${index}`}
                selected={selectedIndex === index}
                onClick={() => setSelectedIndex(index)}
                sx={{
                  borderLeft: selectedIndex === index ? '4px solid #06b6d4' : '4px solid transparent',
                  bgcolor: selectedIndex === index ? '#111827' : 'transparent',
                  borderBottom: '1px solid #1e293b',
                }}
              >
                <ListItemText
                  primary={item.data_type}
                  secondary={`Extracted: ${item.collected_at ?? 'n/a'}`}
                  primaryTypographyProps={{ color: '#fff', fontWeight: 'bold', fontFamily: 'monospace' }}
                  secondaryTypographyProps={{ color: '#64748b', fontSize: '0.75rem' }}
                />
              </ListItemButton>
            ))}
          </List>
        </Paper>
      </Grid>

      <Grid item xs={12} md={8}>
        <Paper sx={{ p: 2, bgcolor: '#0b0f19', height: '520px', overflow: 'auto', border: '1px solid #1e293b' }}>
          {selectedIndex !== null && data[selectedIndex] ? (
            <Box>
              <Typography variant="caption" sx={{ color: '#06b6d4', display: 'block', mb: 1, fontWeight: 'bold' }}>
                TELEMETRY ENVELOPE: SCHEMA_VERSION v{data[selectedIndex].schema_version ?? '1'}
              </Typography>
              <Box
                component="pre"
                sx={{
                  p: 2,
                  bgcolor: '#020617',
                  color: '#38bdf8',
                  fontFamily: 'monospace',
                  borderRadius: 1,
                  overflowX: 'auto',
                  fontSize: '0.8rem',
                  border: '1px solid #1e293b',
                }}
              >
                {JSON.stringify(data[selectedIndex].payload, null, 2)}
              </Box>
            </Box>
          ) : (
            <Typography variant="body2" sx={{ color: '#64748b', textAlign: 'center', mt: 4 }}>
              No extraction footprint packets parsed or indexed on host infrastructure.
            </Typography>
          )}
        </Paper>
      </Grid>
    </Grid>
  );
}
