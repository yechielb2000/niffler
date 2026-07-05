const API_BASE = import.meta.env.VITE_API_BASE ?? '';

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
  return request<{ status: string }>('/healthz');
}

export async function listAgents() {
  return request<{ agents: unknown[] }>('/admin/agents');
}

export async function getAgent(agentId: string) {
  return request<{ agent: unknown; tasks: unknown[]; workflows: unknown[]; data: unknown[] }>(`/admin/agents/${agentId}`);
}

export async function queueTask(agentId: string, payload: { module_name: string; code: string; sched_type?: string; sched_val?: string; duration_sec?: number; }) {
  const params = new URLSearchParams({
    module_name: payload.module_name,
    code: payload.code,
    sched_type: payload.sched_type ?? 'Immediate',
    sched_val: payload.sched_val ?? '0',
    duration_sec: String(payload.duration_sec ?? 0),
  });

  return request<{ task_id: string }>(`/admin/agents/${agentId}/task`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });
}

export async function updateConfig(agentId: string, jitter: number, beaconInterval: number) {
  const params = new URLSearchParams({ agent_id: agentId, jitter: String(jitter), beacon_interval: String(beaconInterval) });

  return request<{ status: string }>('/admin/reconfigure', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });
}

export async function killAgent(agentId: string) {
  return request<{ status: string }>(`/admin/agents/${agentId}/kill`, { method: 'POST' });
}
