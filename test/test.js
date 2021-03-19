/*
find() returns the value of the first element in an array that pass a test
forEach() calls a function once for each element in an array
includes() determines whether an array contains a specified element
for of
some() tests whether at least one element in the array passes the test implemented by the provided function. It returns a Boolean value
*/

videoObject = {content: {captions: {}}};

const bcItem = {
  "id": "5556100515001",
  "account_id": "15364602001",
  "ad_keys": null,
  "clip_source_video_id": null,
  "complete": true,
  "created_at": "2017-08-29T13:45:41.909Z",
  "created_by": {
      "type": "unknown"
  },
  "cue_points": [],
  "custom_fields": {
      "ottflag": "true",
      "otttype": "series with seasons",
      "ottseriesnumber": "1633",
      "ott_series_name": "Annedroids",
      "ottseriesdescription": "Annedroids series description.",
      "ottserieskeywords": "one, two, three",
      "ottseriesgeneres": "one, two, three",
      "ottseriesreleasedate": "2021-09-01T18:55:00.000Z",
      "ottseasonnumber": "3",
      "ottepisodenumber": "1",
      "assettype": "PROGRAM",
      "geogatefilter": "Allow",
      "geogateterritory": "CA",
      "publishpoints": "Brightcove / tvokids",
      "sortorder": "0",
      "tvoembeddable": "0",
      "tvoseries": "1633",
      "tvoseriesname": "Annedroids"
  },
  "delivery_type": "static_origin",
  "description": "Nick's Mom gets curious about what's going on in the junkyard when she finds a USB in Nick's room.",
  "digital_master_id": null,
  "duration": 1381587,
  "economics": "FREE",
  "folder_id": null,
  "geo": {
      "countries": [
          "ca"
      ],
      "exclude_countries": false,
      "restricted": true
  },
  "has_digital_master": false,
  "images": {
      "thumbnail": {
          "asset_id": "5556105446001",
          "remote": false,
          "src": "http://f1.media.brightcove.com/8/15364602001/15364602001_5556105446001_5556100515001-th.jpg?pubId=15364602001&videoId=5556100515001",
          "sources": [
              {
                  "src": "http://f1.media.brightcove.com/8/15364602001/15364602001_5556105446001_5556100515001-th.jpg?pubId=15364602001&videoId=5556100515001",
                  "height": 90,
                  "width": 160
              },
              {
                  "src": "httpss://f1.media.brightcove.com/8/15364602001/15364602001_5556105446001_5556100515001-th.jpg?pubId=15364602001&videoId=5556100515001",
                  "height": 90,
                  "width": 160
              }
          ]
      },
      "poster": {
          "asset_id": "5556102510001",
          "remote": false,
          "src": "http://f1.media.brightcove.com/8/15364602001/15364602001_5556102510001_5556100515001-vs.jpg?pubId=15364602001&videoId=5556100515001",
          "sources": [
              {
                  "src": "http://f1.media.brightcove.com/8/15364602001/15364602001_5556102510001_5556100515001-vs.jpg?pubId=15364602001&videoId=5556100515001",
                  "height": 360,
                  "width": 640
              },
              {
                  "src": "https://f1.media.brightcove.com/8/15364602001/15364602001_5556102510001_5556100515001-vs.jpg?pubId=15364602001&videoId=5556100515001",
                  "height": 360,
                  "width": 640
              }
          ]
      }
  },
  "link": null,
  "long_description": "Nick's Dad has to cancel on a weekend tobogganing trip because he has to work. Nick is upset both because his Dad bailed and because there's no snow in his new town yet. Anne and Shania decide to make snow for Nick so he can still go tobogganing even if he can't do it with his Dad. Meanwhile, Nick's Mom gets curious about what's going on in the junkyard when she finds an old USB lying around in Nick's room.",
  "name": "Family Matter",
  "original_filename": "124619DV.mp4",
  "projection": null,
  "published_at": "2017-08-29T13:45:41.909Z",
  "reference_id": "124619DV",
  "schedule": {
      "ends_at": "2020-12-01T16:00:06.000Z",
      "starts_at": "2017-09-05T13:00:00.000Z"
  },
  "sharing": null,
  "state": "ACTIVE",
  "tags": [
      "android",
      "anne",
      "annedroids",
      "build",
      "construct",
      "curious",
      "discover",
      "engineer",
      "explore",
      "friendship",
      "junkyard",
      "nick",
      "nick's dad",
      "nick's mom",
      "pal",
      "robot",
      "shania",
      "snow",
      "tobogganing",
      "tvokids",
      "tvokids.com",
      "usb"
  ],
  "text_tracks": [
      {
          "id": "f51ba311-ffb0-4ff8-a540-9383c95d482a",
          "account_id": "15364602001",
          "src": "http://brightcove.vo.llnwd.net/v1/unsecured/media/15364602001/201708/2764/15364602001_f212a801-bdcf-4e46-b146-e833469dfbc7.vtt?pubId=15364602001&videoId=5556100515001",
          "srclang": "en",
          "label": "English",
          "kind": "captions",
          "mime_type": "text/vtt",
          "asset_id": "f212a801-bdcf-4e46-b146-e833469dfbc7",
          "sources": [
              {
                  "src": "http://brightcove.vo.llnwd.net/v1/unsecured/media/15364602001/201708/2764/15364602001_f212a801-bdcf-4e46-b146-e833469dfbc7.vtt?pubId=15364602001&videoId=5556100515001"
              },
              {
                  "src": "https://brightcove.hs.llnwd.net/v2/unsecured/media/15364602001/201708/2764/15364602001_f212a801-bdcf-4e46-b146-e833469dfbc7.vtt?pubId=15364602001&videoId=5556100515001"
              }
          ],
          "default": false
      }
  ],
  "updated_at": "2018-01-24T15:55:27.959Z",
  "updated_by": {
      "type": "unknown"
  },
  "playback_rights_id": null,
  "video_url": "https://manifest.prod.boltdns.net/manifest/v1/hls/v4/clear/18140038001/c82f707a-3e0c-4ba4-a626-ad7c6fca3be2/10s/master.m3u8?fastly_token=NjAzNWJlNTNfN2UxZGEwMGNkM2FiOGNmYzFmZThhMjhlNWQ3YjNlYjY2ZjMxZDM3MzkzMGM1YTI1ZTNmYjEzYzM0ODAxOWVmYg%3D%3D"
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

const getBrightcoveThumb = (bcItem) => {
  if(bcItem.images.thumbnail.sources.length != 0) {
      let url = bcItem.images.thumbnail.sources.find((source) => source.src.startsWith("https://"))
      if(url) {
        return url.src;
      }
  }
  throw new ReferenceError("Thumbnail file not found for video " + bcItem.id);
}
console.log(getBrightcoveThumb(bcItem));