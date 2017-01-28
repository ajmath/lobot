'use strict';

const WebClient = require('@slack/client').WebClient;

const getChannelName = (bot) => {
  const web = new WebClient(bot.auth.bot.bot_access_token);
  return new Promise((resolve, reject) => {
    web.channels.list((err, info) => {
      if (err) {
        console.log('Error getting channel list:', err);
        return reject(err);
      }
      const matches = info.channels.filter(c => c.id === bot.payload.event.channel);
      if (!matches || matches.length === 0) {
        return reject('no channel found');
      }
      return resolve(matches[0].name);
    });
  });
};

module.exports = {
  getChannelName: getChannelName
};
