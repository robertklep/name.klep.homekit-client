const { HttpClient } = require('../../../modules/hap-controller');

const CATEGORIES = {
  1: 'Other', 2: 'Bridge', 3: 'Fan', 4: 'Garage',
  5: 'Lightbulb', 6: 'Door Lock', 7: 'Outlet', 8: 'Switch', 9: 'Thermostat',
  10: 'Sensor', 11: 'Security System', 12: 'Door', 13: 'Window',
  14: 'Window Covering', 15: 'Programmable Switch', 16: 'Range Extender',
  17: 'IP Camera', 18: 'Video Door Bell', 19: 'Air Purifier'
};

const PAIRING_ERRORS = {
  0x01 : 'Unknown Error',
  0x02 : 'Authentication Error',
  0x03 : 'Backoff Error',
  0x04 : 'MaxPeers Error',
  0x05 : 'MaxTries Error',
  0x06 : 'Unavailable Error',
  0x07 : 'Busy Error',
};

const Device = module.exports = class Device {
  constructor(data) {
    this.name                = data.name;
    this.address             = data.address;
    this.port                = data.port;
    this.id                  = data.id;
    this.configurationNumber = data['c#'];
    this.featureFlags        = data.ff;
    this.modelName           = data.md;
    this.protocolVersion     = data.pv;
    this.state               = data['s#'];
    this.statusFlags         = data.sf;
    this.categoryIdentifier  = data.ci;
    this.category            = CATEGORIES[data.ci] || 'Reserved';
  }

  async pair(pin) {
    const client = new HttpClient(this.id, this.address, this.port);
    return client.pairSetup(pin).then(() => {
      this.pairingData = client.getLongTermData();
      console.log('pairing data', this.pairingData);
    }).catch(e => {
      const unknownError = Error('Unknown error (device already paired?)');

      if (! e) {
        throw unknownError;
      } 
      if (e.message.includes('Error: ')) {
        const errorCode = (e.message.match(/Error: (\d+)/) || [])[0];
        if (errorCode in PAIRING_ERRORS) {
          throw Error(PAIRING_ERRORS[errorCode]);
        }
        throw unknownError;
      }
      throw e;
    });
  }

  toHomey() {
    return {
      data:         { id : this.id },
      name:         this.name,
      capabilities: [],
      store:        this,
    };
  }
}

Device.fromJSON = json => new Device(json);