'use strict';

// Include the serverless-slack bot framework
const slack = require('serverless-slack');
// const slackHelper = require('./slack-helper.js');

exports.handler = slack.handler.bind(slack);

// TODO: Find out why this can't live in slack-helper.js
const WebClient = require('@slack/client').WebClient;
const getChannelName = (bot) => {
  console.log('getting channel name');
  const web = new WebClient(bot.auth.bot.bot_access_token);
  console.log('connecting with access token ', bot.auth.bot.bot_access_token);

  return new Promise((resolve, reject) => {
    web.channels.list((err, info) => {
      if (err) {
        console.log('Error getting channel list:', err);
        return reject(err);
      }
      const channelId = bot.payload.event.channel;
      console.log('looking for channel', channelId);
      console.log(`found channels`, info);
      const matches = info.channels.filter(c => c.id === bot.payload.event.channel);
      if (!matches || matches.length === 0) {
        return reject('no channel found');
      }
      return resolve(matches[0].name);
    });
  });
};
// end TODO

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
  const replyWithChannelName = (name) => {
    bot.reply({
      text: `channel name is ${name}`
    });
  };
  getChannelName(bot)
    .then(replyWithChannelName)
    .catch(replyWithChannelName);
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
  console.log('got event');

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
  } else if (cmd === 'debug') {
    debug(parts, msg, bot);
  }
});
