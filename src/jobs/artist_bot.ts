import env from "../utils/env";
import nodeCron from "node-cron";
import ArtistBot from "../apps/artistBot/ArtistBot";

const artistBot = new ArtistBot(
  env.INSTAGRAM_USERNAME,
  env.INSTAGRAM_PASSWORD,
  env.DALLE_API_KEY,
  env.MONOLOGUE_CONTEXT,
  env.MONOLOGUE_LENGTH
);
artistBot.init();

const runArtistBot = async () => {
  try {
    await artistBot.run(env.LAST_N_COMMENTS);
    console.log("ArtistBot ran successfully");
  } catch (error) {
    console.error("Error running ArtistBot:", error);
  }
};

const scheduleJob = () => {
  // Schedule the task to run twice a day, for example at 8 AM and 8 PM
  nodeCron.schedule("0 8,20 * * *", runArtistBot);
};

export default scheduleJob;

export { runArtistBot };
