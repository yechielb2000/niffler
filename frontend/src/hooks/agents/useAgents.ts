import { useEffect, useMemo, useState } from 'react';

import { getAgent, getHealth, listAgents } from '../../api';

export function useAgents() {
  const [agents, setAgents] = useState<any[]>([]);
  const [health, setHealth] = useState('unknown');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = () => {
    setLoading(true);
    Promise.all([listAgents(), getHealth()])
      .then(([agentsData, healthData]) => {
        setAgents(agentsData.agents ?? []);
        setHealth(healthData.status ?? 'ok');
        setError('');
      })
      .catch(() => setError('Unable to fetch agents or health status'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    refresh();
  }, []);

  const stats = useMemo(() => ({
    total: agents.length,
    active: agents.filter((agent) => agent.status === 'Active').length,
    inactive: agents.filter((agent) => agent.status !== 'Active').length,
  }), [agents]);

  return { agents, health, loading, error, stats, refresh };
}

export function useAgentDetails(agentId?: string) {
  const [agent, setAgent] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = () => {
    if (!agentId) return;
    setLoading(true);
    getAgent(agentId)
      .then((data: { agent?: any; tasks?: any[]; workflows?: any[]; data?: any[] }) => {
        setAgent(data.agent ?? null);
        setTasks(data.tasks ?? []);
        setWorkflows(data.workflows ?? []);
        setData(data.data ?? []);
        setError('');
      })
      .catch(() => setError('Unable to load the agent details.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    refresh();
  }, [agentId]);

  return { agent, tasks, workflows, data, loading, error, refresh };
}
