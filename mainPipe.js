const fs = require("fs");
const es = require("event-stream");
const stream = require("stream");
const _ = require("lodash");

const promiseGenerator = (pt, index) => {
  return new Promise((resolve, reject) => {
    const ws = fs.createWriteStream(`split/part_${index}.jsonl`);
    pt
      // .pipe(es.split())
      // .pipe(es.mapSync(l => console.log(l)))
      .pipe(ws)
      .on("close", () => {
        console.log("promise end!");
        const randomTime = Math.random() * 2000;
        setTimeout(() => resolve([index, randomTime]), randomTime);
      })
      .on("error", (err) => {
        console.log("error on promise!");
        reject(Error(err));
      })
    ;
  });
}

const pipeGenerator = (index) => {
  const pt = stream.PassThrough();
  // s3.upload().promise()
  return {
    stream: pt,
    promise: promiseGenerator(pt, index)
  };
}

let pageIndex = 1;

const dynamicPiping = (streamables, streamInput) => {
  let i = 0;
  const ms = es.mapSync((line) => {
    let space = "\n";
    if (i === 0) {
      space = "";
      streamables.push(pipeGenerator(pageIndex));
      ms.pipe(_.last(streamables).stream);
    }
    if (i && i % 10 === 0) {
      space = "";
      const prevPipe = _.last(streamables).stream;
      prevPipe.end();
      streamInput.unpipe(prevPipe);
      pageIndex++;
      const newPipe = pipeGenerator(pageIndex);
      streamables.push(newPipe);
      ms.pipe(newPipe.stream);
    }
    if (i && i % 5 === 0) {
      console.log("checkpoint: ", i);
    }
    i++;
    return space + line;
  });

  return ms;
};

const mainPipe = () => {
  return new Promise((resolve, reject) => {
    const rs = fs.createReadStream("master/junk.jsonl");
    const arrOfStreamable = [];
    rs.pipe(es.split())
      .pipe(dynamicPiping(arrOfStreamable, rs))
      .on("end", async () => {
        console.log("finished!");
        const res = await Promise.all(arrOfStreamable.map(o => o.promise));
        if (res) {
          console.log(res);
          resolve(res);
        }
      })
      .on("error", (err) => {
        reject(Error(err));
      })
    ;
  });
};

module.exports = mainPipe;