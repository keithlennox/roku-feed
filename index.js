const { getBrightcoveVideos, getBrightcoveSource } = require('./scripts/brightcove');
const { createRokuFeed, writeRokuFeed } = require('./scripts/rokuFeed.js');

exports.handler = async (event) => {

  global.ACCOUNT = event.account;
  global.FEED_FOLDER = event.feedFolder;
  global.IMAGE_FOLDER = event.imageFolder;

  //let account = event.account;
  console.log("Handler function triggered for account " + ACCOUNT);

  //Get Brightcove videos where ott_flag = roku
  let bcVideos = await getBrightcoveVideos();

  //Get video URLs for Brightcove videos
  let bcSourcedVideos = await getBrightcoveSource(bcVideos);

  //Create roku feed
  let rokuFeed = await createRokuFeed(bcSourcedVideos);

  //Write roku feed to file
  let feedUpdateStatus = await writeRokuFeed(rokuFeed.feed);

  //Log results
  console.log(`account: ${ACCOUNT} - find: ${bcVideos.length} - add: ${rokuFeed.count} - write: ${feedUpdateStatus}`);
  
}