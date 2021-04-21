# Roku Direct Publisher feed generator

Creates Direct Publisher json feed for Roku TVO and TVOKIDS channels. Feeds are available here:  
  
https://d81ef65ednp0p.cloudfront.net/tvo/feed.json  
https://d81ef65ednp0p.cloudfront.net/tvokids/feed.json  

## DETAILS

- Videos are hosted on Brightcove. Code is hosted on AWS Lambda.  
- The Lambda function is automatically triggered, once for each Brightcove account. The account number is passed in the event object to the handler function.
- The Lmabda function can also be triggered manually by creating a test event for each account that passes the Brightcove account number in the event object.
- Users curate videos by changing values in BC custom fields. These are prefixed with OTT.
- Brightcove video URLs normally expire within 6 hrs. At our request, they have extended this to 7 days.
- Ownership/geogating is set at the Roku channel level, NOT the series or video level.
- We have to make multiple calls to Brightcove: oauth, videos, and sources. Sources is the only place we can get the video URL.
- We can only get max of 100 videos at a time and max of only 1 source at a time.
- Roku requires thumbnails for series. These are stored on AWS S3. Users cannot upload these on their own. We upload for them via the AWS S3 console.
- Custom thumbs for non series (moves + tv specials) are stored on brightcove along with the video.
- We will not use CPAD because it does not have a roku live/not live flag or video URLs so we would still need to call BC. Calling both is overly complex.
- We cannot use the BC Playback API. Results are geo-restricted and return max of 1000 videos.
- We cannot use the BC Social Syndication API. Returns 100 videos at a time, but Roku does not page thru results. Does not offer a solution to host series images.

## BC CUSTOM FIELDS (Display name / Internal name / Data type / TS XML field)

This script uses the following Brightcove custom fields:  
  
*OTT Episode Number / ott_episode_number / text / EPISODE_ORDER*  
The episode number for this video. Numeric values only, no leading zeros, no text. -- Required if OTT Type = "series with seasons" or "series without seasons".  
  
OTT Flag / ott_flag / restricted list: true, false  / NA  
Controls whether this video appears on Roku or not. Leaving this field blank is the same as choosing false. -- Required for all OTT videos.  
  
OTT Genres / ott_series_genres / text: comma separated list / NA  
Comma separated list of genres. Accepted values: action, adventure, animals, animated, anime, children, comedy, crime, documentary, drama, educational, fantasy, faith, food, fashion, gaming, health, history, horror, miniseries, mystery, nature, news, reality, romance, science, science fiction, sitcom, special, sports, thriller, technology. -- Required on the first episode of every season if OTT Type = "series with seasons" or the first episode of a series if OTT Type = "series without seasons". Also required if OTT Type = "movies" or "tv specials".  
  
OTT Rating / ott_rating / text / AgeRating  
The rating for the video content. Must be one of the following values: 14+, 18+, C, C8, E, G, PG. -- Required for all OTT videos.  
  
OTT Release Date / ott_release_date / text: YYYY-MM-DD / AirDate  
YYYY-MM-DD. Used by Roku to sort programs chronologically and generate the “Recently Added” category. -- Required for all OTT videos.  
  
OTT Season Number / ott_season_number / text / SeasonNumber  
The season number for this video. Numeric values only, no leading zeros, no text. -- Required if OTT Type = "series with seasons".  
  
OTT Series Description / ott_series_description / text / ShortDescription  
A description of the series that does not exceed 200 characters. The text will be clipped if longer. -- Required on the first episode of every season if OTT Type = "series with seasons" or the first episode of a series if OTT Type = "series without seasons".  
  
OTT Series Name / ott_series_name / text / SeriesTitle  
The title of the series in plain text. This field is used for matching in Roku Search. Do not include extra information such as year, version, and so on. -- Required if OTT Type = "series with seasons" or "series without seasons".  
  
OTT Series Number / ott_series_number / text / TVOSeries  
A unique identifier for this series that does not exceed 50 characters. Four digit Telescope series# is preferred. Can be modified to include letters, dashes and underscores if required. No special characters. -- Required if OTT Type = "series with seasons" or "series without seasons".  
  
OTT Tags / ott_series_tags / text: comma separated list / NA  
Comma separated list of tags (for example: dramas,docs,news). Each tag is limited to 20 characters. Tags are used to define what content will be shown within a category. -- Required on the first episode of every season if OTT Type = "series with seasons" or the first episode of a series if OTT Type = "series without seasons". Also required if OTT Type = "movies" or "tv specials".  
  
OTT Type / ott_type / restricted list / NA  
The type of content: movies, tv specials, series with seasons, series without seasons. -- Required for all OTT videos.  

## ERROR HANDLING

- For the most part error handling consists of a single try/catch block within the createRokuFeed function. All errors bubble up and are caught here.
- For each video, if there's an error, the error is logged and the video is simply skipped, not added to the Roku feed.
- After the issue is fixed, the script can be manually re-run and the video should now be added to the Roku feed.
- Brightcove OTT custom fields are just string types without any validation happening on the Brightcove end.
- This script does some minimal validation of the OTT custom fields.
- Validation does not compare fields. For example, we check that episode# is an integer, but we don't check if ep 2 has been used more than once within a series/season.

## ROADMAP

- Error handling

WHERE TO STORE SERIES INFO (* indicates chosen option)
*Brightcove custom fields: 1st ep only  
Brightcove custom fields: all videos  
Brightcove dummy CMS records  
CPAD, would still need to call BC for video URL, ott_flag, genres
Brightcove playlists: max 100 videos, name and description fields only  
Brightcove folders: name field only  