#!/bin/bash
#
# remove_topics.sh — Remove all Home Assistant MQTT discovery and state topics
# so the device can re-publish a clean set on next boot.
#
# Usage: ./remove_topics.sh [host]
#
# Defaults to localhost if no host specified.

HOST="${1:-localhost}"
ZONES="A B C D E F 0 10 11 12 13 14 15 16 18"

if ! command -v mosquitto_pub &>/dev/null; then
    echo "Error: mosquitto_pub not found. Install mosquitto-clients."
    exit 1
fi

echo "Clearing topics on $HOST ..."

for Z in $ZONES; do
    # Discovery topics (device-based, per new home_assistant.js)
    mosquitto_pub -h "$HOST" -t "homeassistant/switch/bkc-dip-${Z}/power-state/config" -r -n
    mosquitto_pub -h "$HOST" -t "homeassistant/select/bkc-dip-${Z}/input/config" -r -n
    mosquitto_pub -h "$HOST" -t "homeassistant/number/bkc-dip-${Z}/volume/config" -r -n
    mosquitto_pub -h "$HOST" -t "homeassistant/number/bkc-dip-${Z}/bass/config" -r -n
    mosquitto_pub -h "$HOST" -t "homeassistant/number/bkc-dip-${Z}/treble/config" -r -n
    mosquitto_pub -h "$HOST" -t "homeassistant/select/bkc-dip-${Z}/loudness/config" -r -n

    # Legacy topics (backward compat — in case old version still publishing)
    mosquitto_pub -h "$HOST" -t "homeassistant/switch/bkc-mqtt-dip-${Z}/power-state/config" -r -n
    mosquitto_pub -h "$HOST" -t "homeassistant/number/bkc-mqtt-dip-${Z}/bass/config" -r -n
    mosquitto_pub -h "$HOST" -t "homeassistant/number/bkc-mqtt-dip-${Z}/treble/config" -r -n

    # State topics
    mosquitto_pub -h "$HOST" -t "devices/audio-zone/${Z}/power-state/get" -r -n
    mosquitto_pub -h "$HOST" -t "devices/audio-zone/${Z}/input/get" -r -n
    mosquitto_pub -h "$HOST" -t "devices/audio-zone/${Z}/volume/get" -r -n
    mosquitto_pub -h "$HOST" -t "devices/audio-zone/${Z}/bass/get" -r -n
    mosquitto_pub -h "$HOST" -t "devices/audio-zone/${Z}/treble/get" -r -n
    mosquitto_pub -h "$HOST" -t "devices/audio-zone/${Z}/loudness/get" -r -n
done

echo "Done. All HA discovery and state topics cleared."
