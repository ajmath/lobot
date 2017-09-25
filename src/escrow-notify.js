'use strict';

const WebClient = require('@slack/client').WebClient;
const db = require('serverless-slack/src/dynamo');
const slackHelper = require('./slack-helper');
const listPrinter = require('./r2d7/listprinter');

const teamId = process.env.TEAM_ID;
const testingChannelId = process.env.TEST_CHANNEL_ID;

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

const validPlayerRecord = (player) => player && player.name && player.list && player.division_name;

const findTierChannel = (tier, channels) => {
  const channelRegex = new RegExp(`${tier}_[a-z]*`);
  const channel = channels.find(c => c.name.match(channelRegex));
  if (!channel) {
    console.log(`escrow-notify: could not find channel matching ${channelRegex}`);
  }
  return channel;
};

const findPlayerChannel = (player, tier, channels) => {
  const cleanDivision = player.division_name.replace(' ', '').toLowerCase();
  const channelRegex = new RegExp(`${tier}[a-z]-${cleanDivision}`);
  const channel = channels.find(c => c.name.match(channelRegex));
  if (!channel) {
    console.log(`escrow-notify: could not find channel matching ${channelRegex}`);
  }
  return channel;
};

const getPlayerListLines = (isInterdivisional, player) => {
  const lines = listPrinter.printXws(player.list, player.xws);
  lines[0] = `*|* ${lines[0]}`;
  if (isInterdivisional) {
    lines[0] = `(${player.division_name}) ${lines[0]}`;
  }
  lines[0] = `*${player.name}* ${lines[0]}`;
  return lines;
};

module.exports.handler = (event, context, callback) => {
  let body;
  try {
    body = JSON.parse(event.body);
  } catch (e) {
    console.error('Invalid post body', event.body);
    return callback(null, {
      statusCode: 400,
      body: 'invalid post body'
    });
  }

  if (!body.tier_name || !validPlayerRecord(body.player1) || !validPlayerRecord(body.player1)) {
    console.error('Invalid post body', event.body);
    return callback(null, {
      statusCode: 400,
      body: 'invalid post body'
    });
  }

  const tier = tiers[body.tier_name];
  if (!tier) {
    console.error(`uknown tier name ${body.tier_name}`, event.body);
    return callback(null, {
      statusCode: 400,
      body: `uknown tier name ${body.tier_name}`
    });
  }

  console.log(`Escrow notif for ${body.tier_name}: ${body.player1.name} (${body.player1.division_name}) ` +
    `vs ${body.player2.name} (${body.player2.division_name})`);

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
      const playerChannelIds = [testingChannelId, player1Channel.id].filter(c => c);
      const isInterdivisional = player2Channel && player2Channel.id !== player1Channel.id;
      if (isInterdivisional) {
        const tierChannel = findTierChannel(tier.numeral, channels);
        playerChannelIds.push(tierChannel.id);
        playerChannelIds.push(player2Channel.id);
      }

      let msgLines = [`*${isInterdivisional ? 'Inter-divisional e' : 'E'}scrow notification*`];
      msgLines = msgLines.concat(getPlayerListLines(isInterdivisional, body.player1));
      msgLines.push('\nvs.\n');
      msgLines = msgLines.concat(getPlayerListLines(isInterdivisional, body.player2));
      if (body.scheduled_datetime) {
        msgLines.push(`\nScheduled for ${body.scheduled_datetime}\n`);
      }
      const msg = msgLines.join('\n');
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
