import { Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from './layouts/DashboardLayout';
import { DashboardPage } from './pages/DashboardPage';
import { PromptsPage } from './pages/PromptsPage';
import { PromptDetailPage } from './pages/PromptDetailPage';
import { SessionsPage } from './pages/SessionsPage';
import { SessionDetailPage } from './pages/SessionDetailPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { ProjectDetailPage } from './pages/ProjectDetailPage';
import { TemplatesPage } from './pages/TemplatesPage';
import { PacksPage } from './pages/PacksPage';
import { OutcomesPage } from './pages/OutcomesPage';
import { SourcesPage } from './pages/SourcesPage';
import { SettingsPage } from './pages/SettingsPage';
import { StandardsPage } from './pages/StandardsPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<DashboardLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="prompts" element={<PromptsPage />} />
        <Route path="prompts/:id" element={<PromptDetailPage />} />
        <Route path="sessions" element={<SessionsPage />} />
        <Route path="sessions/:id" element={<SessionDetailPage />} />
        <Route path="projects" element={<ProjectsPage />} />
        <Route path="projects/:id" element={<ProjectDetailPage />} />
        <Route path="outcomes" element={<OutcomesPage />} />
        <Route path="templates" element={<TemplatesPage />} />
        <Route path="packs" element={<PacksPage />} />
        <Route path="standards" element={<StandardsPage />} />
        <Route path="sources" element={<SourcesPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  );
}
