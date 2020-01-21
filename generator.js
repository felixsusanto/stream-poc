const fs = require("fs");
const es = require("event-stream");
const faker = require('faker');

const randomGenerator = () => {
  const obj = {
    name: faker.name.findName(),
    email: faker.internet.email(),
    card: faker.helpers.createCard()
  };
  return JSON.stringify(obj);
};

const rs = es.readable(function (count, callback) {
  if(count > 250)
    return this.emit('end')
  
  const data = randomGenerator();
  
  this.emit('data', `${count ? "\n" : ""}${data}`);
  callback();
})
const ws = fs.createWriteStream("master/junk.jsonl");

rs.pipe(ws);