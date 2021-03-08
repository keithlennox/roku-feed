const axios = require('axios');

const getToken = async () => {
  console.log("Retrieving token");
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
    return options;
  }catch(error){
    console.log(error);
  }
}

const getBrightcoveSource = async (account, bcVideo, options) => {
  let counter = 0;
  while(counter < 3) {
    try{
      let response = await axios.get("https://cms.api.brightcove.com/v1/accounts/" + account + "/videos/" + bcVideo + "/sources", options)
      for(let source of response.data) {
        if(source.src && source.src.startsWith("https://") && source.type === "application/x-mpegURL") {
          return source.src;
        }
      }
      throw new ReferenceError("No rendition found");
    }catch(error){
      console.log(error.message);
      if(error.message === "No rendition found") {
        return "Error";
      }
      counter++;
    }
  }
  return "Error";
}

const origin = async () =>{
  let options = await getToken();
  let result = await getBrightcoveSource(18140038001, 6231804241001, options);
  console.log(result);
}

origin();