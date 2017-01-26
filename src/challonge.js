const axios = require("axios");

const challongeToken = process.env.CHALLONGE_TOKEN;
const challongeUser = 'ajmath';

const getApiUrl = (division) => `https://${challongeUser}:${challongeToken}`
  + `@api.challonge.com/v1/tournaments/xwingvassal-${division}`;

const getUsernameMap = (division) => {
  return axios.get(`${getApiUrl(division)}/participants.json`).then(resp => {
    const users = {};
    if (resp.status != 200) {
      return users;
    }

    resp.data.map(r => r.participant).forEach(r => {
      const userId = r.group_player_ids[0];
      users[userId] = {
        name: r.display_name,
        photo: r.attached_participatable_portrait_url,
        seed: r.seed,
      }

      if (users[userId].photo && users[userId].photo.startsWith("//s3")) {
        users[userId].photo = `https:${users[userId].photo}`;
      }
    });
    return users;
  });
}

const getDivsionMatches = (division) => {
  return getUsernameMap(division).then(users => {
    return axios.get(`${getApiUrl(division)}/matches.json`).then(resp => {
      if (resp.status != 200) {
        return {};
      }
      return resp.data.map(r => r.match)
        .filter(r => r.state === "complete")
        .map(rawMatch => {
          const match = {
            player1_id: rawMatch.player1_id,
            player1_name: users[rawMatch.player1_id].name,
            player1_score: parseInt(rawMatch.scores_csv.split('-')[0], 10),
            player2_id: rawMatch.player2_id,
            player2_name: users[rawMatch.player2_id].name,
            player2_score: parseInt(rawMatch.scores_csv.split('-')[1], 10),
            match_id: rawMatch.id,
            group_id: rawMatch.group_id,
            winner_id: rawMatch.winner_id,
            player1_group: String.fromCharCode(65 + users[rawMatch.player1_id].seed / 10),
            player2_group: String.fromCharCode(65 + users[rawMatch.player2_id].seed / 10),
          };
          return match;
        }
      );
    });
  })
}

const newScore = (name, group) => {
  return {
    mov: 0,
    win: 0,
    loss: 0,
    tie: 0,
    name: name,
    group: group,
  };
};

const getStats = (division) => {
  return getDivsionMatches(division).then(matches => {
    const userScores = {};
    matches.forEach(match => {
      if (!userScores[match.player1_id]) {
        userScores[match.player1_id] = newScore(match.player1_name, match.player1_group);
      }
      if (!userScores[match.player2_id]) {
        userScores[match.player2_id] = newScore(match.player2_name, match.player2_group);
      }

      if (match.player2_id === match.winner_id) {
        userScores[match.player2_id].win++;
        userScores[match.player1_id].loss++;
      }
      if (match.player1_id === match.winner_id) {
        userScores[match.player1_id].win++;
        userScores[match.player2_id].loss++;
      }
      userScores[match.player1_id].mov += match.player1_score + (100 - match.player2_score);
      userScores[match.player2_id].mov += match.player2_score + (100 - match.player1_score);
    });
    return userScores;
  });
}

const getRankings = (division, group) => {
  return getStats(division).then(userStats => {
    var filteredStats = [];
    for (var key in userStats) {
      if (!group || userStats[key].group === group) {
        filteredStats.push(userStats[key]);
      }
    }

    filteredStats.sort((a, b) => {
      if (a.wins < b.wins) {
        return -1;
      } else if (a.wins > b.wins) {
        return 1;
      }
      return a.mov > b.mov ? 1 : -1;
    });
    return filteredStats;
  });
};


module.exports = {
  getDivsionMatches: getDivsionMatches,
  getUsernameMap: getUsernameMap,
  getStats: getStats,
  getRankings: getRankings,
}
