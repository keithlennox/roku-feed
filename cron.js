//Set vars
const account = "18140038001";

//CRON
cron.schedule('* * * * *', async () => {
    
    console.log('CRON TRIGGERED ' + new Date())

    //
    let count = await getCount(account);

    //
    let videos = await getVideos(account, count);

    //
    let videos2 = getSources(account, videos);

    //
    createRokuFeed(tempArray);

})

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
    
//GET TOTAL NUMBER OF VIDEOS
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

//Create Roku object
let rokuFeed = { //Create Roku feed
    "providerName": "TVO", 
    "language": "en-US", 
    series: []
}
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
//Output Roku object to json file
    