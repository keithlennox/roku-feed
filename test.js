//https://stackoverflow.com/questions/10834796/validate-that-a-string-is-a-positive-integer

//THESE ARE NUMBERS
//const myVar = 123;
//const myVar = "123";
//const myVar = 12.3;
//const myVar = "12.3";
//console.log(isNaN(myVar));

//const myVar = "12Y3X";
//console.log(parseInt(myVar));



///[1-9][0-9]/


//myVar = "5"; //Match
//myVar = "25"; //Match
//myVar = "255"; //No match
//myVar = "05"; //No match
//myVar = " 25"; //No match
//myVar = "25 "; //No match
//myVar = ""; //No match
//myVar = "Z25"; //No match
//myVar = "25Y"; //No match
if(myVar.match(/^[1-9][0-9]{0,1}$/)) {console.log("Match")}else{console.log("No Match")}