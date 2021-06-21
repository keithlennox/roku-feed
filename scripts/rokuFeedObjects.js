/*Functions used to create various Roku rss feed components*/

const date = require('date-and-time');
const axios = require('axios');

//Create Roku caption url
//Accepts a single Brightcove video object. Returns the appropriate caption URL for that video.
const getBrightcoveCaptions = (bcItem) => {
  if(bcItem.text_tracks.length != 0) {
    let text_track = bcItem.text_tracks.find((item)=> item.kind === "captions");
    if(text_track) {
      let url = text_track.sources.find((item2) => item2.src.startsWith("https://"))
      if(url) {
        return url.src;
      }
    }
  }
  throw new ReferenceError("Caption file not found for video " + bcItem.reference_id);
}

//Get Brightcove thumbnail
//Accepts a Brightcove video object. Returns the thumbnail url.
const getBrightcoveThumb = (bcItem) => {
  if(bcItem.images.thumbnail.sources.length != 0) {
    let url = bcItem.images.thumbnail.sources.find((source) => source.src.startsWith("https://"))
    if(url) {
      return url.src;
    }
  }
  throw new ReferenceError("Thumbnail file not found for video " + bcItem.reference_id);
}

//Get Brightcove series thumbnail
//Accepts a Brightcove video object. Returns the series thumbnail url.
const getBrightcoveSeriesThumb = async (bcSeriesItem) => {
  try{
    await axios.get(`${IMAGE_FOLDER}/${bcSeriesItem.custom_fields.ott_series_number}.jpg`);
    return `${IMAGE_FOLDER}/${bcSeriesItem.custom_fields.ott_series_number}.jpg`;
  }catch(error){
    console.error(`JPG not found for series ${bcSeriesItem.custom_fields.ott_series_number} - ${error}`);
    return `${IMAGE_FOLDER}/placeholder.jpg`;
  }
}

//Create Roku video object
//Accepts a Brightcove video object. Retruns a Roku video object.
//Note: Generes/tags used for movies and tv specials only. EpisodeNumber used for series only.
exports.createRokuVideo = (bcItem) => {

  //Validate fields required for all videos
  if(!bcItem.reference_id) {throw new ReferenceError("Reference id missing for video " + bcItem.id);}
  if(!bcItem.custom_fields.ott_type) {throw new ReferenceError("ott_type missing for video " + bcItem.reference_id);}
  if(!bcItem.custom_fields.ott_release_date || !date.isValid(bcItem.custom_fields.ott_release_date, 'YYYY-MM-DD')) {throw new ReferenceError("ott_release_date missing or malformed for video " + bcItem.reference_id);}
  if(!bcItem.video_url) {throw new ReferenceError("No video url found for " + bcItem.reference_id);}
  if(!bcItem.custom_fields.ott_rating) {throw new ReferenceError("ott_rating missing for video " + bcItem.reference_id);}

  //Validate fields required only for series with and without seasons
  if(bcItem.custom_fields.ott_type === "series with seasons" || bcItem.custom_fields.ott_type === "series without seasons") {
    if(!bcItem.custom_fields.ott_series_name) {throw new ReferenceError("ott_series_name missing for video " + bcItem.reference_id);}
    if(!bcItem.custom_fields.ott_series_number) {throw new ReferenceError("ott_series_number missing for video " + bcItem.reference_id);}
    if(!bcItem.custom_fields.ott_episode_number || !bcItem.custom_fields.ott_episode_number.match(/^[1-9][0-9]{0,1}$/)) {throw new ReferenceError("ott_episode_number is missing or malformed for video " + bcItem.reference_id);} //Must be a 1 or 2 digit positive integer that does not lead with zero
  }

  //Validate fields required only for series with seasons
  if(bcItem.custom_fields.ott_type === "series with seasons") {
    if(!bcItem.custom_fields.ott_season_number || !bcItem.custom_fields.ott_season_number.match(/^[1-9][0-9]{0,1}$/)) {throw new ReferenceError("ott_season_number is missing or malformed for video " + bcItem.reference_id);} //Must be a 1 or 2 digit positive integer that does not lead with zero
  }

  //Validate fields required only for movies and tvspecials
  if(bcItem.custom_fields.ott_type === "movies" || bcItem.custom_fields.ott_type === "tv specials") {
    if(!bcItem.custom_fields.ott_genres) {throw new ReferenceError("ott_genres missing for video " + bcItem.reference_id);}
    if(!bcItem.custom_fields.ott_tags) {throw new ReferenceError("ott_tags missing for video " + bcItem.reference_id);}
  }

  //Populate video object
  let videoObject = {};
  videoObject.id = bcItem.reference_id;
  videoObject.title = bcItem.name;
  videoObject.content = {};
  videoObject.content.dateAdded = date.transform(bcItem.custom_fields.ott_release_date, 'YYYY-MM-DD', 'YYYY-MM-DDT08:mm:ssZ'); //YYYY-MM-DDTHH:MM:SS+HH:MM. Used to generate the “Recently Added” category. All videos are relased 8 AM Toronto time.
  videoObject.content.duration = Math.round(bcItem.duration / 1000); //Brightcove returns miliseconds. Roku requires seconds and must be an integer.
  videoObject.content.language = "en";
  videoObject.content.validityPeriodStart = bcItem.schedule.starts_at;
  videoObject.content.validityPeriodEnd = bcItem.schedule.ends_at;
  videoObject.content.videos = [{
    "url": bcItem.video_url,
    "quality": "FHD",
    "videoType": "HLS"
  }];
  videoObject.content.captions = [{
    "url": getBrightcoveCaptions(bcItem),
    "language": "en",
    "captionType": "CLOSED_CAPTION"
    
  }];
  if(bcItem.custom_fields.ott_type === "movies" || bcItem.custom_fields.ott_type === "tv specials") {
    videoObject.genres = bcItem.custom_fields.ott_genres.trim().replace(/ *, */g, ",").split(",");//Trim whitespace and convert string to array
    videoObject.tags = bcItem.custom_fields.ott_tags.trim().replace(/ *, */g, ",").split(",");//Trim whitespace and convert string to array
  }
  if(bcItem.custom_fields.ott_type === "series with seasons" || bcItem.custom_fields.ott_type === "series without seasons") {
    videoObject.episodeNumber = parseInt(bcItem.custom_fields.ott_episode_number);
  }
  videoObject.thumbnail = getBrightcoveThumb(bcItem);
  videoObject.releaseDate = bcItem.custom_fields.ott_release_date; //YYYY-MM-DD. Used to sort programs chronologically and group related content in Roku Search.
  videoObject.shortDescription = bcItem.description;
  videoObject.longDescription = bcItem.long_description;
  videoObject.ratings = {"rating": bcItem.custom_fields.ott_rating, "ratingSource": "CPR"}
  return videoObject;
}

//Create Roku season object
exports.createRokuSeason = (bcItem) => {

  //Validate season fields
  if(!bcItem.custom_fields.ott_season_number || !bcItem.custom_fields.ott_season_number.match(/^[1-9][0-9]{0,1}$/)) {throw new ReferenceError("ott_season_number is missing or malformed for video " + bcItem.reference_id);} //Must be a 1 or 2 digit positive integer that does not lead with zero

  //Populate season object
  let seasonObject = {};
  seasonObject.seasonNumber = parseInt(bcItem.custom_fields.ott_season_number);
  return seasonObject;
  
}

//Create Roku series object
//Accepts a Brightcove video object and an array containing all Brightcove video objects. Retruns the Roku series object.
exports.createRokuSeries = async (bcObject, bcItem) => {

  //Find the first episode of the series or season (this is where we retrieve the series info)
  if(!bcItem.custom_fields.ott_series_name) {throw new ReferenceError("ott_series_name missing for video " + bcItem.reference_id);}
  if(!bcItem.custom_fields.ott_episode_number || !bcItem.custom_fields.ott_episode_number.match(/^[1-9][0-9]{0,1}$/)) {throw new ReferenceError("ott_episode_number is missing or malformed for video " + bcItem.reference_id);} //Must be a 1 or 2 digit positive integer that does not lead with zero
  let bcSeriesItem = bcObject.find((item) => {
    if(bcItem.custom_fields.ott_type === "series with seasons") {
      if(!bcItem.custom_fields.ott_season_number || !bcItem.custom_fields.ott_season_number.match(/^[1-9][0-9]{0,1}$/)) {throw new ReferenceError("ott_season_number is missing or malformed for video " + bcItem.reference_id);} //Must be a 1 or 2 digit positive integer that does not lead with zero
      return item.custom_fields.ott_series_name === bcItem.custom_fields.ott_series_name && item.custom_fields.ott_season_number === bcItem.custom_fields.ott_season_number && item.custom_fields.ott_episode_number === "1";
    }else {
      return item.custom_fields.ott_series_name === bcItem.custom_fields.ott_series_name && item.custom_fields.ott_episode_number === "1";
    }
    
  })
  if(bcSeriesItem === undefined) {throw new ReferenceError(`First episode for series "${bcItem.custom_fields.ott_series_name}" not found for video ${bcItem.reference_id}`);}

  //Validate fields for the first episode for the series or season
  if(!bcSeriesItem.custom_fields.ott_series_number) {throw new ReferenceError("ott_series_number missing for video " + bcSeriesItem.reference_id);}
  if(!bcSeriesItem.custom_fields.ott_release_date || !date.isValid(bcSeriesItem.custom_fields.ott_release_date, 'YYYY-MM-DD')) {throw new ReferenceError("ott_release_date missing or malformed for video " + bcSeriesItem.reference_id);}
  if(!bcSeriesItem.custom_fields.ott_series_description) {throw new ReferenceError("ott_series_description missing for video " + bcSeriesItem.reference_id);}
  if(!bcSeriesItem.custom_fields.ott_tags) {throw new ReferenceError("ott_tags missing for video " + bcSeriesItem.reference_id);}
  if(!bcSeriesItem.custom_fields.ott_genres) {throw new ReferenceError("ott_genres missing for video " + bcSeriesItem.reference_id);}
  
  //Populate series object
  let seriesObject = {};
  seriesObject.title = bcSeriesItem.custom_fields.ott_series_name;
  seriesObject.id = bcSeriesItem.custom_fields.ott_series_number;
  seriesObject.releaseDate = bcSeriesItem.custom_fields.ott_release_date;
  seriesObject.shortDescription = bcSeriesItem.custom_fields.ott_series_description;
  seriesObject.tags = bcSeriesItem.custom_fields.ott_tags.trim().replace(/ *, */g, ",").split(","); //Trim whitespace and convert string to array
  seriesObject.genres = bcSeriesItem.custom_fields.ott_genres.trim().replace(/ *, */g, ",").split(","); //Trim whitespace and convert string to array
  seriesObject.thumbnail = await getBrightcoveSeriesThumb(bcSeriesItem);

  return seriesObject;

}