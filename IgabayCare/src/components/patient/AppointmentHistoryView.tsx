import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { AppointmentCompletionService, AppointmentHistoryEntry } from '../../services/appointmentCompletionService';
import { 
  Calendar, Clock, User, Stethoscope, FileText, Pill, MapPin,
  Search, Filter, ChevronDown, ChevronUp, Star, MessageSquare
} from 'lucide-react';

interface AppointmentHistoryViewProps {
  patientId: string;
}

export const AppointmentHistoryView: React.FC<AppointmentHistoryViewProps> = ({ patientId }) => {
  const [history, setHistory] = useState<AppointmentHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClinic] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);

  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    if (patientId) {
      loadHistory();
    }
  }, [patientId, selectedClinic, dateFrom, dateTo, page]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      
      const result = await AppointmentCompletionService.getPatientAppointmentHistory(patientId, {
        limit: ITEMS_PER_PAGE,
        offset: page * ITEMS_PER_PAGE,
        ...(selectedClinic !== 'all' && { clinicId: selectedClinic }),
        ...(dateFrom && { dateFrom }),
        ...(dateTo && { dateTo })
      });

      if (result.success && result.data) {
        if (page === 0) {
          setHistory(result.data);
        } else {
          setHistory(prev => [...prev, ...result.data!]);
        }
        setTotal(result.total || 0);
        setHasMore(result.data.length === ITEMS_PER_PAGE);
      } else {
        console.error('Failed to load appointment history:', result.error);
        setHistory([]);
      }
    } catch (error) {
      console.error('Error loading appointment history:', error);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(0);
    loadHistory();
  };

  const handleLoadMore = () => {
    setPage(prev => prev + 1);
  };

  const toggleExpanded = (entryId: string) => {
    setExpandedEntry(expandedEntry === entryId ? null : entryId);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getAppointmentTypeIcon = (type: string) => {
    switch (type) {
      case 'consultation':
        return <Stethoscope className="h-4 w-4" />;
      case 'follow_up':
        return <Calendar className="h-4 w-4" />;
      case 'emergency':
        return <FileText className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const filteredHistory = history.filter(entry =>
    searchTerm === '' || 
    entry.doctor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.clinic_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.diagnosis?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.consultation_notes?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && page === 0) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Appointment History</h2>
          <p className="text-sm text-gray-600 mt-1">
            {total} completed appointment{total !== 1 ? 's' : ''} found
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search appointments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Input
            type="date"
            placeholder="From date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
          
          <Input
            type="date"
            placeholder="To date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
          
          <Button onClick={handleSearch} className="w-full">
            <Filter className="h-4 w-4 mr-2" />
            Apply Filters
          </Button>
        </div>
      </Card>

      {/* History Entries */}
      <div className="space-y-4">
        {filteredHistory.length === 0 ? (
          <Card className="p-8 text-center">
            <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No appointment history found</h3>
            <p className="text-sm text-gray-500">
              {searchTerm ? 'Try adjusting your search criteria.' : 'You haven\'t completed any appointments yet.'}
            </p>
          </Card>
        ) : (
          filteredHistory.map((entry) => (
            <Card key={entry.id} className="hover:shadow-md transition-shadow">
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      {getAppointmentTypeIcon(entry.appointment_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {entry.doctor_name}
                        </h3>
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                          Completed
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        <MapPin className="h-4 w-4" />
                        <span>{entry.clinic_name}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(entry.appointment_date)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{formatTime(entry.appointment_time)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleExpanded(entry.id)}
                    className="flex-shrink-0"
                  >
                    {expandedEntry === entry.id ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                {/* Quick Info */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-3 border-t border-gray-100">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Type</div>
                    <div className="text-sm font-medium text-gray-900 capitalize">
                      {entry.appointment_type.replace('_', ' ')}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Payment</div>
                    <div className="text-sm font-medium text-gray-900">
                      {entry.payment_amount ? `₱${entry.payment_amount.toLocaleString()}` : 'N/A'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Prescription</div>
                    <div className="text-sm font-medium text-gray-900">
                      {entry.prescription_given ? (
                        <span className="text-green-600">Yes</span>
                      ) : (
                        <span className="text-gray-400">No</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Follow-up</div>
                    <div className="text-sm font-medium text-gray-900">
                      {entry.follow_up_required ? (
                        <span className="text-orange-600">Required</span>
                      ) : (
                        <span className="text-gray-400">None</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedEntry === entry.id && (
                  <div className="pt-4 border-t border-gray-100 space-y-4">
                    {entry.diagnosis && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Diagnosis</h4>
                        <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                          {entry.diagnosis}
                        </p>
                      </div>
                    )}
                    
                    {entry.consultation_notes && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Consultation Notes</h4>
                        <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                          {entry.consultation_notes}
                        </p>
                      </div>
                    )}
                    
                    {entry.treatment_plan && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Treatment Plan</h4>
                        <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                          {entry.treatment_plan}
                        </p>
                      </div>
                    )}
                    
                    {entry.follow_up_required && entry.follow_up_date && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Follow-up Information</h4>
                        <div className="bg-orange-50 p-3 rounded-lg">
                          <p className="text-sm text-orange-800">
                            Follow-up appointment recommended for: {formatDate(entry.follow_up_date)}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2">
                      {entry.prescription_given && (
                        <Button size="sm" variant="outline">
                          <Pill className="h-4 w-4 mr-2" />
                          View Prescription
                        </Button>
                      )}
                      <Button size="sm" variant="outline">
                        <Star className="h-4 w-4 mr-2" />
                        Rate Visit
                      </Button>
                      <Button size="sm" variant="outline">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Contact Clinic
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Load More */}
      {hasMore && filteredHistory.length > 0 && (
        <div className="text-center">
          <Button
            onClick={handleLoadMore}
            disabled={loading}
            variant="outline"
            className="w-full sm:w-auto"
          >
            {loading ? 'Loading...' : 'Load More'}
          </Button>
        </div>
      )}
    </div>
  );
};
