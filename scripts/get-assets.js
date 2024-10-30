#!/usr/bin/env node
/*jshint esversion: 8 */

const path = require('path');
const fs = require('fs');
const download = require('./download');

const PACKAGE_JSON_PATH = path.join(__dirname, '../package.json');
const echartsVersion = require(PACKAGE_JSON_PATH).echartsVersion;

const ASSETS_DIR_PATH = path.join(__dirname, '../assets');
const ECHARTS_PATH = path.join(ASSETS_DIR_PATH, 'echarts.min.js');
const ECHARTS_VER_FILE = path.join(ASSETS_DIR_PATH, 'echarts');
const ECHARTS_URL = `https://cdnjs.cloudflare.com/ajax/libs/echarts/${echartsVersion}/echarts.min.js`;

if (!fs.existsSync(ASSETS_DIR_PATH)) {
  fs.mkdirSync(ASSETS_DIR_PATH, { recursive: true });
}

async function main() {
  console.info(`Downloading echarts ${echartsVersion}...`);
  try {
    if (!fs.existsSync(ECHARTS_VER_FILE) || !fs.existsSync(ECHARTS_PATH)) {
      await download(ECHARTS_URL, ECHARTS_PATH, true);
      try {
        const time = new Date();
        fs.utimesSync(ECHARTS_VER_FILE, time, time);
      } catch (err) {
        fs.closeSync(fs.openSync(ECHARTS_VER_FILE, 'w'));
      }
      console.info(`Echarts ${echartsVersion} download complete.`);
    } else {
      console.info(`Echarts ${echartsVersion} is already up to date.`);
    }
  } catch (error) {
    console.error(`Failed to download echarts ${echartsVersion}:`, error);
  }
}

main().catch(error => console.error('Error during download:', error));
