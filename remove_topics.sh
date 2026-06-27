#! /bin/bash
#
# remove_topics.sh — Remove all Home Assistant MQTT discovery topics
# so the device can re-publish a clean set on next boot.
#
# Topics published by home_assistant.js (per zone):
#   homeassistant/switch/bkc-mqtt-dip-<zone>/power-state/config
#   homeassistant/number/bkc-mqtt-dip-<zone>/bass/config
#   homeassistant/number/bkc-mqtt-dip-<zone>/treble/config

ZONES="A B C D E F 0 10 11 12 13 14 15 16 18"

for Z in $ZONES; do
    echo "Clearing zone $Z ..."

    # power switch config
    mosquitto_pub -t "homeassistant/switch/bkc-mqtt-dip-${Z}/power-state/config" -r -n

    # bass / treble gain configs (lowercase — matches s.toLowerCase() in publisher)
    mosquitto_pub -t "homeassistant/number/bkc-mqtt-dip-${Z}/bass/config" -r -n
    mosquitto_pub -t "homeassistant/number/bkc-mqtt-dip-${Z}/treble/config" -r -n
done

echo "Done. All HA discovery topics cleared."
