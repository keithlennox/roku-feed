const axios = require('axios');
var fs = require('fs');
const cron = require('node-cron');
const dummyBcSourcedVideos = require('./data.json')

console.log('Hello from the CRON!')

//Get API token (required for all Brightcove API calls)
const getToken = async () => {
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
    let now =  Date.now();
    if(now > getToken.expireTime || !getToken.expireTime) { //If Brightcove token has expired or is undefined
      let oauth_result = await axios.post("https://oauth.brightcove.com/v3/access_token", oauth_body, oauth_options)
      getToken.options = { //Token saved as function parameter so it persists between function calls
        headers: {
          'Authorization': 'Bearer ' + oauth_result.data.access_token,
          'Content-type' : 'application/json'
        }
      }
      getToken.expireTime = Date.now() + 290000; //Now + 290 sec (BC tokens expire in 300 sec / 5 min). Saved as function parameter so it persists between function calls.
      console.log("Returned new token");
      return getToken.options; //Return a new token
    }
    console.log("Returned exisiting token");
    return getToken.options; //Return the exisiting token because it has not expired yet
}

const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const getBrightcoveVideos = async (account) => {
  console.log("Retrieving videos");
  let counter = 0; //initialize counter
  let bcVideos = []; //Create empty videos array
  const search = "roku";
  while(counter === bcVideos.length) { //Get next 100 videos until no more are returned
    for (i = 1; i <=3; i++) { //Retry on error
      try{
        console.log(counter);
        console.log(bcVideos.length);
        let options = await getToken();
        let response = await axios.get("https://cms.api.brightcove.com/v1/accounts/" + account + "/videos?q=tags:" + search + "&limit=100&offset=" + counter, options);
        bcVideos.push(...response.data);
        console.log("Get next 100 videos")
        break; //No need to retry
      }catch(error){
        console.error(error);
        await sleep(5000); //Wait 5 seconds between retries
      }
    }//End retry loop
    await sleep(111); //Brightcove rate limiting = less than 10 requests per second (111 ms = 9 requests per second)
    counter = counter + 100; //Increment counter
  }
  return bcVideos;//This may be an empty array if all API calls fail
}

const getBrightcoveSource = async (bcVideos) => {
  console.log("Retrieving sources");
  for(let bcVideo of bcVideos) {//For every video in the array
    for (i = 1; i <=3; i++) { //Retry on error
      try{
        let options = await getToken();
        let response = await axios.get("https://cms.api.brightcove.com/v1/accounts/" + bcVideo.account_id + "/videos/" + bcVideo.id + "/sources", options) //Get the sources array
        for(let source of response.data) { //For each sources array...
          if(source.src && source.src.startsWith("https://") && source.type === "application/x-mpegURL") { //Get the HLS source
            console.log(source.src);
            bcVideo.video_url = source.src;
          }
        }
        break; // No need to retry
      }catch(error){
        console.error(error);
        await sleep(5000); //Wait 5 seconds between retries
      }
    }//End retry loop
    await sleep(111); //Brightcove rate limiting = less than 10 requests per second (111 ms = 9 requests per second)
  }
  return bcVideos;
} //End function

const filterBrightcoveVideos = (bcSourcedVideos) => {
  console.log("Filtering videos");
  let filteredVideos = [];
  console.log(filteredVideos);
  for(let bcVideo of bcSourcedVideos) {
    let bc = bcVideo.custom_fields;
    if(bc.otttype === "series with seasons" && bc.ottseriesname && bc.ottseasonnumber && bc.ottepisodenumber && bcVideo.video_url) {
      console.log("Add series with seasons");
      if(!filteredVideos.hasOwnProperty("series with seasons")) {filteredVideos["series with seasons"] = []}
      filteredVideos["series with seasons"].push(bcVideo);
    }else if(bc.otttype === "series without seasons" && bc.ottseriesname && bc.ottepisodenumber && bcVideo.video_url) {
      console.log("Add series without seasons");
      if(!filteredVideos.hasOwnProperty("series without seasons")) {filteredVideos["series without seasons"] = []}
      filteredVideos["series without seasons"].push(bcVideo);
    }else if(bc.otttype === "movies" && bcVideo.video_url) {
      console.log("Add movies");
      if(!filteredVideos.hasOwnProperty("movies")) {filteredVideos["movies"] = []}
      filteredVideos["movies"].push(bcVideo);
    }else if(bc.otttype === "tv specials" && bcVideo.video_url) {
      console.log("Add tv specials");
      if(!filteredVideos.hasOwnProperty("tv specials")) {filteredVideos["tv specials"] = []}
      filteredVideos["tv specials"].push(bcVideo);
    }else{
      //throw { name: "MissingBrightcoveField", message: "Brightcove field is missing!" };
    }
  }
  console.log(filteredVideos);
  return filteredVideos;
}

const sortBrightcoveVideos = (a, b) => {
  console.log("Sorting videos");
  if(a.series > b.series) return 1;
  if(a.series < b.series) return -1;
  if(parseInt(a.custom_fields.ottseasonnumber) > parseInt(b.custom_fields.ottseasonnumber)) return 1;
  if(parseInt(a.custom_fields.ottseasonnumber) < parseInt(b.custom_fields.ottseasonnumber)) return -1;
  if(parseInt(a.custom_fields.ottepisodenumber) > parseInt(b.custom_fields.ottepisodenumber)) return 1;
  if(parseInt(a.custom_fields.ottepisodenumber) < parseInt(b.custom_fields.ottepisodenumber)) return -1;
}

const createRokuVideo = (bcItem) => {
  let videoObject = {};
  videoObject.id = bcItem.reference_id;
  videoObject.title = bcItem.name;
  videoObject.releaseDate = bcItem.schedule.starts_at;
  videoObject.episodeNumber = bcItem.custom_fields.ottepisodenumber;
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
  seriesObject.id = bcItem.custom_fields.ottseriesnumber;
  seriesObject.releaseDate = bcItem.custom_fields.ottseriesreleasedate;
  seriesObject.shortDescription = bcItem.custom_fields.ottseriesdescription;
  seriesObject.tags = bcItem.custom_fields.ottserieskeywords;
  seriesObject.title = bcItem.custom_fields.ottseriesname;
  seriesObject.genres = bcItem.custom_fields.ottseriesgeneres;
  seriesObject.thumbnail = bcItem.images.thumbnail.src;
  return seriesObject;
}

const createRokuFeed = (bcObject) => {
  let rokuFeed = {"providerName": "TVO", "language": "en-US"}; //Add last updated

  //Series with seasons
  if(bcObject.hasOwnProperty("series with seasons")) {
    bcObject["series with seasons"].forEach((bcItem) => { //For each video...
      let videoObject = createRokuVideo(bcItem);
      if(!rokuFeed.hasOwnProperty("series")) {rokuFeed.series = []}
      let rokuSeriesIndex = rokuFeed.series.findIndex((item) => item.title === bcItem.custom_fields.ottseriesname) //For each bc video, check if series INDEX exists in the Roku array
      if(rokuSeriesIndex === -1) { //If series does not exist...
        let seriesObject = createRokuSeries(bcItem);
        rokuFeed.series.push({...seriesObject, "seasons":[{"seasonNumber": bcItem.custom_fields.ottseasonnumber, "episodes": [{...videoObject}]}]}); //PUSH series/season/episode to Rocku
      }else{ //If the series does exist...
        let rokuSeasonIndex = rokuFeed.series[rokuSeriesIndex].seasons.findIndex((seasonsItem) => seasonsItem.seasonNumber === bcItem.custom_fields.ottseasonnumber) //Check if season INDEX exists
        if(rokuSeasonIndex === -1) { //If the season does not exist...
          rokuFeed.series[rokuSeriesIndex].seasons.push({"seasonNumber": bcItem.custom_fields.ottseasonnumber, "episodes": [{...videoObject}]});//PUSH season/episode to Roku
        }else{ //If the season does exist...
          rokuFeed.series[rokuSeriesIndex].seasons[rokuSeasonIndex].episodes.push({...videoObject}); //PUSH episode to Roku
        }
      }
    })
  }

  //Series without seasons
  if(bcObject.hasOwnProperty("series without seasons")) {
    bcObject["series without seasons"].forEach((bcItem) => { //For each video...
      let videoObject = createRokuVideo(bcItem);
      if(!rokuFeed.hasOwnProperty("series")) {rokuFeed.series = []}
      let rokuSeriesIndex = rokuFeed.series.findIndex((item) => item.title === bcItem.custom_fields.ottseriesname) //For each bc video, check if series INDEX exists in the Roku array
      if(rokuSeriesIndex === -1) { //If series does not exist...
        let seriesObject = createRokuSeries(bcItem);
        rokuFeed.series.push({...seriesObject, "episodes": [{...videoObject}]}); //PUSH series/season/episode to Rocku
      }else{ //If the series does exist...
        rokuFeed.series[rokuSeriesIndex].episodes.push({...videoObject}); //PUSH episode to Roku
      }
    })
  }

  //Movies
  if(bcObject.hasOwnProperty("movies")) {
    bcObject["movies"].forEach((bcItem) => { //For each Brightcove video
      let videoObject = createRokuVideo(bcItem);
      if(!rokuFeed.hasOwnProperty("movies")) {rokuFeed.movies = []}
      rokuFeed.movies.push(videoObject); //PUSH movie to Roku
    })
  }

  //TV Specials
  if(bcObject.hasOwnProperty("tv specials")) {
    bcObject["tv specials"].forEach((bcItem) => { //For each video...
      let videoObject = createRokuVideo(bcItem);
      if(!rokuFeed.hasOwnProperty("tvSpecials")) {rokuFeed.tvSpecials = []}
      rokuFeed.tvSpecials.push(videoObject); //PUSH tv special to Roku
    })
  }

  return rokuFeed;
}

const writeRokuFeed = (rokuFeed) => {
  console.log("Writing feed");
  fs.writeFile('./feed.json', JSON.stringify(rokuFeed), (err) => {
    if (err) throw err;
  });
}

const tempCron = async () => {
  console.log("CRON triggered");
  let bcVideos = await getBrightcoveVideos(18140038001);
  let bcSourcedVideos = await getBrightcoveSource(bcVideos);
  let bcFilteredVideos = filterBrightcoveVideos(dummyBcSourcedVideos);
  bcFilteredVideos["series with seasons"].sort(sortBrightcoveVideos);
  let rokuFeed = createRokuFeed(bcFilteredVideos);
  writeRokuFeed(rokuFeed);
}

tempCron();