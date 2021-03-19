const cron = require('node-cron');
const { getBrightcoveVideos, getBrightcoveSource } = require('./scripts/brightcove');
const { createRokuFeed, writeRokuFeed, writeLog} = require('./scripts/rokuFeed.js');

const createRokuFeeds = async (accounts) => {
  for (account of accounts) {
    let bcVideos = await getBrightcoveVideos(account);
    let bcSourcedVideos = await getBrightcoveSource(bcVideos);
    let rokuFeed = createRokuFeed(bcSourcedVideos);
    writeRokuFeed(rokuFeed.feed, account);
    writeLog(account, bcVideos.length, rokuFeed.count);
  }
}

const accounts = [18140038001, 15364602001];

createRokuFeeds(accounts); //A CRON job will trigger this