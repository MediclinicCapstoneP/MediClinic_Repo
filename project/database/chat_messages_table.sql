-- Chat Messages Table for MediBot
-- Stores conversation history for analytics and improvement

CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_role TEXT CHECK (user_role IN ('patient', 'doctor', 'clinic')),
  messages JSONB NOT NULL, -- Array of message objects with role, content, timestamp
  response TEXT NOT NULL, -- The assistant's response
  session_id TEXT, -- Optional session identifier for grouping conversations
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Metadata
  message_count INTEGER DEFAULT 0, -- Number of messages in this conversation
  tokens_used INTEGER DEFAULT 0, -- Total tokens used for this conversation
  satisfaction_rating INTEGER CHECK (satisfaction_rating >= 1 AND satisfaction_rating <= 5), -- Optional user feedback
  category TEXT, -- Categorize conversations (e.g., 'appointment', 'medical_info', 'emergency')
  resolved BOOLEAN DEFAULT FALSE, -- Whether the user's issue was resolved
  
  -- Indexes for performance
);

-- Indexes
CREATE INDEX idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at DESC);
CREATE INDEX idx_chat_messages_user_role ON chat_messages(user_role);
CREATE INDEX idx_chat_messages_category ON chat_messages(category);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_chat_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER chat_messages_updated_at
    BEFORE UPDATE ON chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_chat_messages_updated_at();

-- Row Level Security (RLS)
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view their own chat messages
CREATE POLICY "Users can view own chat messages"
    ON chat_messages
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own chat messages
CREATE POLICY "Users can insert own chat messages"
    ON chat_messages
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own chat messages (e.g., satisfaction rating)
CREATE POLICY "Users can update own chat messages"
    ON chat_messages
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Service role can access all chat messages (for analytics and improvement)
CREATE POLICY "Service role can access all chat messages"
    ON chat_messages
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- Chat Analytics View
CREATE OR REPLACE VIEW chat_analytics AS
SELECT 
    user_role,
    DATE_TRUNC('day', created_at) as date,
    COUNT(*) as total_conversations,
    AVG(message_count) as avg_messages_per_conversation,
    AVG(tokens_used) as avg_tokens_per_conversation,
    AVG(satisfaction_rating) as avg_satisfaction,
    COUNT(CASE WHEN resolved = TRUE THEN 1 END) * 100.0 / COUNT(*) as resolution_rate,
    category,
    COUNT(*) as conversations_by_category
FROM chat_messages
GROUP BY user_role, DATE_TRUNC('day', created_at), category
ORDER BY date DESC;

-- Comments
COMMENT ON TABLE chat_messages IS 'Stores chatbot conversation history for MediBot healthcare assistant';
COMMENT ON COLUMN chat_messages.messages IS 'JSON array of conversation messages with role, content, and timestamps';
COMMENT ON COLUMN chat_messages.response IS 'The assistant''s final response to the user';
COMMENT ON COLUMN chat_messages.session_id IS 'Optional session identifier to group related conversations';
COMMENT ON COLUMN chat_messages.satisfaction_rating IS 'User satisfaction rating from 1 (poor) to 5 (excellent)';
COMMENT ON COLUMN chat_messages.category IS 'Conversation category for analytics (appointment, medical_info, emergency, etc.)';
COMMENT ON COLUMN chat_messages.resolved IS 'Whether the user''s issue was successfully resolved';
