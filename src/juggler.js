'use strict';

const axios = require('axios');
const slackHelper = require('./slack-helper');

const juggler = 'http://lists.starwarsclubhouse.com/api/v1';
const currentLeagueId = process.env.CURRENT_LEAGUE_ID;
const validDivisionChannelNameRegex = /^[1-5][a-v]-[a-z]*$/;
const validTierChannelNameRegex = /^[1-5]_[a-z]*$/;
const testChannel = {
  id: process.env.TEST_CHANNEL_ID,
  name: process.env.TEST_CHANNEL_NAME
};

const tiers = {
  'Deep Core': {
    numeral: 1
  },
  'Core Worlds': {
    numeral: 2
  },
  'Inner Rim': {
    numeral: 3
  },
  'Outer Rim': {
    numeral: 4
  },
  'Unknown Reaches': {
    numeral: 5
  },
  'Lobot Testing': {
    numeral: 9
  }
};

const leagueTierDivisionIds = {
  '5': {
    '1': '21',
    '2': '19',
    '3': '17',
    '4': '20',
    '5': '18'
  },
  '6': {
    '1': '26',
    '2': '24',
    '3': '22',
    '4': '25',
    '5': '23'
  },
  '7': {
    '1': '31',
    '2': '29',
    '3': '27',
    '4': '30',
    '5': '28'
  }
};

const findPlayerChannel = (divisionName, tier, channels) => {
  const cleanDivision = divisionName.replace(' ', '').toLowerCase();
  const channelRegex = new RegExp(`${tier}[a-z]-${cleanDivision}`);
  const channel = channels.find(c => c.name.match(channelRegex));
  if (!channel) {
    console.log(`escrow-notify: could not find channel matching ${channelRegex}`);
  }
  return channel;
};

const findTierChannel = (tier, channels) => {
  const channelRegex = new RegExp(`${tier}_[a-z]*`);
  const channel = channels.find(c => c.name.match(channelRegex));
  if (!channel) {
    console.log(`escrow-notify: could not find channel matching ${channelRegex}`);
  }
  return channel;
};

const jugglerTierForSlackTier = (channelTier) => {
  if (leagueTierDivisionIds[currentLeagueId] && leagueTierDivisionIds[currentLeagueId][channelTier]) {
    return leagueTierDivisionIds[currentLeagueId][channelTier];
  }
  throw new Error(`unsupported league/tier ${currentLeagueId}/${channelTier}`);
};

module.exports.parseChannelInfo = (channelName) => {
  if (channelName && channelName.match(validDivisionChannelNameRegex)) {
    const channelTierDivision = channelName.split('-')[0];
    return {
      tier: channelTierDivision[0],
      division: channelTierDivision[1].toUpperCase()
    };
  } else if (channelName && channelName.match(validTierChannelNameRegex)) {
    const tier = channelName.split('_')[0];
    return {
      tier,
      division: 'ALL'
    };
  } else {
    throw new Error(`Cannot parse leage info from channel name '${channelName}'`);
  }
};

module.exports.getPlayerChannels = (player1, player2, tierName) => {
  return slackHelper.getChannels()
    .then(channels => {
      const tier = tiers[tierName];
      if (!tier) {
        throw new Error(`unknown tier name ${tierName}`);
      }
      const player1Channel = findPlayerChannel(player1.division_name, tier.numeral, channels);
      const player2Channel = findPlayerChannel(player2.division_name, tier.numeral, channels);
      if (!player1Channel && !player2Channel) {
        console.log(`escrow-notify: no match for either player`);
        throw new Error('could not find channel for either player tier/division');
      }
      const playerChannelIds = [testChannel, player1Channel].filter(c => c);
      const isInterdivisional = player2Channel && player2Channel.id !== player1Channel.id;
      if (isInterdivisional) {
        const tierChannel = findTierChannel(tier.numeral, channels);
        playerChannelIds.push(tierChannel);
        playerChannelIds.push(player2Channel);
      }
      return playerChannelIds;
    });
};

module.exports.tierRankingsForChannel = (channelName) => {
  const channelInfo = module.exports.parseChannelInfo(channelName);
  const tier = jugglerTierForSlackTier(channelInfo.tier);
  const url = `${juggler}/vassal_league_ranking/${currentLeagueId}/tier/${tier}/`;
  return axios.get(url).then(resp => {
    if (resp.status !== 200) {
      throw new Error(`non-200 status from list juggler: ${resp.status} ${url}`);
    }
    return {
      'division_ranking': resp.data.division_ranking,
      'tier_ranking': resp.data.tier_ranking,
      'channel_info': channelInfo
    };
  });
};
