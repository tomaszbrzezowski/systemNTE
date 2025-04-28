import React from 'react';
import { Outlet } from 'react-router-dom';
import TopBar from './TopBar';

const EventsLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <TopBar />
      <main className="flex justify-center min-h-[calc(100vh-64px)] p-6">
          <Outlet />
      </main>
    </div>
  );
};

export default EventsLayout;