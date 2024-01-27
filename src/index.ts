require("dotenv").config();

import scheduleArtistBotJob, { runArtistBot } from "./jobs/artist_bot";

const main = async () => {
  scheduleArtistBotJob();
};

main();
