const API_BASE = import.meta.env.VITE_API_BASE ?? '';

export interface Agent {
  agent_id: string;
  hostname?: string | null;
  username?: string | null;
  distribution?: string | null;
  status?: string | null;
  jitter?: number | null;
  beacon_interval?: number | null;
}

export interface Task {
  task_id: string;
  module_name?: string | null;
  status?: string | null;
  schedule_type?: string | null;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(init.headers || {}) },
    ...init,
  });

  if (!res.ok) {
    const message = await res.text().catch(() => 'Request failed');
    throw new Error(message || 'Request failed');
  }

  return res.json() as Promise<T>;
}

export async function getHealth() {
  return request<{ status: string }>('/api/v1/health');
}

export async function listAgents() {
  return request<{ agents: Agent[] }>('/api/v1/agents');
}

export async function getAgent(agentId: string) {
  return request<{ agent: Agent | null; tasks: Task[]; data: unknown[] }>(
    `/api/v1/agents/${encodeURIComponent(agentId)}`,
  );
}

export interface PresetCommand {
  id: string;
  label: string;
  category: string;
  description: string;
}
export async function listCommands() {
  return request<{ commands: PresetCommand[] }>('/api/v1/commands');
}
export async function getConnection(agentId: string) {
  return request<{
    connected: boolean;
    saved: boolean;
    host?: string;
    port?: number;
    username?: string;
  }>(`/api/v1/agents/${encodeURIComponent(agentId)}/connection`);
}
export async function connectAgent(
  agentId: string,
  payload: { host: string; port: number; username: string; credential?: string },
) {
  return request<{ connected: boolean }>(`/api/v1/agents/${encodeURIComponent(agentId)}/connect`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
export async function disconnectAgent(agentId: string) {
  return request<{ connected: boolean }>(
    `/api/v1/agents/${encodeURIComponent(agentId)}/connection`,
    { method: 'DELETE' },
  );
}
export async function runPreset(agentId: string, preset_id: string) {
  return request<{ preset_id: string; result: unknown }>(
    `/api/v1/agents/${encodeURIComponent(agentId)}/commands`,
    { method: 'POST', body: JSON.stringify({ preset_id }) },
  );
}
