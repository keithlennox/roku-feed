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

    //Sort the videos_array by series, season, episode
    //gomakethings.com/sorting-an-array-by-multiple-criteria-with-vanilla-javascript/
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

    //Create Roku feed
    console.log("Creating Roku object");
    let rokuFeed = {
      "providerName": "TVO", 
      "language": "en-US", 
      series: []
    }

    //Populate the Roku feed
    /*Add validation:
      - If any field is blank, do not add vodeo, but log error
      - if series does not exist in the Roku feed, season must = 1 + ep must = 1. This insures that we will get all series info and that you cannot have a series that does not have at least S1E1. Log error.
    */
    console.log("Populating Roku object");
    bcObject.forEach((bcItem) => { //Loop thru brightcove videos

      //Create Roku series object
      let seriesObject = {
        "id": bcItem.custom_fields.syndicationseriesnumber,
        "releaseDate": bcItem.custom_fields.syndicationseriesreleasedate,
        "shortDescription": bcItem.custom_fields.syndicationseriesdescription,
        "tags": bcItem.custom_fields.syndicationserieskeywords,
        "title": bcItem.custom_fields.syndicationseriesname,
        "genres": bcItem.custom_fields.syndicationseriesgeneres,
        "thumbnail": bcItem.images.thumbnail.src //We need to replace with series image
      }
      //console.log(JSON.stringify(seriesObject));

      //Create Roku video object
      let videoObject = {
        "id": bcItem.reference_id,
        "title": bcItem.name,
        "thumbnail": bcItem.images.thumbnail.src,
        "releaseDate": bcItem.schedule.starts_at,
        "episodeNumber": bcItem.custom_fields.syndicationepisodenumber,
        "shortDescription": bcItem.description,
        "longDescription": bcItem.long_description,
        "content": {
          "dateAdded": bcItem.schedule.starts_at,
          "duration": bcItem.duration,
          "language": "en-us",
          "validityPeriodStart": bcItem.schedule.starts_at,
          "validityPeriodEnd": bcItem.schedule.ends_at,
          "videos": [{
            "videoType": "HLS",
            "url": bcItem.video_url,
            "quality": "FHD"
          }],
          "captions": {
            "url": "tbd",
            "language": "en",
            "captionType": "CLOSED_CAPTION"
          }
        }
      };
      //console.log(JSON.stringify(videoObject));
        
      //Add Roku objects to Roku feed
      let rokuSeriesIndex = rokuFeed.series.findIndex((item) => item.title === bcItem.custom_fields.syndicationseriesname) //For each bc video, check if series INDEX exists in the Roku array
      if(rokuSeriesIndex === -1) { //If series does not exist...
          rokuFeed.series.push({...seriesObject, "seasons":[{"seasonNumber": bcItem.custom_fields.syndicationseasonnumber, "episodes": [{...videoObject}]}]}); //PUSH series/season/episode to Rocku
      }else{ //If the series does exist...
          let rokuSeasonIndex = rokuFeed.series[rokuSeriesIndex].seasons.findIndex((seasonsItem) => seasonsItem.seasonNumber === bcItem.custom_fields.syndicationseasonnumber) //Check if season INDEX exists
          if(rokuSeasonIndex === -1) { //If the season does not exist...
              rokuFeed.series[rokuSeriesIndex].seasons.push({"seasonNumber": bcItem.custom_fields.syndicationseasonnumber, "episodes": [{...videoObject}]});//PUSH season/episode to Roku
          }else{ //If the season does exist...
              rokuFeed.series[rokuSeriesIndex].seasons[rokuSeasonIndex].episodes.push({...videoObject}); //PUSH episode to Roku
          }
      }
    
    })
   
    //Write Roku feed to file
    console.log("Writing Roku object to file");
    console.log(JSON.stringify(rokuFeed));
    fs.writeFile('./feed.json', JSON.stringify(rokuFeed), (err) => {
      if (err) throw err;
    });

  }catch(error){
      console.log(error);
  }
}

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