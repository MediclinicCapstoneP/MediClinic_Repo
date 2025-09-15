import React, { useState, useEffect } from 'react';
import { 
  BarChart3, TrendingUp, Users, Activity, Heart,
  Calendar, Clock, AlertTriangle, CheckCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/badge';

interface PatientAnalytics {
  totalPatients: number;
  newPatientsThisMonth: number;
  activePatients: number;
  averageAge: number;
  genderDistribution: {
    male: number;
    female: number;
    other: number;
  };
  conditionDistribution: {
    condition: string;
    count: number;
    percentage: number;
  }[];
  appointmentTrends: {
    month: string;
    appointments: number;
    completed: number;
    cancelled: number;
  }[];
  riskLevels: {
    high: number;
    medium: number;
    low: number;
  };
}

interface PatientAnalyticsChartProps {
  doctorId: string;
  className?: string;
}

export const PatientAnalyticsChart: React.FC<PatientAnalyticsChartProps> = ({
  doctorId,
  className = ''
}) => {
  const [analytics, setAnalytics] = useState<PatientAnalytics | null>(null);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [loading, setLoading] = useState(true);

  // Mock analytics data
  const mockAnalytics: PatientAnalytics = {
    totalPatients: 247,
    newPatientsThisMonth: 18,
    activePatients: 189,
    averageAge: 42,
    genderDistribution: {
      male: 112,
      female: 128,
      other: 7
    },
    conditionDistribution: [
      { condition: 'Hypertension', count: 45, percentage: 18.2 },
      { condition: 'Diabetes', count: 38, percentage: 15.4 },
      { condition: 'Asthma', count: 32, percentage: 13.0 },
      { condition: 'Heart Disease', count: 28, percentage: 11.3 },
      { condition: 'Arthritis', count: 24, percentage: 9.7 },
      { condition: 'Other', count: 80, percentage: 32.4 }
    ],
    appointmentTrends: [
      { month: 'Aug', appointments: 156, completed: 142, cancelled: 14 },
      { month: 'Sep', appointments: 168, completed: 155, cancelled: 13 },
      { month: 'Oct', appointments: 174, completed: 161, cancelled: 13 },
      { month: 'Nov', appointments: 182, completed: 169, cancelled: 13 },
      { month: 'Dec', appointments: 195, completed: 178, cancelled: 17 },
      { month: 'Jan', appointments: 203, completed: 185, cancelled: 18 }
    ],
    riskLevels: {
      high: 23,
      medium: 89,
      low: 135
    }
  };

  useEffect(() => {
    // Simulate loading analytics data
    const loadAnalytics = async () => {
      setLoading(true);
      // In a real app, this would fetch from the API
      setTimeout(() => {
        setAnalytics(mockAnalytics);
        setLoading(false);
      }, 1000);
    };

    loadAnalytics();
  }, [doctorId, timeRange]);

  const renderConditionChart = () => {
    if (!analytics) return null;

    const maxCount = Math.max(...analytics.conditionDistribution.map(c => c.count));

    return (
      <div className="space-y-3">
        {analytics.conditionDistribution.map((condition, index) => (
          <div key={condition.condition} className="flex items-center gap-3">
            <div className="w-20 text-sm text-gray-600 truncate">
              {condition.condition}
            </div>
            <div className="flex-1 bg-gray-200 rounded-full h-2 relative">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${(condition.count / maxCount) * 100}%` }}
              />
            </div>
            <div className="w-12 text-sm text-gray-900 font-medium">
              {condition.count}
            </div>
            <div className="w-12 text-xs text-gray-500">
              {condition.percentage}%
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderAppointmentTrends = () => {
    if (!analytics) return null;

    const maxAppointments = Math.max(...analytics.appointmentTrends.map(t => t.appointments));

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Month</span>
          <span>Appointments</span>
        </div>
        <div className="space-y-3">
          {analytics.appointmentTrends.map((trend, index) => (
            <div key={trend.month} className="flex items-center gap-3">
              <div className="w-8 text-sm text-gray-600">
                {trend.month}
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2 relative">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${(trend.completed / maxAppointments) * 100}%` }}
                    />
                    <div
                      className="bg-red-500 h-2 rounded-full absolute top-0"
                      style={{ 
                        left: `${(trend.completed / maxAppointments) * 100}%`,
                        width: `${(trend.cancelled / maxAppointments) * 100}%` 
                      }}
                    />
                  </div>
                  <div className="text-sm text-gray-900 font-medium w-8">
                    {trend.appointments}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span>Completed</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span>Cancelled</span>
          </div>
        </div>
      </div>
    );
  };

  const renderGenderDistribution = () => {
    if (!analytics) return null;

    const total = analytics.genderDistribution.male + analytics.genderDistribution.female + analytics.genderDistribution.other;

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-center">
          <div className="relative w-32 h-32">
            {/* Simple pie chart representation */}
            <div className="w-full h-full rounded-full bg-gray-200 relative overflow-hidden">
              <div 
                className="absolute inset-0 bg-blue-500"
                style={{
                  clipPath: `polygon(50% 50%, 50% 0%, ${50 + (analytics.genderDistribution.male / total) * 50}% 0%, 50% 50%)`
                }}
              />
              <div 
                className="absolute inset-0 bg-pink-500"
                style={{
                  clipPath: `polygon(50% 50%, ${50 + (analytics.genderDistribution.male / total) * 50}% 0%, 100% ${50 - (analytics.genderDistribution.female / total) * 50}%, 50% 50%)`
                }}
              />
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span className="text-sm">Male</span>
            </div>
            <span className="text-sm font-medium">{analytics.genderDistribution.male}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-pink-500 rounded"></div>
              <span className="text-sm">Female</span>
            </div>
            <span className="text-sm font-medium">{analytics.genderDistribution.female}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gray-400 rounded"></div>
              <span className="text-sm">Other</span>
            </div>
            <span className="text-sm font-medium">{analytics.genderDistribution.other}</span>
          </div>
        </div>
      </div>
    );
  };

  const renderRiskLevels = () => {
    if (!analytics) return null;

    const total = analytics.riskLevels.high + analytics.riskLevels.medium + analytics.riskLevels.low;

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-2">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <div className="text-2xl font-bold text-red-600">{analytics.riskLevels.high}</div>
            <div className="text-xs text-gray-500">High Risk</div>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 mx-auto bg-yellow-100 rounded-full flex items-center justify-center mb-2">
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
            <div className="text-2xl font-bold text-yellow-600">{analytics.riskLevels.medium}</div>
            <div className="text-xs text-gray-500">Medium Risk</div>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-2">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-green-600">{analytics.riskLevels.low}</div>
            <div className="text-xs text-gray-500">Low Risk</div>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">High Risk:</span>
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-red-500 h-2 rounded-full"
                style={{ width: `${(analytics.riskLevels.high / total) * 100}%` }}
              />
            </div>
            <span className="text-sm font-medium">{((analytics.riskLevels.high / total) * 100).toFixed(1)}%</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Medium:</span>
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-yellow-500 h-2 rounded-full"
                style={{ width: `${(analytics.riskLevels.medium / total) * 100}%` }}
              />
            </div>
            <span className="text-sm font-medium">{((analytics.riskLevels.medium / total) * 100).toFixed(1)}%</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Low Risk:</span>
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full"
                style={{ width: `${(analytics.riskLevels.low / total) * 100}%` }}
              />
            </div>
            <span className="text-sm font-medium">{((analytics.riskLevels.low / total) * 100).toFixed(1)}%</span>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${className}`}>
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                  <div className="h-3 bg-gray-200 rounded w-4/6"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!analytics) return null;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Patients</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.totalPatients}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">New This Month</p>
                <p className="text-2xl font-bold text-green-600">{analytics.newPatientsThisMonth}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Patients</p>
                <p className="text-2xl font-bold text-purple-600">{analytics.activePatients}</p>
              </div>
              <Activity className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Average Age</p>
                <p className="text-2xl font-bold text-orange-600">{analytics.averageAge}</p>
              </div>
              <Heart className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Condition Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Common Conditions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {renderConditionChart()}
          </CardContent>
        </Card>

        {/* Gender Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Gender Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {renderGenderDistribution()}
          </CardContent>
        </Card>

        {/* Appointment Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Appointment Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            {renderAppointmentTrends()}
          </CardContent>
        </Card>

        {/* Risk Levels */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Patient Risk Levels
            </CardTitle>
          </CardHeader>
          <CardContent>
            {renderRiskLevels()}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PatientAnalyticsChart;
