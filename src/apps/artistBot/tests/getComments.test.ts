require("dotenv").config();

import ArtistBot from "../ArtistBot";

describe("ArtistBot", () => {
  let artistBot: any;

  beforeEach(async () => {
    // Initialize ArtistBot with real environment variables
    artistBot = new ArtistBot(
      process.env.INSTAGRAM_USERNAME as any,
      process.env.INSTAGRAM_PASSWORD as any,
      process.env.DALLE_API_KEY as any
    );
    await artistBot.init(); // Ensure init is called before tests
  });

  it("getLastCommentsWithMostLikes should return real comments", async () => {
    const comments = await artistBot.getLastCommentsWithMostLikes();
    console.log("comments: ", comments);
    // Perform assertions based on the expected structure of real comments
    expect(comments).toBeInstanceOf(Array);
    expect(comments[0]).toHaveProperty("text");
    expect(comments[0]).toHaveProperty("like_count");
    expect(comments[0]).toHaveProperty("username");
  });
});
