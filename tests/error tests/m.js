/*
https://blog.bearer.sh/add-retry-to-api-calls-javascript-node/
 */

/*RETRY USING LOOP*/

let counter = 0;
while(counter < 3) {
  try{
    //const a = "hello";
    const b = "goodbye";
    myVar = a + b;
    console.log(myVar);
    break;
  }catch{
    console.log("Shit!");
  }
  counter = counter + 1;
}