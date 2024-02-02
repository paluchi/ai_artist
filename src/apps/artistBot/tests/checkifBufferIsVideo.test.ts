require("dotenv").config();

import InstagramClient from "../../services/InstragramClient";

describe("ArtistBot", () => {
  let instagramClient: InstagramClient;

  beforeEach(async () => {
    // Initialize ArtistBot with real environment variables
    instagramClient = new InstagramClient(
      process.env.INSTAGRAM_USERNAME as any,
      process.env.INSTAGRAM_PASSWORD as any
    );
    await instagramClient.init(); // Ensure init is called before tests
  });

  it("checkifBufferIsVideo should return true if a buffer is a video", async () => {
    // Load ./video.mp4 into a buffer
    const videoBuffer = Buffer.from(require("fs").readFileSync("./video.mp4"));
    const imageBuffer = Buffer.from(require("fs").readFileSync("./image.jpeg"));

    const buffer1isVideo = await instagramClient.checkIfBufferIsVideo(
      videoBuffer
    );
    const buffer2isVideo = await instagramClient.checkIfBufferIsVideo(
      imageBuffer
    );
    // Perform assertions based on the expected structure of real comments
    expect(buffer1isVideo).toBe(true);
    expect(buffer2isVideo).toBe(false);
  });
});
