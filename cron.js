var fs = require('fs');
const cron = require('node-cron');
const { getBrightcoveVideos, getBrightcoveSource } = require('./functions/brightcove');
const { createRokuSeries, createRokuSeason, createRokuVideo } = require('./functions/roku');
const dummyBcSourcedVideos = require('./data.json')

console.log('Hello from the CRON!')

const createRokuFeed = (bcObject) => {
  let rokuFeed = {"providerName": "TVO", "language": "en-US"};
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

    }catch(error){
      console.error(error);
    }

  }) //End looping thru Brightcove videos
  return rokuFeed;//This could return an empty Roku feed if all tasks fail

}

const writeRokuFeed = (rokuFeed) => {
  console.log("Writing feed");
  fs.writeFile('./feed.json', JSON.stringify(rokuFeed), (err) => {
    if (err) throw err;
  });
}

const tempCron = async () => {
  console.log("CRON triggered");
  let bcVideos = await getBrightcoveVideos(18140038001);
  let bcSourcedVideos = await getBrightcoveSource(bcVideos);
  let rokuFeed = createRokuFeed(bcSourcedVideos);
  writeRokuFeed(rokuFeed);
}

tempCron();