/*
find() returns the value of the first element in an array that pass a test
forEach() calls a function once for each element in an array
includes() determines whether an array contains a specified element
for of
some() tests whether at least one element in the array passes the test implemented by the provided function. It returns a Boolean value
*/

videoObject = {content: {captions: {}}};

const bcItem = 
    {
        "id": "4356609519001",
        "account_id": "15364602001",
        "text_tracks": [
            {
                "id": "65b8132d-7d0b-46d0-8864-a81c96bfcdb2",
                "account_id": "15364602001",
                "src": "http://brightcove.vo.llnwd.net/v1/unsecured/media/15364602001/201708/2028/15364602001_7e18b10e-bcb1-4eda-a8c6-4d2179a65bc1.vtt?pubId=15364602001&videoId=5556007812001",
                "srclang": "en",
                "label": "English",
                "kind": "captions",
                "mime_type": "text/vtt",
                "asset_id": "7e18b10e-bcb1-4eda-a8c6-4d2179a65bc1",
                "sources": [
                    {
                        "src": "http://brightcove.vo.llnwd.net/v1/unsecured/media/15364602001/201708/2028/15364602001_7e18b10e-bcb1-4eda-a8c6-4d2179a65bc1.vtt?pubId=15364602001&videoId=5556007812001"
                    },
                    {
                        "src": "httpss://brightcove.hs.llnwd.net/v2/unsecured/media/15364602001/201708/2028/15364602001_7e18b10e-bcb1-4eda-a8c6-4d2179a65bc1.vtt?pubId=15364602001&videoId=5556007812001"
                    }
                ],
                "default": false
            }
        ]


    }

/* 
if(bcItem.text_tracks.length != 0) {
  bcItem.text_tracks.forEach((text_track) => {
    if(text_track.kind === "captions") {
      text_track.sources.forEach((source) => {
        if(source.src.startsWith("https://")) {
          videoObject.content.captions.url = source.src
        }
      })
    }
  })
}
console.log(videoObject);
*/

/*
if(bcItem.text_tracks.length != 0) {
  for(let text_track of bcItem.text_tracks) {
    if(text_track.kind === "captions") {
      for(let source of text_track.sources) {
        if(source.src.startsWith("https://")) {
          videoObject.content.captions.url = source.src
        }
      }
    }
  }
}
console.log(videoObject);
*/

/*
let url = bcItem.text_tracks.find((text_track)=> text_track.kind === "captions").sources.find((source) => source.src.startsWith("https://"));
console.log(url.src)
videoObject.content.captions.url = url.src;
console.log(videoObject);
*/

/*   
if(bcItem.text_tracks.length != 0) {
  let text_track = bcItem.text_tracks.find((item)=> item.kind === "captions")
  let url = text_track.sources.find((item2) => item2.src.startsWith("https://"))
  console.log(url);
}
*/

/*
if(bcItem.text_tracks.length != 0) {
  let text_track = bcItem.text_tracks.find((item)=> item.kind === "captions");
  if(text_track) {
    let url = text_track.sources.find((item2) => item2.src.startsWith("https://"))
    if(url) {
      videoObject.content.captions.url = url.src;
    }else{
      throw new ReferenceError("There are no captions of type https for " + bcItem.id);
    }
  }else{
    throw new ReferenceError("There are no text trks of type captions for" + bcItem.id);
  }
}else{
  throw new ReferenceError("There are no text trks for " + bcItem.id);
}
console.log(videoObject);
*/

const getCaptions = (bcItem) => {
  if(bcItem.text_tracks.length != 0) {
    let text_track = bcItem.text_tracks.find((item)=> item.kind === "captions");
    if(text_track) {
      let url = text_track.sources.find((item2) => item2.src.startsWith("https://"))
      if(url) {return url.src;}
    }
  }
  throw new ReferenceError("Caption file not found for video " + bcItem.id);
}

console.log(getCaptions(bcItem));