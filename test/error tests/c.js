const myFunction = () => {
    const a = "hello";
    const b = "goodbye";
    const myVar = a + b;
    console.log("alice cooper"); //Displays "alicecooper"
    return myVar; //
}


try{
    console.log(myFunction()); //Displays "hellogoodbye"
}catch{
    console.log("We caught the error way down here!") //This never runs
}