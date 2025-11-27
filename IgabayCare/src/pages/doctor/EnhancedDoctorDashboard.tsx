import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, Users, Activity, Pill, FileText, Bell, Settings,
  ChevronRight, Plus, Search, MoreVertical, User,
  Star, DollarSign, ArrowUp
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/badge';
import { Avatar } from '../../components/ui/Avatar';
import { roleBasedAuthService } from '../../features/auth/utils/roleBasedAuthService';
import { doctorDashboardService } from '../../features/auth/utils/doctorDashboardService';
import { DoctorProfile } from '../../features/auth/utils/doctorService';
import { EnhancedNotificationService } from '../../services/enhancedNotificationService';

interface DashboardStats {
  totalPatients: number;
  todayAppointments: number;
  weeklyAppointments: number;
  monthlyRevenue: number;
  completedAppointments: number;
  pendingAppointments: number;
  cancelledAppointments: number;
  averageRating: number;
  totalPrescriptions: number;
  activePatients: number;
}

interface RecentActivity {
  id: string;
  type: 'appointment' | 'prescription' | 'patient' | 'review';
  title: string;
  description: string;
  time: string;
  status?: 'completed' | 'pending' | 'cancelled';
  priority?: 'high' | 'medium' | 'low';
}

interface UpcomingAppointment {
  id: string;
  patientName: string;
  patientAvatar?: string;
  time: string;
  type: string;
  status: 'scheduled' | 'confirmed' | 'in-progress';
  duration: number;
  notes?: string;
}

interface PatientOverview {
  id: string;
  name: string;
  avatar?: string;
  lastVisit: string;
  nextAppointment?: string;
  condition: string;
  status: 'stable' | 'improving' | 'needs-attention';
  riskLevel: 'low' | 'medium' | 'high';
}

export const EnhancedDoctorDashboard: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [doctorProfile, setDoctorProfile] = useState<DoctorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalPatients: 0,
    todayAppointments: 0,
    weeklyAppointments: 0,
    monthlyRevenue: 0,
    completedAppointments: 0,
    pendingAppointments: 0,
    cancelledAppointments: 0,
    averageRating: 0,
    totalPrescriptions: 0,
    activePatients: 0
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState<UpcomingAppointment[]>([]);
  const [patientOverview, setPatientOverview] = useState<PatientOverview[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'today' | 'week' | 'month' | 'year'>('week');
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        setLoading(true);
        const user = await roleBasedAuthService.getCurrentUser();
        if (!user || user.role !== 'doctor') {
          await roleBasedAuthService.signOut();
          navigate('/doctor-signin');
          return;
        }
        setCurrentUser(user);
        await loadDashboardData(user.user.id);
      } catch (error) {
        console.error('Auth check error:', error);
        await roleBasedAuthService.signOut();
        navigate('/doctor-signin');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

  const loadDashboardData = async (userId: string) => {
    try {
      // Get doctor profile
      const doctorResult = await doctorDashboardService.getDoctorByUserId(userId);
      if (doctorResult.success && doctorResult.doctor) {
        const doctor = doctorResult.doctor;
        setDoctorProfile(doctor);

        // Load dashboard statistics
        await loadDashboardStats(doctor.id);
        
        // Load recent activity
        await loadRecentActivity(doctor.id);
        
        // Load upcoming appointments
        await loadUpcomingAppointments(doctor.id);
        
        // Load patient overview
        await loadPatientOverview(doctor.id);
        
        // Load notifications
        await loadNotifications(doctor.id);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  const loadDashboardStats = async (doctorId: string) => {
    try {
      const statsResult = await doctorDashboardService.getDoctorStats(doctorId);
      if (statsResult.success && statsResult.stats) {
        const stats = statsResult.stats;
        setDashboardStats({
          totalPatients: stats.total_patients || 0,
          todayAppointments: stats.today_appointments || 0,
          weeklyAppointments: stats.weekly_appointments || 0,
          monthlyRevenue: stats.monthly_revenue || 0,
          completedAppointments: stats.completed_appointments || 0,
          pendingAppointments: stats.pending_appointments || 0,
          cancelledAppointments: stats.cancelled_appointments || 0,
          averageRating: stats.average_rating || 0,
          totalPrescriptions: stats.total_prescriptions || 0,
          activePatients: stats.active_patients || 0
        });
      }
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    }
  };

  const loadRecentActivity = async (doctorId: string) => {
    try {
      const activityResult = await doctorDashboardService.getDoctorActivity(doctorId, 10);
      if (activityResult.success && activityResult.activities) {
        const activities: RecentActivity[] = activityResult.activities.map((activity: any) => ({
          id: activity.id,
          type: activity.type || 'appointment',
          title: activity.title || activity.description,
          description: activity.description,
          time: activity.created_at || activity.timestamp,
          status: activity.status,
          priority: activity.priority || 'medium'
        }));
        setRecentActivity(activities);
      }
    } catch (error) {
      console.error('Error loading recent activity:', error);
    }
  };

  const loadUpcomingAppointments = async (doctorId: string) => {
    try {
      // Mock data for now - replace with actual service call
      const mockAppointments: UpcomingAppointment[] = [
        {
          id: '1',
          patientName: 'Sarah Johnson',
          time: '09:00 AM',
          type: 'General Checkup',
          status: 'confirmed',
          duration: 30,
          notes: 'Follow-up for blood pressure'
        },
        {
          id: '2',
          patientName: 'Michael Chen',
          time: '10:30 AM',
          type: 'Consultation',
          status: 'scheduled',
          duration: 45,
          notes: 'New patient consultation'
        },
        {
          id: '3',
          patientName: 'Emily Davis',
          time: '02:00 PM',
          type: 'Follow-up',
          status: 'confirmed',
          duration: 20,
          notes: 'Prescription review'
        }
      ];
      setUpcomingAppointments(mockAppointments);
    } catch (error) {
      console.error('Error loading upcoming appointments:', error);
    }
  };

  const loadPatientOverview = async (doctorId: string) => {
    try {
      // Mock data for now - replace with actual service call
      const mockPatients: PatientOverview[] = [
        {
          id: '1',
          name: 'Sarah Johnson',
          lastVisit: '2024-01-10',
          nextAppointment: '2024-01-15',
          condition: 'Hypertension',
          status: 'stable',
          riskLevel: 'low'
        },
        {
          id: '2',
          name: 'Michael Chen',
          lastVisit: '2024-01-08',
          condition: 'Diabetes Type 2',
          status: 'improving',
          riskLevel: 'medium'
        },
        {
          id: '3',
          name: 'Emily Davis',
          lastVisit: '2024-01-05',
          nextAppointment: '2024-01-20',
          condition: 'Asthma',
          status: 'needs-attention',
          riskLevel: 'high'
        }
      ];
      setPatientOverview(mockPatients);
    } catch (error) {
      console.error('Error loading patient overview:', error);
    }
  };

  const loadNotifications = async (doctorId: string) => {
    try {
      const notificationsResult = await enhancedNotificationService.getNotifications({
        userId: doctorId,
        limit: 5,
        filters: { read: false }
      });
      if (notificationsResult.success && notificationsResult.notifications) {
        setNotifications(notificationsResult.notifications);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'stable': return 'text-green-600 bg-green-100';
      case 'improving': return 'text-blue-600 bg-blue-100';
      case 'needs-attention': return 'text-red-600 bg-red-100';
      case 'confirmed': return 'text-green-600 bg-green-100';
      case 'scheduled': return 'text-blue-600 bg-blue-100';
      case 'in-progress': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'appointment': return <Calendar className="h-4 w-4" />;
      case 'prescription': return <Pill className="h-4 w-4" />;
      case 'patient': return <User className="h-4 w-4" />;
      case 'review': return <Star className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <div className="w-full h-full bg-blue-600 rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-white" />
                  </div>
                </Avatar>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">
                    Dr. {doctorProfile?.first_name} {doctorProfile?.last_name}
                  </h1>
                  <p className="text-sm text-gray-500">{doctorProfile?.specialization}</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search patients, appointments..."
                  className="pl-10 w-64"
                />
              </div>
              
              <Button variant="outline" size="sm">
                <Bell className="h-4 w-4 mr-2" />
                {notifications.length > 0 && (
                  <Badge variant="destructive" className="ml-1 px-1 min-w-[1.25rem] h-5">
                    {notifications.length}
                  </Badge>
                )}
              </Button>
              
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Good morning, Dr. {doctorProfile?.first_name}
          </h2>
          <p className="text-gray-600">
            You have {dashboardStats.todayAppointments} appointments today and {dashboardStats.pendingAppointments} pending tasks.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Today's Appointments</p>
                  <p className="text-3xl font-bold text-gray-900">{dashboardStats.todayAppointments}</p>
                  <p className="text-sm text-green-600 flex items-center mt-1">
                    <ArrowUp className="h-3 w-3 mr-1" />
                    +12% from yesterday
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Patients</p>
                  <p className="text-3xl font-bold text-gray-900">{dashboardStats.totalPatients}</p>
                  <p className="text-sm text-green-600 flex items-center mt-1">
                    <ArrowUp className="h-3 w-3 mr-1" />
                    +8% this month
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
                  <p className="text-3xl font-bold text-gray-900">₱{dashboardStats.monthlyRevenue.toLocaleString()}</p>
                  <p className="text-sm text-green-600 flex items-center mt-1">
                    <ArrowUp className="h-3 w-3 mr-1" />
                    +15% from last month
                  </p>
                </div>
                <div className="p-3 bg-yellow-100 rounded-full">
                  <DollarSign className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Patient Rating</p>
                  <p className="text-3xl font-bold text-gray-900">{dashboardStats.averageRating.toFixed(1)}</p>
                  <div className="flex items-center mt-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-3 w-3 ${
                          i < Math.floor(dashboardStats.averageRating)
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                    <span className="text-sm text-gray-500 ml-1">({dashboardStats.totalPatients} reviews)</span>
                  </div>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <Star className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Today's Schedule */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-semibold">Today's Schedule</CardTitle>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Appointment
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {upcomingAppointments.map((appointment) => (
                    <div key={appointment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <p className="text-sm font-medium text-gray-900">{appointment.time}</p>
                          <p className="text-xs text-gray-500">{appointment.duration}min</p>
                        </div>
                        <div className="w-px h-12 bg-gray-300"></div>
                        <div>
                          <p className="font-medium text-gray-900">{appointment.patientName}</p>
                          <p className="text-sm text-gray-600">{appointment.type}</p>
                          {appointment.notes && (
                            <p className="text-xs text-gray-500 mt-1">{appointment.notes}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(appointment.status)}>
                          {appointment.status}
                        </Badge>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Patient Overview */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-semibold">Patient Overview</CardTitle>
                <Button variant="outline" size="sm">
                  View All
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {patientOverview.map((patient) => (
                    <div key={patient.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-10 w-10">
                          <div className="w-full h-full bg-gray-300 rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-gray-600" />
                          </div>
                        </Avatar>
                        <div>
                          <p className="font-medium text-gray-900">{patient.name}</p>
                          <p className="text-sm text-gray-600">{patient.condition}</p>
                          <p className="text-xs text-gray-500">Last visit: {patient.lastVisit}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(patient.status)}>
                          {patient.status.replace('-', ' ')}
                        </Badge>
                        <div className={`w-2 h-2 rounded-full ${getRiskLevelColor(patient.riskLevel)}`}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                    <Plus className="h-5 w-5 mb-1" />
                    <span className="text-xs">New Patient</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                    <Calendar className="h-5 w-5 mb-1" />
                    <span className="text-xs">Schedule</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                    <Pill className="h-5 w-5 mb-1" />
                    <span className="text-xs">Prescription</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                    <FileText className="h-5 w-5 mb-1" />
                    <span className="text-xs">Reports</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.slice(0, 5).map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3">
                      <div className="p-2 bg-gray-100 rounded-full">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                        <p className="text-xs text-gray-600">{activity.description}</p>
                        <p className="text-xs text-gray-500">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Notifications */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-semibold">Notifications</CardTitle>
                <Badge variant="secondary">{notifications.length}</Badge>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {notifications.slice(0, 3).map((notification) => (
                    <div key={notification.id} className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm font-medium text-blue-900">{notification.title}</p>
                      <p className="text-xs text-blue-700">{notification.message}</p>
                    </div>
                  ))}
                  {notifications.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">No new notifications</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedDoctorDashboard;
