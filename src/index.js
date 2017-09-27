'use strict';

// Include the serverless-slack bot framework
const slack = require('serverless-slack');
const commands = require('./commands.js');

module.exports.handler = slack.handler.bind(slack);

const debug = (parts, msg, bot) => {
  bot.reply({
    text: 'parts:\n' +
      '```\n' +
      JSON.stringify(parts, null, 2) + '\n' +
      '```\n' +
      'msg:\n' +
      '```\n' +
      JSON.stringify(msg, null, 2) + '\n' +
      '```\n' +
      'bot:\n' +
      '```\n' +
      JSON.stringify(bot, null, 2) + '\n' +
      '```\n'
  });
};

const help = (parts, msg, bot) => {
  bot.reply({
    text: 'How can I be of service to you?\n' +
      ' * `standings|group|division` - provide group/division standings based on this channel name\n' +
      ' * `tier` - provide division standings based on this channel name\n' +
      'To run any of these commands, simply type `@lobot <command>`'
  });
};

const notImplmented = (bot) => {
  bot.reply({
    text: "I'm sorry, I don't know how to do that yet"
  });
};

// Slash Command handler
slack.on('message', (msg, bot) => {
  const botId = bot.auth.bot.bot_user_id;
  if (!msg.event.text.startsWith(`<@${botId}>`)) {
    return;
  }

  let parts = msg.event.text.split(' ');
  if (parts.length === 1) {
    return;
  }

  console.log(`Processing message: ${msg.event.text} @ ${msg.event.event_ts}`);
  let cmd = parts[1];
  if (cmd === 'help') {
    help(parts, msg, bot);
  } else if (cmd === 'standings') {
    commands.respondWithStandings(bot, msg);
  } else if (cmd === 'division' || cmd === 'group') {
    commands.respondWithGroupStandings(bot, msg);
  } else if (cmd === 'tier') {
    commands.respondWithTierStandings(bot, msg);
  } else if (cmd === 'league') {
    notImplmented(bot);
  } else if (cmd === 'debug') {
    debug(parts, msg, bot);
  }
});
