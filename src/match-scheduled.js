'use strict';

const juggler = require('./juggler');
const slackHelper = require('./slack-helper');
const moment = require('moment');

const idealNotificationTime = 15;
module.exports.postScheduledGameReminder = (channel, player1Name, player2Name, startTimeStr) => {
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

/**
 * expected payload:
  {
    "player2": {
      "division_name": "Akiva",
      "name": "ernie"
    },
    "player1": {
      "division_name": "Mustafar",
      "name": "bert"
    },
    "scheduled_datetime": "2/25/17 19:00 PST"
  }
*/
module.exports.handler = (event, context, callback) => {
  function errorMessage(statusCode, message) {
    console.error(message, event.body);
    return callback(null, {
      statusCode: statusCode,
      body: message
    });
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch (e) {
    return errorMessage(400, 'Non-JSON post body');
  }

  if (!body.player1 || !body.player2 || !body.scheduled_datetime || !body.tier_name) {
    return errorMessage(400, 'Missing required keys in post body');
  }

  return juggler.getPlayerChannels(body.player1, body.player2, body.tier_name)
    .then(channels => {
      return channels.map(channel => {
        return module.exports.postScheduledGameReminder(
          channel.id,
          channel.name,
          body.player1.name,
          body.player2.name,
          body.scheduled_datetime,
        );
      });
    });
};
