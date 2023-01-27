#! /bin/bash

for Z in A B C D E F 0 10 11 12 13 14 15 16 18
do
    echo $Z
    mosquitto_pub -t homeassistant/number/bkc-mqtt-dip-${Z}/bass/config -r -n
    mosquitto_pub -t homeassistant/number/bkc-mqtt-dip-${Z}/treble/config -r -n
    mosquitto_pub -t homeassistant/number/bkc-mqtt-dip-${Z}/Bass/config -r -n
    mosquitto_pub -t homeassistant/number/bkc-mqtt-dip-${Z}/Treble/config -r -n
done
