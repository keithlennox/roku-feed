const myFunction = () => {
    //const a = "hello";
    const b = "goodbye";
    const myVar = a + b; //Throws error, processing jumps to catch block
    console.log("alice cooper"); //Does not run
    return myVar; //Does not run
}

try{
    console.log(myFunction());  //Does not display
}catch{
    console.log("We caught the error way down here!") //This displays
}