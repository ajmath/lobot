'use strict';

const WebClient = require('@slack/client').WebClient;
const db = require('serverless-slack/src/dynamo');

const slackHelper = require('./slack-helper');

const teamId = process.env.TEAM_ID;

const validPlayerRecord = (player) => player.name && player.list && player.challonge_division_name;

const tiers = {
  'Deep Core': {
    numeral: 1
  },
  'Core Worlds': {
    numeral: 2
  },
  'Inner Rim': {
    numeral: 3
  },
  'Outer Rim': {
    numeral: 4
  },
  'Unknown Reaches': {
    numeral: 5
  }
};

module.exports.handler = (event, context, callback) => {
  let body;
  try {
    body = JSON.parse(event.body);
  } catch (e) {
    return callback(null, {
      statusCode: 400,
      body: 'invalid post body'
    });
  }

  if (!body.tier_name || !validPlayerRecord(body.player1) || !validPlayerRecord(body.player1)) {
    return callback(null, {
      statusCode: 400,
      body: 'invalid post body'
    });
  }

  const tier = tiers[body.tier_name];
  if (!tier) {
    return callback(null, {
      statusCode: 400,
      body: `uknown tier name ${body.tier_name}`
    });
  }

  let token;
  db.get(teamId)
    .then(r => {
      token = r.bot.bot_access_token;
      return token;
    })
    .then(slackHelper.getChannelsWithToken)
    .then(channels => {
      const player1ChannelPrefix = `${tier.numeral}${body.player1.challonge_division_name.toLowerCase()}`;
      const player1Channel = channels.find(c => c.name.toLowerCase().startsWith(player1ChannelPrefix));
      const player2ChannelPrefix = `${tier.numeral}${body.player2.challonge_division_name.toLowerCase()}`;
      const player2Channel = channels.find(c => c.name.toLowerCase().startsWith(player2ChannelPrefix));
      if (!player1Channel && !player2Channel) {
        const msg = `could not find channels matching ${player1ChannelPrefix} or ${player2ChannelPrefix}`;
        console.log(`escrow-notify: ${msg}`);
        throw new Error({ statusCode: 400, body: msg });
      }
      const playerChannelIds = [];
      if (player1Channel) playerChannelIds.push(player1Channel.id);
      if (player2Channel && player2Channel.id !== player1Channel.id) {
        playerChannelIds.push(player2Channel.id);
      }

      const msg = `:tada: *Escrow notification* :tada: ${body.player1.name} vs ${body.player2.name}\n` +
        `*${body.player1.name}*: ${body.player1.list}\n` +
        `*${body.player2.name}*: ${body.player2.list}\n`;
      const web = new WebClient(token);
      return Promise.all(playerChannelIds.map(channelId => {
        return new Promise((resolve, reject) => {
          web.chat.postMessage(channelId, msg, (err, info) => {
            if (err) {
              console.log(`error posting to slack channel ${channelId}`, err);
              return reject(`error posting to slack channel ${channelId}`);
            }
            return resolve(channelId);
          });
        });
      }));
    })
    .then((channels) => {
      console.log('sent message to channels', channels);
      const response = {
        statusCode: 200,
        body: 'posted'
      };
      callback(null, response);
    })
    .catch(err => {
      console.log('unhandled exception', err);
      if (err.statusCode) {
        callback(null, err);
      } else {
        callback(null, {
          statusCode: 500,
          body: err
        });
      }
    });
};
