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
  //const search = "tags:roku";
  const search = "ott_flag:true";

  while(counter === bcVideos.length) { //Get next 100 videos until no more are returned
    for (i = 1; i <=3; i++) { //Retry on error
      try{
        console.log(counter);
        console.log(bcVideos.length);
        let options = await getToken();
        let response = await axios.get("https://cms.api.brightcove.com/v1/accounts/" + account + "/videos?query=" + search + "&limit=100&offset=" + counter, options);
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

/*All fields used in all videos objects (series with seasons, series without seasons, movies, tv specials), except:
generes: movies and tv shows only
tags: movies and tv shows only
episodeNumber: series only*/
const createRokuVideo = (bcItem) => {
  let videoObject = {};
  videoObject.id = bcItem.reference_id;
  videoObject.title = bcItem.name;
  videoObject.content = {};
  videoObject.content.dateAdded = `${bcItem.custom_fields.ott_release_date}T08:00:00+04:00`; //YYYY-MM-DDTHH:MM:SS+HH:MM. Used to generate the “Recently Added” category. Everything is relased 8 or 9 AM Toronto time.
  videoObject.content.duration = Math.round(bcItem.duration / 1000); //Brightcove returns miliseconds. Roku requires seconds and must be an integer.
  videoObject.content.language = "en-us";
  videoObject.content.validityPeriodStart = bcItem.schedule.starts_at;
  videoObject.content.validityPeriodEnd = bcItem.schedule.ends_at;
  videoObject.content.videos = {};
  videoObject.content.videos.videoType = "HLS";
  if(bcItem.video_url) {
    videoObject.content.videos.url = bcItem.video_url;
  }else {
    throw new ReferenceError("No video url found");
  }
  videoObject.content.videos.quality = "FHD";
  videoObject.content.captions = {};
  videoObject.content.captions.language = "en";
  videoObject.content.captions.captionType = "CLOSED_CAPTION";
  if(bcItem.text_tracks.length != 0) {
    bcItem.text_tracks.forEach((text_track) => {
      if(text_track.kind === "captions") {
        text_track.sources.forEach((source) => {
          if(source.src.startsWith("https://")) {
            videoObject.content.captions.url = source.src //Should throw error if cc not found
          }
        })
      }
    })
  }
  if(bcItem.custom_fields.ott_type === "movies" || bcItem.custom_fields.ott_type === "tv specials") {
    videoObject.genres = bcItem.custom_fields.ott_genres.split(","); //Need to strip whitespace
    videoObject.tags = bcItem.custom_fields.ott_tags.split(","); //Need to strip whitespace
  }
  bcItem.images.thumbnail.sources.forEach((source) => {
    if(source.src.startsWith("https://")) {
      videoObject.thumbnail = source.src //Should throw error if cc not found
    }
  }) 
  videoObject.releaseDate = bcItem.ott_release_date; //YYYY-MM-DD. Used to sort programs chronologically and group related content in Roku Search.
  if(bcItem.custom_fields.ott_type === "series with seasons" || "series without seasons") {
    videoObject.episodeNumber = bcItem.custom_fields.ott_episode_number;
  }
  videoObject.shortDescription = bcItem.description;
  videoObject.longDescription = bcItem.long_description;
  videoObject.ratings = {"rating": bcItem.custom_fields.ott_rating, "ratingSource": "CPR"} //Need to confirm if Telescope AgeRating field is appropriate
  return videoObject;
}

let createRokuSeries = (bcObject, bcItem) => {

  let bcSeriesItem = bcObject.find((item) => {
    if(bcItem.custom_fields.ott_type === "series with seasons") {
      return item.custom_fields.ott_series_name === bcItem.custom_fields.ott_series_name && item.custom_fields.ott_season_number === "1" && item.custom_fields.ott_episode_number === "1";
    }else{
      return item.custom_fields.ott_series_name === bcItem.custom_fields.ott_series_name && item.custom_fields.ott_episode_number === "1";
    }
  })

  if(bcSeriesItem === undefined) {
    throw new ReferenceError("First ep for series not found");
  }

  let seriesObject = {};
  seriesObject.id = bcSeriesItem.custom_fields.ott_series_number;
  seriesObject.releaseDate = bcSeriesItem.custom_fields.ott_release_date;
  seriesObject.shortDescription = bcSeriesItem.custom_fields.ott_series_description;
  seriesObject.tags = bcSeriesItem.custom_fields.ott_tags.split(","); //Need to strip whitespace
  seriesObject.title = bcSeriesItem.custom_fields.ott_series_name;
  seriesObject.genres = bcSeriesItem.custom_fields.ott_genres.split(","); //Need to strip whitespace
  seriesObject.thumbnail = bcSeriesItem.images.thumbnail.src;
  return seriesObject;
}

const createRokuFeed = (bcObject) => {
  let rokuFeed = {"providerName": "TVO", "language": "en-US"};
  bcObject.forEach((bcItem) => { //For each video...

    try{

      //Series with seasosns
      if(bcItem.custom_fields.ott_type === "series with seasons") {
        let videoObject = createRokuVideo(bcItem);
        if(!rokuFeed.hasOwnProperty("series")) {
          let seriesObject = createRokuSeries(bcObject, bcItem);
          rokuFeed.series = [{...seriesObject, "seasons":[{"seasonNumber": bcItem.custom_fields.ott_season_number, "episodes": [{...videoObject}]}]}];
        }else{
          let rokuSeriesIndex = rokuFeed.series.findIndex((item) => item.title === bcItem.custom_fields.ott_series_name) //Check if series INDEX exists
          if(rokuSeriesIndex === -1) { //If series does not exist...
            let seriesObject = createRokuSeries(bcObject, bcItem);
            rokuFeed.series.push({...seriesObject, "seasons":[{"seasonNumber": bcItem.custom_fields.ott_season_number, "episodes": [{...videoObject}]}]}); //PUSH series/season/episode
          }else{ //If the series exists...
            let rokuSeasonIndex = rokuFeed.series[rokuSeriesIndex].seasons.findIndex((seasonsItem) => seasonsItem.seasonNumber === bcItem.custom_fields.ott_season_number) //Check if season INDEX exists
            if(rokuSeasonIndex === -1) { //If the season does not exist...
                rokuFeed.series[rokuSeriesIndex].seasons.push({"seasonNumber": bcItem.custom_fields.ott_season_number, "episodes": [{...videoObject}]});//PUSH season/episode
              }else{ //If the season exists...
                rokuFeed.series[rokuSeriesIndex].seasons[rokuSeasonIndex].episodes.push({...videoObject}); //PUSH episode
              }
          }
        }
        
      //Series without seasons
      }else if(bcItem.custom_fields.ott_type === "series without seasons") {
        let videoObject = createRokuVideo(bcItem);
        if(!rokuFeed.hasOwnProperty("series")) {
          let seriesObject = createRokuSeries(bcObject, bcItem);
          rokuFeed.series = [{...seriesObject, "episodes": [{...videoObject}]}];
        }else{
          let rokuSeriesIndex = rokuFeed.series.findIndex((item) => item.title === bcItem.custom_fields.ott_series_name) //Check if series INDEX exists
          if(rokuSeriesIndex === -1) { //If series does not exist...
            let seriesObject = createRokuSeries(bcObject, bcItem);
            rokuFeed.series.push({...seriesObject, "episodes": [{...videoObject}]}); //PUSH series/season/episode
          }else{ //If the series exists...
            rokuFeed.series[rokuSeriesIndex].episodes.push({...videoObject}); //PUSH episode
          }
        }

      //Movies
      }else if(bcItem.custom_fields.ott_type === "movies"){
        let videoObject = createRokuVideo(bcItem);
        if(!rokuFeed.hasOwnProperty("movies")) {rokuFeed["movies"] = []}
        rokuFeed["movies"].push({...videoObject}); //PUSH movie to Roku

      //TV specials
      }else if(bcItem.custom_fields.ott_type === "tv specials") {
        let videoObject = createRokuVideo(bcItem);
        if(!rokuFeed.hasOwnProperty("tvSpecials")) {rokuFeed["tvSpecials"] = []}
        rokuFeed["tvSpecials"].push({...videoObject}); //PUSH tv special to Roku
      }

    }catch(error){
      console.error(error);
    }

  }) //End looping thru Brightcove videos
  return rokuFeed;//This could return an empty Roku feed if all tasks fail

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
  let rokuFeed = createRokuFeed(bcSourcedVideos);
  writeRokuFeed(rokuFeed);
}

tempCron();