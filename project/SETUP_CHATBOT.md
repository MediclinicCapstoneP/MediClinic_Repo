# MediBot Full Setup Guide

## Step 1: Get Groq API Key
1. Sign up at [groq.com](https://groq.com)
2. Go to Dashboard → API Keys
3. Create new API key
4. Copy the key (starts with `gsk_`)

## Step 2: Update Environment Variables
Add to your `.env.local` file:
```bash
EXPO_PUBLIC_GROQ_API_KEY=gsk_your_api_key_here
```

## Step 3: Deploy Edge Function to Supabase

### Option A: Using Supabase CLI (Recommended)
```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Deploy the chatbot function
supabase functions deploy chatbot
```

### Option B: Using Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to "Edge Functions"
3. Click "New Function"
4. Name it `chatbot`
5. Copy the code from `supabase/functions/chatbot/index.ts`
6. Set environment variables:
   - `GROQ_API_KEY`: Your Groq API key
   - `SUPABASE_URL`: Your Supabase URL
   - `SUPABASE_SERVICE_ROLE_KEY`: Your service role key
7. Click "Deploy"

## Step 4: Set Up Database Table
Run the SQL from `database/chat_messages_table.sql`:
```sql
-- You can run this in Supabase Dashboard → SQL Editor
-- Or use the CLI: supabase db push
```

## Step 5: Test the Chatbot
1. Restart your Expo app: `npx expo start`
2. Tap the floating chatbot button
3. Try sending a message like "How do I book an appointment?"

## Troubleshooting

### Edge Function Not Working
- Check the function logs in Supabase Dashboard
- Ensure environment variables are set correctly
- Verify the function URL matches your Supabase project

### API Key Issues
- Ensure the Groq API key is valid
- Check if you have sufficient credits
- Verify the key starts with `gsk_`

### Database Errors
- Run the chat_messages_table.sql migration
- Check RLS policies are correctly set
- Verify user permissions

## Full Features Available After Setup

### 🤖 AI-Powered Responses
- Natural conversation with Mixtral-8x7b model
- Context-aware responses based on user role
- Intelligent medical information

### 📊 Conversation Analytics
- Store chat history for improvement
- Track user satisfaction ratings
- Analyze conversation categories

### 🏥 Healthcare Intelligence
- Symptom assessment guidance
- Medication information
- Appointment booking assistance
- Emergency detection and response

### 🎯 Role-Specific Support
- **Patients**: Appointment help, general health info
- **Doctors**: Clinical guidance, patient communication
- **Clinics**: Management advice, workflow optimization

## Cost Considerations

### Groq API Pricing
- Mixtral-8x7b: ~$0.27 per million tokens
- Typical chat session: ~500-1000 tokens
- Cost per conversation: ~$0.00014 - $0.00027

### Supabase Edge Functions
- Free tier: 500K invocations/month
- Paid: $0.02 per 1000 invocations after free tier

## Monitoring and Maintenance

### Check Function Health
```bash
# View function logs
supabase functions logs chatbot

# Test function locally
supabase functions serve chatbot --no-verify-jwt
```

### Update Prompts
- Edit `services/chatbotPrompts.ts` for new response patterns
- Redeploy edge function after changes

### Database Maintenance
- Monitor chat_analytics view for insights
- Clean up old conversations periodically
- Update RLS policies as needed

## Security Notes

- Always use environment variables for API keys
- Enable RLS on chat_messages table
- Regularly rotate API keys
- Monitor for unusual usage patterns
