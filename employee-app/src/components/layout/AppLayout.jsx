import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Header from './Header';
import BottomNavigation from '../navigation/BottomNavigation';

const AppLayout = () => {
  const navigate = useNavigate();

  return (
    <div className="app-shell">
      <div className="app-container">
        <Header />
        <main className="app-content">
          <Outlet />
        </main>
        <BottomNavigation />
      </div>
    </div>
  );
};

export default AppLayout;
