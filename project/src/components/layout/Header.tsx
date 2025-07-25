import React from 'react';
import { Bell, HelpCircle, Globe, Facebook, Instagram } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Header: React.FC = () => {
  return (
    <header className="bg-blue-600 text-white w-full">
      <div className="max-w-7xl mx-auto flex justify-between items-center px-4 py-2 text-sm">
        {/* Left side */}
        <div className="flex items-center space-x-4">
          <Link to="/clinic-register" className="hover:underline">Clinic Register</Link>
          <span className="mx-1">|</span>
          <Link to="/clinic-login" className="hover:underline">Clinic Login</Link>
          <span className="mx-1">|</span>
          <a href="#" className="hover:underline">Download</a>
          <span className="mx-1">|</span>
          <span>Follow us on</span>
          <a href="#" className="ml-1"><Facebook size={16} /></a>
          <a href="#" className="ml-1"><Instagram size={16} /></a>
        </div>
        {/* Right side */}
        <div className="flex items-center space-x-4">
          <a href="#" className="flex items-center"><Bell size={16} className="mr-1" />Notifications</a>
          <a href="#" className="flex items-center"><HelpCircle size={16} className="mr-1" />Help</a>
          <a href="#" className="flex items-center"><Globe size={16} className="mr-1" />English</a>
          <Link to="/signup" className="font-semibold hover:underline">Sign Up</Link>
          <span className="mx-1">|</span>
          <Link to="/login" className="font-semibold hover:underline">Login</Link>
        </div>
      </div>
    </header>
  );
};