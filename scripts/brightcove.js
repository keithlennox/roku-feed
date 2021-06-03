/*Functions used to call Brightcove CMS API to retrieve video metadata

Note: Brightcove CMS API may return duplicate results unless you include a sort parameter.
See known issues at bottom of:
https://apis.support.brightcove.com/cms/searching/cmsplayback-api-videos-search.html
*/

const axios = require('axios');

//Get API token (required for all Brightcove API calls)
const getToken = async () => {
  const client_id = process.env.BRIGHTCOVE_CLIENT_ID;
  const client_secret = process.env.BRIGHTCOVE_CLIENT_SECRET;
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
  //console.log("Returned exisiting token");
  return getToken.options; //Return the exisiting token because it has not expired yet
}
  
//Sleep function
//Used for Brightcove rate limiting and retries
//Must work with promises and async/await
const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
}
  
//Get Brightcove video metadata
//Accepts a Brightcove account id
//Returns array of objects containing metadata for all videos in account that match the search criteria
exports.getBrightcoveVideos = async () => {
  console.log("Retrieving videos");
  let counter = 0; //initialize counter
  let bcVideos = []; //Create empty videos array
  const search = "ott_flag:true";
  console.log(`Offset: ${counter} - Array length: ${bcVideos.length}`)
  while(counter === bcVideos.length) { //Get next 100 videos until no more are returned
    for (let i = 1; i <=3; i++) { //Retry on error
      try{
        let options = await getToken();
        let response = await axios.get("https://cms.api.brightcove.com/v1/accounts/" + ACCOUNT + "/videos?sort=created_at&query=" + search + "&limit=100&offset=" + counter, options);
        bcVideos.push(...response.data);
        break; //No need to retry
      }catch(error){
        console.error(error);
        await sleep(5000); //Wait 5 seconds between retries
      }
    }//End retry loop
    await sleep(111); //Brightcove rate limiting = less than 10 requests per second (111 ms = 9 requests per second)
    counter = counter + 100; //Increment counter
    console.log(`Offset: ${counter} - Array length: ${bcVideos.length}`)
  }
  console.log("Video retrieval complete");
  return bcVideos;//This may be an empty array if all API calls fail
}
  
//Get Brightcove sources
//Accepts an array of Brightcove video objects
//Returns the same array with the addition of a video URL for each video
exports.getBrightcoveSource = async (bcVideos) => {
  console.log("Retrieving sources");
  for(let bcVideo of bcVideos) {//For every video in the array
    for (let i = 1; i <=3; i++) { //Retry on error
      try{
        let options = await getToken();
        let response = await axios.get("https://cms.api.brightcove.com/v1/accounts/" + bcVideo.account_id + "/videos/" + bcVideo.id + "/sources", options) //Get the sources array
        for(let source of response.data) { //For each sources array...
          if(source.src && source.src.startsWith("https://") && source.type === "application/x-mpegURL") { //Get the HLS source
            console.log(`${bcVideo.id} - ${bcVideo.reference_id} - ${source.src}`);
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
  console.log("Source retieval complete");
  return bcVideos;
} //End function