import { faker } from "@faker-js/faker";

import InstagramClient, { Comment } from "../services/InstragramClient";
import OpenAIDalleClient from "../services/OpenAIDalleClient";
import subjects from "./utils/subjects";
import actions from "./utils/actions";
import contexts from "./utils/contexts";
import env from "../../utils/env";

class ArtistBot {
  private instagram: InstagramClient;
  private dalle: OpenAIDalleClient;

  constructor(username: string, password: string, dalleApiKey: string) {
    this.instagram = new InstagramClient(username, password);
    this.dalle = new OpenAIDalleClient(dalleApiKey);
  }

  async init(): Promise<void> {
    await this.instagram.init();
  }

  async getLastCommentsWithMostLikes(): Promise<Comment[]> {
    return this.instagram.getMostLikedCommentsFromLastImage();
  }

  generateDescription(
    comment: string,
    likes: number,
    username: string
  ): string {
    return `\n\nInput: '${comment}'. \n\nCrafted with the help of @${username}'s comment, which gathered ${likes} likes.\n\nThis image was generated with a reduced version of OpenAI´s DALL·E.\nDALL·E creates images from text captions for a wide range of concepts expressible in natural language.\nCheck https://openai.com/blog/dall-e/ to know more! \n\nSpecial thanks to:\ngithub.com/borisdayma\ngithub.com/saharmor\n\nDevs:\nhttps://github.com/paluchi/ai_artist\n#dalle #openai #dalle2 #art`;
  }

  async generateImages(prompts: string[]): Promise<Buffer[]> {
    const images: Buffer[] = [];

    for (const prompt of prompts) {
      const image = await this.dalle.generateImage(prompt);
      images.push(image);
    }

    return images;
  }

  async uploadImagePost(images: Buffer[], caption: string): Promise<void> {
    await this.instagram.uploadImagePost(images, caption);
  }

  async run(): Promise<void> {
    let comments = await this.getLastCommentsWithMostLikes();
    if (comments.length === 0) {
      comments = [
        {
          text: this.generateRandomImageDescription(),
          like_count: 0,
          username: env.INSTAGRAM_USERNAME,
        },
      ];
    }
    const descriptions = comments.map((comment) =>
      this.generateDescription(
        comment.text,
        comment.like_count,
        comment.username
      )
    );

    for (let i = 0; i < comments.length; i++) {
      const images = await this.generateImages([comments[i].text]);
      const description = descriptions[i];
      await this.instagram.uploadImagePost(images, description);
    }
  }

  generateRandomImageDescription() {
    function getRandomElement(array: any) {
      return array[Math.floor(Math.random() * array.length)];
    }

    const subject = getRandomElement(subjects);
    const action = getRandomElement(actions);
    const context = getRandomElement(contexts);
    const moodAdjective = faker.commerce.productAdjective();
    const moodNoun = faker.music.genre();

    return `${subject} ${action} ${context}, evoking a ${moodAdjective} and ${moodNoun} mood.`;
  }
}

export default ArtistBot;
