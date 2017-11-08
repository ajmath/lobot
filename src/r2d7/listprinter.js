'use strict';

const utils = require('./utils');
const dataLoader = require('../xwing-data-loader');

module.exports.printXws = (listUrl, list) => {
  console.log('printing list: ' + listUrl);
  listUrl = utils.makeLink(listUrl, list.name || 'View in squad builder');
  const factionEmoji = utils.factionToEmoji(list.faction);
  let output = [`${listUrl} :${factionEmoji}:`];
  let totalPoints = 0;
  for (let pilot of Array.from(list.pilots)) {
    let pilotCard = dataLoader.getPilot(list.faction, pilot.ship, pilot.name);
    if (!pilotCard) {
      console.log(`Unable to load pilot card ${list.faction}/${pilot.ship}/${pilot.name}`);
      pilotCard = {
        points: 0,
        skill: 0,
        name: `?${list.faction}/${pilot.ship}/${pilot.name}?`
      };
    }

    let points = pilotCard.points;
    let skill = pilotCard.skill;
    let cards = [];
    let tiex1 = false;
    let vaksai = false;

    for (let slot in pilot.upgrades) {
      for (let upgrade of pilot.upgrades[slot]) {
        tiex1 = tiex1 || upgrade === 'tiex1';
        vaksai = vaksai || upgrade === 'vaksai';
        const upgradeData = dataLoader.getUpgrade(slot, upgrade);
        if (!upgradeData || !upgradeData.xws) {
          console.log(`Unable to load upgrade card ${slot}/${upgrade}`);
        }
        cards.push(upgradeData);
      }
    }

    const upgrades = [];
    for (let upgrade of Array.from(cards)) {
      if (upgrade.id === undefined || upgrade.id === null) {
        upgrades.push(`*?${upgrade.slot}/${upgrade.name}?*`);
        continue;
      }
      if (upgrade.name === 'Veteran Instincts') {
        skill += 2;
      }
      if ((upgrade.slot.toLowerCase() === 'system') && tiex1) {
        points -= Math.min(4, upgrade.points);
      }
      let upgradeLink = utils.wikiLink(upgrade.name, dataLoader.isAPilot(upgrade.xws));
      if (upgrade.name === 'Adaptability') {
        upgradeLink += ':skill_1:';
      }
      upgrades.push(upgradeLink);
      let cost = upgrade.points;
      if (vaksai && upgrade.points >= 1) {
        cost--;
      }
      points += cost;
    }

    output.push(
      `${utils.shipToIcon(pilotCard)}:skill${skill}:` +
      ` _${utils.wikiLink(pilotCard.name)}_:` +
      ` ${upgrades.join(', ')}` +
      ` *[${points}]*`
    );
    totalPoints += points;
  }

  output[0] += ` *[${totalPoints}]*`;
  return output;
};
