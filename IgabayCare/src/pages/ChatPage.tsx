import React, { useContext, useState } from 'react';
import { AuthProvider, AuthContext } from '../AuthProvider';
import { ChatWidget, GroqChatbot } from '../ChatWidget';

const ChatInner: React.FC = () => {
  const { getToken, user, login, signup, logout } = useContext(AuthContext);
  const [email, setEmail] = useState('user@example.com');
  const [password, setPassword] = useState('password');

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-4">
      <div className="flex items-center gap-2">
        <input className="border rounded p-2 flex-1" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
        <input className="border rounded p-2" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" type="password" />
        <button className="px-3 py-2 rounded bg-blue-600 text-white" onClick={() => signup(email, password)}>Signup</button>
        <button className="px-3 py-2 rounded bg-green-600 text-white" onClick={() => login(email, password)}>Login</button>
        <button className="px-3 py-2 rounded bg-gray-600 text-white" onClick={logout}>Logout</button>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h2 className="font-semibold mb-2">JWT + SSE</h2>
          <ChatWidget apiBase={import.meta.env.VITE_EDGE_BASE || ''} getToken={getToken} user={user} />
        </div>
        <div>
          <h2 className="font-semibold mb-2">Simple x-user-id + raw chunks</h2>
          <GroqChatbot edgeEndpoint={`${import.meta.env.VITE_EDGE_BASE || ''}/api/chat-simple`} userId={user?.id || null} />
        </div>
      </div>
    </div>
  );
};

const ChatPage: React.FC = () => {
  return (
    <AuthProvider apiBase={import.meta.env.VITE_EDGE_BASE || ''}>
      <ChatInner />
    </AuthProvider>
  );
};

export default ChatPage;