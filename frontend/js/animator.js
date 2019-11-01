//
// Animator Server
//

// Node modules
var request = require("request");
var fetch = require('node-fetch');

// Our libraries
var animator = require('./lib_animator.js');


function promiseLoadJson(url) {
  return fetch(url)
    .then(response => response.json());
}

// Load files and start

promiseLoadJson("http://laastutabloo.erm.ee/json/letters.json")
	.then(data => new Promise(function(resolve, reject) {
   		console.log("Letters loaded");
   		letters = data;
        resolve(true);
    }))
   .then(a => new Promise(function(resolve, reject){
   		console.log("Libraries loaded");
   		var ta = new animator({"runInBrowser":0});
   		resolve(true);
   } )).then(a => new Promise(function(resolve, reject){
   		console.log("Start!");
   		start();
   		resolve(true);
   } ));


function start(){

	var url = "http://laastutabloo.erm.ee:5000/render_query?query_id=avalik&ehak=446";

	promiseLoadJson(url)
		.then(data => new Promise(function(resolve, reject) {
			 console.log(data);
			 ta.parseQueries()
			 resolve(true);
		}));

}
