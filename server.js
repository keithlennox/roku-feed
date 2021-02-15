/*
Creates RSS feed for Roku

CONSTRAINTS
- Users will schedule videos onto or off of Roku by setting a custom BC tag called Roku to yes. We have to do this because there is no where else to get that info.
  CPAD does not have it and there is no separate scheduling system. Unless everyone agress that all content live on the web sites also goes to Roku...
- We have have to make 3 calls to Brightcove to get videos: oauth, cms video, and cms sources. Sources is the only place we can get the video URL.
- We will add videos one at a time to the Roku feed. We have to do this, as opposed to adding series objects, because there is no series or season constructs on BC. 
  Everything is held at the video level. The down side is that it's more difficult to qc objects before adding them. You don't know an object is complete until
  all videos have been added.
- We can only get max of 100 videos at a time and max of only 1 source at a time.
- The playback API returns everything we need in a single call (oauth, videos, sources) but we can't use it because it's geo-gated. The AWS server might be anywhere.

QUESTIONS/TO DO
- Where do we store series thumb, title, short descript, long descript, tags, genres, release data?
  Available playlist fields are name, description, ref if, id (not editable), last updated (not editable)
- Search by complete, shedule.starts_at, schedule-ends_at, roku, state
- How does Roku handle geogating?
- Do I need to sort the array? Does Roku care?
- Don't forget captions
- Error handling, retry on any error, write to log file, write to error file
- Agenda eps are in segments. Roku has no concept of segments.
- Do we have to call different Brightcove accounts?
- How does Roku handle publish and kill dates?
- API creds should be read only

BRIGHTCOVE PLAYLIST FIELD MAPPING
- name: Paw Patrol-S1
- description: This is the description --news, sports, science-- ((space, aliens, reptiles))
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


// REFERENCE /////////////////////////// REFERENCE //////////////////////////// REFERENCE //////////////////////// REFERENCE //

/*API ENPOINTS

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
*/

/*OPTIONS FOR ORGANIZING CONTENT
Videos: 
Playlists: max 100, cannot filter by playable
Folders: no series description
CPAD: more API calls
*/

/*OPTIONS FOR RESHAPING JSON
- node.js / json / javascript methods
- node.js / json / npm package
- node.js / json / npm xslt package (saxon)
- php
*/

/*OPTIONS FOR GETTING CONTENT + RE-MAPPING JSON

OPTION 1
- Call BC to get 100 videos that match search=roku
- Loop thru results and call again to get sources for each video
- Create video object
- Insert video into season object
- Call BC for next 100

OPTION 2
Is there a way to build the objects first, before adding them to the Roku object.
*/

/*ROKU OBJECT - EMPTY
const unFlatObjectA = {
	"series": [
        {
            "seasons": [
                {
                    "episodes": [
                        {},
                        {},
                        {}
                    ]
                },
                {
                    "episodes": [
                        {},
                        {},
                        {}
                    ]
                }
            ]
	    },
        {
            "seasons": [
                {
                    "episodes": [
                        {},
                        {},
                        {}
                    ]
                },
                {
                    "episodes": [
                        {},
                        {},
                        {}
                    ]
                }
            ]
	    }
    ]
} */

/*ROKU OBJECT - POPULATED
const unFlatObjectB = {
	"providerName": "Roku Developers",
	"language": "en-US",
	"series": [
        {
            "id": "series_2_RSG",
            "title": "Hello",
            "seasons": [
                {
                    "seasonNumber": "1",
                    "episodes": [
                        {
                            "id": "series-rsg_unit1_intro",
                            "title": "Introduction to the course",
                            "episodeNumber": 1,
                        },
                        {
                            "id": "series-rsg-unit2-developerSetup",
                            "title": "Development setup",
                            "episodeNumber": 2,
                        },
                        {
                            "id": "series-video3-scenegraph-overview",
                            "title": "Core concepts",
                            "episodeNumber": 3,
                        }
                    ]

                }
            ]
	    }
    ]
} */

/*CODE SNIPPETS

ARRAY LOOPING FUNCTIONS
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

OTHER ARRAY FUNCTION
Array.push(...items) – adds items to the end,
Array.isArray(arr) - checks arr for being an array.

OTHER FUNCTIONS
- for: repeats until a specified condition evaluates to false.
- for in: iterates a specified variable over all the enumerable properties of an object. 
- for of: 
- while: executes its statements as long as a specified condition evaluates to true. 
- do while: repeats until a specified condition evaluates to false.

OBJECT FUNCTIONS
- assign

FINDINDEX: Returns the index of the first element in an array that pass a test
array.findIndex(function(currentValue, index, arr), thisValue)
 let a = bcObject.findIndex((item, index) => item.series === "Brady Bunch")
 console.log(a);

FIND: Returns the value of the first element in an array that pass a test
array.find(function(currentValue, index, arr),thisValue)
let b = flatObject.find((item, index) => item.series === "Brady Bunch")
console.log(b);

FOREACH: Calls a function for each array element
array.forEach(function(currentValue, index, arr), thisValue)
let c = flatObject.forEach((item, index) => {
    if(item.series === "Brady Bunch") {
        console.log(index);
    }
/})

SOME: Checks if any of the elements in an array pass a test
array.some(function(currentValue, index, arr), thisValue)
let d = flatObject.some((item, index) => item.series === "Brady Bunch")
console.log(d);

EVERY: Checks if all elements in an array pass a test
array.every(function(currentValue, index, arr), thisValue)
let e = flatObject.every((item, index) => item.series === "Brady Bunch")
console.log(e);
*/

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