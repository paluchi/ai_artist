require("dotenv").config();

import ArtistBot from "../ArtistBot";
import fs from "fs";
import path from "path";

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

  it("generateCommentMonologue should return a Buffer audio", async () => {
    const prompt = "very short menologue please. only 10 to 20 words";
    const audioBuffer = await artistBot.generateCommentMonologue({
      text: prompt,
      like_count: 0,
      username: "test",
    });

    // Store the audio to a file
    const filePath = path.join(__dirname, "output.mp3");
    fs.writeFile(filePath, audioBuffer, (err) => {
      if (err) {
        console.error("Error writing audio file:", err);
      } else {
        console.log("Audio file saved successfully.");
      }
    });

    // Perform assertions
    expect(audioBuffer).toBeInstanceOf(Buffer);
  }, 75000);
});
