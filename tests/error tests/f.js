/*Throw my own error
https://javascript.info/try-catch
*/

const myFunction = () => {
    //const a = "hello";
    const a = "goodbye";
    if(a === "hello"){
        return "Hello was detected";
    }else{
        //throw "Hello was not detected";
        //throw 500;
        //throw new SyntaxError("Hello was not detected"); //A SyntaxError is thrown if you try to evaluate code with a syntax error.
        throw new ReferenceError("Hello was not detected"); //A ReferenceError is thrown if you use a variable that has not been declared.
        //throw new TypeError("Hello was not detected"); //A TypeError is thrown if you use a value that is outside the range of expected types.
    }
}

try{
    console.log(myFunction());
}catch(error){
    console.log(error);
}