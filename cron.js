const axios = require('axios');

//Set vars
const account = "18140038001";

//CRON
/* cron.schedule('* * * * *', async () => {
    console.log('CRON TRIGGERED ' + new Date())
    createFeed(account);
}) */

//CREATE ROKU FEED (TO DO: more robust error handling + rate limiting)
createFeed = async (account) => {
    try {
        let options = await getToken(); //Get token
        let count = await axios.get("https://cms.api.brightcove.com/v1/accounts/" + account + "/counts/videos?q=tags:history", options);
        console.log(JSON.stringify(count.data.count));
        let counter = 0; //initialize counter
        let videos_array = [];
        while(counter <= count.data.count) {
            let videos = await axios.get("https://cms.api.brightcove.com/v1/accounts/" + account + "/videos?q=tags:history&limit=100&offset=" + counter, options);
            videos.data.forEach( item => {videos_array.push(item); console.log("found1");} );
            console.log(counter);
            counter = counter + 100;
        }
        videos_array.forEach( async item => {
            console.log(item.id);
            let sources = await axios.get("https://cms.api.brightcove.com/v1/accounts/" + account + "/videos/" + item.id + "/sources", options)
            console.log(sources.data);
            // TO DO: retrieve specific source + push it to videos_array
        } );
        // TO DO: create roku object and write it to json file
    }catch(error){
        console.log(error);
    }
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
      console.log(options);
    return options;
    }catch(error){
      console.log(error);
    }
}

createFeed(account);