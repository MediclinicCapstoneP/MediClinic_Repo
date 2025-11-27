import React, { useEffect, useMemo, useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { GroqChatbot } from '../../ChatWidget';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

function inferRoleFromPath(pathname: string): 'patient' | 'clinic' | 'doctor' | null {
  if (pathname.includes('/patient/')) return 'patient';
  if (pathname.includes('/clinic/')) return 'clinic';
  if (pathname.includes('/doctor')) return 'doctor';
  return null;
}

export const FloatingGroqChat: React.FC = () => {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuth();

  const role = useMemo(() => {
    return (user?.role as 'patient' | 'clinic' | 'doctor' | undefined) || inferRoleFromPath(location.pathname) || 'patient';
  }, [user?.role, location.pathname]);

  const userId = user?.id || null;
  const endpoint = `${import.meta.env.VITE_EDGE_BASE || ''}/api/chat-simple`;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {open && (
        <div className="mb-3 w-96 h-[600px] bg-white border rounded-2xl shadow-xl overflow-hidden">
          <GroqChatbot edgeEndpoint={endpoint} userId={userId} role={role} />
        </div>
      )}
      <button
        aria-label="Open AI Assistant"
        onClick={() => setOpen(!open)}
        className={`p-4 rounded-full shadow-lg transition-colors ${open ? 'bg-red-600' : 'bg-blue-600'} text-white flex items-center justify-center`}
      >
        <MessageCircle className="h-6 w-6" />
      </button>
    </div>
  );
};

export default FloatingGroqChat;