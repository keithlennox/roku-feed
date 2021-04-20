# Roku Direct Publisher feed generator

Creates Direct Publisher json feed for Roku TVO and TVOKIDS channels  
Videos are hosted on Brightcove. Code is hosted on AWS Lambda.  
To run code locally, see instructions at bottom of this readme.  
Feeds are available here:  
https://d81ef65ednp0p.cloudfront.net/tvo/feed.json   
https://d81ef65ednp0p.cloudfront.net/tvokids/feed.json   

### PROJECT CONSTRAINTS

- Users will schedule (CMS) videos by changing values in BC custom fields. At our request, BC added 10 additional custom fields.
- We will not use CPAD because it does not have a roku live/not live flag or video URLs so we would still need to call BC. Calling both is overly complex.
- We have to make multiple calls to Brightcove: oauth, videos, and sources. Sources is the only place we can get the video URL.
- We can only get max of 100 videos at a time and max of only 1 source at a time.
- We will need to cache the feed in a json file. Brightcove calls can't be triggered by Roku because Roku will time out waiting for the calls to finish.
- Roku requires still images for series. They will need to be stored on the node.js server or they may already exist on TVO server.
- Users will not be able to upload series images on their own. We will have to do it for them. This is because there will be no front end for uploading images.
- Brightcove URLs expire. At our request, they have extended the expiry time from 6 hrs to 7 days.
- Agenda eps are in segments. Roku has no concept of segments.
- We will need 2 feeds, one for TVO and one for TVOKids.
- Ownership is set at the channel level, NOT the series or video level!
- Pub/kill dates are the same for Roku as they are for our web sites. These are set in the feed for each video.
- Roku Direct Publisher is slow to update which makes it slow to test and trouble shoot.
- We cannot use the BC Playback API, which is much simpler. See constraints below.
- We cannot use the BC Social Syndication API, which is much simpler. See contstraints below.
- There is almost ZERO feed validation happening. Whatever is set on BC will go into the feed as is.

### PLAYBACK API CONSTRAINTS

- The playback API returns everything in a single call (oauth, videos, sources).
- The Playback API is faster.
- But we cannot use it due to the following constraints:
- Results are geo-restricted (may be able to locate AWS server in Canadian region)
- Search returns max of 1000 videos.
- Reference: apis.support.brightcove.com/playback/references/reference_v2.html
- Reference: apis.support.brightcove.com/cms/searching/cmsplayback-api-videos-search.html
- Reference: apis.support.brightcove.com/cms/searching/cmsplayback-api-videos-search.html

### SOCIAL SYNDICATION API CONSTRAINTS

- Returns only 100 videos at a time. You must make multiple API calls to get all videos. This make it impossible to organize videos by series, seasons, and episodes.
- Does not offer a solution to host series images (may not be a showstopper).

### BC CUSTOM FIELD CONSTRAINTS

- Max of 50 allowed
- Can only be deleted by BC
- Text or restricted list
- Provide display name, internal name, type, description
- Internal name can only be alphanumeric (no spaces, dashes or underscores)
- Display and internal names 128 chars max
- Description 500 chars max
- You cannot search on values shorter than 3 chars

### PROPOSED BC CUSTOM FIELDS (Display name / Internal name / Data type / TS XML field / Description)

- OTT Episode Number / ott_episode_number / text / EPISODE_ORDER / The episode number for this video. Only required when OTT Type = "series...".
- OTT Flag / ott_flag / restricted list: true, false  / NA / Controls whether this video appears on Roku or not. Leaving this field blank is the same as choosing false.
- OTT Genres / ott_series_genres / text: comma separated list / NA / Comma sepated list of genres. Only values from Roku's restricted list are allowed. Required if OTT Type = "movies" or "tv shows". Only required on the first episode of a series if OTT Type = "series...".
- OTT Rating / ott_rating / text / AgeRating / The rating for the video content. See Roku documentation for list of allowed values.
- OTT Release Date / ott_release_date / text: YYYY-MM-DD / AirDate / YYYY-MM-DD. Used by Roku to sort programs chronologically and generate the “Recently Added” category.
- OTT Season Number / ott_season_number / text / SeasonNumber / The season number for this video. Only required on first episode of a series when OTT Type = "series with seasons".
- OTT Series Description / ott_series_description / text / ShortDescription / A description of the series that does not exceed 200 characters. The text will be clipped if longer. Only required on the first episode of a series if OTT Type = "series...".
- OTT Series Name / ott_series_name / text / SeriesTitle / The title of the series in plain text. This field is used for matching in Roku Search. Do not include extra information such as year, version, and so on. Only required on the first episode of a series if OTT Type = "series...".
- OTT Series Number / ott_series_number / text / TVOSeries / A unique identifier for this series that does not exceed 50 characters. Only required on the first episode of a series if OTT Type = "series...".
- OTT Tags / ott_series_tags / text: comma separated list / NA / Comma separated list of tags for this series (for example: dramas,docs,news). Each tag is limited to 20 characters. Tags are used to define what content will be shown within a category. Required if OTT Type = "movies" or "tv shows". Only required on the first episode of a series if OTT Type = "series...".
- OTT Type / ott_type / restricted list: series with seasons, series without seasons, movies, tvSpecials / Controls how this video appears on Roku. See Roku documentation for more details.

### ROKU CONTAINER OBJECTS

- Series w/ seasons      { id, title, thumb, shortDescript, longDescription, releaseDate, genres, tags, seasons[]  }
- Series w/out seasons   { id, title, thumb, shortDescript, longDescription, releaseDate, genres, tags, episodes[] }
- seasons                { seasonNumber, episodes[] }

### ROKU VIDEO OBJECTS

- episode                { id, title, thumb, shortDescript, longDescription, releaseDate, content{}, ratings, episodeNumber }
- Movie                  { id, title, thumb, shortDescript, longDescription, releaseDate, content{}, ratings, genres, tags }
- tvSpecial              { id, title, thumb, shortDescript, longDescription, releaseDate, content{}, ratings, genres, tags }
- shortFormVideo         { id, title, thumb, shortDescript, longDescription, releaseDate, content{}, ratings, genres, tags }

### OTHER ROKU OBJECTS

- content    { dateAdded, duration, language, validityPeriodStart, validityPeriodEnd, videos{}, captions{} }
- video      { url, quality, videoType }
- captions   {url, language, captionType}

### TO DO

- Replace BC CMS API creds and madke read only
- Publish feed to Roku and make sure it validates
- Investigate uncaught errors - IN PROGRESS
- Improve logging
- Fix custom fields explanations (on Brightcove and this readme)
- Add to readme: error handling checks individual fields. Does not check interactions between fields. Provide examples: duplicate ep nums, sws and swos within same series. Can cause unexpected errors. 
- Add to readme: where images are stored
- AWS: Use gitlab / serverless framework to manage code
- AWS: Handle BC creds in yml file. These should not be committed to git.
- AWS: Implement CRON (trigger each feed seperately, can we provide BC account id?)
- AWS: email notifications
- TS QUESTION: What is the hard coded value for rating type?
- TS QUESTION: Is AgeRating appropriate for the ratings field?
- TS QUESTION: Is first air appropriate for releaseDate and dateAdded?
- Fix duplicate video issue - COMPLETE
- Decide where to store images (Brightcove and/or S3) - COMPLETE
- Upload series image files thru AWS S3 console and/or Brightcove cloud - COMPLETE
- Change stills URL code - COMPLETE
- Add validation to videoObject date (releaseDate YYYY-MM-DD) - COMPLETE
- Confirm validityPeriodStart + End are correct format - COMPLETE
- AWS: Manually trigger script on demand - COMPLETE
- AWS: Pull error logs = COMPLETE
- Add lastUpdated to root of feed - COMPLETE
- Search by ott_flag=true - COMPLETE
- Error handling on write to S3 bucket - COMPLETE
- Create log file should be changed to console.log() - COMPLETE
- Organize folder/files - COMPLETE
- Handle multiple bc accounts - COMPLETE
- Check for 2 digit integer on season number - COMPLETE
- Create separate function folder/files - COMPLETE
- Add error handling on thumbs and text tracks - COMPLETE
- Correct formatting of dates in releaseDate and dateAdded - COMPLETE
- Format generes and tags into arrays - COMPLETE
- Re-tries - COMPLETE
- Rate limiting - COMPLETE
- Series metadata pulls from ep 1 video only - COMPLETE
- If ott type not series, include genres and tags in video object - COMPLETE

### WHERE TO STORE SERIES INFO (* indicates chosen option)

*Brightcove video custom fields, 1st ep only: some manual effort by MSOs  
Brightcove playlists: more manual effort by MSOs, max 100 videos so need playlist for every season, cannot search videos by playable  
Brightcove folders: name field only  
Brightcove dummy CMS records  
CPAD programs: requires more complexity, would still need to call BC for URL and strand  

### ERROR HANDLING (retry, log, notify)

Script try/catches any error, script skips only video that has error.  

- Get next 100 videos: try/catch any error, log error, retry 3x, after 3rd attempt skip to next 100 videos
- Get bc source: try/catch any error, log error, retry 3x, after 3rd attempt skip to next source
- Create video and series objects: try/catch any error, log error + skip to next video
- Create feed: no error handling
- Write to feed: throw error if json object samller than x, try/catch any error, log error, retry 3x, after 3rd attempt do not update feed
- Notify user of any errors

### CMS API ENDPOINTS

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

### PLAYBACK API ENDPOINTS

- Get videos: includes sources
- Get playlist by id
- Static URLs

### RUN CODE LOCALLY

This code is intended to run on AWS Lambda. To run locally, do the following:  

root project folder  
- Create public/tvo.json
- Create tvokids.json

index.js  
- Replace exports.handler with const handler and call it with handler({"account": "15364602001"}). Change the Brightcove account number to 18140038001 as needed.

rokuFeed.js  
- Remove this line: var fs = require('fs');
- Add this line near the top: const AWS = require('aws-sdk');
- Add this line near the top const s3 = new AWS.S3();
- Replace the entire contents of exports.writeRokuFeed with the following:

    let feedName;  
    if(account === 18140038001) {  
        feedName = "tvo";  
    }else if(account === 15364602001)  
        feedName = "tvokids";  
    }  
    fs.writeFile(`./public/${feedName}.json`, JSON.stringify(rokuFeed), (error) => {  
        if (error) throw error;  
    });  