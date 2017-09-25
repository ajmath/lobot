'use strict';

const axios = require('axios');

const juggler = 'http://lists.starwarsclubhouse.com/api/v1';
const currentLeagueId = process.env.CURRENT_LEAGUE_ID;
const validDivisionChannelNameRegex = /^[1-5][a-v]-[a-z]*$/;
const validTierChannelNameRegex = /^[1-5]_[a-z]*$/;

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

const parseChannelInfo = (channelName) => {
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

const jugglerTierForSlackTier = (channelTier) => {
  if (leagueTierDivisionIds[currentLeagueId] && leagueTierDivisionIds[currentLeagueId][channelTier]) {
    return leagueTierDivisionIds[currentLeagueId][channelTier];
  }
  throw new Error(`unsupported league/tier ${currentLeagueId}/${channelTier}`);
};
module.exports.parseChannelInfo = parseChannelInfo;

module.exports.tierRankingsForChannel = (channelName) => {
  const channelInfo = parseChannelInfo(channelName);
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
