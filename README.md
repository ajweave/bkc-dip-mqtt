# bkc-dip-mqtt [![NPM version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Dependency Status][daviddm-image]][daviddm-url] [![Coverage percentage][coveralls-image]][coveralls-url]
> MQTT bridge for the BKC-DIP protocol
Control B&K devices connected via ethernet through MQTT.  BKC-DIP is a control protocol for audio/visual devices manufactured by the now defunct B&K Components company.  This library will interrogate the features of the device and establish topics that can be used to control and query the state of the device.

## Installation

```sh
$ npm install --save bkc-dip-mqtt
```

## Usage

```js
var bkcDipMqtt = require('bkc-dip-mqtt');

bkcDipMqtt('Rainbow');
```
### Supported devices

### Information topics

### Control topics

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