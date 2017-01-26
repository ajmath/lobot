#!/usr/bin/env node

const challonge = require('../challonge.js')

challonge.getRankings('innerrim3', 'F').then((res) => {
  console.log(res);
  process.exit(0);
}).catch(err => console.log(err));

setInterval(() => {}, 1000);
