import React, { useState } from "react";
import {
  Users,
  Calendar,
  TrendingUp,
  Activity,
  Clock,
  Star,
  Building,
  Phone,
  Mail,
  MapPin,
  Settings,
  Bell,
  Award,
  Shield,
  DollarSign,
  UserCheck,
  Eye,
  MoreHorizontal,
} from "lucide-react";

import { Card, CardContent } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { LatestReviews } from "../../components/dashboard/LatestReviews";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, Title } from "chart.js";
ChartJS.register(ArcElement, Tooltip, Legend, Title);

interface ClinicHomeProps {
  onNavigate: (tab: string) => void;
}

export const ClinicHome: React.FC<ClinicHomeProps> = ({ onNavigate }) => {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const quickActions = [
    {
      id: "appointments",
      title: "Manage Appointments",
      description: "View and schedule patient appointments",
      icon: Calendar,
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50",
      iconColor: "text-blue-600",
      action: () => onNavigate("appointments"),
    },
    {
      id: "doctors",
      title: "Manage Doctors",
      description: "Manage your clinic's doctors and medical staff",
      icon: Users,
      color: "from-green-500 to-green-600",
      bgColor: "bg-green-50",
      iconColor: "text-green-600",
      action: () => onNavigate("doctors"),
    },
    {
      id: "patients",
      title: "Registered Patients",
      description: "View and manage registered patient records",
      icon: Users,
      color: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-50",
      iconColor: "text-purple-600",
      action: () => onNavigate("patients"),
    },
  ];

  const recentActivity = [
    {
      id: 1,
      type: "appointment",
      title: "New Appointment",
      description: "John Doe - General Checkup",
      time: "30 minutes ago",
      icon: Calendar,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      id: 2,
      type: "patient",
      title: "Patient Registered",
      description: "Jane Smith - New patient profile created",
      time: "2 hours ago",
      icon: UserCheck,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      id: 3,
      type: "review",
      title: "New Review",
      description: "5-star rating from patient visit",
      time: "1 day ago",
      icon: Star,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
    },
  ];

  const stats = [
    {
      title: "Total Patients",
      value: "1,247",
      change: "+12",
      changeType: "positive",
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Today's Appointments",
      value: "23",
      change: "Scheduled",
      changeType: "neutral",
      icon: Calendar,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Average Rating",
      value: "4.8",
      change: "+0.2",
      changeType: "positive",
      icon: Star,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div
            key={stat.title}
            className={`transform transition-all duration-300 hover:scale-105 hover:shadow-lg cursor-pointer ${
              hoveredCard === stat.title ? "ring-2 ring-secondary-200" : ""
            }`}
            onMouseEnter={() => setHoveredCard(stat.title)}
            onMouseLeave={() => setHoveredCard(null)}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stat.value}
                    </p>
                    <p
                      className={`text-xs font-medium ${
                        stat.changeType === "positive"
                          ? "text-green-600"
                          : stat.changeType === "negative"
                            ? "text-red-600"
                            : "text-gray-500"
                      }`}
                    >
                      {stat.change}
                    </p>
                  </div>
                  <div className={`p-3 rounded-full ${stat.bgColor}`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>

      {/* Latest Reviews with Pie Chart */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Latest Reviews</h2>
          <Button
            variant="outline"
            onClick={() => onNavigate("settings")}
            className="text-secondary-600 border-secondary-200 hover:bg-secondary-50"
          >
            View All
          </Button>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Reviews Table */}
          <div className="w-full lg:w-2/3">
            <LatestReviews />
          </div>

          {/* Pie Chart */}
          {/* Pie Chart */}
          <div className="w-full lg:w-1/3 bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Review Sentiment
            </h3>

            <div
              style={{ position: "relative", height: "250px", width: "100%" }}
            >
              <Pie
                data={{
                  labels: ["Positive", "Negative", "Neutral"],
                  datasets: [
                    {
                      label: "Sentiment",
                      data: [10, 5, 2],
                      backgroundColor: [
                        "rgba(34, 197, 94, 0.5)", // Green
                        "rgba(239, 68, 68, 0.5)", // Red
                        "rgba(234, 179, 8, 0.5)", // Yellow
                      ],
                      borderColor: [
                        "rgba(34, 197, 94, 1)",
                        "rgba(239, 68, 68, 1)",
                        "rgba(234, 179, 8, 1)",
                      ],
                      borderWidth: 1,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: "bottom",
                    },
                    title: {
                      display: false,
                    },
                  },
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Recent Activity
        </h2>
        <div className="space-y-4">
          {recentActivity.map((activity) => (
            <Card
              key={activity.id}
              className="group cursor-pointer transform transition-all duration-300 hover:scale-102 hover:shadow-md border-l-4 border-l-transparent hover:border-l-secondary-500"
            >
              <CardContent className="p-4">
                <div className="flex items-center space-x-4">
                  <div
                    className={`p-2 rounded-full ${activity.bgColor} group-hover:scale-110 transition-transform duration-300`}
                  >
                    <activity.icon className={`h-5 w-5 ${activity.color}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 group-hover:text-secondary-600 transition-colors">
                      {activity.title}
                    </h3>
                    <p className="text-gray-600 text-sm">
                      {activity.description}
                    </p>
                  </div>
                  <div className="text-xs text-gray-500 group-hover:text-gray-700 transition-colors">
                    {activity.time}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Clinic Performance Promo */}
      <div className="mt-8">
        <Card className="bg-gradient-to-r from-secondary-50 to-blue-50 border-secondary-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-gradient-to-r from-secondary-500 to-blue-500 rounded-full">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Boost Your Clinic Performance
                  </h3>
                  <p className="text-gray-600">
                    Access detailed analytics and insights to improve patient
                    care
                  </p>
                </div>
              </div>
              <Button
                variant="gradient"
                onClick={() => onNavigate("settings")}
                className="bg-gradient-to-r from-secondary-500 to-blue-500 hover:from-secondary-600 hover:to-blue-600"
              >
                Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
