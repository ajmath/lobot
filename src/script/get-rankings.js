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
      channel: 'C3U5JCBP1'
    }
  },
  reply: (msg) => console.log(msg.text)
}).then(() => process.exit(0));
setInterval(() => {}, 1000);
