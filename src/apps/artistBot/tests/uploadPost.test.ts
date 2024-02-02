const fs = require("fs");
require("dotenv").config();

import ArtistBot from "../ArtistBot";

describe("ArtistBot", () => {
  let artistBot: ArtistBot;

  beforeAll(async () => {
    artistBot = new ArtistBot(
      process.env.INSTAGRAM_USERNAME as any,
      process.env.INSTAGRAM_PASSWORD as any,
      process.env.DALLE_API_KEY as any
    );
    await artistBot.init();
  });

  it("uploadPost should upload media", async () => {
    const mediaPath = "video.mp4";
    const mediaBuffer = fs.readFileSync(mediaPath);

    const mockComments = [
      {
        text: "Test comment",
        like_count: 10,
        username: "testuser",
      },
    ];

    // Using the first mock comment to generate a description
    const description = artistBot.generatePostDescription(
      mockComments[0].text,
      mockComments[0].like_count,
      mockComments[0].username
    );

    await artistBot.uploadPost([mediaBuffer], description);

    // Perform any necessary assertions or checks here
    // Note: Verifying actual upload on Instagram might require additional steps
  }, 75000);
});
