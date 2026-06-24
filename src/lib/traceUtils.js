function textFromParts(parts) {
  return (parts ?? [])
    .map((p) => (p.type === 'text' ? p.content : ''))
    .filter(Boolean)
    .join('\n');
}

function messageToText(msg) {
  if (typeof msg.content === 'string') return msg.content;
  if (Array.isArray(msg.parts)) return textFromParts(msg.parts);
  return JSON.stringify(msg);
}

export function extractInput(input) {
  if (typeof input === 'string') return input;
  if (!Array.isArray(input)) return JSON.stringify(input, null, 2);
  const userMsgs = input.filter((m) => m.role === 'user');
  const last = userMsgs[userMsgs.length - 1];
  return last ? messageToText(last) : JSON.stringify(input, null, 2);
}

export function extractOutput(output) {
  if (typeof output === 'string') return output;
  if (!Array.isArray(output)) return JSON.stringify(output, null, 2);
  const assistantMsgs = output.filter((m) => m.role === 'assistant');
  const last = assistantMsgs[assistantMsgs.length - 1];
  return last ? messageToText(last) : JSON.stringify(output, null, 2);
}

export function formatMessages(value) {
  if (typeof value === 'string') return value;
  if (!Array.isArray(value)) return JSON.stringify(value, null, 2);
  return value
    .map((m) => `[${(m.role ?? 'unknown').toUpperCase()}]\n${messageToText(m)}`)
    .join('\n\n');
}

export function getModel(trace) {
  return (
    trace.metadata?.model ||
    trace.metadata?.attributes?.['gen_ai.request.model'] ||
    null
  );
}

export function getProvider(trace) {
  return (
    trace.metadata?.provider ||
    trace.metadata?.attributes?.['gen_ai.provider.name'] ||
    null
  );
}

export function getTokens(trace) {
  const attrs = trace.metadata?.attributes ?? {};
  const input =
    trace.metadata?.inputTokens ?? (Number(attrs['gen_ai.usage.input_tokens']) || 0);
  const output =
    trace.metadata?.outputTokens ?? (Number(attrs['gen_ai.usage.output_tokens']) || 0);
  return {
    inputTokens: input,
    outputTokens: output,
    totalTokens: trace.metadata?.totalTokens ?? input + output,
  };
}
