"use strict";
// Home Assistant auto-discovery (device-based, per HA MQTT spec)

var packageJson = require('../package.json');

module.exports = function(mqtt) {
    this.mqtt = mqtt;
    this.discovery_prefix = 'homeassistant';

    this.publishAutoDiscoveryTopics = function(UNIT_PARAMETERS) {
        var zones = UNIT_PARAMETERS.getZones();
        var origin = {
            name: 'bkc-dip-mqtt',
            sw_version: packageJson.version,
            support_url: 'https://github.com/ajweave/bkc-dip-mqtt'
        };
        zones.forEach(function(z) {
            var device = {
                identifiers: ['bkc-dip-' + z.id],
                name: 'BKC-DIP Zone ' + z.id,
                manufacturer: 'Harman/BKC',
                model: 'BKC-DIP',
                sw_version: packageJson.version
            };
            // power - switch
            var power_config = {
                name: 'Audio Zone ' + z.id,
                unique_id: 'bkc-mqtt-dip-' + z.id + '-power-state',
                command_topic: 'devices/audio-zone/' + z.id + '/power-state/set',
                state_topic: 'devices/audio-zone/' + z.id + '/power-state/get',
                payload_on: 'on',
                payload_off: 'off',
                icon: 'mdi:speaker',
                device: device,
                origin: origin
            };
            mqtt.publish(this.discovery_prefix + '/switch/bkc-mqtt-dip-' + z.id + '/power-state/config',
                JSON.stringify(power_config),
                {retain: true}
            );
            // source - select
            var source_config = {
                name: 'Audio Zone ' + z.id + ' Source',
                unique_id: 'bkc-mqtt-dip-' + z.id + '-source',
                command_topic: 'devices/audio-zone/' + z.id + '/input/set',
                state_topic: 'devices/audio-zone/' + z.id + '/input/get',
                icon: 'mdi:input-hdmi',
                device: device,
                origin: origin
            };
            mqtt.publish(this.discovery_prefix + '/select/bkc-mqtt-dip-' + z.id + '/input/config',
                JSON.stringify(source_config),
                {retain: true}
            );
            // volume - number
            var volume_config = {
                name: 'Audio Zone ' + z.id + ' Volume',
                unique_id: 'bkc-mqtt-dip-' + z.id + '-volume',
                command_topic: 'devices/audio-zone/' + z.id + '/volume/set',
                state_topic: 'devices/audio-zone/' + z.id + '/volume/get',
                min: 0,
                max: 100,
                step: 1,
                unit_of_measurement: '%',
                device: device,
                origin: origin
            };
            mqtt.publish(this.discovery_prefix + '/number/bkc-mqtt-dip-' + z.id + '/volume/config',
                JSON.stringify(volume_config),
                {retain: true}
            );
            // bass/treble - number
            var a = ['Bass', 'Treble'];
            a.forEach(function(s) {
                var gain_config = {
                    name: z.id + ' ' + s + ' Gain',
                    unique_id: 'bkc-mqtt-dip-_' + z.id + '_' + s.toLowerCase() + '_gain',
                    command_topic: 'devices/audio-zone/' + z.id + '/' + s.toLowerCase() + '/set',
                    state_topic: 'devices/audio-zone/' + z.id + '/' + s.toLowerCase() + '/get',
                    min: -12,
                    max: 12,
                    step: 2,
                    unit_of_measurement: 'dB',
                    device: device,
                    origin: origin
                };
                mqtt.publish(this.discovery_prefix + '/number/bkc-mqtt-dip-' + z.id + '/' + s.toLowerCase() + '/config',
                    JSON.stringify(gain_config),
                    {retain: true}
                );
            }, this);

            // loudness - select
            var loudness_config = {
                name: 'Audio Zone ' + z.id + ' Loudness',
                unique_id: 'bkc-mqtt-dip-' + z.id + '-loudness',
                command_topic: 'devices/audio-zone/' + z.id + '/loudness/set',
                state_topic: 'devices/audio-zone/' + z.id + '/loudness/get',
                options: ['off', 'on', 'auto'],
                device: device,
                origin: origin
            };
            mqtt.publish(this.discovery_prefix + '/select/bkc-mqtt-dip-' + z.id + '/loudness/config',
                JSON.stringify(loudness_config),
                {retain: true}
            );
        }, this);
    };
};
