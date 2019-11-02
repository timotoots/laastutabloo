//
// Animator Server
//

// Node modules
var request = require("request");
var fetch = require('node-fetch');
var letters = {};

// Our libraries
var animator = require('./lib_animator.js');
  var ta;

function promiseLoadJson(url) {
  return fetch(url)
    .then(response => response.json());
}

// Load files and start

promiseLoadJson("http://laastutabloo.erm.ee/json/letters.json")
	.then(data => new Promise(function(resolve, reject) {
   		console.log("Letters loaded");
      for (var i = 0; i < data.length; i++) {
        letters[data[i].letter] = true;
      }
        resolve(true);
    }))
   .then(a => promiseLoadJson("http://laastutabloo.erm.ee/json/bigfont.json"))
   .then(bigfont => new Promise(function(resolve, reject){
   		console.log("Libraries loaded");
   		ta = new animator({"runInBrowser":0,"letters":letters,"bigfont":bigfont});
   		resolve(true);
   } )).then(a => new Promise(function(resolve, reject){
   		console.log("Start!");
   		start();
   		resolve(true);
   } ));


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
