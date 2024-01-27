import axios from "axios";
import OpenAI from "openai";

class OpenAIDalleClient {
  private openai: OpenAI;

  constructor(apiKey: string) {
    this.openai = new OpenAI({
      apiKey: apiKey,
    });
  }

  async downloadImage(url: string): Promise<Buffer> {
    const response = await axios.get(url, {
      responseType: "arraybuffer",
    });
    return response.data;
  }

  async generateImage(prompt: string): Promise<Buffer> {
    const response = await this.openai.images.generate({
      prompt: prompt,
      n: 1, // Number of images to generate
      model: "dall-e-3", // The ID of the model that should be used to generate images
      quality: "standard",
      // Include other parameters as needed
    });

    // The API returns an array of images. We'll take the first one.
    const imageUrl = response.data[0].url as string;

    // download image from url as a buffer with axios
    return this.downloadImage(imageUrl);
  }
}

export default OpenAIDalleClient;
