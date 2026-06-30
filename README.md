# bkc-dip-mqtt

*MQTT bridge for the BKC-DIP protocol*

Control B&K devices connected by either ethernet or serial via MQTT.
BKC-DIP is a control protocol for audio/visual devices manufactured by the now
defunct B&K Components company. This library interrogates the features of the
device and establishes topics that can be used to control and query the state
of the device.

## Installation

```sh
$ npm install --save bkc-dip-mqtt
```

## Usage

```sh
# Device connected via USB-Serial adapter
bkcdip -b mqtt://localhost -d /dev/ttyUSB0

# Device connected via ethernet
bkcdip -b mqtt://localhost -h 192.168.0.12
```

### Supported Devices

Currently multi-zone audio amplifiers such as the CT 600 are supported.

### MQTT Topics

#### State topics (published by the bridge)

```
devices/audio-zone/<zoneid>/title
devices/audio-zone/<zoneid>/power-state/get
devices/audio-zone/<zoneid>/input/get
devices/audio-zone/<zoneid>/volume/get
devices/audio-zone/<zoneid>/bass/get
devices/audio-zone/<zoneid>/treble/get
devices/audio-zone/<zoneid>/loudness/get
devices/audio-zone/<zoneid>/inputs
```

#### Command topics (subscribed by the bridge)

```
devices/audio-zone/<zoneid>/power-state/set
devices/audio-zone/<zoneid>/input/set
devices/audio-zone/<zoneid>/volume/set
devices/audio-zone/<zoneid>/bass/set
devices/audio-zone/<zoneid>/treble/set
devices/audio-zone/<zoneid>/loudness/set
```

#### Home Assistant auto-discovery

The bridge publishes HA discovery topics on the `homeassistant` prefix using
the **device-based discovery** format (recommended over legacy entity
discovery). Each zone gets a device entry with identifiers, manufacturer, and
model info.

```
homeassistant/switch/bkc-dip-<zoneid>/power-state/config
homeassistant/select/bkc-dip-<zoneid>/input/config
homeassistant/number/bkc-dip-<zoneid>/volume/config
homeassistant/number/bkc-dip-<zoneid>/bass/config
homeassistant/number/bkc-dip-<zoneid>/treble/config
homeassistant/select/bkc-dip-<zoneid>/loudness/config
```

To clear all retained discovery and state topics (e.g. before a firmware
update or to force re-discovery):

```sh
./remove_topics.sh [mqtt-host]
```

## Requirements

- Node.js >= 18
- An MQTT broker (e.g. Mosquitto)
- B&K device with BKC-DIP protocol support

## CI

Tests run on GitHub Actions for Node.js 18, 20, and 22.

## Running Tests

```sh
$ npm test
```

## License

Apache-2.0 © [ajweave](https://github.com/ajweave)
