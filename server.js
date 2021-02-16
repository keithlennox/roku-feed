/*
Creates RSS feed for Roku

EXPLANATION
- Videos are hosted on Brightcove within playlists
- Playlists are tagged with keyword Roku

CONSTRAINTS
- Users will schedule (CMS) videos on Roku by placing them in playlists. Not all content in CPAD can go on Roku and CPAD does not have a Roku flag.
- Users will not be able to create playlists or upload series images on their own. We will have to do it for them. This is because the metadata on
  a series will need to contain data for x, y, and z and be in json format. There will be no front end for uploading images and the naming convention
  on images will be very specific.
- We must store Roku series title, short descript, long descript, tags, genres, release data in the available Brightcove playlist fields.
  Available playlist fields are name (248 chars), description (248 chars), refid, id (not editable), last updated (not editable)
- Series title and description cannot be that long because they are stored on Brightcove playlists along with tags and genres.
- Any metadata updates must happen on Brightcove. This is because calling Brightcove and CPAD increases complexity.
- We have to make numerous calls to Brightcove: oauth, cms playlists, cms videos, and cms sources. Sources is the only place we can get the video URL.
  This increases the amount of coding and error handling.
- We can only get max of 100 videos at a time and max of only 1 source at a time. This increases the comlexity and the duration it takes to refresh the feed.
- We will need a CRON. This will increase the amount of coding. Brightcove calls can't be triggered by Roku because Roku will time out waiting for
  the calls to finsih. We will need to run a cron job and cache the feed in a json file.
- Roku requires still images for series. They will need to be stored on the node.js server. This increaes the complexity.
- Brightcove URLs expire. We will have to ask them to extend the expiry time/
- We may need to add Brightcove custom fields... TBD.
- Roku Direct Publisher is only meant for simple feeds, mainly because testing/trouble shooting is very slow. We should only put a few shows up or build an app.
- Agenda eps are in segments. Roku has no concept of segments.
- We cannot call different Brightcove accounts in the same Roku channel.

QUESTIONS
- How does Roku handle publish and kill dates?
- How does Roku handle geo-gating?
- Do I need to sort the array? Does Roku care?
- The playback API returns everything we need in a single call (oauth, videos, sources), can we use it? Apparently we can't because it's geo-gated. The AWS server might be anywhere.
- Roku's sample feed does not adhere to their spec doc. Which is correct?
- Do you control what gets into a Roku category using series tags or episode tags?

TO DO
- Search by complete, shedule.starts_at, schedule-ends_at, roku, state
- Don't forget captions.
- Error handling, retry on any error, write to log file, write to error file.
- API creds should be read only

BRIGHTCOVE PLAYLIST NAME FIELD EXAMPLE
- ["Paw Patrol", 3, "education, sports, dogs", "education, kids" ]

OPTIONS FOR STORING SERIES INFO
Brightcove videos: custom fields
Brightcove playlists: max 100, cannot filter by playable
Brightcove folders: no series description
CPAD: programs
*/

const express = require('express');
const cors = require('cors');
const axios = require('axios');

//Set vars
const account = "18140038001";

//Express server
const app = express();
app.use(cors());
app.use(express.urlencoded({extended: false}));
app.use(express.json());
app.get('/', (req, res) => {
  getVideoCount(account);
  getVideos(account);
  getVideoSources(account);
  res.send('Hello World!');
});
app.listen(3000);

//GET BRIGHTCOVE TOKEN (This will need to check for expiry)
const getBCToken = async () => {
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
  console.log(options);
return options;
}catch(error){
  console.log(error);
}
}

//GET TOTAL NUMBER OF VIDEOS
getVideoCount = async (account) => {
  try {
      let options = await getBCToken(); //Get token
      let cms_count_result = await axios.get("https://cms.api.brightcove.com/v1/accounts/" + account + "/counts/videos?q=tags:roku", options)
      console.log(JSON.stringify(cms_count_result.data));
  }catch(error){
      console.log(error);
  }
}

//GET VIDEOS
//Add Looping code (100 videos at a time)
getVideos = async (account) => {
  try {
      let options = await getBCToken(); //Get token
      let cms_result = await axios.get("https://cms.api.brightcove.com/v1/accounts/" + account + "/videos?q=tags:roku", options)
      console.log(JSON.stringify(cms_result.data));
  }catch(error){
      console.log(error);
  }
}

//GET VIDEO SOURCES
getVideoSources = async (account) => {
  try {
      let options = await getBCToken(); //Get token
      let cms_sources_result = await axios.get("https://cms.api.brightcove.com/v1/accounts/" + account + "/videos/6231365655001/sources", options)
      console.log(JSON.stringify(cms_sources_result.data));
  }catch(error){
      console.log(error);
  }
}

//BRIGHTCOVE OBJECT - POPULATED
const bcObject = [
  {
    "series": "Paw Patrol",
    "season": "1",
    "episode": "2",
    "reference_id": "123456",
    "name": "Pups save the day"
  },
  {
    "series": "Kratts",
    "season": "2",
    "episode": "11",
    "reference_id": "654321",
    "name": "Lions"
  },
  {
    "series": "Paw Patrol",
    "season": "1",
    "episode": "1",
    "reference_id": "234567",
    "name": "Pups go to Hollywood"
  },
  {
    "series": "Kratts",
    "season": "1",
    "episode": "7",
    "reference_id": "4500889",
    "name": "Tigers"
  },
  {
    "series": "Kratts",
    "season": "2",
    "episode": "4",
    "reference_id": "654045",
    "name": "Lions"
  },
  { 
    "series": "Paw Patrol",
    "season": "1",
    "episode": "17",
    "reference_id": "234567",
    "name": "Pups go on holiday"
  },
  {
    "series": "Kratts",
    "season": "2",
    "episode": "3",
    "reference_id": "789443",
    "name": "Armadillos"
  },
  {
    "series": "Kratts",
    "season": "1",
    "episode": "2",
    "reference_id": "225478",
    "name": "Wolves"
  }
];

//CREATE ROKU KEED
let rokuFeed = { //Create Roku feed
    "providerName": "TVO", 
    "language": "en-US", 
    series: []
}

//POPULATE ROKU FEED
bcObject.forEach((bcItem) => { //Loop thru brightcove videos
    let rokuSeriesIndex = rokuFeed.series.findIndex((item) => item.title === bcItem.series) //Get the series index from the Roku series array, if it exists
    if(rokuSeriesIndex === -1) { //If the BC series does not exist in the Roku series array
        rokuFeed.series.splice(rokuSeriesIndex, 0, {"title": bcItem.series, "seasons":[{"seasonNumber": bcItem.season, "episodes": [{"title": bcItem.name, "episode": bcItem.episode}]}]}); //Push BC series to Rocku series array
    }else{ //If the BC series does exist in the Roku series array
        let rokuSeasonIndex = rokuFeed.series[rokuSeriesIndex].seasons.findIndex((seasonsItem) => seasonsItem.seasonNumber === bcItem.season) //Get the season index from the Roku seasons array, if it exists
        if(rokuSeasonIndex === -1) { //If the BC season does not exist in the Roku season array
            rokuFeed.series[rokuSeriesIndex].seasons.splice(rokuSeriesIndex, 0,{"seasonNumber": bcItem.season, "episodes": [{"title": bcItem.name, "episode": bcItem.episode}]});//Push the BC season and episode to the seasons array
        }else{ //If the BC season does exist in the Roku season array
            rokuFeed.series[rokuSeriesIndex].seasons[rokuSeasonIndex].episodes.splice(bcItem.episode, 0, {"title": bcItem.name, "episode": bcItem.episode}); //Push the BC episode to the existing Roku season in the Roku seasons array
        }
    }
})
console.log(JSON.stringify(rokuFeed));

/*
CMS API ENDPOINTS
- Get Videos: can use search terms, does not include sources
- Get Video Sources: contains URLs, requires id or refid, cannot use search terms
- Get Playlists for Video
- Get playlists: no way to filter for just roku playlists
- Get videos in playlist
- Get folders
- Get videos in folder
- Get labels
- Get assets: returns master, renditions, txt trks, images
- Get renditions: I think this is just renditions, does not contain URLs

PLAYBACK API ENDPOINTS
- Get videos: includes sources
- Get playlist by id
- Static URLs

POTENTIALLY USEFULL FUNCTIONS
- Array.indexOf/lastIndexOf(item, pos) – look for item starting from position pos, return the index or -1 if not found.
- Array.includes(value) – returns true if the array has value, otherwise false.
- Array.find/filter(func) – filter elements through the function, return first/all values that make it return true.
- Array.findIndex(func) - like find, but returns the index instead of a value.
- Array.forEach(func) – calls func for every element, does not return anything.
- Array.map(func) – creates a new array from results of calling func for every element.
- Array.reduce(func, initial) – calculate a single value over the array by calling func for each element and passing an intermediate result between the calls.
- Array.keys() - returns a new Array Iterator object that contains the keys for each index in the array.
- Array.values() - returns a new Array Iterator object that contains the values for each index in the array.
- Array.some() - at least one element in the array passes the test implemented by the provided function. It returns a Boolean value.
- Array.every() - all elements in the array pass the test implemented by the provided function. It returns a Boolean value.
- Array.push(...items) – adds items to the end,
- Array.isArray(arr) - checks arr for being an array.
- for: repeats until a specified condition evaluates to false.
- for in: iterates a specified variable over all the enumerable properties of an object. 
- for of: 
- while: executes its statements as long as a specified condition evaluates to true. 
- do while: repeats until a specified condition evaluates to false.
- assign

/*RESOURCES
https://www.robinwieruch.de/javascript-map-array
https://codepunk.io/xml-vs-json-why-json-sucks/
https://developer.mozilla.org/en-US/docs/Web/XSLT/XSLT_JS_interface_in_Gecko/JavaScript_XSLT_Bindings
https://www.npmjs.com/package/saxon-js
https://www.npmjs.com/package/object-mapper
https://www.npmjs.com/package/node-json-transform
https://www.npmjs.com/package/object-mapper
https://www.npmjs.com/package/dot-object
https://www.npmjs.com/package/handlebars
https://javascript.info/json
https://www.freecodecamp.org/news/javascript-array-of-objects-tutorial-how-to-create-update-and-loop-through-objects-using-js-array-methods/
https://dev.to/lokinder1/cheatsheet-of-most-useful-javascript-array-functions-48j1
https://javascript.info/array-methods
https://www.linkedin.com/pulse/javascript-find-object-array-based-objects-property-rafael/
https://usefulangle.com/post/3/javascript-search-array-of-objects
https://www.javascripttutorial.net/es6/javascript-array-findindex/
https://apis.support.brightcove.com/cms/code-samples/cms-api-sample-mrss-generator.html
https://apis.support.brightcove.com/playback/code-samples/playback-api-sample-mrss-generator.html
https://apis.support.brightcove.com/cms/code-samples/cms-api-sample-mrss-feed-playlist.html
https://apis.support.brightcove.com/playback/code-samples/playback-api-sample-jsonmrss-feed-playlist.html
https://github.com/registerguard/brightcove-cms-api-php-rss
*/