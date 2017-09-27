'use strict';

const WebClient = require('@slack/client').WebClient;
const db = require('serverless-slack/src/dynamo');

const teamId = process.env.TEAM_ID;
const remindersToken = process.env.REMINDERS_TOKEN;

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
    return Promise.resolve(channels);
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

const postMessageToChannel = (channel, msg, opts = null) => {
  return getWebClient()
    .then(web => {
      return new Promise((resolve, reject) => {
        web.chat.postMessage(channel.id, msg, opts, (err, info) => {
          if (err) {
            console.log(`error posting to slack channel ${channel}`, err);
            return reject(`error posting to slack channel ${channel}`);
          }
          return resolve(channel);
        });
      });
    });
};

/**
 * Does not work at all
 **/
const postReminder = (text, unixTimestamp, channel) => {
  const web = new WebClient(remindersToken);
  return new Promise((resolve, reject) => {
    const opts = { user: `#${channel.name}` };
    web.reminders.add(text, unixTimestamp, opts, (err, info) => {
      if (err) {
        console.log(`error adding slack reminder ${text} ${channel.name}`, err);
        return reject(`error adding slack reminder ${text} ${channel.name}`);
      }
      console.log('Response from reminders.add', info);
      return resolve(channel);
    });
  });
};

module.exports = {
  getChannelName,
  getChannels,
  getWebClient,
  postMessageToChannel,
  postReminder
};
