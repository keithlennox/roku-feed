//https://electrictoolbox.com/javascript-static-variables/

const getToken = () => {
  let now =  Date.now();
  if(now > getToken.expireTime || !getToken.expireTime) {
    getToken.options = Math.random();
    getToken.expireTime = Date.now() + 60000; //now + 290 sec (BC tokens expire in 300 sec / 5 min)
    return getToken.options;
  }
  return getToken.options;
}

const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const myFunction = async () => {
  let i = 0;
  while(i < 1000) {
    console.log(getToken());
    await sleep(10000);
    i++;
  }
}

myFunction();







