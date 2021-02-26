const axios = require('axios');
const url = require('url');
//const bcObject = require('./data.json')
const bcObject = require('./data2.json')
var fs = require('fs');
const cron = require('node-cron');

console.log('Hello from the CRON!')

//Set vars
const account = "18140038001";
//const search = "history";
const search = "roku";
let seriesObject = {};
let videoObject = {};

//CREATE ROKU FEED
//TO DO: error handling, logging, re-tries, rate limiting, handle multiple bc accounts, filter for playable videos, handle multiple content types
createFeed = async (account) => {
  try {
    console.log("CRON triggered")

    //Get count
    let options = await getToken(); //This may need to be called on each CMS call
    let count = await axios.get("https://cms.api.brightcove.com/v1/accounts/" + account + "/counts/videos?q=tags:" + search, options);
    console.log("Search found " + count.data.count + " videos");

    //Get videos
    let counter = 0; //initialize counter
    let videos_array = []; //Create empty videos array
    while(counter <= count.data.count) { //Get next 100 videos
      console.log("Retrieving next 100 videos");
      let videos = await axios.get("https://cms.api.brightcove.com/v1/accounts/" + account + "/videos?q=tags:" + search + "&limit=100&offset=" + counter, options);
      for(let item of videos.data) { //Push each found video to videos_array
        videos_array.push(item); 
        console.log(item.id);
      };
      counter = counter + 100; //Increment counter
    }

    //Get sources
    console.log("Retrieving sources");
    for(let videoItem of videos_array) { //For each video...
      let sources = await axios.get("https://cms.api.brightcove.com/v1/accounts/" + account + "/videos/" + videoItem.id + "/sources", options) //Get the sorces array
      for(let sourceItem of sources.data) { //For each sources array...
        if(sourceItem.src && sourceItem.src.startsWith("https://") && sourceItem.type === "application/x-mpegURL") { //Get the HLS source
          videoItem.video_url = sourceItem.src; //Add the HLS source url to the videos_array
          console.log(sourceItem.src);
        }
      }
      await sleep(111); //Brightcove rate limiting = less than 10 requests per second (111 ms = 9 requests per second)
    };
    //console.log(videos_array);

    //Sort the videos by series, season, episode
    //parseInt() required because Brightcove only returns strings. You cannot sort numbers properly (11 is less than 2) unless they are integers.
    //console.log(bcObject);
    console.log("Sorting array");
    bcObject.sort(function (a, b) {
      if(a.series > b.series) return 1;
      if(a.series < b.series) return -1;
      if(parseInt(a.custom_fields.syndicationseasonnumber) > parseInt(b.custom_fields.syndicationseasonnumber)) return 1;
      if(parseInt(a.custom_fields.syndicationseasonnumber) < parseInt(b.custom_fields.syndicationseasonnumber)) return -1;
      if(parseInt(a.custom_fields.syndicationepisodenumber) > parseInt(b.custom_fields.syndicationepisodenumber)) return 1;
      if(parseInt(a.custom_fields.syndicationepisodenumber) < parseInt(b.custom_fields.syndicationepisodenumber)) return -1;
    });
    //console.log(bcObject);

    //Create Roku object
    let rokuFeed = {"providerName": "TVO", "language": "en-US", series: []}

    //Loop thru Brightcove videos
    bcObject.forEach((bcItem) => { //For each video...

      //Create temporary video object
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
      
      //Populate Roku object
      let rokuSeriesIndex = rokuFeed.series.findIndex((item) => item.title === bcItem.custom_fields.syndicationseriesname) //For each bc video, check if series INDEX exists in the Roku array
      if(rokuSeriesIndex === -1) { //If series does not exist...
        seriesObject.id = bcItem.custom_fields.syndicationseriesnumber;
        seriesObject.releaseDate = bcItem.custom_fields.syndicationseriesreleasedate;
        seriesObject.shortDescription = bcItem.custom_fields.syndicationseriesdescription;
        seriesObject.tags = bcItem.custom_fields.syndicationserieskeywords;
        seriesObject.title = bcItem.custom_fields.syndicationseriesname;
        seriesObject.genres = bcItem.custom_fields.syndicationseriesgeneres;
        seriesObject.thumbnail = bcItem.images.thumbnail.src;
        rokuFeed.series.push({...seriesObject, "seasons":[{"seasonNumber": bcItem.custom_fields.syndicationseasonnumber, "episodes": [{...videoObject}]}]}); //PUSH series/season/episode to Rocku
      }else{ //If the series does exist...
        let rokuSeasonIndex = rokuFeed.series[rokuSeriesIndex].seasons.findIndex((seasonsItem) => seasonsItem.seasonNumber === bcItem.custom_fields.syndicationseasonnumber) //Check if season INDEX exists
        if(rokuSeasonIndex === -1) { //If the season does not exist...
            rokuFeed.series[rokuSeriesIndex].seasons.push({"seasonNumber": bcItem.custom_fields.syndicationseasonnumber, "episodes": [{...videoObject}]});//PUSH season/episode to Roku
          }else{ //If the season does exist...
            rokuFeed.series[rokuSeriesIndex].seasons[rokuSeasonIndex].episodes.push({...videoObject}); //PUSH episode to Roku
          }
      }
    
    }) //End loop thru Brightcove videos
   
    //Write Roku feed to file
    console.log("Writing Roku object to file");
    console.log(JSON.stringify(rokuFeed));
    fs.writeFile('./feed.json', JSON.stringify(rokuFeed), (err) => {
      if (err) throw err;
    });

  }catch(error){
    console.log(error); //Need to log these
  }

} //End create feed function

//SLEEP FUNCTION (works with async/await)
//sitepoint.com/delay-sleep-pause-wait
//coreycleary.me/why-does-async-await-in-a-foreach-not-actually-await
const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
}

//GET BRIGHTCOVE TOKEN (This will need to check for expiry)
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
  try {
    let oauth_result = await axios.post("https://oauth.brightcove.com/v3/access_token", oauth_body, oauth_options)
    let options = {
      headers: {
        'Authorization': 'Bearer ' + oauth_result.data.access_token,
        'Content-type' : 'application/json'
      }
    }
    //console.log(options);
    console.log("Retrieving token")
    return options;
  }catch(error){
    console.log(error);
  }
}

//CRON
createFeed(account); //Triggers CRON once immediately (for testing only)
// cron.schedule('*/10 * * * *', () => { //Enable this in prod
//     console.log('CRON TRIGGERED ' + new Date())
//     createFeed(account);
// })