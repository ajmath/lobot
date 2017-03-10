'use strict';

const WebClient = require('@slack/client').WebClient;
const db = require('serverless-slack/src/dynamo');

const slackHelper = require('./slack-helper');

const teamId = process.env.TEAM_ID;

const testingChannelId = process.env.TEST_CHANNEL_ID;

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
  },
  'Lobot Testing': {
    numeral: 9
  }
};

const findTierChannel = (tier, channels) => {
  const channelRegex = new RegExp(`${tier}_[a-z]*`);
  const channel = channels.find(c => c.name.match(channelRegex));
  if (!channel) {
    console.log(`escrow-notify: could not find channel matching ${channelRegex}`);
  }
  return channel;
};

const findPlayerChannel = (player, tier, channels) => {
  const cleanDivision = player.challonge_division_name.replace(' ', '').toLowerCase();
  const channelRegex = new RegExp(`${tier}[a-z]-${cleanDivision}`);
  const channel = channels.find(c => c.name.match(channelRegex));
  if (!channel) {
    console.log(`escrow-notify: could not find channel matching ${channelRegex}`);
  }
  return channel;
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
      const player1Channel = findPlayerChannel(body.player1, tier.numeral, channels);
      const player2Channel = findPlayerChannel(body.player2, tier.numeral, channels);
      if (!player1Channel && !player2Channel) {
        console.log(`escrow-notify: no match for either player`);
        throw new Error('could not find channel for either player tier/division');
      }
      const playerChannelIds = [];
      if (player1Channel) {
        playerChannelIds.push(player1Channel.id);
      }
      const isInterdivisional = player2Channel && player2Channel.id !== player1Channel.id;
      if (isInterdivisional) {
        const tierChannel = findTierChannel(tier.numeral, channels);
        playerChannelIds.push(tierChannel.id);
        playerChannelIds.push(player2Channel.id);
      }

      let msg = `*${isInterdivisional ? 'Inter-divisional e' : 'E'}scrow notification* \n` +
        `:hit: *<${body.player1.list}|${body.player1.name} (${body.player1.challonge_division_name})>* :hit:\n` +
        `${body.player1.pretty_print}\n\n` +
        `:hit: *<${body.player2.list}|${body.player2.name} (${body.player1.challonge_division_name})>* :hit:\n` +
        `${body.player2.pretty_print}\n\n`;
      if (body.scheduled_datetime) {
        msg += `Scheduled for ${body.scheduled_datetime}\n\n`;
      }
      playerChannelIds.push(testingChannelId);// Add lobot-testing channel
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
