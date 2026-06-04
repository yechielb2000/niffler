import { Route, Routes } from 'react-router-dom';

import { AgentDetailPage } from './pages/agents/AgentDetailPage';
import { AgentListPage } from './pages/agents/AgentListPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<AgentListPage />} />
      <Route path="/agents/:agentId" element={<AgentDetailPage />} />
    </Routes>
  );
}
