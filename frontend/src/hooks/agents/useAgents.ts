import { useCallback, useEffect, useMemo, useState } from 'react';

import { getAgent, listAgents } from '../../api';
import type { Agent, Task } from '../../api';
import type { CollectedRecord } from '../../components/data/types';

export function useAgents() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    listAgents()
      .then((agentsData) => {
        setAgents(agentsData.agents ?? []);
        setError('');
      })
      .catch(() => setError('Unable to fetch agents'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  const stats = useMemo(
    () => ({
      total: agents.length,
      active: agents.filter((agent) => agent.status === 'Active').length,
      inactive: agents.filter((agent) => agent.status !== 'Active').length,
    }),
    [agents],
  );

  return { agents, loading, error, stats };
}

export function useAgentDetails(agentId?: string) {
  const [agent, setAgent] = useState<Agent | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [data, setData] = useState<CollectedRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    if (!agentId) {
      setLoading(false);
      return;
    }
    getAgent(agentId)
      .then((data) => {
        setAgent(data.agent ?? null);
        setTasks(data.tasks ?? []);
        setData(
          data.data
            .flatMap((item) => (Array.isArray(item) ? item : [item]))
            .filter(isCollectedRecord),
        );
        setError('');
      })
      .catch(() => setError('Unable to load the agent details.'))
      .finally(() => setLoading(false));
  }, [agentId]);

  const refresh = useCallback(() => {
    setLoading(true);
    load();
  }, [load]);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  return { agent, tasks, data, loading, error, refresh };
}

function isCollectedRecord(value: unknown): value is CollectedRecord {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.id === 'number' && typeof record.data_type === 'string' && 'payload' in record
  );
}
