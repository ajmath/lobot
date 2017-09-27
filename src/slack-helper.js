'use strict';

const WebClient = require('@slack/client').WebClient;
const db = require('serverless-slack/src/dynamo');

const teamId = process.env.TEAM_ID;

let webClient;
const getWebClient = () => {
  if (webClient) {
    return Promise.resolve(webClient);
  }
  return db.get(teamId).then(record => {
    webClient = new WebClient(record.bot.bot_access_token);
    return webClient;
  });
};

let channels;
const getChannels = () => {
  if (channels) {
    return channels;
  }
  return getWebClient().then(web => {
    return new Promise((resolve, reject) => {
      web.channels.list(true, (err, info) => {
        if (err) {
          console.log('Error getting channel list:', err);
          return reject(err);
        }
        channels = info.channels;
        return resolve(channels);
      });
    });
  });
};

const getChannelName = (bot) => {
  return getChannels()
    .then((channels) => {
      const matches = channels.filter(c => c.id === bot.payload.event.channel);
      if (!matches || matches.length === 0) {
        throw new Error('no channel found');
      }
      return matches[0].name;
    });
};

const postMessageToChannel = (channel, msg) => {
  return getWebClient()
    .then(web => {
      return new Promise((resolve, reject) => {
        web.chat.postMessage(channel.id, msg, (err, info) => {
          if (err) {
            console.log(`error posting to slack channel ${channel}`, err);
            return reject(`error posting to slack channel ${channel}`);
          }
          return resolve(channel);
        });
      });
    });
};

const postCommandToChannel = (channel, command, msg) => {
  const payload = {
    channel: channel.id,
    command,
    text: msg
  };
  return getWebClient()
    .then(web => {
      return new Promise((resolve, reject) => {
        console.log(`Posting command ${command} ${JSON.stringify(payload)} to channel ${channel}`);
        return web.chat.command(payload, (err, info) => {
          if (err) {
            console.log(`error posting command to slack channel ${channel}`, err);
            return reject(`error posting command to slack channel ${channel}`);
          }
          return resolve(channel);
        });
      });
    });
};

module.exports = {
  getChannelName: getChannelName,
  getChannels: getChannels,
  getWebClient: getWebClient,
  postMessageToChannel,
  postCommandToChannel
};
