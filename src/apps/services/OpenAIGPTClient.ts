import OpenAI from "openai";

class OpenAIGPTClient {
  private openai: OpenAI;

  constructor(apiKey: string) {
    this.openai = new OpenAI({
      apiKey: apiKey,
    });
  }

  async prompt(prompt: string): Promise<string> {
    const response = await this.openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-4",
    });

    const text = response.choices[0].message.content!;
    return text;
  }
}

export default OpenAIGPTClient;
