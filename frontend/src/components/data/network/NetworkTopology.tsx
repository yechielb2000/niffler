import { Box, Chip, Paper, Stack, Typography } from '@mui/material';
import LanOutlinedIcon from '@mui/icons-material/LanOutlined';
import RouterOutlinedIcon from '@mui/icons-material/RouterOutlined';
import ComputerOutlinedIcon from '@mui/icons-material/ComputerOutlined';
import HubOutlinedIcon from '@mui/icons-material/HubOutlined';
import type { ReactNode } from 'react';

import type { NetworkInterface, NetworkNode, NetworkRoute } from './schema';
import { subnetFor } from './normalize';

export function NetworkTopology({
  hostname,
  interfaces,
  neighbors,
  routes,
  switchName,
}: {
  hostname?: string;
  interfaces: NetworkInterface[];
  neighbors: NetworkNode[];
  routes: NetworkRoute[];
  switchName?: string;
}) {
  const primary = interfaces.find((iface) =>
    iface.addresses.some((address) => !address.startsWith('127.') && !address.startsWith('::1')),
  );
  const primaryIp = primary?.addresses.find(
    (address) => !address.startsWith('127.') && !address.startsWith('::1'),
  );
  const subnet = primaryIp ? subnetFor(primaryIp) : undefined;
  const defaultGateway = routes.find(
    (route) =>
      route.destination === 'default' ||
      route.destination === '0.0.0.0/0' ||
      route.destination === '::/0',
  )?.gateway;
  const nodes = [...neighbors];
  if (defaultGateway && !nodes.some((node) => node.ip === defaultGateway))
    nodes.unshift({ ip: defaultGateway, kind: 'Gateway', state: 'From route table' });

  return (
    <Paper variant="outlined" sx={{ p: { xs: 1.5, md: 2 }, overflowX: 'auto' }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        spacing={1}
        sx={{ mb: 2 }}
      >
        <Box>
          <Typography variant="subtitle1" fontWeight={700}>
            Logical network map
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Links reflect collected addresses, routes, and neighbor records. A physical switch is
            shown only when reported.
          </Typography>
        </Box>
        <Chip size="small" variant="outlined" label={`${nodes.length} known adjacent nodes`} />
      </Stack>
      <Box
        sx={{
          minWidth: 700,
          display: 'grid',
          gridTemplateColumns:
            'minmax(180px, 1fr) 56px minmax(220px, 1.2fr) 56px minmax(200px, 1fr)',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <NodeCard
          icon={<ComputerOutlinedIcon color="primary" />}
          title={hostname || 'This system'}
          subtitle={primaryIp || 'Local address not reported'}
          detail={primary?.name ? `Interface ${primary.name}` : 'Network interface unavailable'}
        />
        <LinkLine />
        <NodeCard
          icon={
            switchName ? <HubOutlinedIcon color="secondary" /> : <LanOutlinedIcon color="info" />
          }
          title={switchName || subnet || 'LAN segment'}
          subtitle={switchName ? 'Reported network device' : 'Logical subnet'}
          detail={
            subnet
              ? `${subnet} · derived from interface CIDR`
              : 'Subnet not derivable from available addresses'
          }
        />
        <LinkLine />
        <Stack spacing={1}>
          {nodes.length ? (
            nodes
              .slice(0, 5)
              .map((node, index) => (
                <NodeCard
                  key={`${node.ip}-${index}`}
                  compact
                  icon={
                    node.kind?.toLowerCase().includes('gateway') ? (
                      <RouterOutlinedIcon color="warning" />
                    ) : (
                      <ComputerOutlinedIcon color="action" />
                    )
                  }
                  title={node.hostname || node.ip}
                  subtitle={node.hostname ? node.ip : node.kind || 'Neighbor'}
                  detail={
                    [node.mac, node.interface, node.state].filter(Boolean).join(' · ') ||
                    'Neighbor details not reported'
                  }
                />
              ))
          ) : (
            <Paper variant="outlined" sx={{ p: 1.5 }}>
              <Typography variant="body2" color="text.secondary">
                No adjacent nodes reported
              </Typography>
            </Paper>
          )}
          {nodes.length > 5 ? (
            <Typography variant="caption" color="text.secondary">
              and {nodes.length - 5} more neighbors
            </Typography>
          ) : null}
        </Stack>
      </Box>
    </Paper>
  );
}

function LinkLine() {
  return (
    <Box
      aria-hidden="true"
      sx={{
        height: 2,
        bgcolor: 'primary.main',
        opacity: 0.55,
        position: 'relative',
        '&:after': {
          content: '""',
          position: 'absolute',
          right: -1,
          top: -4,
          width: 0,
          height: 0,
          borderTop: '5px solid transparent',
          borderBottom: '5px solid transparent',
          borderLeft: '7px solid',
          borderLeftColor: 'primary.main',
        },
      }}
    />
  );
}

function NodeCard({
  icon,
  title,
  subtitle,
  detail,
  compact = false,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
  detail: string;
  compact?: boolean;
}) {
  return (
    <Paper
      variant="outlined"
      sx={{ p: compact ? 1 : 1.5, minWidth: 0, bgcolor: 'background.default' }}
    >
      <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
        {icon}
        <Box sx={{ minWidth: 0 }}>
          <Typography variant={compact ? 'body2' : 'subtitle2'} fontWeight={700} noWrap>
            {title}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            {subtitle}
          </Typography>
        </Box>
      </Stack>
      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }} noWrap>
        {detail}
      </Typography>
    </Paper>
  );
}
