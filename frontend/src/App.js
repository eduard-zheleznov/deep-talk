import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from './contexts/AuthContext';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import GroupsPage from './pages/GroupsPage';
import GroupDetailPage from './pages/GroupDetailPage';
import JoinGroupPage from './pages/JoinGroupPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import MyQuestionsPage from './pages/MyQuestionsPage';
import NewConversationPage from './pages/NewConversationPage';

import './App.css';

const ConnectionStatus = () => {
  const [online, setOnline] = useState(() => navigator.onLine);

  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  if (online) return null;
  return (
    <div role="status" className="fixed inset-x-4 bottom-[calc(5.25rem+env(safe-area-inset-bottom))] z-50 mx-auto max-w-md rounded-xl bg-foreground px-4 py-3 text-center text-sm font-medium text-background shadow-lg">
      Нет интернета — доступен просмотр сохранённых данных
    </div>
  );
};

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const from = `${location.pathname}${location.search}`;
  return user ? children : <Navigate to="/login" replace state={{ from }} />;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return user ? <Navigate to={location.state?.from || '/groups'} replace /> : children;
};

function AppRoutes() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [location.pathname]);

  return (
    <Routes>
      <Route path="/login" element={
        <PublicRoute>
          <LoginPage />
        </PublicRoute>
      } />
      <Route path="/register" element={
        <PublicRoute>
          <RegisterPage />
        </PublicRoute>
      } />

      <Route path="/groups" element={
        <ProtectedRoute>
          <GroupsPage />
        </ProtectedRoute>
      } />
      <Route path="/new-conversation" element={
        <ProtectedRoute>
          <NewConversationPage />
        </ProtectedRoute>
      } />
      <Route path="/group/:groupId" element={
        <ProtectedRoute>
          <GroupDetailPage />
        </ProtectedRoute>
      } />
      <Route path="/join/:inviteCode" element={
        <ProtectedRoute>
          <JoinGroupPage />
        </ProtectedRoute>
      } />
      <Route path="/profile" element={
        <ProtectedRoute>
          <ProfilePage />
        </ProtectedRoute>
      } />
      <Route path="/settings" element={
        <ProtectedRoute>
          <SettingsPage />
        </ProtectedRoute>
      } />
      <Route path="/settings/questions" element={
        <ProtectedRoute>
          <MyQuestionsPage />
        </ProtectedRoute>
      } />

      <Route path="/" element={<Navigate to="/groups" replace />} />
      <Route path="*" element={<Navigate to="/groups" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter basename={process.env.PUBLIC_URL || ''}>
      <AuthProvider>
        <AppRoutes />
        <ConnectionStatus />
        <Toaster position="top-center" richColors />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
