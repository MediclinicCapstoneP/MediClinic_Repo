import React from 'react';
import { Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';

export const DateSelector = ({ selectedDate, setSelectedDate, total }) => (
  <div className="mb-6">
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Calendar size={20} className="text-gray-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="text-sm text-gray-600">{total} appointments scheduled</div>
        </div>
      </CardContent>
    </Card>
  </div>
);
