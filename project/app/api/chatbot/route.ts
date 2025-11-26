import Groq from 'groq-sdk';

export async function POST({ request }: { request: Request }) {
  // Initialize Groq with API key from environment variables
  const groq = new Groq({
    apiKey: process.env.VITE_GROQ_API_KEY,
  });
  
  try {
    const { messages } = await request.json();

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a helpful healthcare assistant for MediClinic. Provide accurate and helpful medical information while being cautious about serious health concerns. Always recommend consulting with a real doctor for serious medical issues."
        },
        ...messages
      ],
      model: "llama3-8b-8192",
      temperature: 0.7,
      max_tokens: 1024,
      top_p: 1,
      stream: false,
    });

    const response = chatCompletion.choices[0]?.message?.content || "Sorry, I couldn't process that request.";

    return new Response(JSON.stringify({ response }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Chatbot error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to process chat request' }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
}