/*Isolated Brightcove API calls that can be used for testing.*/

const axios = require('axios');

//Set vars
const account = "18140038001";

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
      console.log(options);
    return options;
    }catch(error){
      console.log(error);
    }
}

//GET VIDEO COUNT
getCount = async (account) => {
    try {
        let options = await getToken(); //Get token
        let cms_count_result = await axios.get("https://cms.api.brightcove.com/v1/accounts/" + account + "/counts/videos?q=tags:roku", options)
        console.log(JSON.stringify(cms_count_result.data));
    }catch(error){
        console.log(error);
    }
}
    
//GET VIDEOS
//Start loop
    getVideos = async (account) => {
        try {
            let options = await getToken(); //Get token
            let cms_result = await axios.get("https://cms.api.brightcove.com/v1/accounts/" + account + "/videos?q=tags:roku", options)
            console.log(JSON.stringify(cms_result.data));
        }catch(error){
            console.log(error);
        }
    }
//End loop
    
//GET SOURCES
getSources = async (account) => {
    try {
        let options = await getToken(); //Get token
        let cms_sources_result = await axios.get("https://cms.api.brightcove.com/v1/accounts/" + account + "/videos/6231365655001/sources", options)
        console.log(JSON.stringify(cms_sources_result.data));
    }catch(error){
        console.log(error);
    }
}
