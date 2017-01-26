'use strict';

// Include the serverless-slack bot framework
const slack = require('serverless-slack');


// The function that AWS Lambda will call
exports.handler = slack.handler.bind(slack);

const configure = (parts, msg, bot) => {
  bot.reply({
    text: "I'm sorry, I don't know how to configure this channel yet"
  });
};

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
    text: "How can I be of service to you?\n" +
      " * `group` - provide group standings\n" +
      " * `division` - provide division standings\n" +
      " * `league` - provide league standings\n" +
      " * `configure` - configure challonge group/division for this channel\n" +
      "To learn more about any of these, type `@lobot <command> help`"
  });
};

// Slash Command handler
slack.on('message', (msg, bot) => {
  // let message = {
  //   text: "How would you like to greet the channel?",
  //   attachments: [{
  //     fallback: 'actions',
  //     callback_id: "greetings_click",
  //     actions: [
  //       { type: "button", name: "Wave", text: ":wave:", value: ":wave:" },
  //       { type: "button", name: "Hello", text: "Hello", value: "Hello" },
  //       { type: "button", name: "Howdy", text: "Howdy", value: "Howdy" },
  //       { type: "button", name: "Hiya", text: "Hiya", value: "Hiya" }
  //     ]
  //   }]
  // };
  //
  const botId = bot.auth.bot.bot_user_id;
  if (!msg.event.text.startsWith(`<@${botId}>`)) {
    return;
  }

  let parts = msg.event.text.split(' ');
  if (parts.length === 1) {
    return;
  }

  let cmd = parts[1];
  if (cmd === "help") {
    help(parts, msg, bot);
  }
  else if (cmd == "configure") {
    configure(parts, msg, bot);
  }
  else if (cmd == "group") {
    group(parts, msg, bot);
  }
  else if (cmd == "division") {
    division(parts, msg, bot);
  }
  else if (cmd == "league") {
    league(parts, msg, bot);
  }
});

//
// // Interactive Message handler
// slack.on('greetings_click', (msg, bot) => {
//   let message = {
//     // selected button value
//     text: msg.actions[0].value
//   };
//
//   // public reply
//   bot.reply(message);
// });
//
//
// Reaction Added event handler
slack.on('reaction_added', (msg, bot) => {
  bot.reply({
    text: ':wave:'
  });
});
