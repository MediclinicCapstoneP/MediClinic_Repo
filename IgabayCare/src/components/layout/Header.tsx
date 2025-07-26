import React from 'react';
import { Bell, HelpCircle, Globe, Facebook, Instagram } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Header: React.FC = () => {
  return (
    <header className="bg-blue-600 text-white w-full text-sm shadow">
      <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center px-4 py-2 gap-y-2">
        
        {/* Left side: Logo + Links */}
        <div className="flex items-center gap-6">
          {/* Logo */}
          <Link to="/" className="text-white font-bold text-lg tracking-wide hover:opacity-90">
            <span className="text-white">Egabay</span><span className="text-yellow-300">Care</span>
          </Link>

          {/* Clinic Links + Social */}
          <div className="hidden md:flex items-center gap-3 text-white">
            <Link to="/clinic-register" className="hover:underline">Clinic Register</Link>
            <span>|</span>
            <Link to="/clinic-login" className="hover:underline">Clinic Login</Link>
            <span>|</span>
            <a href="#" className="hover:underline">Download</a>
            <span>|</span>
            <div className="flex items-center gap-1">
              <span>Follow us on</span>
              <a href="#" className="hover:text-gray-200"><Facebook size={16} /></a>
              <a href="#" className="hover:text-gray-200"><Instagram size={16} /></a>
            </div>
          </div>
        </div>

        {/* Right side: Notifications, Help, Lang, Auth */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <a href="#" className="flex items-center hover:text-gray-200">
            <Bell size={16} className="mr-1" /> Notifications
          </a>
          <a href="#" className="flex items-center hover:text-gray-200">
            <HelpCircle size={16} className="mr-1" /> Help
          </a>
          <a href="#" className="flex items-center hover:text-gray-200">
            <Globe size={16} className="mr-1" /> English
          </a>
          <Link to="/signup" className="font-semibold hover:underline">Sign Up</Link>
          <span className="hidden sm:inline">|</span>
          <Link to="/login" className="font-semibold hover:underline">Login</Link>
        </div>
      </div>
    </header>
  );
};
