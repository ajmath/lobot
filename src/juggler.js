'use strict';

const axios = require('axios');

const juggler = 'http://lists.starwarsclubhouse.com/api/v1';
const currentLeagueId = process.env.CURRENT_LEAGUE_ID;
const validChannelNameRegex = /^[1-5][a-m]-[a-z]*$/;

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
  }
};

const parseChannelInfo = (channelName) => {
  if (!channelName || channelName.match(validChannelNameRegex) === null) {
    throw new Error(`invalid channel name: ${channelName}`);
  }
  const channelTierDivision = channelName.split('-')[0];
  const channelTier = channelTierDivision[0];
  const channelDivision = channelTierDivision[1].toUpperCase();

  return {
    tier: channelTier,
    division: channelDivision
  };
};

const jugglerTierForSlackTier = (channelTier) => {
  if (leagueTierDivisionIds[currentLeagueId] && leagueTierDivisionIds[currentLeagueId][channelTier]) {
    return leagueTierDivisionIds[currentLeagueId][channelTier];
  }
  throw new Error(`unsupported league/tier ${currentLeagueId}/${channelTier}`);
};

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
