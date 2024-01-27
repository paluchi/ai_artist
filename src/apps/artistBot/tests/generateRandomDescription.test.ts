require("dotenv").config();

import ArtistBot from "../ArtistBot";

describe("ArtistBot", () => {
  let artistBot: any;

  beforeEach(() => {
    artistBot = new ArtistBot(
      process.env.INSTAGRAM_USERNAME as any,
      process.env.INSTAGRAM_PASSWORD as any,
      process.env.DALLE_API_KEY as any
    );
    // Assuming no init is needed for generating descriptions
  });

  it("generateRandomDescription should return random descriptions", () => {
    const descriptions = [];
    for (let i = 0; i < 5; i++) {
      descriptions.push(artistBot.generateRandomImageDescription());
    }

    expect(descriptions).toBeInstanceOf(Array);
    expect(descriptions).toHaveLength(5);

    // Additional assertions can be made based on the expected format of the descriptions
    descriptions.forEach((description) => {
      expect(typeof description).toBe("string");
      // Further expectations based on the structure of your descriptions
    });

    console.log("Random Descriptions:\n", descriptions);
  });
});
