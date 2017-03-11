"use strict";

const xwsPilots = require('./data/pilots');
const xwsUpgrades = require('./data/upgrades');

class DataLoader {
  constructor () {
    this.pilots = {};
    this.upgrades = {};

    this.getPilot = this.getPilot.bind(this);
    this.isAPilot = this.isAPilot.bind(this);
    this.getUpgrade = this.getUpgrade.bind(this);
  }

  getPilot (faction, ship, name) {
    if (Object.keys(this.pilots).length === 0) {
      this._loadPilots();
    }
    return this.pilots[`${faction}/${ship}/${name}`];
  }

  isAPilot (name) {
    for (let key of Object.keys(this.pilots)) {
      if (key.indexOf(`/${name}`) !== -1) {
        return true;
      }
    }
    return false;
  }

  getUpgrade (slot, name) {
    if (Object.keys(this.upgrades).length === 0) {
      this._loadUpgrades();
    }
    if (!this.upgrades.hasOwnProperty(`${slot}/${name}`)) {
      console.log('unable to find ' + `${slot}/${name}`);
      return { slot, name };
    }
    return this.upgrades[`${slot}/${name}`];
  }

  _xwsFaction (faction) {
    switch (faction) {
      case 'Scum and Villainy': return 'scum';
      case 'Rebel Alliance': return 'rebel';
      case 'Resistance': return 'rebel';
      case 'Galactic Empire': return 'imperial';
      case 'First Order': return 'imperial';
      default: return null;
    }
  }

  _canonicalize (name) {
    if (!name) {
      return null;
    }
    const cleanedName = name.replace(/[^A-z0-9]/g, '').toLowerCase();
    switch (cleanedName) {
      case 'tieadvancedprototype': return 'tieadvprototype';
      case 'yt2400freighter': return 'yt2400';
      default: return cleanedName;
    }
  }

  _xwsSlot (slot) {
    switch (slot) {
      case 'Astromech': return 'amd';
      case 'Elite': return 'ept';
      case 'Salvaged Astromech': return 'samd';
      case 'Modification': return 'mod';
      default: return typeof slot === 'string' && this._canonicalize(slot);
    }
  }

  _loadPilots () {
    xwsPilots.forEach(pilot => {
      const xwsFaction = this._xwsFaction(pilot.faction);
      const xwsShip = this._canonicalize(pilot.ship);
      this.pilots[`${xwsFaction}/${xwsShip}/${pilot.xws}`] = pilot;
    });
  }

  _loadUpgrades () {
    xwsUpgrades.forEach(upgrade => {
      const xwsSlot = this._xwsSlot(upgrade.slot);
      this.upgrades[`${xwsSlot}/${upgrade.xws}`] = upgrade;
    });
  }
}

module.exports = new DataLoader();
