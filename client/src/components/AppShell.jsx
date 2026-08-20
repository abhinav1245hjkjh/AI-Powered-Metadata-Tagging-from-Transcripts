import React from 'react';
import TopNavbar from './TopNavbar';

const AppShell = ({ children }) => {
  return (
    <div className="min-h-screen bg-[#F6F7F9] flex flex-col text-[#172033] antialiased">
      <TopNavbar />

      <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {children}
      </main>
    </div>
  );
};

export default AppShell;
