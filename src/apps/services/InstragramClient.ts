import sharp from "sharp";
import ffmpeg from "fluent-ffmpeg";
import fs from "fs";
import {
  IgApiClient,
  MediaCommentsFeedResponseCommentsItem,
} from "instagram-private-api";

export interface Comment {
  text: string;
  like_count: number;
  username: string;
}

class InstagramClient {
  private ig: IgApiClient;
  private username: string;
  private password: string;

  constructor(username: string, password: string) {
    this.ig = new IgApiClient();
    this.ig.state.generateDevice(username);
    this.username = username;
    this.password = password;
  }

  // Await init before calling any other methods
  async init(): Promise<void> {
    await this.ig.account.login(this.username, this.password);
  }

  checkIfBufferIsVideo(buffer: Buffer): boolean {
    // MP4 files usually have 'ftyp' at the 5th byte
    const MP4_SIGNATURE = "66747970"; // 'ftyp' in hexadecimal
    const signature = buffer.toString("hex", 4, 8);

    return signature === MP4_SIGNATURE;
  }

  async getMostLikedCommentsFromLastImage(
    lastn: number = 1
  ): Promise<Comment[]> {
    const feed = this.ig.feed.user(this.ig.state.cookieUserId);
    const posts = await feed.items();
    if (posts.length === 0) throw new Error("No posts found");

    const commentsFeed = this.ig.feed.mediaComments(posts[0].id);
    const allComments: MediaCommentsFeedResponseCommentsItem[] =
      await commentsFeed.items();

    const formattedComments: Comment[] = allComments.map((comment) => ({
      text: comment.text,
      like_count: comment.comment_like_count,
      username: comment.user.username,
    }));

    return formattedComments
      .sort((a, b) => b.like_count - a.like_count)
      .slice(0, lastn);
  }

  async uploadPost(media: Buffer[], caption: string): Promise<void> {
    for (const mediaBuffer of media) {
      const isVideo = await this.checkIfBufferIsVideo(mediaBuffer);
      if (isVideo) {
        // extract the first frame of the video as jpeg buffer
        const coverImage = await this.extractFirstFrameAsJPEG(mediaBuffer);

        await this.ig.publish.video({
          video: mediaBuffer,
          coverImage: coverImage,
          caption: caption,
        });
        return;
      }

      // Convert to JPEG
      const jpegBuffer = await this.convertToJpegBuffer(mediaBuffer);
      await this.ig.publish.photo({
        file: jpegBuffer,
        caption: caption,
      });
    }
  }

  async extractFirstFrameAsJPEG(videoBuffer: Buffer): Promise<Buffer> {
    // Write the video buffer to a temporary file
    const tempVideoPath = "temp_video.mp4";
    const tempImagePath = "temp_frame.jpg";

    fs.writeFileSync(tempVideoPath, videoBuffer);

    return new Promise((resolve, reject) => {
      ffmpeg(tempVideoPath)
        .frames(1) // Extract only the first frame
        .output(tempImagePath)
        .on("end", () => {
          // Read the image file into a buffer
          const imageBuffer = fs.readFileSync(tempImagePath);

          // Clean up temporary files
          fs.unlinkSync(tempVideoPath);
          fs.unlinkSync(tempImagePath);

          resolve(imageBuffer);
        })
        .on("error", (err) => {
          // Clean up temporary files in case of error
          fs.unlinkSync(tempVideoPath);
          if (fs.existsSync(tempImagePath)) {
            fs.unlinkSync(tempImagePath);
          }
          reject(err);
        })
        .run();
    });
  }
  async convertToJpegBuffer(buffer: Buffer): Promise<Buffer> {
    try {
      const jpegBuffer = await sharp(buffer)
        .jpeg() // Convert to JPEG
        .toBuffer(); // Output as a buffer
      return jpegBuffer;
    } catch (error) {
      console.error("Error converting image:", error);
      throw error;
    }
  }
}

export default InstagramClient;
