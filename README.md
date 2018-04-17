# bkc-dip-mqtt [![NPM version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Dependency Status][daviddm-image]][daviddm-url] [![Coverage percentage][coveralls-image]][coveralls-url]

*MQTT bridge for the BKC-DIP protocol*

Control B&K devices connected by either ethernet or serial via MQTT.
BKC-DIP is a control protocol for audio/visual devices manufactured by the now defunct B&K Components company.  This library will interrogate the features of the device and establish topics that can be used to control and query the state of the device.


## Installation

```sh
$ npm install --save bkc-dip-mqtt
```

## Usage

```sh
#Device connected via USB-Serial adapter
bkcdip -b mqtt://localhost -d /dev/ttyUSB0

#Device connected via ethernet
bkcdip -b mqtt://localhost -h 192.168.0.12
```
### Supported devices
Currently multi-zone audio amplifiers such as the CT 600 are supported.

### Topics
```
devices/audio-zone/<zoneid>/title
devices/audio-zone/<zoneid>/power-state/<get|set>
devices/audio-zone/<zoneid>/input/<get|set>
devices/audio-zone/<zoneid>/volume/<get|set>
devices/audio-zone/<zoneid>/inputs
```

## Running tests
```sh
$ npm test
```

## License

Apache-2.0 © [ajweave]()


[npm-image]: https://badge.fury.io/js/bkc-dip-mqtt.svg
[npm-url]: https://npmjs.org/package/bkc-dip-mqtt
[travis-image]: https://travis-ci.org/ajweave/bkc-dip-mqtt.svg?branch=master
[travis-url]: https://travis-ci.org/ajweave/bkc-dip-mqtt
[daviddm-image]: https://david-dm.org/ajweave/bkc-dip-mqtt.svg?theme=shields.io
[daviddm-url]: https://david-dm.org/ajweave/bkc-dip-mqtt
[coveralls-image]: https://coveralls.io/repos/ajweave/bkc-dip-mqtt/badge.svg
[coveralls-url]: https://coveralls.io/r/ajweave/bkc-dip-mqtt