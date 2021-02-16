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
- We must store Roku series title, short descript, long descript, tags, genres, release date in the available Brightcove playlist fields.
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
- Ownership is set at the channel level, NOT the series or video level! Country is set in the Roku channel properties. You also set country at the Roku channel
  "Channel Store Info" level, but this does not affect where videos play.
- Pub/kill dates are same for Roku as they are for web sites. These are set in the feed, under Content.
- Roku Direct Publisher is slow to update which makes it slow to test and trouble shoot.
- BC URLS expire. We have to ask them to extend.

QUESTIONS
- The playback API returns everything we need in a single call (oauth, videos, sources), can we use it? Apparently we can't because it's geo-gated. The AWS server might be anywhere.
- Roku's sample feed does not adhere to their spec doc. Which is correct?
- Do you control what gets into a Roku category using series tags or episode tags?
- Do I need to sort the array? Does Roku care?
- What BC custom fields are needed?
- What's the proper way to call an async function?
- How to do error hnadling?
- How to host jpegs?
- How to host json?
- How to deploy?
- Can we re-purpose existing custom fields?

TO DO
- Search by complete, shedule.starts_at, schedule-ends_at, roku, state
- Don't forget captions.
- Error handling, retry on any error, write to log file, write to error file.
- API creds should be read only

WHERE TO STORE SERIES INFO (* indicates chosen options)
*Brightcove video custom fields, 1st ep only: some manual effort by MSOs
Brightcove playlists: more manual effort by MSOs, max 100 videos so need playlist for every season, cannot search videos by playable
Brightcove folders: name field only
CPAD programs: requires more complexity, would still need to call BC for URL and strand

BC CUSTOM FIELDS
- TVOSeriesName (already exists): 1st ep only
- seriesDescription (new): 1st ep only
- seriesKeywords (new): 1st ep only
- seriesGenres (new): 1st ep only
- seriesReleaseDate (new): 1st ep only
- seasonNumber (new): all eps, pull from TS XML "SeasonNumber"
- episodeNumber (new): all eps, pull from TS XML "EPISODE_ORDER"

BC API FUNCTIONS
- getToken
- getCount
- getVideos
- getSources

CRON.JS (how to grab series metadata?)
- cron job
  - getCount
  - Loop until count reached
    - getVideos (100) / add to temp array
  - Loop thru temp array
    - getSources / add to temp array
  - Sort temp array by series / season / ep
  - Loop thru temp array
    - Move videos to Roku object
  - Write object to json file

SERVER.JS
- recieve API call
- ingest json file
- send json in response
*/

const express = require('express');
const cors = require('cors');
const axios = require('axios');

//Express server
const app = express();
app.use(cors());
app.use(express.urlencoded({extended: false}));
app.use(express.json());
app.get('/', (req, res) => {
  res.send('Hello World!');
  //Ingest json file and return roku json object
});
app.listen(3000);

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