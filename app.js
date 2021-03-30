const cron = require('node-cron');
const { getBrightcoveVideos, getBrightcoveSource } = require('./scripts/brightcove');
const { createRokuFeed, writeRokuFeed, writeLog} = require('./scripts/rokuFeed.js');

const createRokuFeeds = async (account) => {
  let bcVideos = await getBrightcoveVideos(account);
  let bcSourcedVideos = await getBrightcoveSource(bcVideos);
  let rokuFeed = createRokuFeed(bcSourcedVideos);
  writeRokuFeed(rokuFeed.feed, account);
  writeLog(account, bcVideos.length, rokuFeed.count);
}

//TVO = 18140038001
//TVOKIDS = 15364602001
createRokuFeeds(15364602001); //A CRON job will trigger this