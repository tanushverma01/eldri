import OpenAI from 'openai';

export async function analyzeScreenWithAI(base64Image: string, prompt: string, apiKey: string) {
  if (!apiKey) {
    throw new Error("No API Key found. Please add your OpenAI key in the Dashboard.");
  }

  // Initialize OpenAI (dangerouslyAllowBrowser is needed because Tauri runs a local webview)
  const openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });

  const systemPrompt = "You are Eldri, an elite, hyper-intelligent desktop assistant. Analyze the user's screen context and answer their prompt directly and concisely.";

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: [
          { type: "text", text: prompt || "Explain what is on my screen right now." },
          { type: "image_url", image_url: { url: base64Image } }
        ]
      }
    ],
    max_tokens: 800,
  });

  return response.choices[0].message.content;
}