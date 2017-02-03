'use strict';

const WebClient = require('@slack/client').WebClient;
const db = require('serverless-slack/src/dynamo');

const teamId = process.env.TEAM_ID;

const getChannelName = (bot) => {
  return getChannelsWithToken(bot.auth.bot.bot_access_token)
    .then((channels) => {
      const matches = channels.filter(c => c.id === bot.payload.event.channel);
      if (!matches || matches.length === 0) {
        throw new Error('no channel found');
      }
      return matches[0].name;
    });
};

const getChannelsWithToken = (token) => {
  const web = new WebClient(token);
  return new Promise((resolve, reject) => {
    web.channels.list((err, info) => {
      if (err) {
        console.log('Error getting channel list:', err);
        return reject(err);
      }
      return resolve(info.channels);
    });
  });
};

const getChannels = () => {
  return db.get(teamId).then(record => {
    return getChannelsWithToken(record.bot.bot_access_token);
  });
};

module.exports = {
  getChannelName: getChannelName,
  getChannelsWithToken: getChannelsWithToken,
  getChannels: getChannels
};
