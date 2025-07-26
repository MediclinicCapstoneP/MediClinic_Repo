import React, { useState } from 'react';
import { Navigation } from '../layout/Navigation';
import { Header } from '../layout/Header';
import { PatientHome } from './PatientHome';
import { SearchClinics } from './SearchClinics';
import { NearbyClinic } from './NearbyClinic';
import { PatientAppointments } from './PatientAppointments';
import { PatientHistory } from './PatientHistory';
import { PatientProfile } from './PatientProfile';
import { ChatBot } from './ChatBot';

export const PatientDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('home');

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <PatientHome onNavigate={setActiveTab} />;
      case 'search':
        return <SearchClinics />;
      case 'nearby':
        return <NearbyClinic />;
      case 'appointments':
        return <PatientAppointments />;
      case 'history':
        return <PatientHistory />;
      case 'profile':
        return <PatientProfile />;
      case 'chat':
        return <ChatBot />;
      default:
        return <PatientHome onNavigate={setActiveTab} />;
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