const mainPipe = require("./mainPipe");

exports.handler = async function (event, context) {
  try {
    await mainPipe();
    console.log("run here?");
  } catch(e) {
    throw Error(e);
  }
};