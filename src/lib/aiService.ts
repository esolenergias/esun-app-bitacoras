export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export async function generateAIContent(
  messages: AIMessage[],
  geminiApiKey: string,
  siliconFlowApiKey: string,
  geminiModel: string = 'gemini-2.5-flash',
  temperature: number = 0.4
): Promise<string> {
  const cleanSiliconKey = (siliconFlowApiKey || '').trim().replace(/^["']|["']$/g, '');
  const cleanGeminiKey = (geminiApiKey || '').trim().replace(/^["']|["']$/g, '');

  // Fallback to Gemini
  if (cleanGeminiKey) {
    let systemInstruction = '';
    const formattedContents: any[] = [];
    
    let lastRole = '';
    for (const msg of messages) {
      if (msg.role === 'system') {
        systemInstruction += msg.content + '\n';
      } else {
        const role = msg.role === 'assistant' ? 'model' : 'user';
        if (formattedContents.length > 0 && lastRole === role) {
          formattedContents[formattedContents.length - 1].parts[0].text += "\n" + msg.content;
        } else {
          formattedContents.push({
            role: role,
            parts: [{ text: msg.content }]
          });
          lastRole = role;
        }
      }
    }

    const payload: any = {
      contents: formattedContents,
      generationConfig: { temperature }
    };

    if (systemInstruction) {
      payload.systemInstruction = {
        parts: [{ text: systemInstruction.trim() }]
      };
    }

    const modelsToTry = [geminiModel, 'gemini-3.5-flash', 'gemini-2.5-flash', 'gemini-flash-latest'];
    
    let lastError = null;

    for (const model of modelsToTry) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${cleanGeminiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          let errText = response.statusText;
          try {
            const errorJson = await response.json();
            errText = errorJson.error?.message || JSON.stringify(errorJson);
          } catch(e) {
            errText = await response.text();
          }
          throw new Error(`Gemini API Error: ${response.status} - ${errText}`);
        }

        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      } catch (err: any) {
        lastError = err;
        // If it's a 400 (Bad Request), it might be a prompt issue, don't retry models
        if (err.message && err.message.includes('400')) break;
        // Continue to next model
      }
    }
    
    throw lastError || new Error("Failed to generate content with Gemini.");
  }

  throw new Error('No API Keys available for AI generation.');
}
