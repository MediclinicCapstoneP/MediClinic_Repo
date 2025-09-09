import React, { useState, useEffect } from "react";
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
  Loader2,
} from "lucide-react";

import { Card, CardContent } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { LatestReviews } from "../../components/dashboard/LatestReviews";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, Title } from "chart.js";
import { clinicDashboardService, type ClinicStats, type RecentActivity } from "../../features/auth/utils/clinicDashboardService";
import { roleBasedAuthService } from "../../features/auth/utils/roleBasedAuthService";
import { clinicService } from "../../features/auth/utils/clinicService";
ChartJS.register(ArcElement, Tooltip, Legend, Title);

interface ClinicHomeProps {
  onNavigate: (tab: string) => void;
}

export const ClinicHome: React.FC<ClinicHomeProps> = ({ onNavigate }) => {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ClinicStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [clinicId, setClinicId] = useState<string | null>(null);

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

  // Fetch clinic data and stats
  useEffect(() => {
    const fetchClinicData = async () => {
      try {
        setLoading(true);
        
        // Get current user and clinic ID
        const currentUser = await roleBasedAuthService.getCurrentUser();
        if (!currentUser || currentUser.role !== 'clinic') {
          return;
        }

        const clinicResult = await clinicService.getClinicByUserId(currentUser.user.id);
        if (clinicResult.success && clinicResult.clinic) {
          const clinicId = clinicResult.clinic.id;
          setClinicId(clinicId);

          // Fetch stats and recent activity
          const [statsResult, activityResult] = await Promise.all([
            clinicDashboardService.getClinicStats(clinicId),
            clinicDashboardService.getRecentActivity(clinicId, 5)
          ]);

          if (statsResult.success && statsResult.stats) {
            setStats(statsResult.stats);
          }

          if (activityResult.success && activityResult.activities) {
            setRecentActivity(activityResult.activities);
          }
        }
      } catch (error) {
        console.error('Error fetching clinic data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchClinicData();
  }, []);

  // Icon mapping for activity types
  const getActivityIcon = (iconName: string) => {
    const iconMap: { [key: string]: any } = {
      Calendar,
      UserCheck,
      Star,
      Users
    };
    return iconMap[iconName] || Calendar;
  };

  // Generate stats display data
  const statsDisplay = stats ? [
    {
      title: "Total Patients",
      value: stats.totalPatients.toString(),
      change: "+" + Math.floor(stats.totalPatients * 0.1),
      changeType: "positive",
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Today's Appointments",
      value: stats.todayAppointments.toString(),
      change: "Scheduled",
      changeType: "neutral",
      icon: Calendar,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Average Rating",
      value: stats.averageRating.toFixed(1),
      change: "+0.2",
      changeType: "positive",
      icon: Star,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
    },
    {
      title: "This Month Revenue",
      value: "₱" + stats.totalRevenue.toLocaleString(),
      change: "+" + Math.floor(stats.totalRevenue * 0.15),
      changeType: "positive",
      icon: DollarSign,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
  ] : [];

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading clinic dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statsDisplay.map((stat, index) => (
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
          {recentActivity.length > 0 ? (
            recentActivity.map((activity) => {
              const ActivityIcon = getActivityIcon(activity.icon);
              return (
                <Card
                  key={activity.id}
                  className="group cursor-pointer transform transition-all duration-300 hover:scale-102 hover:shadow-md border-l-4 border-l-transparent hover:border-l-secondary-500"
                >
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-4">
                      <div
                        className={`p-2 rounded-full ${activity.bgColor} group-hover:scale-110 transition-transform duration-300`}
                      >
                        <ActivityIcon className={`h-5 w-5 ${activity.color}`} />
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
              );
            })
          ) : (
            <Card>
              <CardContent className="p-6 text-center text-gray-500">
                <Activity className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No recent activity to display</p>
                <p className="text-sm">Activity will appear here as patients book appointments and interact with your clinic.</p>
              </CardContent>
            </Card>
          )}
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
