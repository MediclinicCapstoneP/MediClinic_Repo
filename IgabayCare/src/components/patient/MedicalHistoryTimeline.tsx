import React, { useState, useMemo } from 'react';
import { 
  Clock, 
  Calendar, 
  User, 
  MapPin, 
  Pill, 
  TestTube, 
  Shield, 
  FileText,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  AlertTriangle
} from 'lucide-react';
import {
  HistoryTimelineItem,
  HistoryFilters,
  HistoryRecordType,
  HISTORY_RECORD_TYPES,
  HISTORY_RECORD_COLORS,
  PRESCRIPTION_STATUS_COLORS,
  LAB_RESULT_STATUS_COLORS
} from '../../types/history';
import { APPOINTMENT_STATUS_COLORS } from '../../types/appointments';

interface MedicalHistoryTimelineProps {
  timelineItems: HistoryTimelineItem[];
  onFilter?: (filters: HistoryFilters) => void;
  loading?: boolean;
}

const getRecordIcon = (type: HistoryRecordType) => {
  switch (type) {
    case 'appointments':
      return <Calendar className="w-4 h-4" />;
    case 'medical_records':
      return <FileText className="w-4 h-4" />;
    case 'prescriptions':
      return <Pill className="w-4 h-4" />;
    case 'lab_results':
      return <TestTube className="w-4 h-4" />;
    case 'vaccinations':
      return <Shield className="w-4 h-4" />;
    case 'allergies':
      return <AlertTriangle className="w-4 h-4" />;
    default:
      return <FileText className="w-4 h-4" />;
  }
};

const getStatusColor = (type: HistoryRecordType, status?: string) => {
  if (!status) return 'bg-gray-100 text-gray-800';
  
  switch (type) {
    case 'appointments':
      return APPOINTMENT_STATUS_COLORS[status as keyof typeof APPOINTMENT_STATUS_COLORS] || 'bg-gray-100 text-gray-800';
    case 'prescriptions':
      return PRESCRIPTION_STATUS_COLORS[status] || 'bg-gray-100 text-gray-800';
    case 'lab_results':
      return LAB_RESULT_STATUS_COLORS[status] || 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const MedicalHistoryTimeline: React.FC<MedicalHistoryTimelineProps> = ({
  timelineItems,
  onFilter,
  loading = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRecordTypes, setSelectedRecordTypes] = useState<HistoryRecordType[]>([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);

  // Filter and search timeline items
  const filteredItems = useMemo(() => {
    return timelineItems.filter(item => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = 
          item.title.toLowerCase().includes(searchLower) ||
          item.description.toLowerCase().includes(searchLower) ||
          item.doctor_name?.toLowerCase().includes(searchLower) ||
          item.clinic_name?.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Record type filter
      if (selectedRecordTypes.length > 0) {
        if (!selectedRecordTypes.includes(item.type)) return false;
      }

      // Date filters
      if (dateFrom && item.date < dateFrom) return false;
      if (dateTo && item.date > dateTo) return false;

      return true;
    });
  }, [timelineItems, searchTerm, selectedRecordTypes, dateFrom, dateTo]);

  const toggleRecordType = (type: HistoryRecordType) => {
    setSelectedRecordTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedRecordTypes([]);
    setDateFrom('');
    setDateTo('');
  };

  const renderTimelineItem = (item: HistoryTimelineItem, index: number) => {
    const isExpanded = expandedItems.has(item.id);
    const recordTypeColor = HISTORY_RECORD_COLORS[item.type];
    const statusColor = getStatusColor(item.type, item.status);

    return (
      <div key={item.id} className="relative">
        {/* Timeline line */}
        {index < filteredItems.length - 1 && (
          <div className="absolute left-6 top-12 bottom-0 w-0.5 bg-gray-200"></div>
        )}

        {/* Timeline item */}
        <div className="flex items-start space-x-4 pb-8">
          {/* Icon */}
          <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${recordTypeColor}`}>
            {getRecordIcon(item.type)}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              {/* Header */}
              <div 
                className="p-4 cursor-pointer"
                onClick={() => toggleExpanded(item.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${recordTypeColor}`}>
                        {HISTORY_RECORD_TYPES[item.type]}
                      </span>
                      {item.status && (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor}`}>
                          {item.status}
                        </span>
                      )}
                      {item.priority === 'urgent' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Urgent
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-1">
                      {item.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">
                      {item.description}
                    </p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(item.date)}</span>
                      </div>
                      {item.doctor_name && (
                        <div className="flex items-center space-x-1">
                          <User className="w-3 h-3" />
                          <span>{item.doctor_name}</span>
                        </div>
                      )}
                      {item.clinic_name && (
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-3 h-3" />
                          <span>{item.clinic_name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded content */}
              {isExpanded && (
                <div className="px-4 pb-4 border-t border-gray-100">
                  <div className="pt-4">
                    {renderExpandedContent(item)}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderExpandedContent = (item: HistoryTimelineItem) => {
    const data = item.data;

    switch (item.type) {
      case 'appointments':
        return (
          <div className="space-y-2 text-sm">
            {(data as any).appointment_time && (
              <div><strong>Time:</strong> {(data as any).appointment_time}</div>
            )}
            {(data as any).duration_minutes && (
              <div><strong>Duration:</strong> {(data as any).duration_minutes} minutes</div>
            )}
            {(data as any).patient_notes && (
              <div><strong>Notes:</strong> {(data as any).patient_notes}</div>
            )}
            {(data as any).doctor_notes && (
              <div><strong>Doctor Notes:</strong> {(data as any).doctor_notes}</div>
            )}
          </div>
        );
      
      case 'medical_records':
        return (
          <div className="space-y-2 text-sm">
            {(data as any).chief_complaint && (
              <div><strong>Chief Complaint:</strong> {(data as any).chief_complaint}</div>
            )}
            {(data as any).diagnosis && (
              <div><strong>Diagnosis:</strong> {(data as any).diagnosis}</div>
            )}
            {(data as any).treatment_plan && (
              <div><strong>Treatment Plan:</strong> {(data as any).treatment_plan}</div>
            )}
            {(data as any).notes && (
              <div><strong>Notes:</strong> {(data as any).notes}</div>
            )}
          </div>
        );
      
      case 'prescriptions':
        return (
          <div className="space-y-2 text-sm">
            {(data as any).dosage && (
              <div><strong>Dosage:</strong> {(data as any).dosage}</div>
            )}
            {(data as any).frequency && (
              <div><strong>Frequency:</strong> {(data as any).frequency}</div>
            )}
            {(data as any).duration && (
              <div><strong>Duration:</strong> {(data as any).duration}</div>
            )}
            {(data as any).instructions && (
              <div><strong>Instructions:</strong> {(data as any).instructions}</div>
            )}
          </div>
        );
      
      case 'lab_results':
        return (
          <div className="space-y-2 text-sm">
            {(data as any).test_type && (
              <div><strong>Test Type:</strong> {(data as any).test_type}</div>
            )}
            {(data as any).results && (
              <div><strong>Results:</strong> {JSON.stringify((data as any).results)}</div>
            )}
            {(data as any).interpretation && (
              <div><strong>Interpretation:</strong> {(data as any).interpretation}</div>
            )}
            {(data as any).doctor_notes && (
              <div><strong>Doctor Notes:</strong> {(data as any).doctor_notes}</div>
            )}
          </div>
        );
      
      case 'vaccinations':
        return (
          <div className="space-y-2 text-sm">
            {(data as any).vaccine_type && (
              <div><strong>Vaccine Type:</strong> {(data as any).vaccine_type}</div>
            )}
            {(data as any).site_of_injection && (
              <div><strong>Site:</strong> {(data as any).site_of_injection}</div>
            )}
            {(data as any).dose_number && (
              <div><strong>Dose:</strong> {(data as any).dose_number} of {(data as any).total_doses}</div>
            )}
            {(data as any).next_dose_date && (
              <div><strong>Next Dose:</strong> {formatDate((data as any).next_dose_date)}</div>
            )}
          </div>
        );
      
      default:
        return <div className="text-sm text-gray-600">Details not available</div>;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filter Controls */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        {/* Search bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search medical history..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Filter toggle */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-800"
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
            {showFilters ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
          
          {(selectedRecordTypes.length > 0 || dateFrom || dateTo || searchTerm) && (
            <button
              onClick={clearFilters}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Clear all
            </button>
          )}
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mt-4 space-y-4 border-t border-gray-200 pt-4">
            {/* Record type filters */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Record Types
              </label>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(HISTORY_RECORD_TYPES) as HistoryRecordType[]).map(type => (
                  <button
                    key={type}
                    onClick={() => toggleRecordType(type)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      selectedRecordTypes.includes(type)
                        ? HISTORY_RECORD_COLORS[type]
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {HISTORY_RECORD_TYPES[type]}
                  </button>
                ))}
              </div>
            </div>

            {/* Date filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  From Date
                </label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  To Date
                </label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results summary */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>
          Showing {filteredItems.length} of {timelineItems.length} records
        </span>
        {filteredItems.length !== timelineItems.length && (
          <span>
            ({timelineItems.length - filteredItems.length} filtered out)
          </span>
        )}
      </div>

      {/* Timeline */}
      <div className="space-y-0">
        {filteredItems.length > 0 ? (
          filteredItems.map((item, index) => renderTimelineItem(item, index))
        ) : (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No records found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {timelineItems.length === 0
                ? "No medical history records available."
                : "Try adjusting your search or filter criteria."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MedicalHistoryTimeline;