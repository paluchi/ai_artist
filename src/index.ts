require("dotenv").config();

import scheduleArtistBotJob, { runArtistBot } from "./jobs/artist_bot";

const main = async () => {
  scheduleArtistBotJob();
};

// setTimeout(async () => {
//   await runArtistBot();
// }, 5000);

main();
