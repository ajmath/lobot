#!/usr/bin/env node

const commands = require('../commands.js');

commands.respondWithDivisionStandings({
  auth: {
    bot: {
      bot_access_token: process.env.BOT_ACCESS_TOKEN
    }
  },
  payload: {
    event: {
      channel: process.env.CHANNEL_ID
    }
  },
  reply: (msg) => console.log(msg.text)
}).then(() => process.exit(0))
.catch(err => {
  console.log('fatal error: ', err);
  process.exit(1);
});
setInterval(() => {}, 1000);
