'use strict';

const WebClient = require('@slack/client').WebClient;

const getChannelName = (bot) => {
  console.log('getting channel name');
  const web = new WebClient(bot.auth.bot.bot_access_token);
  console.log('connecting with access token ', bot.auth.bot.bot_access_token);

  return new Promise((resolve, reject) => {
    web.channels.list((err, info) => {
      if (err) {
        console.log('Error getting channel list:', err);
        return reject(err);
      }
      console.log(`found channels`, info);
      const matches = info.channels.filter(c => c.id === bot.auth.incoming_webhook.channel_id);
      if (!matches || matches.length === 0) {
        return reject('no channel found');
      }
      return resolve(matches[0].name);
    });
  });
};

exports = {
  getChannelName: getChannelName
};
