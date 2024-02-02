import OpenAI from "openai";

export type Voice = "alloy" | "nova" | "onyx";

class OpenAIAudioClient {
  private openai: OpenAI;

  constructor(apiKey: string) {
    this.openai = new OpenAI({
      apiKey: apiKey,
    });
  }

  async text_to_speech(input: string, voice: Voice = "alloy"): Promise<Buffer> {
    const response = await this.openai.audio.speech.create({
      model: "tts-1",
      voice: voice,
      input: input,
    });

    const audioStream = response.body as any;
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      audioStream.on("data", (chunk: any) => chunks.push(Buffer.from(chunk)));
      audioStream.on("end", () => resolve(Buffer.concat(chunks)));
      audioStream.on("error", reject);
    });
  }
}

export default OpenAIAudioClient;
