import React, { useState } from 'react';
import { Plus, Edit, Trash2, Calendar, Clock, DollarSign } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Modal } from '../ui/Modal';

export const ClinicDoctors: React.FC = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);

  const mockDoctors = [
    {
      id: 1,
      name: 'Dr. Sarah Johnson',
      specialization: 'General Medicine',
      email: 'sarah.johnson@clinic.com',
      phone: '+1 234-567-8900',
      consultationFee: 150,
      experience: '8 years',
      schedule: [
        { day: 'Monday', startTime: '09:00', endTime: '17:00', available: true },
        { day: 'Tuesday', startTime: '09:00', endTime: '17:00', available: true },
        { day: 'Wednesday', startTime: '09:00', endTime: '17:00', available: true },
        { day: 'Thursday', startTime: '09:00', endTime: '17:00', available: true },
        { day: 'Friday', startTime: '09:00', endTime: '17:00', available: true },
        { day: 'Saturday', startTime: '09:00', endTime: '13:00', available: true },
        { day: 'Sunday', startTime: '', endTime: '', available: false },
      ],
      totalAppointments: 245,
      monthlyAppointments: 23,
      rating: 4.8,
      profileImage: 'https://images.pexels.com/photos/5215024/pexels-photo-5215024.jpeg?auto=compress&cs=tinysrgb&w=400'
    },
    {
      id: 2,
      name: 'Dr. Michael Wilson',
      specialization: 'Cardiology',
      email: 'michael.wilson@clinic.com',
      phone: '+1 234-567-8901',
      consultationFee: 200,
      experience: '12 years',
      schedule: [
        { day: 'Monday', startTime: '10:00', endTime: '18:00', available: true },
        { day: 'Tuesday', startTime: '10:00', endTime: '18:00', available: true },
        { day: 'Wednesday', startTime: '10:00', endTime: '18:00', available: true },
        { day: 'Thursday', startTime: '10:00', endTime: '18:00', available: true },
        { day: 'Friday', startTime: '10:00', endTime: '16:00', available: true },
        { day: 'Saturday', startTime: '', endTime: '', available: false },
        { day: 'Sunday', startTime: '', endTime: '', available: false },
      ],
      totalAppointments: 189,
      monthlyAppointments: 18,
      rating: 4.9,
      profileImage: 'https://images.pexels.com/photos/6129967/pexels-photo-6129967.jpeg?auto=compress&cs=tinysrgb&w=400'
    },
    {
      id: 3,
      name: 'Dr. Emily Davis',
      specialization: 'Pediatrics',
      email: 'emily.davis@clinic.com',
      phone: '+1 234-567-8902',
      consultationFee: 120,
      experience: '6 years',
      schedule: [
        { day: 'Monday', startTime: '08:00', endTime: '16:00', available: true },
        { day: 'Tuesday', startTime: '08:00', endTime: '16:00', available: true },
        { day: 'Wednesday', startTime: '08:00', endTime: '16:00', available: true },
        { day: 'Thursday', startTime: '08:00', endTime: '16:00', available: true },
        { day: 'Friday', startTime: '08:00', endTime: '16:00', available: true },
        { day: 'Saturday', startTime: '08:00', endTime: '12:00', available: true },
        { day: 'Sunday', startTime: '', endTime: '', available: false },
      ],
      totalAppointments: 312,
      monthlyAppointments: 28,
      rating: 4.7,
      profileImage: 'https://images.pexels.com/photos/4173251/pexels-photo-4173251.jpeg?auto=compress&cs=tinysrgb&w=400'
    }
  ];

  const handleEditDoctor = (doctor: any) => {
    setSelectedDoctor(doctor);
    setShowEditModal(true);
  };

  const handleDeleteDoctor = (doctorId: number) => {
    if (confirm('Are you sure you want to remove this doctor?')) {
      // TODO: Delete doctor from Supabase
      console.log('Deleting doctor:', doctorId);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Doctors</h1>
          <p className="text-gray-600">Manage your clinic's medical staff</p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus size={16} className="mr-2" />
          Add Doctor
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Calendar className="text-blue-600" size={24} />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{mockDoctors.length}</h3>
            <p className="text-gray-600">Total Doctors</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Clock className="text-green-600" size={24} />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">
              {mockDoctors.reduce((acc, doctor) => acc + doctor.monthlyAppointments, 0)}
            </h3>
            <p className="text-gray-600">Appointments This Month</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <DollarSign className="text-purple-600" size={24} />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">
              ${mockDoctors.reduce((acc, doctor) => acc + (doctor.consultationFee * doctor.monthlyAppointments), 0).toLocaleString()}
            </h3>
            <p className="text-gray-600">Monthly Revenue</p>
          </CardContent>
        </Card>
      </div>

      {/* Doctors List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {mockDoctors.map((doctor) => (
          <Card key={doctor.id} hover>
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <img
                  src={doctor.profileImage}
                  alt={doctor.name}
                  className="w-16 h-16 rounded-full object-cover"
                />
                
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{doctor.name}</h3>
                      <p className="text-gray-600">{doctor.specialization}</p>
                      <p className="text-sm text-gray-500">{doctor.experience} experience</p>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditDoctor(doctor)}
                      >
                        <Edit size={16} />
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDeleteDoctor(doctor.id)}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                    <div>
                      <p className="text-gray-600">Email</p>
                      <p className="font-medium">{doctor.email}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Phone</p>
                      <p className="font-medium">{doctor.phone}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Consultation Fee</p>
                      <p className="font-medium">${doctor.consultationFee}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Rating</p>
                      <p className="font-medium">⭐ {doctor.rating}</p>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm font-medium text-gray-900 mb-2">This Month</p>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Appointments</p>
                        <p className="font-medium">{doctor.monthlyAppointments}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Revenue</p>
                        <p className="font-medium">${(doctor.consultationFee * doctor.monthlyAppointments).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add Doctor Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Doctor"
        size="lg"
      >
        <form className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Full Name"
              placeholder="Dr. John Smith"
              required
            />
            <Input
              label="Specialization"
              placeholder="General Medicine"
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Email"
              type="email"
              placeholder="doctor@clinic.com"
              required
            />
            <Input
              label="Phone"
              placeholder="+1 234-567-8900"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Consultation Fee ($)"
              type="number"
              placeholder="150"
              required
            />
            <Input
              label="Years of Experience"
              placeholder="5 years"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Weekly Schedule
            </label>
            <div className="space-y-2">
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                <div key={day} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                  <div className="w-24">
                    <label className="flex items-center">
                      <input type="checkbox" className="mr-2" />
                      {day}
                    </label>
                  </div>
                  <Input
                    type="time"
                    placeholder="Start Time"
                    className="flex-1"
                  />
                  <Input
                    type="time"
                    placeholder="End Time"
                    className="flex-1"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <Button variant="outline" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Add Doctor
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Doctor Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Doctor"
        size="lg"
      >
        {selectedDoctor && (
          <form className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Full Name"
                defaultValue={selectedDoctor.name}
                required
              />
              <Input
                label="Specialization"
                defaultValue={selectedDoctor.specialization}
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Email"
                type="email"
                defaultValue={selectedDoctor.email}
                required
              />
              <Input
                label="Phone"
                defaultValue={selectedDoctor.phone}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Consultation Fee ($)"
                type="number"
                defaultValue={selectedDoctor.consultationFee}
                required
              />
              <Input
                label="Years of Experience"
                defaultValue={selectedDoctor.experience}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Weekly Schedule
              </label>
              <div className="space-y-2">
                {selectedDoctor.schedule.map((scheduleItem: any, index: number) => (
                  <div key={index} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                    <div className="w-24">
                      <label className="flex items-center">
                        <input 
                          type="checkbox" 
                          className="mr-2" 
                          defaultChecked={scheduleItem.available}
                        />
                        {scheduleItem.day}
                      </label>
                    </div>
                    <Input
                      type="time"
                      defaultValue={scheduleItem.startTime}
                      className="flex-1"
                    />
                    <Input
                      type="time"
                      defaultValue={scheduleItem.endTime}
                      className="flex-1"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <Button variant="outline" onClick={() => setShowEditModal(false)}>
                Cancel
              </Button>
              <Button type="submit">
                Save Changes
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};