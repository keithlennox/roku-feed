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
  "season": "11",
  "reference_id": "234567",
  "name": "Pups go to Hollywood"
  },
  {
  "series": "Kratts",
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
  "season": "1",
  "episode": "17",
  "reference_id": "234567",
  "name": "Pups go on holiday"
  },
  {
  "series": "Kratts",
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

for(let video of bcObject) {
  try{
    if(video.series && video.season && video.name && video.episode && video.reference_id) {
      console.log("all good");
      //push to array
    }else{
      throw "error";
    }
  }catch(error) {
    console.log("all bad");
  }
}