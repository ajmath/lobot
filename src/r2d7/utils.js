'use strict';

const capitalize = require('capitalize');
const canonicalize = require('../xwing-data-loader')._canonicalize;

function stripNameSay (name) {
  return name.replace(/ \(.*\)$/, '');
}

function stripName (name) {
  return stripNameSay(name.toLowerCase()).replace(/[ -/]/g, '');
}

function nameToEmoji (name) {
  name = `:${stripName(name)}:`;
  return name.replace(/:bomb:/g, ':xbomb:').replace(/:shield:/g, ':xshield:');
}

function shipToIcon (pilot) {
  const shipName = canonicalize(pilot.ship);
  switch (shipName) {
    case 'yt2400': return nameToEmoji('yt2400freighter');
    case 'tieadvprototype': return nameToEmoji('tieadvancedprototype');
    default: return nameToEmoji(shipName);
  }
}

function factionToEmoji (faction) {
  switch (faction) {
    case 'imperial': return 'empire';
    default: return faction;
  }
}

function makeLink (url, name) {
  name = name
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return `<${url}|${stripNameSay(name)}>`;
}

function wikiLink (cardName, crewOfPilot, wikiName) {
  if (wikiName == null) { wikiName = false; }
  if (!wikiName) {
    wikiName = cardName;
  }
  // YASB and the wiki use different name conventions
  let fudgedName = capitalize.words(wikiName)
    .replace(/ /g, '_')
    .replace(/\(Scum\)/, '(S&V)')
    .replace(/\((PS9|TFA)\)/, '(HOR)')
    .replace(/-Wing/, '-wing')
    .replace(/\/V/, '/v')
    .replace(/\/X/, '/x');
  if (crewOfPilot) {
    fudgedName += '_(Crew)';
    // Stupid Nien Nunb is a stupid special case
  } else if (fudgedName === 'Nien_Nunb') {
    fudgedName += '_(T-70_X-Wing)';
    // All Hera's are suffixed on the wiki
  } else if (fudgedName === 'Hera_Syndulla') {
    fudgedName += '_(VCX-100)';
  } else if (/"Heavy_Scyk"_Interceptor/.test(fudgedName)) {
    fudgedName = '"Heavy_Scyk"_Interceptor';
  }
  let url = `http://xwing-miniatures.wikia.com/wiki/${fudgedName}`;
  return makeLink(url, cardName);
}

module.exports = {
  shipToIcon,
  wikiLink,
  makeLink,
  factionToEmoji
};
