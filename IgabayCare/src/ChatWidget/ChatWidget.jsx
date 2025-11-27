import React, { useState, useRef, useEffect } from "react";

export default function ChatWidget({
  apiBase = "",
  getToken,
  user,
  initialConversation = [],
  onConversationChange = () => {},
}) {
  const [conversation, setConversation] = useState(initialConversation);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const streamAbortCtrl = useRef(null);

  useEffect(() => onConversationChange(conversation), [conversation, onConversationChange]);

  const appendMessage = (msg) => {
    setConversation((c) => [...c, msg]);
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    const text = input.trim();
    const userMsg = { role: "user", content: text, ts: Date.now(), user };
    appendMessage(userMsg);
    setInput("");
    setIsStreaming(true);

    const token = await getToken();
    streamAbortCtrl.current = new AbortController();
    try {
      const resp = await fetch(`${apiBase}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ prompt: text, conversation }),
        signal: streamAbortCtrl.current.signal,
      });

      if (!resp.ok) {
        const message = await resp.text();
        appendMessage({ role: "assistant", content: `Error: ${message}` });
        setIsStreaming(false);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let assistantText = "";
      appendMessage({ role: "assistant", content: "" });

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const cleaned = chunk.replace(/^data:\s*/gm, "");
        assistantText += cleaned;
        setConversation((c) => {
          const copy = [...c];
          const lastIdx = copy.findIndex((m) => m.role === "assistant" && m.content === "");
          if (lastIdx !== -1) {
            copy[lastIdx] = { ...copy[lastIdx], content: assistantText };
          } else {
            copy.push({ role: "assistant", content: assistantText });
          }
          return copy;
        });
      }

      setIsStreaming(false);
    } catch (err) {
      if (err.name === "AbortError") {
        appendMessage({ role: "assistant", content: "[Stream aborted]" });
      } else {
        appendMessage({ role: "assistant", content: `Error: ${err.message}` });
      }
      setIsStreaming(false);
    }
  };

  const handleAbort = () => {
    if (streamAbortCtrl.current) streamAbortCtrl.current.abort();
  };

  return (
    <div className="w-full max-w-xl border rounded-lg shadow p-4 bg-white">
      <div className="h-72 overflow-auto mb-3 space-y-3" style={{ maxHeight: 300 }}>
        {conversation.map((m, i) => (
          <div key={i} className={m.role === "user" ? "text-right" : "text-left"}>
            <div className={`inline-block p-2 rounded ${m.role === "user" ? "bg-blue-500 text-white" : "bg-gray-100 text-black"}`}>
              {m.content}
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          className="flex-1 p-2 border rounded"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder={isStreaming ? "Assistant is typing..." : "Type your message..."}
        />
        {!isStreaming ? (
          <button className="px-4 py-2 rounded bg-green-600 text-white" onClick={handleSend}>
            Send
          </button>
        ) : (
          <button className="px-4 py-2 rounded bg-red-500 text-white" onClick={handleAbort}>
            Stop
          </button>
        )}
      </div>
    </div>
  );
}