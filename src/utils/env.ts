export default {
  INSTAGRAM_USERNAME: process.env.INSTAGRAM_USERNAME as string,
  INSTAGRAM_PASSWORD: process.env.INSTAGRAM_PASSWORD as string,
  DALLE_API_KEY: process.env.DALLE_API_KEY as string,
  LAST_N_COMMENTS: parseInt(process.env.LAST_N_COMMENTS as string),
};
