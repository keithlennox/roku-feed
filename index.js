const { getBrightcoveVideos, getBrightcoveSource } = require('./scripts/brightcove');
const { createRokuFeed, writeRokuFeed } = require('./scripts/rokuFeed.js');

exports.handler = async (event) => {
  
  let account = event.account;
  console.log("Handler function triggered for account " + account);

  //Get Brightcove videos where ott_flag = roku
  let bcVideos = await getBrightcoveVideos(account);

  //Get video URLs for Brightcove videos
  let bcSourcedVideos = await getBrightcoveSource(bcVideos);

  //Create roku feed
  let rokuFeed = createRokuFeed(bcSourcedVideos);

  //Write roku feed to file
  let feedUpdateStatus = await writeRokuFeed(rokuFeed.feed, account);

  //Log results
  console.log(`account: ${account} - find: ${bcVideos.length} - add: ${rokuFeed.count} - write: ${feedUpdateStatus}`);
  
}