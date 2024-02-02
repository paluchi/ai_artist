const fs = require("fs");
const path = require("path");
require("dotenv").config();

import ArtistBot from "../ArtistBot";

describe("ArtistBot", () => {
  let artistBot: ArtistBot;

  beforeEach(async () => {
    artistBot = new ArtistBot(
      process.env.INSTAGRAM_USERNAME as any,
      process.env.INSTAGRAM_PASSWORD as any,
      process.env.DALLE_API_KEY as any
    );
    await artistBot.init();
  });

  it("generateVideoPostContent should return a video buffer and caption", async () => {
    const prompt =
      "obese guy. short monologue";
    const postContent = await artistBot.generateCommentPostContent(
      { text: prompt, like_count: 0, username: "test" },
      "video"
    );

    // Store the video to a file
    const filePath = path.join(__dirname, "video.mp4");
    fs.writeFile(filePath, postContent.media, (err: any) => {
      if (err) {
        console.error("Error storing video:", err);
      } else {
        console.log("Video stored successfully.", filePath);
      }
    });

    // Perform assertions
    expect(postContent.media).toBeInstanceOf(Buffer);
    expect(postContent.coverImage).toBeInstanceOf(Buffer);
    expect(typeof postContent.description).toBe("string");
  }, 75000);
});
