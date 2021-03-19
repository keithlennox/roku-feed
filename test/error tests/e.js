/*BUBBLE UP*/

const myFunction2 = () => {
    //const a = "hello";
    const b = "goodbye";
    const myVar = a + b;
    return myVar;
}

const myFunction1 = () => {
    return myFunction2();
}

try{
    console.log(myFunction1());
}catch{
    console.log("We caught the error way down here!")
}