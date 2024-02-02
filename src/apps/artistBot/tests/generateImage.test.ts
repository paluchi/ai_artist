const fs = require("fs");
const path = require("path");
require("dotenv").config();

import ArtistBot from "../ArtistBot";

describe("ArtistBot", () => {
  let artistBot: any;

  beforeEach(async () => {
    artistBot = new ArtistBot(
      process.env.INSTAGRAM_USERNAME as any,
      process.env.INSTAGRAM_PASSWORD as any,
      process.env.DALLE_API_KEY as any
    );
    await artistBot.init();
  });

  it("generateImage should return an image buffer", async () => {
    const prompt = "Fox running";
    const images = await artistBot.generateImage(prompt);

    // Perform assertions
    expect(images).toBeInstanceOf(Array);
    expect(images[0]).toBeInstanceOf(Buffer);

    // Save the image to a file
    const filePath = path.join(__dirname, "robot_dancing.jpg");
    fs.writeFileSync(filePath, images[0]);
  }, 35000);
});
