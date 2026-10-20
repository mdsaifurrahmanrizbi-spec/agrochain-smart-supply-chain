import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from '../common/Header';
import { Footer } from '../common/Footer';
import { DemoRoleSwitcher } from '../common/DemoRoleSwitcher';

export const PublicLayout: React.FC = () => {
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

