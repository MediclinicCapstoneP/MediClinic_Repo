import React, { useState } from 'react';
import { Navigation } from '../../components/layout/Navigation';
import { Header } from '../../components/layout/Header';
import { ClinicHome } from '../../pages/clinic/ClinicHome';
import { ClinicAppointments } from '../../components/clinic/ClinicAppointments';
import { ClinicDoctors } from '../../components/clinic/ClinicDoctors';
import { ClinicPatients } from '../../components/clinic/ClinicPatients';
import { ClinicSettings } from '../../pages/clinic/ClinicSettings';

export const ClinicDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <ClinicHome />;
      case 'appointments':
        return <ClinicAppointments />;
      case 'doctors':
        return <ClinicDoctors />;
      case 'patients':
        return <ClinicPatients />;
      case 'settings':
        return <ClinicSettings />;
      default:
        return <ClinicHome />;
    }
  };

  return (
    <div className="h-screen flex flex-col">
      <Header />
      <div className="flex-1 flex overflow-hidden">
        <div className="w-64 hidden md:block">
          <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
        <main className="flex-1 overflow-y-auto bg-gray-50">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};