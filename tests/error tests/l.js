/*
https://blog.bearer.sh/add-retry-to-api-calls-javascript-node/
 */

/*RETRY USING FUNCTION*/

let counter = 0;
const getVideos = () => {
  try{
    //const a = "hello";
    const b = "goodbye";
    return a + b;
  }catch{
    counter = counter + 1;
    if(counter < 3) {
      console.log("Shit!");
      getVideos();
    }
  }
}

console.log(getVideos());