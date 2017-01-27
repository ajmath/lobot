'use strict';

// Include the serverless-slack bot framework
const slack = require('serverless-slack');


exports.handler = slack.handler.bind(slack);

const group = (parts, msg, bot) => {
  bot.reply({
    text: "I'm sorry, I don't know how to print standings for this group yet"
  });
};

const division = (parts, msg, bot) => {
  bot.reply({
    text: "I'm sorry, I don't know how to print standings for this division yet"
  });
};

const league = (parts, msg, bot) => {
  bot.reply({
    text: "I'm sorry, I don't know how to print standings for the league yet"
  });
};

const help = (parts, msg, bot) => {
  bot.reply({
    text: 'How can I be of service to you?\n' +
      ' * `group` - provide group standings\n' +
      ' * `division` - provide division standings\n' +
      ' * `league` - provide league standings\n' +
      'To run any of these commands, simply type `@lobot <command>`'
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

  let cmd = parts[1];
  if (cmd === 'help') {
    help(parts, msg, bot);
  } else if (cmd === 'group') {
    group(parts, msg, bot);
  } else if (cmd === 'division') {
    division(parts, msg, bot);
  } else if (cmd === 'league') {
    league(parts, msg, bot);
  }
});
