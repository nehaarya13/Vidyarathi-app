const fs = require('fs');
const pdf = require('pdf-parse'); // old version works perfectly with require

const dataBuffer = fs.readFileSync('data/uploads/jesc101.pdf');

pdf(dataBuffer).then(function(data) {
    console.log(data.text); // Plain text output
});
