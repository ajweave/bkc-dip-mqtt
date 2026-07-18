"use strict";
// Home Assistant auto-discovery (device-based, per HA MQTT spec)

var packageJson = require('../package.json');

module.exports = function(mqtt) {
    this.mqtt = mqtt;
    this.discovery_prefix = 'homeassistant';

    this.publishAutoDiscoveryTopics = function(UNIT_PARAMETERS, SYSTEM_SETTINGS) {
        var zones = UNIT_PARAMETERS.getZones();
        var origin = {
            name: 'bkc-dip-mqtt',
            sw_version: packageJson.version,
            support_url: 'https://github.com/ajweave/bkc-dip-mqtt'
        };
        zones.forEach(function(z) {
            var device = {
                identifiers: ['bkc-dip-' + z.id],
                name: z.name,
                manufacturer: 'Harman/BKC',
                model: 'BKC-DIP',
                sw_version: packageJson.version
            };
            
            // power - switch
            var power_config = {
                name: 'Power',
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
            var input_options = SYSTEM_SETTINGS.getInputs().map(function(input) {
                return input.title;
            });
            var source_config = {
                name: 'Source',
                unique_id: 'bkc-mqtt-dip-' + z.id + '-source',
                command_topic: 'devices/audio-zone/' + z.id + '/input/set',
                state_topic: 'devices/audio-zone/' + z.id + '/input/get',
                icon: 'mdi:input-hdmi',
                options: input_options,
                device: device,
                origin: origin
            };
            mqtt.publish(this.discovery_prefix + '/select/bkc-mqtt-dip-' + z.id + '/input/config',
                JSON.stringify(source_config),
                {retain: true}
            );
            
            // volume - number
            var volume_config = {
                name: 'Volume',
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
                    name: s + ' Gain',
                    unique_id: 'bkc-mqtt-dip-' + z.id + '_' + s.toLowerCase() + '_gain',
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
                name: 'Loudness',
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
            
            // Room EQ Bass Gain - number
            var room_eq_bass_gain_config = {
                name: 'Room EQ Bass Gain',
                unique_id: 'bkc-mqtt-dip-' + z.id + '_room_eq_bass_gain',
                command_topic: 'devices/audio-zone/' + z.id + '/room-eq/bass-gain/set',
                state_topic: 'devices/audio-zone/' + z.id + '/room-eq/bass-gain/get',
                min: -12,
                max: 12,
                step: 0.5,
                unit_of_measurement: 'dB',
                device: device,
                origin: origin
            };
            mqtt.publish(this.discovery_prefix + '/number/bkc-mqtt-dip-' + z.id + '/room-eq/bass-gain/config',
                JSON.stringify(room_eq_bass_gain_config),
                {retain: true}
            );
            
            // Room EQ Bass Frequency - sensor
            var room_eq_bass_freq_config = {
                name: 'Room EQ Bass Frequency',
                unique_id: 'bkc-mqtt-dip-' + z.id + '_room_eq_bass_freq',
                state_topic: 'devices/audio-zone/' + z.id + '/room-eq/bass-frequency/get',
                unit_of_measurement: 'Hz',
                device: device,
                entity_category: 'diagnostic',
                origin: origin
            };
            mqtt.publish(this.discovery_prefix + '/sensor/bkc-mqtt-dip-' + z.id + '/room-eq/bass-frequency/config',
                JSON.stringify(room_eq_bass_freq_config),
                {retain: true}
            );
            
            // Room EQ Treble Gain - number
            var room_eq_treble_gain_config = {
                name: 'Room EQ Treble Gain',
                unique_id: 'bkc-mqtt-dip-' + z.id + '_room_eq_treble_gain',
                command_topic: 'devices/audio-zone/' + z.id + '/room-eq/treble-gain/set',
                state_topic: 'devices/audio-zone/' + z.id + '/room-eq/treble-gain/get',
                min: -12,
                max: 12,
                step: 0.5,
                unit_of_measurement: 'dB',
                device: device,
                origin: origin
            };
            mqtt.publish(this.discovery_prefix + '/number/bkc-mqtt-dip-' + z.id + '/room-eq/treble-gain/config',
                JSON.stringify(room_eq_treble_gain_config),
                {retain: true}
            );
            
            // Room EQ Treble Frequency - sensor
            var room_eq_treble_freq_config = {
                name: 'Room EQ Treble Frequency',
                unique_id: 'bkc-mqtt-dip-' + z.id + '_room_eq_treble_freq',
                state_topic: 'devices/audio-zone/' + z.id + '/room-eq/treble-frequency/get',
                unit_of_measurement: 'Hz',
                device: device,
                entity_category: 'diagnostic',
                origin: origin
            };
            mqtt.publish(this.discovery_prefix + '/sensor/bkc-mqtt-dip-' + z.id + '/room-eq/treble-frequency/config',
                JSON.stringify(room_eq_treble_freq_config),
                {retain: true}
            );
            
            // Notch Filter settings (Notch 1, 2, 3)
            [1, 2, 3].forEach(function(notchNum) {
                var _this = this;
                // Notch Gain - number
                var notch_gain_config = {
                    name: 'Notch ' + notchNum + ' Gain',
                    unique_id: 'bkc-mqtt-dip-' + z.id + '_notch' + notchNum + '_gain',
                    command_topic: 'devices/audio-zone/' + z.id + '/notch/' + notchNum + '/gain/set',
                    state_topic: 'devices/audio-zone/' + z.id + '/notch/' + notchNum + '/gain/get',
                    min: -18,
                    max: 0,
                    step: 1,
                    unit_of_measurement: 'dB',
                    device: device,
                    origin: origin
                };
                mqtt.publish(_this.discovery_prefix + '/number/bkc-mqtt-dip-' + z.id + '/notch/' + notchNum + '/gain/config',
                    JSON.stringify(notch_gain_config),
                    {retain: true}
                );
                
                // Notch Frequency - sensor
                var notch_freq_config = {
                    name: 'Notch ' + notchNum + ' Frequency',
                    unique_id: 'bkc-mqtt-dip-' + z.id + '_notch' + notchNum + '_freq',
                    state_topic: 'devices/audio-zone/' + z.id + '/notch/' + notchNum + '/frequency/get',
                    unit_of_measurement: 'Hz',
                    device: device,
                    entity_category: 'diagnostic',
                    origin: origin
                };
                mqtt.publish(_this.discovery_prefix + '/sensor/bkc-mqtt-dip-' + z.id + '/notch/' + notchNum + '/frequency/config',
                    JSON.stringify(notch_freq_config),
                    {retain: true}
                );
                
                // Notch Width - number
                // Notch Width: raw BKC-DIP index 0..6 (Appendix R Note 4 maps
                // the semantic Q-value 0.5..4.5 to index 0..6 internally).
                var notch_width_config = {
                    name: 'Notch ' + notchNum + ' Width',
                    unique_id: 'bkc-mqtt-dip-' + z.id + '_notch' + notchNum + '_width',
                    command_topic: 'devices/audio-zone/' + z.id + '/notch/' + notchNum + '/width/set',
                    state_topic: 'devices/audio-zone/' + z.id + '/notch/' + notchNum + '/width/get',
                    min: 0,
                    max: 6,
                    step: 1,
                    device: device,
                    origin: origin
                };
                mqtt.publish(_this.discovery_prefix + '/number/bkc-mqtt-dip-' + z.id + '/notch/' + notchNum + '/width/config',
                    JSON.stringify(notch_width_config),
                    {retain: true}
                );
            }, this);
            
            // Tuner settings
            // AM Frequency (10kHz step) - sensor
            var am_freq_config = {
                name: 'AM Frequency',
                unique_id: 'bkc-mqtt-dip-' + z.id + '_am_frequency',
                state_topic: 'devices/audio-zone/' + z.id + '/tuner/am-frequency/get',
                unit_of_measurement: 'kHz',
                device: device,
                entity_category: 'diagnostic',
                origin: origin
            };
            mqtt.publish(this.discovery_prefix + '/sensor/bkc-mqtt-dip-' + z.id + '/tuner/am-frequency/config',
                JSON.stringify(am_freq_config),
                {retain: true}
            );
            
            // FM Frequency - sensor
            var fm_freq_config = {
                name: 'FM Frequency',
                unique_id: 'bkc-mqtt-dip-' + z.id + '_fm_frequency',
                state_topic: 'devices/audio-zone/' + z.id + '/tuner/fm-frequency/get',
                unit_of_measurement: 'MHz',
                device: device,
                entity_category: 'diagnostic',
                origin: origin
            };
            mqtt.publish(this.discovery_prefix + '/sensor/bkc-mqtt-dip-' + z.id + '/tuner/fm-frequency/config',
                JSON.stringify(fm_freq_config),
                {retain: true}
            );
            
            // FM Mode - select
            var fm_mode_config = {
                name: 'FM Mode',
                unique_id: 'bkc-mqtt-dip-' + z.id + '_fm-mode',
                command_topic: 'devices/audio-zone/' + z.id + '/tuner/fm-mode/set',
                state_topic: 'devices/audio-zone/' + z.id + '/tuner/fm-mode/get',
                options: ['mono', 'stereo'],
                device: device,
                entity_category: 'diagnostic',
                origin: origin
            };
            mqtt.publish(this.discovery_prefix + '/select/bkc-mqtt-dip-' + z.id + '/tuner/fm-mode/config',
                JSON.stringify(fm_mode_config),
                {retain: true}
            );
            
            // Tuner Level - number
            var tuner_level_config = {
                name: 'Tuner Level',
                unique_id: 'bkc-mqtt-dip-' + z.id + '_tuner_level',
                command_topic: 'devices/audio-zone/' + z.id + '/tuner/level/set',
                state_topic: 'devices/audio-zone/' + z.id + '/tuner/level/get',
                min: 0,
                max: 255,
                step: 1,
                device: device,
                entity_category: 'diagnostic',
                origin: origin
            };
            mqtt.publish(this.discovery_prefix + '/number/bkc-mqtt-dip-' + z.id + '/tuner/level/config',
                JSON.stringify(tuner_level_config),
                {retain: true}
            );
            
            // Tuner Max Level - number
            var tuner_max_level_config = {
                name: 'Tuner Max Level',
                unique_id: 'bkc-mqtt-dip-' + z.id + '_tuner_max_level',
                command_topic: 'devices/audio-zone/' + z.id + '/tuner/max-level/set',
                state_topic: 'devices/audio-zone/' + z.id + '/tuner/max-level/get',
                min: 0,
                max: 255,
                step: 1,
                device: device,
                entity_category: 'diagnostic',
                origin: origin
            };
            mqtt.publish(this.discovery_prefix + '/number/bkc-mqtt-dip-' + z.id + '/tuner/max-level/config',
                JSON.stringify(tuner_max_level_config),
                {retain: true}
            );
            
            // Left/Right Level - number
            var left_level_config = {
                name: 'Left Level',
                unique_id: 'bkc-mqtt-dip-' + z.id + '_left_level',
                command_topic: 'devices/audio-zone/' + z.id + '/left-level/set',
                state_topic: 'devices/audio-zone/' + z.id + '/left-level/get',
                min: 0,
                max: 255,
                step: 1,
                device: device,
                entity_category: 'diagnostic',
                origin: origin
            };
            mqtt.publish(this.discovery_prefix + '/number/bkc-mqtt-dip-' + z.id + '/left-level/config',
                JSON.stringify(left_level_config),
                {retain: true}
            );
            
            var right_level_config = {
                name: 'Right Level',
                unique_id: 'bkc-mqtt-dip-' + z.id + '_right_level',
                command_topic: 'devices/audio-zone/' + z.id + '/right-level/set',
                state_topic: 'devices/audio-zone/' + z.id + '/right-level/get',
                min: 0,
                max: 255,
                step: 1,
                device: device,
                entity_category: 'diagnostic',
                origin: origin
            };
            mqtt.publish(this.discovery_prefix + '/number/bkc-mqtt-dip-' + z.id + '/right-level/config',
                JSON.stringify(right_level_config),
                {retain: true}
            );
            
            // Left/Right Max Level - number
            var left_max_level_config = {
                name: 'Left Max Level',
                unique_id: 'bkc-mqtt-dip-' + z.id + '_left_max_level',
                command_topic: 'devices/audio-zone/' + z.id + '/left-max-level/set',
                state_topic: 'devices/audio-zone/' + z.id + '/left-max-level/get',
                min: 0,
                max: 255,
                step: 1,
                device: device,
                entity_category: 'diagnostic',
                origin: origin
            };
            mqtt.publish(this.discovery_prefix + '/number/bkc-mqtt-dip-' + z.id + '/left-max-level/config',
                JSON.stringify(left_max_level_config),
                {retain: true}
            );
            
            var right_max_level_config = {
                name: 'Right Max Level',
                unique_id: 'bkc-mqtt-dip-' + z.id + '_right_max_level',
                command_topic: 'devices/audio-zone/' + z.id + '/right-max-level/set',
                state_topic: 'devices/audio-zone/' + z.id + '/right-max-level/get',
                min: 0,
                max: 255,
                step: 1,
                device: device,
                entity_category: 'diagnostic',
                origin: origin
            };
            mqtt.publish(this.discovery_prefix + '/number/bkc-mqtt-dip-' + z.id + '/right-max-level/config',
                JSON.stringify(right_max_level_config),
                {retain: true}
            );
            
        }, this);
        
        // System-wide settings (not zone-specific)
        var system_device = {
            identifiers: ['bkc-dip-system'],
            name: 'BKC-DIP System',
            manufacturer: 'Harman/BKC',
            model: 'BKC-DIP',
            sw_version: packageJson.version
        };
        
        // Flasher Out - switch
        var flasher_config = {
            name: 'Flasher Out',
            unique_id: 'bkc-mqtt-dip-system-flasher-out',
            command_topic: 'devices/audio-zone/system/flasher-out/set',
            state_topic: 'devices/audio-zone/system/flasher-out/get',
            payload_on: '1',
            payload_off: '0',
            device: system_device,
            entity_category: 'config',
            origin: origin
        };
        mqtt.publish(this.discovery_prefix + '/switch/bkc-mqtt-dip-system/flasher-out/config',
            JSON.stringify(flasher_config),
            {retain: true}
        );
        
        // RS-232 Control - select
        var rs232_config = {
            name: 'RS-232 Control',
            unique_id: 'bkc-mqtt-dip-system-rs232-control',
            command_topic: 'devices/audio-zone/system/rs232-control/set',
            state_topic: 'devices/audio-zone/system/rs232-control/get',
            min: 0,
            max: 255,
            device: system_device,
            entity_category: 'config',
            origin: origin
        };
        mqtt.publish(this.discovery_prefix + '/number/bkc-mqtt-dip-system/rs232-control/config',
            JSON.stringify(rs232_config),
            {retain: true}
        );
        
        // System Name - sensor
        var system_name_config = {
            name: 'System Name',
            unique_id: 'bkc-mqtt-dip-system-name',
            state_topic: 'devices/audio-zone/system/name/get',
            device: system_device,
            entity_category: 'diagnostic',
            origin: origin
        };
        mqtt.publish(this.discovery_prefix + '/sensor/bkc-mqtt-dip-system/name/config',
            JSON.stringify(system_name_config),
            {retain: true}
        );
    };
    
    return this;
};