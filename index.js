const { getBrightcoveVideos, getBrightcoveSource } = require('./scripts/brightcove');
const { createRokuFeed, writeRokuFeed } = require('./scripts/rokuFeed.js');

//exports.handler = async (event) => {
const handler = async () => { //For local testing only, in prod use exports.handler

  //For local testing only, in prod these values will come from the AWS event object
  //const account = 18140038001; //TVO
  const account = 15364602001; //TVOKIDS

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

handler(); //For local testing only, in prod AWS EventBridge will triiger our handler function