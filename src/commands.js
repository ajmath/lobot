'use strict';

const Table = require('cli-table');

const slackHelper = require('./slack-helper.js');
const juggler = require('./juggler.js');

module.exports.respondWithGroupStandings = (bot, msg) => {
  return slackHelper.getChannelName(bot)
    .then(juggler.tierRankingsForChannel)
    .then(rankings => {
      const division = rankings.division_ranking
        .find(r => r.division_name === rankings.channel_info.division);
      if (!division) {
        throw new Error(`could not find division: ${rankings.channel_info.division}`);
      }
      const table = new Table({
        head: ['Rank', 'Name', 'Win', 'Loss', 'Draws', 'MOV'],
        colors: false
      });
      division.rankings.forEach((r, i) => table.push([
        r.rank,
        r.name,
        r.wins,
        r.losses ? r.losses : r.loses,
        r.draws,
        r.mov
      ]));
      bot.reply({
        text: '```\n' + table.toString() + '\n```\n'
      });
    })
    .catch(err => {
      console.error('Fatal error requesting group standings', err);
      bot.reply({
        text: `:interrobang: ${err}`
      });
    });
};

module.exports.respondWithTierStandings = (bot, msg) => {
  return slackHelper.getChannelName(bot)
    .then(juggler.tierRankingsForChannel)
    .then(rankings => {
      const table = new Table({
        head: ['Rank', 'Name', 'Win', 'Loss', 'Draws', 'MOV', 'Division'],
        colors: false
      });
      rankings.tier_ranking.slice(0, 10).forEach((r, i) => {
        const division = rankings.division_ranking
          .find(d => d.rankings.some(dr => dr.name === r.name));
        table.push([
          r.rank,
          r.name,
          r.wins,
          r.losses,
          r.draws,
          r.mov,
          `${division.division_name} (${division.division_letter})`
        ]);
      });
      bot.reply({
        text: '```\n' + table.toString() + '\n```'
      });
    })
    .catch(err => {
      console.error('Fatal error requesting tier standings', err);
      bot.reply({
        text: `:interrobang: ${err}`
      });
    });
};
