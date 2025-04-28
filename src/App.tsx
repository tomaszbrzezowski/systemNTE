import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuth, AuthProvider } from './context/AuthContext';
import LoginForm from './components/auth/LoginForm';
import EventsLayout from './components/layout/EventsLayout';
import EventsList from './components/events/EventsList';
import EventDetails from './components/events/EventDetails';
import Agreements from './components/events/Agreements';
import CreateAgreement from './components/events/CreateAgreement';
import Halls from './components/events/Halls';
import HallLayout from './components/events/HallLayout';
import HallLayoutPreview from './components/events/HallLayoutPreview';
import Clients from './components/events/Clients';
import { Navigate } from 'react-router-dom';
import CalendarApp from './components/calendar/CalendarApp';

// Create an inner App component that uses the useAuth hook
function InnerApp() {
  const { currentUser, isAuthenticated } = useAuth();
  
  const isAdmin = currentUser?.role === 'administrator';
  
  if (!isAuthenticated) {
    return <LoginForm />;
  }

  // Guard function for admin-only routes
  const guardAdminRoute = (element: JSX.Element) => {
    return isAdmin ? element : <Navigate to="/" replace />;
  };

  return (
    <Routes>
      <Route path="/" element={<CalendarApp />} />
      <Route path="/events" element={<EventsLayout />}>
        <Route index element={<EventsList />} />
        <Route path=":id" element={<EventDetails />} />
        <Route path="agreements" element={<Agreements />} />
        <Route path="agreements/create" element={<CreateAgreement />} />
        <Route path="halls" element={<Halls />} />
        <Route path="halls/:hallId(\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b)/layout" element={<HallLayout />} />
        <Route path="halls/:hallId(\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b)/preview" element={<HallLayoutPreview />} />
        <Route path="clients" element={<Clients />} />
      </Route>
    </Routes>
  );
}

// Main App component that provides the AuthProvider
function App() {
  return (
    <AuthProvider>
      <InnerApp />
    </AuthProvider>
  );
}

export default App;