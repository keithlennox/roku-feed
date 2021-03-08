//FUNCTION 1
const getVideo = (account) => {
    let video = "123456";
    let i = 0;
    while (i < 10) {
        let source =  getSource(video);
        try{
           if(source != "12345698") {
                throw "Something bad happened";
           }else{
                return video + "-" + source;
           }
        }catch(error) {
            i++;
            console.log(i);
            console.log(error);
        }
    }
    return "What the fuck just happened?";
}

//FUNCTION 2
const getSource = (video) => {
    return video + "99";
}

//CALL FUNCTION 1
console.log(getVideo("654321"));