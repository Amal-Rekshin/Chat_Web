import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Chat from './pages/Chat';
import AdminLayout from './admin/layouts/AdminLayout';
import AdminDashboard from './admin/pages/AdminDashboard';
import UserManagement from './admin/pages/UserManagement';
import GroupManagement from './admin/pages/GroupManagement';
import AnnouncementsManagement from './admin/pages/AnnouncementsManagement';
import { WebSocketProvider } from './context/WebSocketContext';

const PrivateRoute = ({ element }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? element : <Navigate to="/login" />;
};

const AdminRoute = ({ element }) => {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (user?.role !== 'ADMIN') return <Navigate to="/" />; // Redirect non-admins to chat
  return element;
};

const App = () => {
  return (
    <AuthProvider>
      <WebSocketProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* User Routes */}
            <Route path="/" element={<PrivateRoute element={<Chat />} />} />
            
            {/* Admin Routes */}
            <Route path="/admin" element={<AdminRoute element={<AdminLayout />} />}>
              <Route index element={<AdminDashboard />} />
              <Route path="users" element={<UserManagement />} />
              <Route path="groups" element={<GroupManagement />} />
              <Route path="announcements" element={<AnnouncementsManagement />} />
            </Route>
          </Routes>
        </Router>
      </WebSocketProvider>
    </AuthProvider>
  );
};
export default App;