import { convertToCoreMessages, streamText } from 'ai';
import { getModel } from './model-provider';
import { maxTokens, model, systemPrompt, temperature } from './config';

export const maxDuration = 1000;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = await streamText({
    model: getModel(model),
    system: systemPrompt,
    maxTokens: maxTokens,
    temperature: temperature,
    messages: convertToCoreMessages(messages),
  });

  return result.toAIStreamResponse();
}
