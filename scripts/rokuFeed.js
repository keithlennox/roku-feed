/*Functions used to create Roku rss feed and write it to file*/

var fs = require('fs');
const { createRokuSeries, createRokuSeason, createRokuVideo } = require('./rokuFeedObjects');

//Create Roku feed
exports.createRokuFeed = (bcObject) => {
    let rokuFeed = {"providerName": "TVO", "language": "en-US"};
    let counter = 0;
    bcObject.forEach((bcItem) => { //For each video...
  
      try{
  
        //Series with seasosns
        if(bcItem.custom_fields.ott_type === "series with seasons") {
          let videoObject = createRokuVideo(bcItem);
          if(!rokuFeed.hasOwnProperty("series")) {
            let seriesObject = createRokuSeries(bcObject, bcItem);
            let seasonObject = createRokuSeason(bcItem);
            rokuFeed.series = [{...seriesObject, "seasons":[{...seasonObject, "episodes": [{...videoObject}]}]}];
          }else{
            let rokuSeriesIndex = rokuFeed.series.findIndex((item) => item.title === bcItem.custom_fields.ott_series_name) //Check if series INDEX exists
            if(rokuSeriesIndex === -1) { //If series does not exist...
              let seriesObject = createRokuSeries(bcObject, bcItem);
              let seasonObject = createRokuSeason(bcItem);
              rokuFeed.series.push({...seriesObject, "seasons":[{...seasonObject, "episodes": [{...videoObject}]}]}); //PUSH series/season/episode
            }else{ //If the series exists...
              let rokuSeasonIndex = rokuFeed.series[rokuSeriesIndex].seasons.findIndex((seasonsItem) => seasonsItem.seasonNumber === bcItem.custom_fields.ott_season_number) //Check if season INDEX exists
              if(rokuSeasonIndex === -1) { //If the season does not exist...
                let seasonObject = createRokuSeason(bcItem);
                rokuFeed.series[rokuSeriesIndex].seasons.push({...seasonObject, "episodes": [{...videoObject}]});//PUSH season/episode
              }else{ //If the season exists...
                rokuFeed.series[rokuSeriesIndex].seasons[rokuSeasonIndex].episodes.push({...videoObject}); //PUSH episode
              }
            }
          }
          
        //Series without seasons
        }else if(bcItem.custom_fields.ott_type === "series without seasons") {
          let videoObject = createRokuVideo(bcItem);
          if(!rokuFeed.hasOwnProperty("series")) {
            let seriesObject = createRokuSeries(bcObject, bcItem);
            rokuFeed.series = [{...seriesObject, "episodes": [{...videoObject}]}];
          }else{
            let rokuSeriesIndex = rokuFeed.series.findIndex((item) => item.title === bcItem.custom_fields.ott_series_name) //Check if series INDEX exists
            if(rokuSeriesIndex === -1) { //If series does not exist...
              let seriesObject = createRokuSeries(bcObject, bcItem);
              rokuFeed.series.push({...seriesObject, "episodes": [{...videoObject}]}); //PUSH series/season/episode
            }else{ //If the series exists...
              rokuFeed.series[rokuSeriesIndex].episodes.push({...videoObject}); //PUSH episode
            }
          }
  
        //Movies
        }else if(bcItem.custom_fields.ott_type === "movies"){
          let videoObject = createRokuVideo(bcItem);
          if(!rokuFeed.hasOwnProperty("movies")) {rokuFeed["movies"] = []}
          rokuFeed["movies"].push({...videoObject}); //PUSH movie to Roku
  
        //TV specials
        }else if(bcItem.custom_fields.ott_type === "tv specials") {
          let videoObject = createRokuVideo(bcItem);
          if(!rokuFeed.hasOwnProperty("tvSpecials")) {rokuFeed["tvSpecials"] = []}
          rokuFeed["tvSpecials"].push({...videoObject}); //PUSH tv special to Roku
        }

        counter++; //Increment counter

      }catch(error){
        console.error(error);
      }
  
    }) //End looping thru Brightcove videos
    return {"feed": rokuFeed, "count": counter};
  
  }
  
  //Write Roku feed to file
  //Add try/catch that throws error if success-to-fail ratio is above x%
  exports.writeRokuFeed = (rokuFeed, account) => {
    let feedName;
    if(account === 18140038001) {
      feedName = "tvo";
    }else if(account === 15364602001) 
    {
      feedName = "tvokids";
    }
    console.log("Writing feed " + feedName);
    fs.writeFile(`./public/${feedName}.json`, JSON.stringify(rokuFeed), (error) => {
      if (error) throw error;
    });
  }