import React from 'react';
import { EnhancedChatbotModal } from '../components/chatbot';
import { Button } from '../components/ui/Button';

const ChatbotTestPage: React.FC = () => {
  const [isChatOpen, setIsChatOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Enhanced Chatbot Test Page</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Test the Enhanced Chatbot</h2>
          <p className="text-gray-600 mb-4">
            This page allows you to test the new enhanced chatbot system copied from the mobile app.
            The chatbot includes role-based responses, emergency detection, and comprehensive healthcare guidance.
          </p>
          
          <Button onClick={() => setIsChatOpen(true)}>
            Open Enhanced Chatbot
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-3">Features</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              <li>Role-based responses (patient/doctor/clinic)</li>
              <li>Emergency keyword detection</li>
              <li>Appointment booking guidance</li>
              <li>Medication information</li>
              <li>Clinic search assistance</li>
              <li>Health tips and wellness advice</li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-3">Test Scenarios</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              <li>Type "emergency" to test emergency response</li>
              <li>Ask about booking appointments</li>
              <li>Inquire about symptoms</li>
              <li>Ask for medication information</li>
              <li>Request clinic search help</li>
              <li>Test role-specific questions</li>
            </ul>
          </div>
        </div>
      </div>

      <EnhancedChatbotModal
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
      />
    </div>
  );
};

export default ChatbotTestPage;
