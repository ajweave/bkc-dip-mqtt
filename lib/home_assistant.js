//Home Assistant auto-discovery

HomeAssistant = function(mqtt) {
    this.mqtt = mqtt;
    this.discovery_prefix = 'homeassistant';

    this.publishAutoDiscoveryTopics = function(UNIT_PARAMETERS) {
        var zones = UNIT_PARAMETERS.getZones()
        zones.forEach(z => {
            //power - switch
            var power_config = {
                name: 'Audio Zone ' + z.id,
                unique_id: 'bkc-mqtt-dip-' + z.id + '-power-state',
                command_topic: 'devices/audio-zone/' + z.id + '/power-state/set',
                state_topic: 'devices/audio-zone/' + z.id + '/power-state/get',
                payload_on: 'on',
                payload_off: 'off',
                icon: 'mdi:speaker'
            }
            mqtt.publish(this.discovery_prefix + '/switch/bkc-mqtt-dip-' + z.id + '/power-state/config',
                JSON.stringify(power_config), 
                {retain: true}
            );
            //source - input-select
            //volume - number
            //bass/treble - number
            const a = ['Bass', 'Treble'];
	        a.forEach(s => {
                var gain_config = {
                    name: z.id + ' ' + s + ' Gain',
                    unique_id: 'bkc-mqtt-dip-_' + z.id + '_' + s.toLowerCase() + '_gain',
                    command_topic: 'devices/audio-zone/' + z.id + '/' + s.toLowerCase() + '/set',
                    state_topic: 'devices/audio-zone/' + z.id + '/' + s.toLowerCase() + '/get',
                    min: -12,
                    max: 12,
                    step: 2
                }
                console.log('publishing ha autodiscovery ' + gain_config)
                mqtt.publish(this.discovery_prefix + '/number/bkc-mqtt-dip-' + z.id + '/' + s.toLowerCase() + '/config',
                    JSON.stringify(gain_config), 
                    {retain: true}
                );
            });

            //loudness - switch
            
        });
    }

}
