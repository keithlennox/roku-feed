const { getBrightcoveVideos, getBrightcoveSource } = require('./scripts/brightcove');
const { createRokuFeed, writeRokuFeed, writeLog} = require('./scripts/rokuFeed.js');

const createRokuFeeds = async (account) => {

  //Get Brightcove videos where ott_flag = roku
  let bcVideos = await getBrightcoveVideos(account);

  //Get video URLs for Brightcove videos
  let bcSourcedVideos = await getBrightcoveSource(bcVideos);

  //Create roku feed
  let rokuFeed = createRokuFeed(bcSourcedVideos);

  //Write roku feed to file
  writeRokuFeed(rokuFeed.feed, account);

  //Log results
  let timestamp = new Date().toLocaleString();
  console.log(`${timestamp} - account: ${account} found: ${bcVideos.length} added: ${rokuFeed.count}`);
}

//TVO = 18140038001
//TVOKIDS = 15364602001
createRokuFeeds(18140038001); //A CRON job will trigger this