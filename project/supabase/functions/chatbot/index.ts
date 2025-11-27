import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

interface ChatRequest {
  messages: ChatMessage[]
  userId?: string
  userRole?: 'patient' | 'doctor' | 'clinic'
}

interface GroqResponse {
  choices: Array<{
    message: {
      content: string
      role: string
    }
    finish_reason: string
  }>
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { messages, userId, userRole }: ChatRequest = await req.json()

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: 'Invalid messages format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get Groq API key from environment
    const groqApiKey = Deno.env.get('GROQ_API_KEY')
    if (!groqApiKey) {
      return new Response(
        JSON.stringify({ error: 'Groq API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // System prompt for healthcare assistant
    const systemPrompt: ChatMessage = {
      role: 'system',
      content: `You are MediBot, a helpful healthcare assistant for the MediClinic app. You provide general health information and guidance but always emphasize that you're not a substitute for professional medical advice.

Your role is to:
- Provide general health information and wellness tips
- Help users understand common medical terms
- Suggest when to seek professional medical attention
- Assist with appointment booking and clinic information
- Provide medication reminders and general health advice

IMPORTANT GUIDELINES:
- Never provide specific medical diagnoses
- Always include a disclaimer that users should consult healthcare professionals
- For emergencies, advise calling emergency services immediately
- Be empathetic, professional, and clear in your responses
- Keep responses concise but informative

Context: You're assisting with ${userRole || 'a user'} in the MediClinic healthcare platform.`
    }

    // Prepare messages for Groq API
    const groqMessages: ChatMessage[] = [systemPrompt, ...messages]

    // Call Groq API
    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'mixtral-8x7b-32768', // Groq model
        messages: groqMessages,
        max_tokens: 1000,
        temperature: 0.7,
      }),
    })

    if (!groqResponse.ok) {
      const errorData = await groqResponse.text()
      console.error('Groq API error:', errorData)
      return new Response(
        JSON.stringify({ error: 'Failed to get response from AI service' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const groqData: GroqResponse = await groqResponse.json()
    const assistantMessage = groqData.choices[0]?.message?.content

    if (!assistantMessage) {
      return new Response(
        JSON.stringify({ error: 'No response from AI service' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Optionally store conversation in Supabase for analytics/improvement
    if (userId && Deno.env.get('SUPABASE_URL') && Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')) {
      try {
        const supabase = createClient(
          Deno.env.get('SUPABASE_URL')!,
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        )

        // Store chat message (you'd need to create a chat_messages table)
        await supabase.from('chat_messages').insert({
          user_id: userId,
          user_role: userRole,
          messages: messages,
          response: assistantMessage,
          created_at: new Date().toISOString(),
        })
      } catch (error) {
        console.error('Failed to store chat message:', error)
        // Don't fail the request if storage fails
      }
    }

    return new Response(
      JSON.stringify({
        message: assistantMessage,
        usage: groqData.usage,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Chatbot edge function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
