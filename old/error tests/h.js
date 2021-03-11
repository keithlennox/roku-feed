/*Isolated code that creates Rouku feed that can be used for testing*/

//DUMMY BRIGHTCOVE OBJECT
const bcObject = [
    {
    "series": "Paw Patrol",
    "season": "1",
    "episode": "2",
    "reference_id": "123456",
    "name": "Pups save the day"
    },
    {
    "series": "Kratts",
    "season": "2",
    "episode": "11",
    "reference_id": "654321",
    "name": "Lions"
    },
    {
    "series": "Paw Patrol",
    "reference_id": "234567",
    "name": "Pups go to Hollywood"
    },
    {
    "series": "Kratts",
    "season": "11",
    "episode": "7",
    "reference_id": "4500889",
    "name": "Tigers"
    },
    {
    "series": "Kratts",
    "season": "2",
    "episode": "4",
    "reference_id": "654045",
    "name": "Lions"
    },
    { 
    "series": "Paw Patrol",
    "season": "1",
    "episode": "17",
    "reference_id": "234567",
    "name": "Pups go on holiday"
    },
    {
    "series": "Kratts",
    "season": "1",
    "episode": "3",
    "reference_id": "789443",
    "name": "Armadillos"
    },
    {
    "series": "Kratts",
    "season": "1",
    "episode": "2",
    "reference_id": "225478",
    "name": "Wolves"
    }
];

//gomakethings.com/sorting-an-array-by-multiple-criteria-with-vanilla-javascript/
//console.log(bcObject);
bcObject.sort(function (a, b) {
    if(a.series > b.series) return 1;
    if(a.series < b.series) return -1;
    if(parseInt(a.season) > parseInt(b.season)) return 1;
    if(parseInt(a.season) < parseInt(b.season)) return -1;
    if(parseInt(a.episode) > parseInt(b.episode)) return 1;
    if(parseInt(a.episode) < parseInt(b.episode)) return -1;
});
console.log(bcObject);