import fs from "fs";
import ffmpegPath from "@ffmpeg-installer/ffmpeg";
import ffmpeg from "fluent-ffmpeg";
import ffprobePath from "@ffprobe-installer/ffprobe";
ffmpeg.setFfprobePath(ffprobePath.path);
ffmpeg.setFfmpegPath(ffmpegPath.path);

import { faker } from "@faker-js/faker";

import InstagramClient, { Comment } from "../services/InstragramClient";
import OpenAIDalleClient from "../services/OpenAIDalleClient";
import subjects from "./utils/subjects";
import actions from "./utils/actions";
import contexts from "./utils/contexts";
import env from "../../utils/env";
import OpenAIGPTClient from "../services/OpenAIGPTClient";
import OpenAIAudioClient, { Voice } from "../services/OpenAIAudioClient";

class ArtistBot {
  private instagram: InstagramClient;
  private dalle: OpenAIDalleClient;
  private GPT: OpenAIGPTClient;
  private audioGen: OpenAIAudioClient;
  monologueContext: string;
  monologueLength: number;

  constructor(
    username: string,
    password: string,
    dalleApiKey: string,
    monologueContext: string = "",
    monologueLength: number = 60
  ) {
    this.instagram = new InstagramClient(username, password);
    this.dalle = new OpenAIDalleClient(dalleApiKey);
    this.GPT = new OpenAIGPTClient(dalleApiKey);
    this.audioGen = new OpenAIAudioClient(dalleApiKey);
    this.monologueContext = monologueContext;
    this.monologueLength = monologueLength;
  }

  async init(): Promise<void> {
    await this.instagram.init();
  }

  // Get the last N comments with the most likes
  async getLastCommentsWithMostLikes(
    lastNcomments?: number
  ): Promise<Comment[]> {
    return this.instagram.getMostLikedCommentsFromLastImage(lastNcomments);
  }

  // Upload a post with a set of media and a caption
  async uploadPost(media: Buffer[], caption: string): Promise<void> {
    await this.instagram.uploadPost(media, caption);
  }

  // Generate a description for a given comment
  generateCommentDescription(
    comment: string,
    likes: number,
    username: string
  ): string {
    return `\n\nInput: '${comment}'. \n\nCrafted with the help of @${username}'s comment, which gathered ${likes} likes.`;
  }

  // Generate a random image description
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

  // Generate a comment by the bot
  generateBotComment(): Comment {
    return {
      text: this.generateRandomImageDescription(),
      like_count: 0,
      username: env.INSTAGRAM_USERNAME,
    };
  }

  // Generate post content for a given comment
  async generateCommentPostContent(
    comment: Comment,
    type: "image" | "video" = "video",
    retryCount = 0
  ): Promise<{
    media: Buffer;
    description: string;
    coverImage?: Buffer;
  }> {
    try {
      const description = this.generateCommentDescription(
        comment.text,
        comment.like_count,
        comment.username
      );

      // Generate image
      const image = await this.generateImage(comment.text);

      // If type is video, generate monologue audio and create a video
      if (type === "video") {
        const audioBuffer = await this.generateCommentMonologue(comment);
        const videoBuffer = await this.createVideoFromImageAndAudio(
          image,
          audioBuffer
        );
        return {
          media: videoBuffer,
          description,
          coverImage: image,
        };
      }

      // If type is image, return the image as is
      return {
        media: image,
        description,
      };
    } catch (error) {
      if (retryCount >= 5) {
        console.error("Error generating content:", error);
        throw new Error("Too many errors while generating post content");
      } else {
        console.warn(`Error on attempt ${retryCount + 1}:`, error);
        await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait for 5 seconds before retrying
        return this.generateCommentPostContent(comment, type, retryCount + 1);
      }
    }
  }

  // Generate images for a set of prompts
  async generateImage(prompt: string): Promise<Buffer> {
    return await this.dalle.generateImage(prompt);
  }

  // Create a video from an image buffer and an audio buffer
  async createVideoFromImageAndAudio(
    image: Buffer,
    audioBuffer: Buffer
  ): Promise<Buffer> {
    const imageFilePath = "temp_image.jpg"; // or .png
    const audioFilePath = "temp_audio.mp3";
    const videoFilePath = "output_video.mp4";

    // Save the image and audio buffers to files
    fs.writeFileSync(imageFilePath, image);
    fs.writeFileSync(audioFilePath, audioBuffer);

    // Get the duration of the audio file
    const audioDuration = await this.getAudioDuration(audioFilePath);

    return new Promise((resolve, reject) => {
      ffmpeg()
        .input(imageFilePath)
        .inputFPS(1) // Static image, so 1 frame per second
        .loop(audioDuration + 1) // Audio duration plus 1 second
        .input(audioFilePath)
        .audioCodec("aac")
        .videoCodec("libx264")
        .size("1080x1080")
        .outputOptions("-pix_fmt yuv420p")
        .output(videoFilePath)
        .on("end", () => {
          // Read the video file to buffer and resolve
          resolve(fs.readFileSync(videoFilePath));
          // Clean up temporary files
          fs.unlinkSync(imageFilePath);
          fs.unlinkSync(audioFilePath);
          fs.unlinkSync(videoFilePath);
        })
        .on("error", (err) => {
          reject(err);
        })
        .run();
    });
  }

  async getAudioDuration(filePath: string): Promise<number> {
    return new Promise((resolve, reject): any => {
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) reject(err);
        else resolve(metadata.format.duration!);
      });
    });
  }

  // Generate molologue story with GPT for a given comment, returns a string with the story
  async generateCommentMonologue(comment: Comment): Promise<Buffer> {
    // Context window text
    const contextText = `
      You will receive an image description. Envision yourself as the depicted character and the following -> 
      ${this.monologueContext}
    
      INPUT TEXT: '${comment.text}'
    
      IMPORTANT:
      The narrative must be limited to ${this.monologueLength} words or less.
      The narrative must strictly follow the language style of the 'INPUT TEXT'. (Essential)


      Your response should have STRICTLY the following format:
    
      Monologue: '...'
    
      voice: <alloy/nova/onyx> (pick explicitly one where chidish/masculine kid/teen, woman or feminine, man respectively)
    `;

    try {
      const story = await this.GPT.prompt(contextText);

      let monologue: string = "";
      let voice: Voice = "alloy"; // Default value

      // Case-insensitive regular expressions to capture the monologue and voice
      const monologueMatch = story.match(/monologue: '([\s\S]*?)'\s*voice:/i);
      const voiceMatch = story.match(/voice: (\w+)/i);

      if (monologueMatch && monologueMatch[1]) {
        monologue = monologueMatch[1].trim();
      }
      if (voiceMatch && voiceMatch[1]) {
        if (voiceMatch.includes("nova")) {
          voice = "nova";
        } else if (voiceMatch.includes("onyx")) {
          voice = "onyx";
        }
      }

      // Generate audio for the monologue
      return await this.audioGen.text_to_speech(monologue, voice);
    } catch (error) {
      console.log(error);
      throw new Error("Error generating story");
    }
  }

  async run(lastNcomments?: number): Promise<void> {
    // Process each comment
    try {
      // Attempt to get the comments with the most likes
      let comments = await this.getLastCommentsWithMostLikes(lastNcomments);

      // If no comments, use a bot-generated comment
      if (comments.length === 0) {
        comments = [this.generateBotComment()];
      }

      const media: Buffer[] = [];
      const descriptions: string[] = [];

      for (const comment of comments) {
        // Generate post content for each comment
        const content = await this.generateCommentPostContent(comment);
        media.push(content.media);
        descriptions.push(content.description);
      }

      // Join all descriptions with two newlines
      let fullDescription = descriptions.join("\n\n");
      // Append the common text at the end of the descriptions
      fullDescription +=
        "\n\nThis media was generated with AI that creates media from text captions for a wide range of concepts expressible in natural language.\n\nRepo:\nhttps://github.com/paluchi/ai_artist\n\n#ai #art #dalle #openai #creative #technology #innovation #future #design #digitalart #artificialintelligence";

      // Upload all media as a single post if there are any images
      if (media.length > 0) {
        await this.instagram.uploadPost(media, fullDescription);
      }
    } catch (error) {
      console.error("Error processing comments:", error);
      // Handle any additional error logging or recovery as needed
    }
  }
}

export default ArtistBot;
