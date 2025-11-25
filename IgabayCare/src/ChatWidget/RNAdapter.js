export async function sendMessageRN({ apiBase, token, prompt, conversation }) {
  const res = await fetch(`${apiBase}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ prompt, conversation })
  });
  const text = await res.text();
  const cleaned = text.replace(/^data:\s*/gm, '');
  return cleaned;
}