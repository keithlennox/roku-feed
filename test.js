const bcItem = {
    "id": "4356609519001",
    "account_id": "15364602001",
    "ad_keys": null,
    "clip_source_video_id": null,
    "complete": true,
    "created_at": "2015-07-15T20:14:58.340Z",
    "created_by": {
        "type": "unknown"
    },
    "cue_points": [],
    "custom_fields": {
        "ottflag": "true",
        "otttype": "series with seasons",
        "ottseriesnumber": "1633",
        "ottseriesname": "Annedroids",
        "ottseriesdescription": "Annedroids series description.",
        "ottserieskeywords": "one, two, three",
        "ottseriesgeneres": "one, two, three",
        "ottseriesreleasedate": "2021-09-01T18:55:00.000Z",
        "ottseasonnumber": "1",
        "ottepisodenumber": "1",
        "tvoseriesname": "Annedroids",
        "tvoseries": "1633",
        "tvoembeddable": "0",
        "geogateterritory": "CA",
        "geogatefilter": "Allow",
        "sortorder": "0",
        "assettype": "PROGRAM",
        "altaudio": "No"
    },
    "delivery_type": "static_origin",
    "description": "Shania and Nick break back into the junkyard to find what's really going inside now.",
    "digital_master_id": null,
    "duration": 1381377,
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
            "asset_id": "5193173454001",
            "remote": false,
            "src": "http://f1.media.brightcove.com/8/15364602001/15364602001_5193173454001_4356609519001-th.jpg?pubId=15364602001&videoId=4356609519001",
            "sources": [
                {
                    "src": "http://f1.media.brightcove.com/8/15364602001/15364602001_5193173454001_4356609519001-th.jpg?pubId=15364602001&videoId=4356609519001",
                    "height": 90,
                    "width": 160
                },
                {
                    "src": "https://f1.media.brightcove.com/8/15364602001/15364602001_5193173454001_4356609519001-th.jpg?pubId=15364602001&videoId=4356609519001",
                    "height": 90,
                    "width": 160
                }
            ]
        },
        "poster": {
            "asset_id": "5193175456001",
            "remote": false,
            "src": "http://f1.media.brightcove.com/8/15364602001/15364602001_5193175456001_4356609519001-vs.jpg?pubId=15364602001&videoId=4356609519001",
            "sources": [
                {
                    "src": "http://f1.media.brightcove.com/8/15364602001/15364602001_5193175456001_4356609519001-vs.jpg?pubId=15364602001&videoId=4356609519001",
                    "height": 360,
                    "width": 640
                },
                {
                    "src": "https://f1.media.brightcove.com/8/15364602001/15364602001_5193175456001_4356609519001-vs.jpg?pubId=15364602001&videoId=4356609519001",
                    "height": 360,
                    "width": 640
                }
            ]
        }
    },
    "link": null,
    "long_description": "Shania thinks everything is the worst right now. Nick is not allowed back in the junkyard as per his Mom's new rules, Anne's not answering her walky-talky, and the junkyard has newly upgraded security. Nick thinks Anne doesn't want them to come in while Shania thinks the junkyard has been taken over by an evil genius. In order to find what's really going on behind the now even higher junkyard fence, Shania and Nick break back into the junkyard.",
    "name": "Reset (Described Video)",
    "original_filename": "1351824783_4356623951001_116692DV-AltAudio-1500k.mp4",
    "projection": null,
    "published_at": "2015-07-15T20:14:58.359Z",
    "reference_id": "116692DV_AltAudio",
    "schedule": {
        "ends_at": "2021-09-01T18:55:00.000Z",
        "starts_at": "2015-07-17T18:55:00.000Z"
    },
    "sharing": null,
    "state": "ACTIVE",
    "tags": [
        "android",
        "building",
        "experiment",
        "friendship",
        "meteorite",
        "robotics",
        "science",
        "scientist",
        "space"
    ],
    "text_tracks": [],
    "updated_at": "2017-03-01T20:47:17.618Z",
    "updated_by": {
        "type": "unknown"
    },
    "playback_rights_id": null,
    "video_urls": "https://manifest.prod.boltdns.net/manifest/v1/hls/v4/clear/18140038001/c82f707a-3e0c-4ba4-a626-ad7c6fca3be2/10s/master.m3u8?fastly_token=NjAzNWJlNTNfN2UxZGEwMGNkM2FiOGNmYzFmZThhMjhlNWQ3YjNlYjY2ZjMxZDM3MzkzMGM1YTI1ZTNmYjEzYzM0ODAxOWVmYg%3D%3D"
}

if(bcItem.video_url) {
    console.log("found")
}else {
    throw new ReferenceError("Video url not found");
}