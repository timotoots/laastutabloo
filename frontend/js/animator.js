//
// Animator Server
//

// Global parameters
var params = {
  laastX: 27, // Global: number of shingles X
  laastY: 12 // Global: number of shingles Y
};

// Node modules
var request = require("request");
var fetch = require('node-fetch');
var allowedLetters = {};

// Our libraries
var animator_lib = require('./lib_animator.js');
  var ta;

////////////////////////////////////////////////////////////////////////////////////////////////////
// Web server
// nohup node animator.js

const express = require('express')
const app = express()
const port = 3030


app.listen(port, () => console.log(`Listening commands on port ${port}!`))

app.get('/get_animations', function (req, res) {

  var rando = Math.floor((Math.random() * 3) + 1);

  var ehak = "6017";

  if(rando==1){
    ehak = "6017";
  } else if(rando==2){
    ehak = "3364";
  } else {
    ehak = "6017";
  }

  console.log("Query: EHAK:" + ehak+" ");

   var url = "http://laastutabloo.erm.ee:5000/render_query?query_id=avalik&ehak=446";

   var url = "http://laastutabloo.erm.ee:5000/render_query?query_id=viimasedlaenutused&ehak=6017";
   
   // var url = "http://laastutabloo.erm.ee:5000/render_query?query_id=linnud&ehak=1021"
   var url = "http://laastutabloo.erm.ee/json/query3.json";

    promiseLoadJson(url)
      .then(data => new Promise(function(resolve, reject) {
         //console.log(data);

         var queries = ta.animateQueries(data);

         res.send(queries)
         resolve(true);
      }));

})



function promiseLoadJson(url) {
  return fetch(url)
    .then(response => response.json());
}

// Load files and start

promiseLoadJson("http://laastutabloo.erm.ee/json/letters.json")
	.then(data => new Promise(function(resolve, reject) {

      for (var i = 0; i < data.length; i++) {
          allowedLetters[data[i].letter] = true;
        }
      console.log("Letters loaded");
        resolve(true);


    }))
   .then(a => promiseLoadJson("http://laastutabloo.erm.ee/json/bigfont.json"))
   .then(bigfont => new Promise(function(resolve, reject){
   	

      // Load animator
      var animatorParams = params;
      animatorParams.bigfont = bigfont;
      animatorParams.runInBrowser = 0;
      animatorParams.allowedLetters = allowedLetters;
      ta = new animator_lib(animatorParams);

   		resolve(true);
   } )).then(a => new Promise(function(resolve, reject){
   		console.log("Start!");
   		resolve(true);
   } ));

/*
function start(){

	var url = "http://laastutabloo.erm.ee:5000/render_query?query_id=avalik&ehak=446";
  var url = "http://laastutabloo.erm.ee/json/query.json";

	promiseLoadJson(url)
		.then(data => new Promise(function(resolve, reject) {
			 //console.log(data);
			 ta.animateQueries(data)
			 resolve(true);
		}));

}
*/