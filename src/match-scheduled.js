'use strict';

const juggler = require('./juggler');
const slackHelper = require('./slack-helper');
const moment = require('moment');

const parseStartTimeStr = (startTimeStr) => moment(startTimeStr, 'DD-MM-YYYY hh:mm a Z');

const idealNotificationTime = 15;
const postScheduledGameReminder = (channel, player1Name, player2Name, startTimeStr) => {
  const startTime = parseStartTimeStr(startTimeStr);
  let notificationTime = startTime.subtract(idealNotificationTime, 'minutes');
  if (notificationTime.isBefore(moment())) {
    notificationTime = moment().add(30, 'seconds');
  }
  const startingIn = notificationTime.diff(startTime, 'minutes');
  const msg = `${channel.name} Scheduled match between ${player1Name} and ${player2Name}` +
    `starting in ${startingIn} minutes`;
  console.log(`Posting to slack: '/remind #${channel.name} ${msg}' (at ${notificationTime.format()})`);
  return slackHelper.postReminder(msg, notificationTime.valueOf(), channel);
};

const postScheduledGameMessage = (channel, startTimeStr, url, player1Name, player2Name) => {
  const t = parseStartTimeStr(startTimeStr);
  const slackDate = `<!date^${t.unix()}^{date_long_pretty} at {time}|${t.utc().format()}>`;
  const playerInfo = player1Name && player2Name ? ` between <@${player1Name}> and <@${player2Name}> ` : ' ';
  const msg = `Match scheduled${playerInfo}for ${slackDate} | <${url}|View on List Juggler>`;
  return slackHelper.postMessageToChannel(channel, msg, {
    parse: 'none',
    mrkdwn: false
  });
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
    "tier_name": "Lobot Testing",
    "scheduled_datetime": "27-09-2017 01:00 AM CDT-0500"
  }
*/
const handler = (event, context, callback) => {
  function errorMessage (statusCode, message) {
    console.log(message, event.body);
    return callback(null, {
      statusCode: statusCode,
      body: message
    });
  }

  console.log('handling match-scheduled', event.body);

  let body;
  try {
    body = JSON.parse(event.body);
  } catch (e) {
    return errorMessage(400, 'Non-JSON post body');
  }

  if (!body.player1 || !body.player2 || !body.scheduled_datetime || !body.tier_name || !body.url) {
    return errorMessage(400, 'Missing required keys in post body');
  }

  console.log('invoking main stuff');
  return juggler.getPlayerChannels(body.player1, body.player2, body.tier_name)
    .then(channels => {
      return Promise.all(channels.map(channel => {
        return postScheduledGameMessage(
          channel,
          body.scheduled_datetime,
          body.url,
          body.player1.name,
          body.player2.name
        );
      }));
    })
    .then(channels => {
      const channelNames = channels.filter(c => c).map(c => c.name);
      console.log('sent message to channels', channelNames);
      const response = {
        statusCode: 200,
        body: `posted to channels ${JSON.stringify(channelNames)}`
      };
      callback(null, response);
    })
    .catch(e => errorMessage(500, 'Unhandled exception'));
};

module.exports = {
  handler,
  parseStartTimeStr,
  postScheduledGameReminder,
  postScheduledGameMessage
};
