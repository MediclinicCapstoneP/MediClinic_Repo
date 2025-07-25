import React from 'react';
import { Search, MapPin, Calendar, History, MessageCircle, Heart } from 'lucide-react';
import { Card, CardContent } from '../ui/Card';

interface PatientHomeProps {
  onNavigate: (tab: string) => void;
}

export const PatientHome: React.FC<PatientHomeProps> = ({ onNavigate }) => {
  const quickActions = [
    {
      id: 'search',
      title: 'Search Clinics',
      description: 'Find clinics by name, location, or specialty',
      icon: Search,
      color: 'bg-blue-500',
    },
    {
      id: 'nearby',
      title: 'View Nearby Clinics',
      description: 'Discover healthcare providers in your area',
      icon: MapPin,
      color: 'bg-green-500',
    },
    {
      id: 'appointments',
      title: 'My Appointments',
      description: 'View and manage your upcoming appointments',
      icon: Calendar,
      color: 'bg-purple-500',
    },
    {
      id: 'history',
      title: 'Medical History',
      description: 'Access your consultation and treatment records',
      icon: History,
      color: 'bg-orange-500',
    },
    {
      id: 'chat',
      title: 'Ask iGabay AI',
      description: 'Get instant help from our AI assistant',
      icon: MessageCircle,
      color: 'bg-pink-500',
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to iGabayAtiCare</h1>
        <p className="text-gray-600">Your healthcare companion for easy clinic booking and medical management</p>
      </div>

      {/* Health Tips Card */}
      <Card className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-start space-x-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <Heart className="text-blue-600" size={24} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Health Tip of the Day</h3>
              <p className="text-gray-700">
                Regular health checkups can help detect potential health issues early. 
                Schedule your annual checkup today and stay on top of your health!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <div
              key={action.id}
              className="cursor-pointer hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1"
              onClick={() => onNavigate(action.id)}
            >
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 ${action.color} rounded-full`}>
                      <Icon className="text-white" size={24} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{action.title}</h3>
                      <p className="text-sm text-gray-600">{action.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>

      {/* Recent Activity */}
      <Card className="mt-8">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-4">
            <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Calendar size={16} className="text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Appointment booked</p>
                <p className="text-xs text-gray-600">City General Hospital - Dr. Smith - Tomorrow 2:00 PM</p>
              </div>
            </div>
            <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Heart size={16} className="text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Health record updated</p>
                <p className="text-xs text-gray-600">Annual checkup results added - 2 days ago</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};