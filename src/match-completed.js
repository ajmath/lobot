'use strict';

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
  console.log('match-completed', event.body);
  callback(null, {
    statusCode: 200,
    body: 'It totally worked, I wouldn\'t lie I promise'
  });
};

module.exports = {
  handler
};
