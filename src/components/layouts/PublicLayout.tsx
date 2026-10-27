import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Header } from '../common/Header';
import { Footer } from '../common/Footer';
import { DemoRoleSwitcher } from '../common/DemoRoleSwitcher';

export const PublicLayout: React.FC = () => {
  const { pathname } = useLocation();
  const isLoginRoute = ['/login', '/warehouse-portal/login', '/admin-portal/login'].includes(pathname);

  if (isLoginRoute) {
    return (
      <div className="min-h-screen bg-slate-50">
        <main className="min-h-screen">
          <Outlet />
        </main>
        {import.meta.env.DEV && <DemoRoleSwitcher />}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      {import.meta.env.DEV && <DemoRoleSwitcher />}
    </div>
  );
};
