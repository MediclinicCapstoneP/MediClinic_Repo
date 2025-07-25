import React, { useState } from 'react';
import { FileText, Calendar, User, Download, Eye } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Modal } from '../ui/Modal';

export const PatientHistory: React.FC = () => {
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const mockMedicalHistory = [
    {
      id: 1,
      date: '2023-12-20',
      clinicName: 'QuickCare Medical',
      doctorName: 'Dr. Emily Davis',
      specialty: 'Family Medicine',
      diagnosis: 'Viral Upper Respiratory Infection',
      treatment: 'Symptomatic treatment, rest, increased fluid intake',
      prescription: [
        'Paracetamol 500mg - Take 1 tablet every 8 hours for fever',
        'Loratadine 10mg - Take 1 tablet daily for nasal congestion'
      ],
      notes: 'Patient presented with cold symptoms. No complications observed. Follow-up if symptoms worsen.',
      vitalSigns: {
        temperature: '99.2°F',
        bloodPressure: '120/80 mmHg',
        heartRate: '78 bpm',
        weight: '70 kg'
      }
    },
    {
      id: 2,
      date: '2023-08-15',
      clinicName: 'City General Hospital',
      doctorName: 'Dr. Sarah Johnson',
      specialty: 'General Medicine',
      diagnosis: 'Annual Health Checkup - Normal',
      treatment: 'Preventive care counseling',
      prescription: [
        'Multivitamin - Take 1 tablet daily',
        'Vitamin D3 1000 IU - Take 1 tablet daily'
      ],
      notes: 'Comprehensive annual exam. All vital signs and lab results within normal limits. Continue current lifestyle habits.',
      vitalSigns: {
        temperature: '98.6°F',
        bloodPressure: '118/76 mmHg',
        heartRate: '72 bpm',
        weight: '69 kg'
      },
      labResults: [
        'Complete Blood Count - Normal',
        'Lipid Panel - Normal',
        'Blood Glucose - 92 mg/dL (Normal)',
        'Thyroid Function - Normal'
      ]
    },
    {
      id: 3,
      date: '2023-05-10',
      clinicName: 'Heart Care Center',
      doctorName: 'Dr. Michael Chen',
      specialty: 'Cardiology',
      diagnosis: 'Hypertension Follow-up',
      treatment: 'Blood pressure monitoring, lifestyle modifications',
      prescription: [
        'Lisinopril 10mg - Take 1 tablet daily in the morning',
        'Amlodipine 5mg - Take 1 tablet daily'
      ],
      notes: 'Blood pressure well controlled with current medication. Continue current regimen. Next follow-up in 3 months.',
      vitalSigns: {
        temperature: '98.4°F',
        bloodPressure: '128/82 mmHg',
        heartRate: '68 bpm',
        weight: '71 kg'
      }
    }
  ];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const handleViewDetails = (record: any) => {
    setSelectedRecord(record);
    setShowDetailsModal(true);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Medical History</h1>
        <p className="text-gray-600">Your complete healthcare records and consultation history</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <FileText className="text-blue-600" size={24} />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{mockMedicalHistory.length}</h3>
            <p className="text-gray-600">Total Records</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Calendar className="text-green-600" size={24} />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">3</h3>
            <p className="text-gray-600">This Year</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <User className="text-purple-600" size={24} />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">3</h3>
            <p className="text-gray-600">Different Doctors</p>
          </CardContent>
        </Card>
      </div>

      {/* Medical Records */}
      <div className="space-y-4">
        {mockMedicalHistory.map((record) => (
          <Card key={record.id} hover>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{record.diagnosis}</h3>
                  <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                    <span>{formatDate(record.date)}</span>
                    <span>•</span>
                    <span>{record.clinicName}</span>
                    <span>•</span>
                    <span>{record.doctorName}</span>
                  </div>
                </div>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                  {record.specialty}
                </span>
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Treatment</h4>
                  <p className="text-sm text-gray-600">{record.treatment}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Vital Signs</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>Temperature: {record.vitalSigns.temperature}</div>
                    <div>BP: {record.vitalSigns.bloodPressure}</div>
                    <div>Heart Rate: {record.vitalSigns.heartRate}</div>
                  </div>
                </div>
              </div>

              {record.prescription.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">Prescriptions</h4>
                  <div className="space-y-1">
                    {record.prescription.slice(0, 2).map((med, index) => (
                      <div key={index} className="text-sm text-gray-600 bg-gray-50 px-3 py-1 rounded">
                        {med}
                      </div>
                    ))}
                    {record.prescription.length > 2 && (
                      <div className="text-sm text-blue-600">
                        +{record.prescription.length - 2} more medications
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600 max-w-md">
                  {record.notes.length > 100 ? `${record.notes.substring(0, 100)}...` : record.notes}
                </p>
                
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleViewDetails(record)}
                  >
                    <Eye size={16} className="mr-1" />
                    View Details
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download size={16} className="mr-1" />
                    Download
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title="Medical Record Details"
        size="lg"
      >
        {selectedRecord && (
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Date</h4>
                <p className="text-gray-600">{formatDate(selectedRecord.date)}</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Healthcare Provider</h4>
                <p className="text-gray-600">{selectedRecord.clinicName}</p>
                <p className="text-sm text-gray-500">{selectedRecord.doctorName} • {selectedRecord.specialty}</p>
              </div>
            </div>

            {/* Diagnosis */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Diagnosis</h4>
              <p className="text-gray-600">{selectedRecord.diagnosis}</p>
            </div>

            {/* Vital Signs */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Vital Signs</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-sm text-gray-600">Temperature</p>
                  <p className="font-medium">{selectedRecord.vitalSigns.temperature}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-sm text-gray-600">Blood Pressure</p>
                  <p className="font-medium">{selectedRecord.vitalSigns.bloodPressure}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-sm text-gray-600">Heart Rate</p>
                  <p className="font-medium">{selectedRecord.vitalSigns.heartRate}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-sm text-gray-600">Weight</p>
                  <p className="font-medium">{selectedRecord.vitalSigns.weight}</p>
                </div>
              </div>
            </div>

            {/* Lab Results */}
            {selectedRecord.labResults && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Lab Results</h4>
                <div className="space-y-1">
                  {selectedRecord.labResults.map((result: string, index: number) => (
                    <div key={index} className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded">
                      {result}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Prescriptions */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Prescriptions</h4>
              <div className="space-y-2">
                {selectedRecord.prescription.map((med: string, index: number) => (
                  <div key={index} className="text-sm text-gray-600 bg-blue-50 px-3 py-2 rounded border-l-4 border-blue-200">
                    {med}
                  </div>
                ))}
              </div>
            </div>

            {/* Treatment & Notes */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Treatment</h4>
              <p className="text-gray-600">{selectedRecord.treatment}</p>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">Doctor's Notes</h4>
              <p className="text-gray-600">{selectedRecord.notes}</p>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <Button variant="outline" onClick={() => setShowDetailsModal(false)}>
                Close
              </Button>
              <Button>
                <Download size={16} className="mr-2" />
                Download Record
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};