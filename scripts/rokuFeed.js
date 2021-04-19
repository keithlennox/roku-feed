/*Functions used to create Roku rss feed and write it to file*/

const AWS = require('aws-sdk'); // No need to include this in node_modules because it's already part of AWS JS runtime
const { createRokuSeries, createRokuSeason, createRokuVideo } = require('./rokuFeedObjects');

const s3 = new AWS.S3(); //Access S3 object of AWS-SDK

//Create Roku feed
exports.createRokuFeed = async (bcObject) => {
    let now = new Date().toISOString();
    let rokuFeed = {"providerName": "TVO", "language": "en", "lastUpdated": now};
    let counter = 0;

    //Loop thru all Brightcove videos
    for(let bcItem of bcObject) {
  
      try{

        //Throw error if ott_type is missing
        if(!bcItem.custom_fields.ott_type) {throw new ReferenceError("ott_type missing for video " + bcItem.id);}
  
        //Series with seasosns
        if(bcItem.custom_fields.ott_type === "series with seasons") {
          let videoObject = createRokuVideo(bcItem);
          if(!rokuFeed.hasOwnProperty("series")) { //If seriesArray does not exist...
            let seriesObject = await createRokuSeries(bcObject, bcItem);
            let seasonObject = createRokuSeason(bcItem);
            rokuFeed.series = [{...seriesObject, "seasons":[{...seasonObject, "episodes": [{...videoObject}]}]}]; //PUSH seriesArr/seriesObj/seasonsArr/seasonObj/episodesArr/episodeObj to root
            console.log(`Pushed seriesArr/seriesObj/seasonsArr/seasonObj/episodesArr/${bcItem.reference_id} to root`);
          }else{ //If seriesArray does exist...
            let rokuSeriesIndex = rokuFeed.series.findIndex((item) => item.title == bcItem.custom_fields.ott_series_name);
            if(rokuSeriesIndex === -1) { //If seriesObject does not exist...
              let seriesObject = await createRokuSeries(bcObject, bcItem);
              let seasonObject = createRokuSeason(bcItem);
              rokuFeed.series.push({...seriesObject, "seasons":[{...seasonObject, "episodes": [{...videoObject}]}]}); //PUSH seriesObj/seasonsArr/seasonObj/episodesArr/episodeObject to seriesArr
              console.log(`Pushed seriesObj/seasonsArr/seasonObj/episodesArr/${bcItem.reference_id} to seriesArr`);
            }else{ //If seriesObject does exist...
              let rokuSeasonIndex = rokuFeed.series[rokuSeriesIndex].seasons.findIndex((seasonsItem) => seasonsItem.seasonNumber == bcItem.custom_fields.ott_season_number);
              if(rokuSeasonIndex === -1) { //If seasonArray does not exist...
                let seasonObject = createRokuSeason(bcItem);
                rokuFeed.series[rokuSeriesIndex].seasons.push({...seasonObject, "episodes": [{...videoObject}]});//PUSH seasonObj/episodesArray/episodeObj to seriesArr/seriesObj/seasonsArr
                console.log(`Pushed seasonObj/episodesArr/${bcItem.reference_id} to seriesArr/seriesObj/seasonsArr`);
              }else{ //If seasonArray does exist...
                rokuFeed.series[rokuSeriesIndex].seasons[rokuSeasonIndex].episodes.push({...videoObject}); //PUSH episodeObj
                console.log(`Pushed ${bcItem.reference_id} to seriesArr/seriesObj/seasonsArr/seasonObj/episodesArr`);
              }
            }
          }
        }

        //Series without seasons
        if(bcItem.custom_fields.ott_type === "series without seasons") {
          let videoObject = createRokuVideo(bcItem);
          if(!rokuFeed.hasOwnProperty("series")) { //If seriesArray does not exist...
            let seriesObject = await createRokuSeries(bcObject, bcItem);
            rokuFeed.series = [{...seriesObject, "episodes": [{...videoObject}]}]; //PUSH seriesArr/seriesObj/episodesArr/episodeObj to root
            console.log(`Pushed seriesArr/seriesObj/episodesArr/${bcItem.reference_id} to root`);
          }else{ //If seriesArray does exist...
            let rokuSeriesIndex = rokuFeed.series.findIndex((item) => item.title == bcItem.custom_fields.ott_series_name);
            if(rokuSeriesIndex === -1) { //If seriesObject does not exist...
              let seriesObject = await createRokuSeries(bcObject, bcItem);
              rokuFeed.series.push({...seriesObject, "episodes": [{...videoObject}]}); //PUSH seriesObj/episodesArr/episodeObj to seriesArr
              console.log(`Pushed seriesObj/episodesArr/${bcItem.reference_id} to seriesArr`);
            }else{ //If seriesObject exists...
              rokuFeed.series[rokuSeriesIndex].episodes.push({...videoObject}); //PUSH episodeObj to seriesArr/seriesObj/episodesArr
              console.log(`Pushed ${bcItem.reference_id} to seriesArr/seriesObj/episodesArr`);
            }
          }
        }

        //Movies
        if(bcItem.custom_fields.ott_type === "movies"){
          let videoObject = createRokuVideo(bcItem);
          if(!rokuFeed.hasOwnProperty("movies")) { //If moviesArray does not exist
            rokuFeed["movies"] = [] //PUSH moviesArr
            console.log(`Pushed moviesArr to root`);
          }
          rokuFeed["movies"].push({...videoObject}); //PUSH moviesObj to moviesArr
          console.log(`Pushed ${bcItem.reference_id} to moviesArr`);
        }

        //TV specials
        if(bcItem.custom_fields.ott_type === "tv specials") {
          let videoObject = createRokuVideo(bcItem);
          if(!rokuFeed.hasOwnProperty("tvSpecials")) { //If tvSpecialsArray does not exist
            rokuFeed["tvSpecials"] = [] //PUSH tvSpecialsArr
            console.log(`Pushed tvSpecialsArr to root`);
          }
          rokuFeed["tvSpecials"].push({...videoObject}); //PUSH tvSpecialsObj to tvSpecialsArr
          console.log(`Pushed ${bcItem.reference_id} to tvSpecialsArr`);
        }

        counter++; //Increment counter

      }catch(error){
        console.error(error);
      }
  
    }//End looping thru Brightcove videos
  
    return {"feed": rokuFeed, "count": counter};
  
  }
  
  // Write Roku feed to S3 bucket
  exports.writeRokuFeed = async (rokuFeed, account) => {
    let folder;
    if(account === "18140038001") {
      folder = "tvo";
    }else if(account === "15364602001") 
    {
      folder = "tvokids";
    }
    const params = { Bucket: "ott-feeds", Key: `roku/${folder}/feed.json`, Body: `${JSON.stringify(rokuFeed)}` };
    try {
      const putResponse = await s3.putObject(params).promise();
      console.log("Write to feed response: " + JSON.stringify(putResponse));
      return true;
    }catch(error) {
      console.error(error);
    }
    return false;
  }