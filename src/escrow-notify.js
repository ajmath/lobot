'use strict';

// const matchScheduled = require('./match-scheduled');
const juggler = require('./juggler');
const slackHelper = require('./slack-helper');
const listPrinter = require('./r2d7/listprinter');
const moment = require('moment');

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

const idealNotificationTime = 15;
const postScheduledGameReminder = (channel, player1Name, player2Name, startTimeStr) => {
  // TODO: Move to match-scheduled
  // Example: 28-09-2017 09:00 PM EDT-0400
  const startTime = moment(startTimeStr, 'DD-MM-YYY hh:mm a Z');
  if (startTime.isBefore(moment())) {
    return;
  }
  const notificationTime = startTime.subtract(idealNotificationTime, 'minutes');
  const secondsTilStart = notificationTime.unix() - moment().unix();
  const msg = `${channel.name} Scheduled match between ${player1Name} and ${player2Name}` +
    `starting in 15 minutes in ${secondsTilStart} seconds`;
  return slackHelper.postCommandToChannel(channel, '/remind', msg);
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

  console.log(`Escrow notif for ${body.tier_name}: ${body.player1.name} (${body.player1.division_name}) ` +
    `vs ${body.player2.name} (${body.player2.division_name})`);

  juggler.getPlayerChannels(body.player1, body.player2, body.tier_name)
    .then(channels => {
      const isInterdivisional = channels.length > 2;
      let msgLines = [`*${isInterdivisional ? 'Inter-divisional e' : 'E'}scrow notification*`];
      msgLines = msgLines.concat(getPlayerListLines(isInterdivisional, body.player1));
      msgLines.push('\nvs.\n');
      msgLines = msgLines.concat(getPlayerListLines(isInterdivisional, body.player2));
      if (body.scheduled_datetime) {
        msgLines.push(`\nScheduled for ${body.scheduled_datetime}\n`);
      }
      const msg = msgLines.join('\n');
      return Promise.all(channels.map(channel => {
        return slackHelper.postMessageToChannel(channel, msg);
      })).then(() => channels);
    })
    .then(channels => {
      if (!body.scheduled_datetime) {
        return channels;
      }
      return Promise.all(channels.map(channel => {
        return postScheduledGameReminder(
          channel,
          body.player1.name,
          body.player2.name,
          body.scheduled_datetime
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
      console.log('sent message to channels', channels);
      const response = {
        statusCode: 200,
        body: `posted to channels ${JSON.stringify(channels)}`
      };
      callback(null, response);
    });
};
