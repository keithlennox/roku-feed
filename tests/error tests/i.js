const videos = [
  {"make" : "Ford", "color":"red"},
  {"make" : "Chrysler", "color":"blue"},
  {"make" : "Toyota", "color":"purple"}
];

const video_array = [
  {"make" : "GM", "color":"black"},
  {"make" : "Pontiac", "color":"green"},
  {"make" : "BMW", "color":"yello"}
];

video_array.push(...videos);

console.log(video_array);