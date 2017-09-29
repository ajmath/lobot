'use strict';

const juggler = require('./juggler');
const slackHelper = require('./slack-helper');

const postMatchResult = (channel, url, player1, player2, winner) => {
  let score = `${player1.points_destroyed}-${player2.points_destroyed}`;
  if (winner === player2.name) {
    score = `${player2.points_destroyed}-${player1.points_destroyed}`;
  }

  const fallback = `Match result for @${player1.name} vs @${player2.name} ` +
    `- ${winner} wins ${score} | <${url}|View on List Juggler>`;
  return slackHelper.postMessageToChannel(channel, null, {
    attachments: [{
      fallback,
      color: 'danger',
      title: 'Match result',
      title_link: url,
      text: `<@${player1.name}> vs <@${player2.name}>`,
      fields: [
        // {
        //   title: `${player1.name} - Points Destroyed`,
        //   value: player1.points_destroyed,
        //   short: true
        // },
        // {
        //   title: `${player1.name} - MoV`,
        //   value: player1.mov,
        //   short: true
        // },
        // {
        //   title: `${player2.name} - Points Destroyed`,
        //   value: player2.points_destroyed,
        //   short: true
        // },
        // {
        //   title: `${player2.name} - MoV`,
        //   value: player2.mov,
        //   short: true
        // },
        {
          title: `${player1.name} (mov)`,
          value: `${player1.points_destroyed} (${player1.mov})`,
          short: true
        },
        {
          title: `${player2.name} (mov)`,
          value: `${player2.points_destroyed} (${player2.mov})`,
          short: true
        },
        {
          title: 'Winner',
          value: winner,
          short: true
        }
      ]
    }]
  });
};

/**
 * expected payload:
 {
   "player2": {
     "division_name": "Akiva",
     "name": "ernie",
     "points_destroyed": 100
   },
   "player1": {
     "division_name": "Mustafar",
     "name": "bert",
     "points_destroyed": 99
   },
   "tier_name": "Lobot Testing",
   "winner": "ernie",
   "url": "http://lists.starwarsclubhouse.com/league_match?match_id=7075"
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

  console.log('handling match-completed', event.body);

  let body;
  try {
    body = JSON.parse(event.body);
  } catch (e) {
    return errorMessage(400, 'Non-JSON post body');
  }

  if (!body.player1 || !body.player2 || !body.tier_name || !body.url) {
    return errorMessage(400, 'Missing required keys in post body');
  }

  console.log('invoking main stuff');
  return juggler.getPlayerChannels(body.player1, body.player2, body.tier_name)
    .then(channels => {
      return Promise.all(channels.map(channel => {
        return postMatchResult(
          channel,
          body.url,
          body.player1,
          body.player2,
          body.winner
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
  handler
};
