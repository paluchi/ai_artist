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

  async getLastCommentsWithMostLikes(
    lastNcomments?: number
  ): Promise<Comment[]> {
    return this.instagram.getMostLikedCommentsFromLastImage(lastNcomments);
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

  generatePostDescription(
    comment: string,
    likes: number,
    username: string
  ): string {
    return `\n\nInput: '${comment}'. \n\nCrafted with the help of @${username}'s comment, which gathered ${likes} likes.`;
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

  generateBotComment(): Comment {
    return {
      text: this.generateRandomImageDescription(),
      like_count: 0,
      username: env.INSTAGRAM_USERNAME,
    };
  }

  async generateCommentPostContent(
    comment: Comment,
    retryCount = 0
  ): Promise<{
    image: Buffer;
    description: string;
  }> {
    try {
      const description = this.generatePostDescription(
        comment.text,
        comment.like_count,
        comment.username
      );

      const images = await this.generateImages([comment.text]);

      return {
        image: images[0],
        description,
      };
    } catch (error) {
      if (retryCount >= 5) {
        console.log(error);
        throw new Error("Too many errors while generating post content");
      } else if (retryCount >= 2) {
        await new Promise((resolve) => setTimeout(resolve, 5000));
        return this.generateCommentPostContent(
          this.generateBotComment(),
          retryCount + 1
        );
      } else {
        return this.generateCommentPostContent(comment, retryCount + 1);
      }
    }
  }

  async run(lastNcomments?: number): Promise<void> {
    // Attempt to get the comments with the most likes
    let comments = await this.getLastCommentsWithMostLikes(lastNcomments);

    // If no comments, use a bot-generated comment
    if (comments.length === 0) {
      comments = [this.generateBotComment()];
    }

    const images: Buffer[] = [];
    const descriptions: string[] = [];

    // Process each comment
    try {
      for (const comment of comments) {
        // Generate post content for each comment
        const content = await this.generateCommentPostContent(comment);
        images.push(content.image);
        descriptions.push(content.description);
      }

      // Join all descriptions with two newlines
      let fullDescription = descriptions.join("\n\n");
      // Append the common text at the end of the descriptions
      fullDescription +=
        "\n\nThis image was generated with AI that creates images from text captions for a wide range of concepts expressible in natural language.\n\nRepo:\nhttps://github.com/paluchi/ai_artist\n\n#ai #art #dalle #openai #creative #technology #innovation #future #design #digitalart #artificialintelligence";

      // Upload all images as a single post if there are any images
      if (images.length > 0) {
        await this.instagram.uploadImagePost(images, fullDescription);
      }
    } catch (error) {
      console.error("Error processing comments:", error);
      // Handle any additional error logging or recovery as needed
    }
  }
}

export default ArtistBot;
