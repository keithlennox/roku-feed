const axios = require('axios');
var fs = require('fs');
const cron = require('node-cron');
const bcObject = require('./data2.json')

console.log('Hello from the CRON!')

const getToken = async () => {
  console.log("Retrieving token");
  const client_id = "2a703469-6009-4204-bcb3-ba3cec61abf5";
  const client_secret = "4munZY-rUvfs-SnoaMXkkywC_z9Li5fViX_GGOz2k9A-IwkOhEksFiGsdG88g_1JmuYd_60Tvk5wf48Cdvv52g";
  var auth_string = new Buffer(client_id + ":" + client_secret).toString('base64');
  const oauth_body = "grant_type=client_credentials";
  const oauth_options = {
    headers: {
      'Authorization': 'Basic ' + auth_string,
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  }
  try {
    let oauth_result = await axios.post("https://oauth.brightcove.com/v3/access_token", oauth_body, oauth_options)
    let options = {
      headers: {
        'Authorization': 'Bearer ' + oauth_result.data.access_token,
        'Content-type' : 'application/json'
      }
    }
    return options;
  }catch(error){
    console.log(error);
  }
}

const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const getBrightcoveVideos = async (account, options) => {
  console.log("Retrieving videos")
  let counter = 0; //initialize counter
  let bcVideos = []; //Create empty videos array
  const search = "roku";
  while(counter === bcVideos.length) { //Get next 100 videos until no more are returned
    console.log(counter);
    console.log(bcVideos.length);
    let response = await axios.get("https://cms.api.brightcove.com/v1/accounts/" + account + "/videos?q=tags:" + search + "&limit=100&offset=" + counter, options);
    for(let bcVideo of response.data) {
      if(bcVideo.custom_fields.tvoseriesname && bcVideo.custom_fields.assettype && bcVideo.custom_fields.sortorder) {
        console.log(bcVideo.id);
        let bcVideoUrl = await getBrightcoveSource(account, bcVideo.id, options);
        console.log(bcVideoUrl);
        bcVideo.video_url = bcVideoUrl;
        bcVideos.push(bcVideo);
      }else{
        console.log("Skipped");
      }
       await sleep(111); //Brightcove rate limiting = less than 10 requests per second (111 ms = 9 requests per second)
    };
    counter = counter + 100; //Increment counter
  }
  return bcVideos;
}

const getBrightcoveSource = async (account, bcVideo, options) => {
  console.log("Retrieving source");
  let response = await axios.get("https://cms.api.brightcove.com/v1/accounts/" + account + "/videos/" + bcVideo + "/sources", options) //Get the sorces array
  for(let source of response.data) { //For each sources array...
    if(source.src && source.src.startsWith("https://") && source.type === "application/x-mpegURL") { //Get the HLS source
      console.log(source.src);
      return source.src;
    }
  }
}

const sortBrightcoveVideos = (a, b) => {
  if(a.series > b.series) return 1;
  if(a.series < b.series) return -1;
  if(parseInt(a.custom_fields.syndicationseasonnumber) > parseInt(b.custom_fields.syndicationseasonnumber)) return 1;
  if(parseInt(a.custom_fields.syndicationseasonnumber) < parseInt(b.custom_fields.syndicationseasonnumber)) return -1;
  if(parseInt(a.custom_fields.syndicationepisodenumber) > parseInt(b.custom_fields.syndicationepisodenumber)) return 1;
  if(parseInt(a.custom_fields.syndicationepisodenumber) < parseInt(b.custom_fields.syndicationepisodenumber)) return -1;
}

const createRokuVideo = (bcItem) => {
  let videoObject = {};
  videoObject.id = bcItem.reference_id;
  videoObject.title = bcItem.name;
  videoObject.releaseDate = bcItem.schedule.starts_at;
  videoObject.episodeNumber = bcItem.custom_fields.syndicationepisodenumber;
  videoObject.shortDescription = bcItem.description;
  videoObject.longDescription = bcItem.long_description;
  videoObject.content = {};
  videoObject.content.dateAdded = bcItem.schedule.starts_at;
  videoObject.content.duration = bcItem.duration;
  videoObject.content.language = "en-us";
  videoObject.content.validityPeriodStart = bcItem.schedule.starts_at;
  videoObject.content.validityPeriodEnd = bcItem.schedule.ends_at;
  videoObject.content.videos = {};
  videoObject.content.videos.videoType = "HLS";
  videoObject.content.videos.url = bcItem.video_url;
  videoObject.content.videos.quality = "FHD";
  videoObject.content.captions = {};
  videoObject.content.captions.language = "en";
  videoObject.content.captions.captionType = "CLOSED_CAPTION";
  bcItem.images.thumbnail.sources.forEach((source) => {
    if(source.src.startsWith("https://")) {
      videoObject.thumbnail = source.src
    }
  }) 
  if(bcItem.text_tracks.length != 0) {
    bcItem.text_tracks.forEach((text_track) => {
      if(text_track.kind === "captions") {
        text_track.sources.forEach((source) => {
          if(source.src.startsWith("https://")) {
            videoObject.content.captions.url = source.src
          }
        })
      }
    })
  }
  return videoObject;
}

let createRokuSeries = (bcItem) => {
  let seriesObject = {};
  seriesObject.id = bcItem.custom_fields.syndicationseriesnumber;
  seriesObject.releaseDate = bcItem.custom_fields.syndicationseriesreleasedate;
  seriesObject.shortDescription = bcItem.custom_fields.syndicationseriesdescription;
  seriesObject.tags = bcItem.custom_fields.syndicationserieskeywords;
  seriesObject.title = bcItem.custom_fields.syndicationseriesname;
  seriesObject.genres = bcItem.custom_fields.syndicationseriesgeneres;
  seriesObject.thumbnail = bcItem.images.thumbnail.src;
  return seriesObject;
}

const createRokuFeed = (bcObject) => {
  let rokuFeed = {"providerName": "TVO", "language": "en-US"};
  bcObject.forEach((bcItem) => { //For each video...
    let videoObject = createRokuVideo(bcItem);
    if(bcItem.custom_fields.syndicationtype === "series") { //If Roku type = series...
      if(!rokuFeed.hasOwnProperty("series")) {rokuFeed.series = []}
      let rokuSeriesIndex = rokuFeed.series.findIndex((item) => item.title === bcItem.custom_fields.syndicationseriesname) //For each bc video, check if series INDEX exists in the Roku array
      if(rokuSeriesIndex === -1) { //If series does not exist...
        let seriesObject = createRokuSeries(bcItem);
        rokuFeed.series.push({...seriesObject, "seasons":[{"seasonNumber": bcItem.custom_fields.syndicationseasonnumber, "episodes": [{...videoObject}]}]}); //PUSH series/season/episode to Rocku
      }else{ //If the series does exist...
        let rokuSeasonIndex = rokuFeed.series[rokuSeriesIndex].seasons.findIndex((seasonsItem) => seasonsItem.seasonNumber === bcItem.custom_fields.syndicationseasonnumber) //Check if season INDEX exists
        if(rokuSeasonIndex === -1) { //If the season does not exist...
            rokuFeed.series[rokuSeriesIndex].seasons.push({"seasonNumber": bcItem.custom_fields.syndicationseasonnumber, "episodes": [{...videoObject}]});//PUSH season/episode to Roku
          }else{ //If the season does exist...
            rokuFeed.series[rokuSeriesIndex].seasons[rokuSeasonIndex].episodes.push({...videoObject}); //PUSH episode to Roku
          }
      }
    }else { //Else if Roku type = any other value...
      if(!rokuFeed.hasOwnProperty(bcItem.custom_fields.syndicationtype)) {rokuFeed[bcItem.custom_fields.syndicationtype] = []}
      rokuFeed[bcItem.custom_fields.syndicationtype].push({...videoObject}); //PUSH episode to Roku
    }

  }) //End looping thru Brightcove videos
  return rokuFeed;
}

const writeRokuFeed = (rokuFeed) => {
  console.log("Writing feed");
  fs.writeFile('./feed.json', JSON.stringify(rokuFeed), (err) => {
    if (err) throw err;
  });
}

const tempcron = async () => {
  console.log("CRON triggered");
  let options = await getToken();
  let bcVideos = await getBrightcoveVideos(18140038001, options);
  bcObject.sort(sortBrightcoveVideos);
  let rokuFeed = createRokuFeed(bcObject);
  writeRokuFeed(rokuFeed);
}

tempcron();