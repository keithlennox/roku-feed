const getBrightcoveVideos = async (account) => {
  console.log("Retrieving videos")
  let counter = 0; //initialize counter
  let bcVideos = []; //Create empty videos array
  const search = "roku";

  //START OUTER LOOP 
  while(counter === bcVideos.length) { //Get next 100 videos until no more are returned
    console.log(counter);
    console.log(bcVideos.length);

    //START INNER LOOP 3x

      //START OUTER TRY
        let options = await getToken();
        //If options === "Error", throw error
        let response = await axios.get("https://cms.api.brightcove.com/v1/accounts/" + account + "/videos?q=tags:" + search + "&limit=100&offset=" + counter, options);
        
        //START INNER INNER LOOP
        for(let bcVideo of response.data) {

          //START INNER TRY

            if(bcVideo.custom_fields.tvoseriesname && bcVideo.custom_fields.assettype && bcVideo.custom_fields.sortorder) {
              console.log(bcVideo.id);
              let bcVideoUrl = await getBrightcoveSource(account, bcVideo.id, options);
              // If bcVideoUrl ==== "Error", throw error "ERROR: SOURCE VIDEO CANNOT BE FOUND"
              console.log(bcVideoUrl);
              bcVideo.video_url = bcVideoUrl;
              bcVideos.push(bcVideo);
            }else{
              //Throw error "ERROR: VIDEO FIELDS ARE MISSING"
            }
            await sleep(111); //Brightcove rate limiting = less than 10 requests per second (111 ms = 9 requests per second)
        
          //END INNER TRY

          //START INNER CATCH
            //Log the error
          //END INNER CATCH

        }; //END INNER INNER LOOP

      //END OUTER TRY
      //START OUTER CATCH
        //log error
      //END OUTER CATCH

    //END INNER LOOP

    counter = counter + 100; //Increment counter

  } //END OUTER LOOP

  return bcVideos;
}