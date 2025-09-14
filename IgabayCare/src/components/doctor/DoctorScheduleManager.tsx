import React, { useState, useEffect } from 'react';
import { Calendar, Clock, X, Save, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { doctorScheduleService, DoctorSchedule, DaySchedule } from '../../features/auth/utils/doctorScheduleService';

interface DoctorScheduleManagerProps {
  doctorId: string;
}

const DAYS_OF_WEEK = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
];

export const DoctorScheduleManager: React.FC<DoctorScheduleManagerProps> = ({ doctorId }) => {
  const [weeklySchedule, setWeeklySchedule] = useState<DoctorSchedule[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [daySchedule, setDaySchedule] = useState<DaySchedule | null>(null);
  const [blockedDates, setBlockedDates] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'weekly' | 'daily' | 'blocked'>('weekly');

  // Load initial data
  useEffect(() => {
    loadScheduleData();
  }, [doctorId]);

  const loadScheduleData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Load weekly schedule
      const weeklyResult = await doctorScheduleService.getDoctorSchedule(doctorId);
      if (weeklyResult.success && weeklyResult.schedule) {
        setWeeklySchedule(weeklyResult.schedule);
      }

      // Load day schedule for selected date
      const dayResult = await doctorScheduleService.getAvailableTimeSlots(doctorId, selectedDate);
      if (dayResult.success && dayResult.timeSlots) {
        setDaySchedule({
          date: selectedDate,
          dayOfWeek: new Date(selectedDate).getDay(),
          isAvailable: dayResult.timeSlots.length > 0,
          timeSlots: dayResult.timeSlots,
          totalSlots: dayResult.timeSlots.length,
          bookedSlots: dayResult.timeSlots.filter(slot => slot.booked).length,
          availableSlots: dayResult.timeSlots.filter(slot => slot.available && !slot.booked).length
        });
      }
    } catch (err) {
      setError('Failed to load schedule data');
      console.error('Schedule loading error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWeeklyScheduleUpdate = async (dayIndex: number, field: 'start_time' | 'end_time' | 'is_available', value: string | boolean) => {
    const updatedSchedule = [...weeklySchedule];
    const existingDay = updatedSchedule.find(day => day.day_of_week === dayIndex);
    
    if (existingDay) {
      updatedSchedule[updatedSchedule.indexOf(existingDay)] = {
        ...existingDay,
        [field]: value
      };
    } else {
      updatedSchedule.push({
        id: `temp-${dayIndex}`,
        doctor_id: doctorId,
        day_of_week: dayIndex,
        start_time: '09:00',
        end_time: '17:00',
        is_available: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        [field]: value
      });
    }

    setWeeklySchedule(updatedSchedule);
  };

  const saveWeeklySchedule = async () => {
    if (weeklySchedule.length === 0) return;

    setIsLoading(true);
    setError(null);

    try {
      const scheduleData = weeklySchedule.map(schedule => ({
        day_of_week: schedule.day_of_week,
        start_time: schedule.start_time,
        end_time: schedule.end_time,
        is_available: schedule.is_available,
        break_start: schedule.break_start,
        break_end: schedule.break_end,
        max_appointments: schedule.max_appointments,
        appointment_duration: schedule.appointment_duration
      }));

      const result = await doctorScheduleService.updateDoctorSchedule(doctorId, scheduleData);
      if (!result.success) {
        setError(result.error || 'Failed to save schedule');
      }
    } catch (err) {
      setError('Failed to save schedule');
      console.error('Schedule save error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleDateBlock = async (date: string) => {
    const isCurrentlyBlocked = blockedDates.includes(date);
    
    setIsLoading(true);
    setError(null);

    try {
      const result = await doctorScheduleService.toggleDateAvailability(doctorId, date, !isCurrentlyBlocked);
      if (result.success) {
        if (isCurrentlyBlocked) {
          setBlockedDates(prev => prev.filter(d => d !== date));
        } else {
          setBlockedDates(prev => [...prev, date]);
        }
      } else {
        setError(result.error || 'Failed to update blocked date');
      }
    } catch (err) {
      setError('Failed to update blocked date');
      console.error('Block date error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const renderWeeklyScheduleTab = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Weekly Schedule</h3>
        <Button onClick={saveWeeklySchedule} disabled={isLoading} className="flex items-center gap-2">
          <Save className="w-4 h-4" />
          Save Schedule
        </Button>
      </div>

      <div className="space-y-3">
        {DAYS_OF_WEEK.map((day, index) => {
          const daySchedule = weeklySchedule.find(schedule => schedule.day_of_week === index);
          return (
            <Card key={day}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={daySchedule?.is_available || false}
                      onChange={(e) => handleWeeklyScheduleUpdate(index, 'is_available', e.target.checked)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="font-medium">{day}</span>
                  </div>
                  
                  {daySchedule?.is_available && (
                    <div className="flex items-center gap-2">
                      <Input
                        type="time"
                        value={daySchedule.start_time}
                        onChange={(e) => handleWeeklyScheduleUpdate(index, 'start_time', e.target.value)}
                        className="w-24"
                      />
                      <span>to</span>
                      <Input
                        type="time"
                        value={daySchedule.end_time}
                        onChange={(e) => handleWeeklyScheduleUpdate(index, 'end_time', e.target.value)}
                        className="w-24"
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );

  const renderDailyScheduleTab = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <h3 className="text-lg font-semibold">Daily Schedule</h3>
        <Input
          type="date"
          value={selectedDate}
          onChange={(e) => {
            setSelectedDate(e.target.value);
            loadScheduleData();
          }}
          className="w-40"
        />
      </div>

      {daySchedule && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <h4 className="font-medium">
                {new Date(selectedDate).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </h4>
              <div className="flex gap-4 text-sm text-gray-600">
                <span>Total: {daySchedule.totalSlots}</span>
                <span>Booked: {daySchedule.bookedSlots}</span>
                <span>Available: {daySchedule.availableSlots}</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-2">
              {daySchedule.timeSlots.map((slot, index) => (
                <div
                  key={index}
                  className={`p-2 text-center text-sm rounded border ${
                    slot.booked 
                      ? 'bg-red-100 border-red-300 text-red-700'
                      : slot.available
                      ? 'bg-green-100 border-green-300 text-green-700'
                      : 'bg-gray-100 border-gray-300 text-gray-500'
                  }`}
                >
                  {slot.time}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderBlockedDatesTab = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Blocked Dates</h3>
        <div className="flex items-center gap-2">
          <Input
            type="date"
            onChange={(e) => {
              if (e.target.value) {
                toggleDateBlock(e.target.value);
              }
            }}
            className="w-40"
          />
          <span className="text-sm text-gray-600">Select date to block/unblock</span>
        </div>
      </div>

      {blockedDates.length > 0 ? (
        <div className="space-y-2">
          {blockedDates.map((date) => (
            <Card key={date}>
              <CardContent className="p-3 flex justify-between items-center">
                <span>{new Date(date).toLocaleDateString()}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleDateBlock(date)}
                  className="text-red-600 hover:text-red-700"
                >
                  <X className="w-4 h-4" />
                  Unblock
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No blocked dates</p>
        </div>
      )}
    </div>
  );

  if (isLoading && !weeklySchedule) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('weekly')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'weekly'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Clock className="w-4 h-4 inline mr-2" />
          Weekly Schedule
        </button>
        <button
          onClick={() => setActiveTab('daily')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'daily'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Calendar className="w-4 h-4 inline mr-2" />
          Daily View
        </button>
        <button
          onClick={() => setActiveTab('blocked')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'blocked'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <X className="w-4 h-4 inline mr-2" />
          Blocked Dates
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2 text-red-700">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Tab Content */}
      {activeTab === 'weekly' && renderWeeklyScheduleTab()}
      {activeTab === 'daily' && renderDailyScheduleTab()}
      {activeTab === 'blocked' && renderBlockedDatesTab()}
    </div>
  );
};
