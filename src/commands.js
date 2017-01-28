'use strict';

const Table = require('cli-table');

const channelMap = require('./channel-mappings.js');
const challonge = require('./challonge.js');
const slackHelper = require('./slack-helper.js');

const getMapping = (bot) => {
  return slackHelper.getChannelName(bot)
    .then(name => {
      const mapping = channelMap[name];
      if (!mapping) {
        throw new Error(`I don't know anything about channel: ${name}`);
      }
      return mapping;
    });
};

module.exports.respondWithGroupStandings = (bot) => {
  return getMapping(bot)
    .then(mapping => challonge.getDivisionRankings(mapping.division, mapping.group))
    .then(rankings => {
      const table = new Table({
        head: ['Rank', 'Name', 'Win', 'Loss', 'MOV'],
        colors: false
      });
      rankings.forEach((r, i) => table.push([ i + 1, r.name, r.win, r.loss, r.mov ]));
      bot.reply({
        text: '```\n' + table.toString() + '\n```'
      });
    });
};

module.exports.respondWithDivisionStandings = (bot) => {
  return getMapping(bot)
    .then(mapping => challonge.getDivisionRankings(mapping.division))
    .then(rankings => {
      const table = new Table({
        head: ['Rank', 'Name', 'Win', 'Loss', 'MOV', 'Group'],
        colors: false
      });
      rankings.slice(0, 10)
        .forEach((r, i) => table.push([ i + 1, r.name, r.win, r.loss, r.mov, r.group ]));
      bot.reply({
        text: '```\n' + table.toString() + '\n```'
      });
    });
};
