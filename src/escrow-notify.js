'use strict';

const matchScheduled = require('./match-scheduled');
const juggler = require('./juggler');
const slackHelper = require('./slack-helper');
const listPrinter = require('./r2d7/listprinter');

const validPlayerRecord = (player) => player && player.name && player.list && player.division_name;

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

  if (!body.tier_name || !validPlayerRecord(body.player1) || !validPlayerRecord(body.player1) || !body.url) {
    console.error('Invalid post body', event.body);
    return callback(null, {
      statusCode: 400,
      body: 'invalid post body'
    });
  }

  console.log(`Escrow notif for ${body.tier_name}: ${body.player1.name} (${body.player1.division_name}) ` +
    `vs ${body.player2.name} (${body.player2.division_name})`);

  juggler.getPlayerChannels(body.player1, body.player2, body.tier_name)
    .then(channels => {
      const isInterdivisional = channels.length > 2;
      let msgLines = [`*${isInterdivisional ? 'Inter-divisional e' : 'E'}scrow notification*`];
      msgLines = msgLines.concat(getPlayerListLines(isInterdivisional, body.player1));
      msgLines.push('\nvs.\n');
      msgLines = msgLines.concat(getPlayerListLines(isInterdivisional, body.player2));
      const msg = msgLines.join('\n');
      return Promise.all(channels.map(channel => {
        return slackHelper.postMessageToChannel(channel, msg);
      }));
    })
    .then(channels => {
      if (!body.scheduled_datetime) {
        return channels;
      }
      return Promise.all(channels.map(channel => {
        return matchScheduled.postScheduledGameMessage(
          channel,
          body.scheduled_datetime,
          body.url
        );
      }));
    })
    .catch(err => {
      console.error('unhandled exception', err);
      if (err.statusCode) {
        callback(null, err);
      } else {
        callback(null, {
          statusCode: 500,
          body: err
        });
      }
    })
    .then((channels) => {
      const channelNames = channels.filter(c => c).map(c => c.name);
      console.log('sent message to channels', channelNames);
      const response = {
        statusCode: 200,
        body: `posted to channels ${JSON.stringify(channelNames)}`
      };
      callback(null, response);
    });
};
