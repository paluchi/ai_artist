import {
  IgApiClient,
  MediaCommentsFeedResponseCommentsItem,
} from "instagram-private-api";
import sharp from "sharp";

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

  async uploadImagePost(images: Buffer[], caption: string): Promise<void> {
    for (const imageBuffer of images) {
      // Convert to JPEG
      const jpegBuffer = await this.convertToJpegBuffer(imageBuffer);
      await this.ig.publish.photo({
        file: jpegBuffer,
        caption: caption,
      });
    }
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
