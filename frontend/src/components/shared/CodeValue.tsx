import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined';
import { IconButton, Stack, Tooltip, Typography } from '@mui/material';
import { useState } from 'react';

export function CodeValue({
  value,
  maxWidth = 240,
}: {
  value: string;
  maxWidth?: number | string;
}) {
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle');

  const copyValue = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopyState('copied');
    } catch {
      setCopyState('failed');
    }

    window.setTimeout(() => setCopyState('idle'), 1600);
  };

  return (
    <Stack direction="row" spacing={0.25} alignItems="center" sx={{ minWidth: 0 }}>
      <Tooltip title={value} enterDelay={500}>
        <Typography variant="technical" noWrap sx={{ maxWidth, minWidth: 0 }}>
          {value}
        </Typography>
      </Tooltip>
      <Tooltip
        title={
          copyState === 'copied' ? 'Copied' : copyState === 'failed' ? 'Copy failed' : 'Copy value'
        }
      >
        <IconButton
          size="small"
          onClick={copyValue}
          aria-label="Copy value"
          sx={{ flexShrink: 0, p: 0.5 }}
        >
          <ContentCopyOutlinedIcon sx={{ fontSize: 14 }} />
        </IconButton>
      </Tooltip>
    </Stack>
  );
}
