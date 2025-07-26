import React from 'react';
import { Calendar, Users, Clock, DollarSign, TrendingUp, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../ui/Card';

export const ClinicHome: React.FC = () => {
  const stats = [
    {
      title: 'Today\'s Appointments',
      value: '12',
      change: '+3 from yesterday',
      icon: Calendar,
      color: 'bg-blue-500',
      trend: 'up'
    },
    {
      title: 'Total Patients',
      value: '1,247',
      change: '+15 this week',
      icon: Users,
      color: 'bg-green-500',
      trend: 'up'
    },
    {
      title: 'Average Wait Time',
      value: '18 min',
      change: '-5 min from last week',
      icon: Clock,
      color: 'bg-orange-500',
      trend: 'down'
    },
    {
      title: 'Revenue This Month',
      value: '$24,500',
      change: '+12% from last month',
      icon: DollarSign,
      color: 'bg-purple-500',
      trend: 'up'
    }
  ];

  const todayAppointments = [
    {
      id: 1,
      time: '09:00',
      patient: 'John Smith',
      type: 'Consultation',
      status: 'confirmed',
      doctor: 'Dr. Johnson'
    },
    {
      id: 2,
      time: '09:30',
      patient: 'Emily Davis',
      type: 'Follow-up',
      status: 'in-progress',
      doctor: 'Dr. Johnson'
    },
    {
      id: 3,
      time: '10:00',
      patient: 'Michael Chen',
      type: 'Check-up',
      status: 'waiting',
      doctor: 'Dr. Wilson'
    },
    {
      id: 4,
      time: '10:30',
      patient: 'Sarah Brown',
      type: 'Consultation',
      status: 'confirmed',
      doctor: 'Dr. Wilson'
    }
  ];

  const recentAlerts = [
    {
      id: 1,
      type: 'warning',
      message: 'Dr. Johnson is running 15 minutes behind schedule',
      time: '10 minutes ago'
    },
    {
      id: 2,
      type: 'info',
      message: 'New patient registration: Maria Rodriguez',
      time: '25 minutes ago'
    },
    {
      id: 3,
      type: 'success',
      message: 'Monthly report generated successfully',
      time: '1 hour ago'
    }
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Clinic Dashboard</h1>
        <p className="text-gray-600">Welcome back! Here's what's happening at your clinic today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} hover>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                    <div className="flex items-center mt-2">
                      <TrendingUp size={16} className={`mr-1 ${stat.trend === 'up' ? 'text-green-500' : 'text-red-500'}`} />
                      <p className={`text-sm ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                        {stat.change}
                      </p>
                    </div>
                  </div>
                  <div className={`p-3 ${stat.color} rounded-full`}>
                    <Icon className="text-white" size={24} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Schedule */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Today's Schedule</h3>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-4">
              {todayAppointments.map((appointment) => (
                <div key={appointment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="text-sm font-medium text-gray-900">
                      {appointment.time}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{appointment.patient}</p>
                      <p className="text-xs text-gray-600">{appointment.type} • {appointment.doctor}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    appointment.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                    appointment.status === 'in-progress' ? 'bg-green-100 text-green-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {appointment.status}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Alerts */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Recent Alerts</h3>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-4">
              {recentAlerts.map((alert) => (
                <div key={alert.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <AlertCircle size={16} className={`mt-0.5 ${
                    alert.type === 'warning' ? 'text-yellow-500' :
                    alert.type === 'success' ? 'text-green-500' :
                    'text-blue-500'
                  }`} />
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">{alert.message}</p>
                    <p className="text-xs text-gray-500 mt-1">{alert.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};