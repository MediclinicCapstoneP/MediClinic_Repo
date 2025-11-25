import React, { useEffect, useRef, useState } from 'react';

type Role = 'user' | 'assistant' | 'system';
type Message = { role: Role; content: string; ts?: number };

interface Props {
  edgeEndpoint: string;
  userId: string | null;
  initialMessages?: Message[];
  role?: 'patient' | 'clinic' | 'doctor' | 'admin' | null;
}

const GroqChatbot: React.FC<Props> = ({ edgeEndpoint, userId, initialMessages = [], role = null }) => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const base = [...messages];
    const withRole = role && base.length === 0 ? [{ role: 'system', content: `USER_ROLE=${role}`, ts: Date.now() } as Message] : [];
    const newMessages = [...withRole, ...base, { role: 'user', content: input.trim(), ts: Date.now() }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    const response = await fetch(edgeEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId || '',
        'x-user-role': role || '',
      },
      body: JSON.stringify({ messages: newMessages }),
    });
    if (!response.body) {
      setLoading(false);
      return;
    }
    const reader = response.body.getReader();
    let assistantMessage = '';
    setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      const chunk = new TextDecoder().decode(value);
      assistantMessage += chunk;
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: 'assistant', content: assistantMessage };
        return updated;
      });
    }
    setLoading(false);
  };

  if (!userId) {
    return (
      <div className="w-full p-4 bg-gray-100 rounded-xl text-center">
        <p>Please login to use the AI chatbot.</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto shadow-xl rounded-2xl overflow-hidden border bg-white flex flex-col h-[600px]">
      <div className="p-4 font-bold text-lg bg-blue-600 text-white">AI Assistant</div>
      <div ref={chatRef} className="flex-1 p-4 overflow-y-auto space-y-3 bg-gray-50">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`p-3 rounded-xl max-w-[80%] whitespace-pre-wrap ${
              m.role === 'user' ? 'bg-blue-500 text-white self-end ml-auto' : 'bg-gray-300 text-black'
            }`}
          >
            {m.content}
          </div>
        ))}
        {loading && <div className="text-sm text-gray-500">Thinking...</div>}
      </div>
      <div className="p-4 flex gap-2 bg-white border-t">
        <input
          className="flex-1 px-3 py-2 border rounded-xl"
          placeholder="Ask something..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button
          onClick={handleSend}
          className="px-4 py-2 bg-blue-600 text-white rounded-xl disabled:bg-gray-400"
          disabled={loading}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default GroqChatbot;