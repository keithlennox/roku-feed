# Roku Direct Publisher feed generator

Creates Direct Publisher json feed for Roku

## Details

Videos are hosted on Brightcove...

### PROJECT CONSTRAINTS

- Users will schedule (CMS) videos on Roku by changing a value in a custom tag. Not all content in CPAD can go on Roku and CPAD does not have a Roku flag.
- We must store Roku series title, short descript, long descript, tags, genres, release date in Brightcove custom fields.
- Any metadata must come from Brightcove. This is because calling Brightcove and CPAD increases complexity.
- We have to make numerous calls to Brightcove: oauth, videos, and sources. Sources is the only place we can get the video URL.
- We can only get max of 100 videos at a time and max of only 1 source at a time.
- We will need to cache the feed in a json file. Brightcove calls can't be triggered by Roku because Roku will time out waiting for the calls to finish.
- Roku requires still images for series. They will need to be stored on the node.js server or they may already exist on TVO server.
- Users will not be able to upload series images on their own. We will have to do it for them. This is because there will be no front end for uploading images.
- Brightcove URLs expire. We will have to ask them to extend the expiry time. Or have a proxy inbewteen roku feed and brightcove.
- Agenda eps are in segments. Roku has no concept of segments.
- We will need to call different Brightcove accounts in the same Roku channel.
- Ownership is set at the channel level, NOT the series or video level!
- Pub/kill dates are same for Roku as they are for web sites. These are set in the feed, under Content.  
- Roku Direct Publisher is slow to update which makes it slow to test and trouble shoot.
- We cannot use the BC Playback API, which is simpler. See constraints below.
- We cannot use the BC Social Syndication API, which is much simpler. See contstraints below.
- There is ZERO feed validation happening. Whatever is set on BC will go into the feed as is.

### PLAYBACK API CONSTRAINTS

- The playback API returns everything in a single call (oauth, videos, sources).
- The Playback API is faster.
- But we cannot use it due to the following constraints.
- Results are geo-restricted (may be able to locate AWS server in Canadian region)
- Search returns max of 1000 videos.
- Reference: apis.support.brightcove.com/playback/references/reference_v2.html
- Reference: apis.support.brightcove.com/cms/searching/cmsplayback-api-videos-search.html
- Reference: apis.support.brightcove.com/cms/searching/cmsplayback-api-videos-search.html

### SOCIAL SYNDICATION API CONSTRAINTS

- Returns only 100 videos (need to confirm)
- Nowhere to host series images (may not be a showstopper)
- Liquid not capable of creating nested series, seasons, episodes (need to conmfirm)

### BC CUSTOM FIELD CONSTRAINTS

- Max of 50 allowed
- Can only be deleted by BC
- Text, restricted list, or boolean
- Provide display name, internal name, type, description
- Internal name can only be alphanumeric (no spaces, dashes or underscores)
- Display and internal names 128 chars max
- Description 500 chars max
- You cannot search on values shorter than 3 chars

### PROPOSED BC CUSTOM FIELDS (Display name / Internal name / Data type / TS XML field)

- Syndication Flag / syndicationflag / restricted list: true, false  / NA
- Syndication Type / syndicationtype / restricted list: series, movie, shortFormVideo, tvSpecial / NA
- Syndication Series Number / syndicationseriesnumber / text / TBD
- Syndication Series Name / syndicationseriesname / text / TBD
- Syndication Series Description / syndicationseriesdescription / text / TBD
- Syndication Series Keywords / syndicationserieskeywords / text: comma separated list / NA
- Syndication Series Genres / syndicationseriesgenres / text: comma separated list / NA
- Syndication Series Release Date / syndicationseriesreleasedate / text / TBD
- Syndication Season Number / syndicationseasonnumber / text / SeasonNumber
- Syndication Episode Number / syndicationepisodenumber / text / EPISODE_ORDER

### ROKU SERIES OBJECT

- Series         { id, title, thumb, shortDescript, longDescription, releaseDate, genres, tags, seasons[]  }
- Series         { id, title, thumb, shortDescript, longDescription, releaseDate, genres, tags, episodes[] }
- seasons        {seasonNumber, episodes[] }

### ROKU VIDEO OBJECT

- Movie          { id, title, thumb, shortDescript, longDescription, releaseDate, content{}, ratings, genres, tags }
- tvSpecial      { id, title, thumb, shortDescript, longDescription, releaseDate, content{}, ratings, genres, tags }
- shortFormVideo { id, title, thumb, shortDescript, longDescription, releaseDate, content{}, ratings, genres, tags }
- episode        { id, title, thumb, shortDescript, longDescription, releaseDate, content{}, ratings, episodeNumber }
- content { dateAdded, duration, language, validityPeriodStart, validityPeriodEnd, videos{}, captions{} }
- video { url, quality, videoType }
- captions {url, language, captionType}

### QUESTIONS

- Roku's sample feed does not adhere to their spec doc. Which is correct?  
- Do you control what gets into a Roku category using series tags or episode tags?  
- Do I need to sort the array? Does Roku care?  

### TO DO

- Search by complete, shedule.starts_at, schedule-ends_at, roku, state
- Captions
- Error handling
- BC CMS API creds should be read only
- Logging
- Re-tries
- Rate limiting
- Handle multiple bc accounts
- Handle multiple content types
- Add series metadata to roku feed, pulling from ep 1 video only
- Upload series image files and serve them
- Add and populate BC custom fields
- Map all bc fields to Roku feed

### WHERE TO STORE SERIES INFO (* indicates chosen option)

*Brightcove video custom fields, 1st ep only: some manual effort by MSOs  
Brightcove playlists: more manual effort by MSOs, max 100 videos so need playlist for every season, cannot search videos by playable  
Brightcove folders: name field only  
CPAD programs: requires more complexity, would still need to call BC for URL and strand  

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

### RESOURCES

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
https://www.toptal.com/nodejs/node-js-error-handling  