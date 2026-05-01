import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import MeetingRoomPage from './pages/MeetingRoomPage';
import ProtectedRoute from './components/ProtectedRoute';
import '../src/App.css';
import PostMeetingSummaryPage from './pages/PostMeetingSummaryPage';
import AuthSuccess from './pages/AuthSuccess';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/meeting/:id" element={<ProtectedRoute><MeetingRoomPage /></ProtectedRoute>} />
        <Route path="/meeting/:id/summary" element={<ProtectedRoute><PostMeetingSummaryPage /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/login" replace />} />
        <Route path="/auth/success" element={<AuthSuccess />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;