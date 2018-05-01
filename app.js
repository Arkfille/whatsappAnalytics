let fs = require("fs");
let express = require('express');
let app = express();

// init the server
app.use(express.static(__dirname + '/public'));


app.get('/', function(req, res){
    res.render('index');
});

app.get('/getDataObj', function(req,res){
    res.send(getDataObjectToSendToView(messagesArray));
})

app.listen(3000);
console.log("listening");

// Read the file
let chatData = fs.readFileSync("withoutLineBreaks.txt").toString("utf-8");

let makeAllDatesTheSameFormat = (chatData) => {
    initialConvert = chatData.replace(/(\d\d?)\/(\d\d?)\/(\d\d),/g, '20$3-0$1-0$2');
    dateCleanup = initialConvert.replace(/(\d{4})-0(\d{2})/g, '$1-$2');
    dayCleanup = dateCleanup.replace(/(\d{4})-(\d{2})-0(\d{2})/g, '$1-$2-$3');
    return dayCleanup;
}

let removeNewLines = (chatData) => {
    return chatData.replace(/(\r|\n)(?=\D{4})/g, ' ');
}

// These are needed if the file is not already beautiful :)
//fs.writeFileSync("withoutLineBreaks.txt", removeNewLines(chatData));
//chatData = makeAllDatesTheSameFormat(chatData)
//fs.writeFileSync("sanitizedDates.txt", chatData);

let getArrayOfAllMessages = (chatData) => {
    let returnObj = chatData.split(/(\r|\n)/g);
    for (var i = 1; i <= returnObj.length; i += 1)
    {
        returnObj.splice(i, 1);
    }
    return returnObj;
}
let messagesArray = getArrayOfAllMessages(chatData);

let getNumberOfMessagesPerPerson = (chatData) => {

}

let removedWords = ["var", "jag", "sig", "från", "vi", "så", "kan", "man", "när", "år", ,"", "säger", "hon", "under", "också", "efter", "eller", "nu", "sin", "där", "vid", 'omitted>', 'jag', 'så', '<media', 'utelämnats>', 'har', 'i', 'och', 'att', "det", "som", "en", "på", "är", "av", "för", "med", "till", "den", "har", "de", "inte", "om", "ett", "han", "men"];

let getEachPersonsMessages = (messagesArray) => {
    let people = {};
    for (var message of messagesArray) {
        let dateOfMessage = message.substring(0,10);
        let timeOfMessage = message.substring(11,16);
        let nameOfPerson = message.substring(19, getPosition(message,":",2)).replace(/[^ -ö]+/g, "").trim();
        let theMessage = message.substring(getPosition(message,":",2))
        if(people[nameOfPerson]) {
            if(people[nameOfPerson][dateOfMessage]){
                people[nameOfPerson][dateOfMessage].push({date: dateOfMessage, name: nameOfPerson, time: timeOfMessage, message: theMessage});
            }
            else {
                people[nameOfPerson][dateOfMessage] = [{date: dateOfMessage, name: nameOfPerson, time: timeOfMessage, message: theMessage}];
            }
        }
        else {
            people[nameOfPerson] = {
                [dateOfMessage]: [{date: dateOfMessage, name: nameOfPerson, time: timeOfMessage, message: theMessage}]
            };
        }
    }

    return sanitizePeopleObject(people);
}

let sanitizePeopleObject = (peopleObj) => {
    let cacheOfNames = [];
    for (var key in peopleObj) {
        if (peopleObj.hasOwnProperty(key)) {
           if(key === ("") || key.match(/added|lade till|lämnade|left/)){
               delete peopleObj[key];
            }
        }
     }
     return peopleObj
}


let getAllWordsPerPerson = (people) => {
    let data = {};
    for (person in people) {
        let tempCount = 0;
        for (date in people[person]) {
            for(message of people[person][date] ){
                if(!data[person]) {
                    data[person] = message.message.substring(2).split(" ");
                }
                else {
                    data[person] = data[person].concat(message.message.substring(2).split(" "));
                }
            }
        }
    }
    return data;
}


let getWordFrequencyPerPerson = (people) => {
    let data = {};
    for (person in people) {
        data[person] = {};
        for(word of people[person]){
            if(data[person][word] && removedWords.indexOf(word.toLowerCase()) < 0 ){
                data[person][word]++
            }
            else {
                data[person][word] = 1;
            }
        }
    }
    for(person in data) {
        var sortable = [];
        for (word in data[person]) {
            sortable.push([word, data[person][word]]);
        }
        
        sortable.sort(function(a, b) {
            return b[1] - a[1];
        });
        data[person] = sortable;
    }
    return data;
}

/* let getDateMessageStream = (people) => {
    let data = [];
    let AllDates = [];
    for(person in people) {
        let theValues = [];
        for(date in people[person]) {
        let timeX = new Date(date).getTime();
        AllDates.push(timeX);
        theValues.push([timeX, people[person][date].length]);
    }
    data.push({key: person, values: theValues});
    }

    for(date of AllDates) {
        for(person in people){ 
            let theIndex = data.findIndex(function(e) {
                return e.key === person
              });
              let dateExists = data[theIndex].values.some(function(e) {
                  e[0] === date
              });
            if(!dateExists) {
                data[theIndex].values.push([date,0]);
            }
        }
    }

    fs.writeFileSync('public/stream.json', JSON.stringify(data));
} */

function personExists (array, person) {
    return array.findIndex(function(e) {
        return e.key === person
      });
}

let getDateMessageStream = (people) => {
    let data = [];
    var end = new Date('2018-04-30');
    for (var d = new Date('2016-08-25'); d <= end; d.setDate(d.getDate() + 1)) {
        let theDate = d.toISOString().substring(0,10);
        for(person in people) {
            if(personExists(data, person) === -1) {
                data.push({key: person, values: []});
            };
            let personIndex = personExists(data, person);
            let datesOnPerson = Object.keys(people[person]);
            let timeX = new Date(theDate).getTime();
            if(datesOnPerson.includes(theDate)) {
                data[personIndex].values.push([timeX, people[person][theDate].length]);
            }
            else {
                data[personIndex].values.push([timeX, 0]);
            }
            
        }
    }

    fs.writeFileSync('public/stream.json', JSON.stringify(data));
}

let getaverageMessagesPerWeekday = (people) => {
    let data = [];
    for(person in people) {
        data.push({key: person, values: []});
        for(date in people[person]) {
            let weekday = getWeekday[new Date(date).getDay()];
            let personIndex = personExists(data,person);
            if(!weekday) {
                continue
            }
            let weekdayIndex = data[personIndex].values.findIndex(function(e) {
                return e.x === weekday;
              });
            if(weekdayIndex > -1) {
                  data[personIndex].values[weekdayIndex].y++
            }
            else {
                data[personIndex].values.push({x: weekday, y: 1});
            }
        }
    }


    data[0].values.sort(function sortByDay(a, b) {
        var day1 = a.x;
        var day2 = b.x;
        return sorter[day1] > sorter[day2];
      });
    return data;

}


var sorter = {
    // "sunday": 0, // << if sunday is first day of week
    "Måndag": 1,
    "Tisdag": 2,
    "Onsdag": 3,
    "Torsdag": 4,
    "Fredag": 5,
    "Lördag": 6,
    "Söndag": 7
  }


let getDataObjectToSendToView = (messagesArray) => {
    let people = getEachPersonsMessages(messagesArray);
    let allwords =  getAllWordsPerPerson(people);
    let wordFrequency = getWordFrequencyPerPerson(allwords)
    let weekdayMessages = getaverageMessagesPerWeekday(people);
    //getDateMessageStream(people)
    
    return {
        totalNumberOfMessages: messagesArray.length,
        allMessages: messagesArray,
        allWordByPerson: allwords,
        people: people,
        weekdayMessages: weekdayMessages,
        wordFrequencyByPerson: wordFrequency
    }
}


// HELPERS

function getPosition(string, subString, index) {
    return string.split(subString, index).join(subString).length;
 }
 let getWeekday = {
    0: "Söndag",
    1: "Måndag",
    2: "Tisdag",
    3: "Onsdag",
    4: "Torsdag",
    5: "Fredag",
    6: "Lördag"
 }
