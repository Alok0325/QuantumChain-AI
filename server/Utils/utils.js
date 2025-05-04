const crypto = require('crypto');

exports.hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};


exports.errorLog = (err) => {
  console.log(err);
};

exports.normalLog = (log) => {
  console.log(log);
};


exports.generateRandomId=(length)=> {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"; // Only letters
  const numbers = "0123456789"; // Only digits

  let letterPart = "";
  let numberPart = "";

  if(!length){
    length=5;
  }

  // Generate the length-letter part
  for (let i = 0; i < length; i++) {
    letterPart += letters.charAt(Math.floor(Math.random() * letters.length));
  }

  // Generate the length-digit part
  for (let i = 0; i < length; i++) {
    numberPart += numbers.charAt(Math.floor(Math.random() * numbers.length));
  }

  // Combine both parts
  return letterPart + numberPart;
}
