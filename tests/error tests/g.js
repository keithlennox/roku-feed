/*RE-THROW*/

const myFunction = () => {
    const a = "hello";
    //const a = "goodbye";
    if(a === "hello"){
        throw new SyntaxError("This is serious!");
    }else if(a === "goodbye"){
        throw new SyntaxError("This is super serious!");
    }
}

try{
    console.log(myFunction());
}catch(error) {
    if (error.message === "This is serious!") {
        console.log("We're gonna retry!");
    } else {
        console.log("Not my circus. Not my monkey.");
    }
}