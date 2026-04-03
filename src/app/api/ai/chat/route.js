import OpenAI from 'openai';
import { getSystemPrompt } from '@/utils/ai-prompts';

export async function POST(req) {
  try {
    const { messages, userRole, studentData, schoolContext, contextData } = await req.json();

    // Validate API key
    if (!process.env.GROQ_API_KEY) {
      console.error('GROQ_API_KEY not found in environment');
      return new Response(
        JSON.stringify({ error: 'Groq API key not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('Groq API Key present, length:', process.env.GROQ_API_KEY.length);

    // Initialize OpenAI client pointing to Groq
    const client = new OpenAI({
      apiKey: process.env.GROQ_API_KEY.trim(),
      baseURL: 'https://api.groq.com/openai/v1',
    });

    // Get role-appropriate system prompt with database context
    const systemPrompt = getSystemPrompt(userRole, studentData, schoolContext, contextData);

    // Convert messages to OpenAI format
    const groqMessages = [
      {
        role: 'system',
        content: systemPrompt,
      },
      ...messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
    ];

    // Get completion from Groq using official model
    const completion = await client.chat.completions.create({
      messages: groqMessages,
      model: 'openai/gpt-oss-20b', // Official Groq model from docs
      temperature: 0.7,
      max_tokens: 1024,
    });

    const fullResponse = completion.choices[0]?.message?.content || 'No response generated';

    // Return as streaming response to maintain compatibility with frontend
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        // Send the entire response at once
        controller.enqueue(encoder.encode(fullResponse));
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('AI Chat API Error:', error.message || error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to process AI request', 
        details: error.message || String(error)
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
