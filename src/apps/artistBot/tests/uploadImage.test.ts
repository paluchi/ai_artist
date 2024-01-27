const fs = require("fs");
const path = require("path");
require("dotenv").config();

import ArtistBot from "../ArtistBot";

describe("ArtistBot", () => {
  let artistBot: any;

  beforeAll(async () => {
    artistBot = new ArtistBot(
      process.env.INSTAGRAM_USERNAME as any,
      process.env.INSTAGRAM_PASSWORD as any,
      process.env.DALLE_API_KEY as any
    );
    await artistBot.init();
  });

  it("uploadImagePost should upload an image", async () => {
    const imagePath = "test.png";
    const imageBuffer = fs.readFileSync(imagePath);

    const mockComments = [
      {
        text: "Test comment",
        like_count: 10,
        username: "testuser",
      },
    ];

    // Using the first mock comment to generate a description
    const description = artistBot.generateDescription(
      mockComments[0].text,
      mockComments[0].like_count,
      mockComments[0].username
    );

    await artistBot.uploadImagePost([imageBuffer], description);

    // Perform any necessary assertions or checks here
    // Note: Verifying actual upload on Instagram might require additional steps
  });
});
