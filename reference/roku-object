/*Isolated code that creates Rouku feed that can be used for testing*/

//DUMMY BRIGHTCOVE OBJECT
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