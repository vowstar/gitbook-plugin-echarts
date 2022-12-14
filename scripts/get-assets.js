var fs = require('fs');
var path = require('path');

var download = require('./download');

var PACKAGE_JSON_PATH = path.join(__dirname, '../package.json');
var echartsVersion = require(PACKAGE_JSON_PATH).echartsVersion;

var ASSETS_DIR_PATH = path.join(__dirname, '../assets');
var ECHARTS_PATH = path.join(ASSETS_DIR_PATH, 'echarts.min.js');

var ECHARTS_URL = 'https://cdnjs.cloudflare.com/ajax/libs/echarts' + '/' + echartsVersion + '/echarts.min.js';

console.log('Downloading echarts ' + echartsVersion + ' ...');
download(ECHARTS_URL, ECHARTS_PATH, true);
