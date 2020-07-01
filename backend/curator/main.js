//
// Laastutabloo curator server
//
// port 3030 = erm
// port 3040 = public
// port 3041 = devel

// Global parameters
var params = {
  laastX: 27, // Global: number of shingles X
  laastY: 12 // Global: number of shingles Y
};

// Node modules
var request = require("request");
var fetch = require('node-fetch');
var colors = require('colors');
var allowedLetters = {};

const cors = require('cors');

// Our libraries
var layout_lib = require('/opt/laastutabloo/backend/curator/layout.js');
var animator_lib = require('/opt/laastutabloo/backend/curator/animator.js');

var layout, animator, ehak, queries; // global classes

var ehak_length = 0;

var counter = 0;

queries = ["rahvaarv","ettevotjad","mooduvad_lennukid","rongid","viimased_laenutused","popimad_raamatud","avalik","suurimad_saunad","korgemad_hooned","linnud","taimed","loomad"];

var ver = process.argv[2];
var port;

console.log("\n\nLAASTURABLOO CURATOR".green);
  console.log("VERSION: "+ver.red);

if(ver=="erm"){

  port = 3030;
} else {

  port = 3031;
}

////////////////////////////////////////////////////////////////////////////////////////////////////
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

      // Load layout
      var layoutParams = params;
      layoutParams.bigfont = bigfont;
      layoutParams.runInBrowser = 0;
      layoutParams.allowedLetters = allowedLetters;
      layout = new layout_lib(layoutParams);

      // Load animator
      var animatorParams = params;
      animatorParams.runInBrowser = 0;
      animator = new animator_lib(animatorParams);

      resolve(true);

   } )).then(a => promiseLoadJson("http://laastutabloo.erm.ee/json/list_ehak.json"))
   .then(data => new Promise(function(resolve, reject){

      ehak = data;
      ehak_length = ehak.length;
     console.log("EHAK Loaded");

      resolve(true);

   } )).then(a => new Promise(function(resolve, reject){
      console.log("Ready for action!\n".green);
      resolve(true);
   } ));


////////////////////////////////////////////////////////////////////////////////////////////////////

// Web server
// nohup node animator.js



const express = require('express')

const app = express()



app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.listen(port, () => console.log(`Listening commands on port ${port}!`))

////////////////////////////////////////////////////////////////////////////////////////////////////

var exec = require('child_process').exec;


function logInflux(key, value){

    var cmd = "curl -i -XPOST 'https://XX.XX.XX:8086/write?db=iot_test'  -u XXX:YYY --data-binary '"+ key +",place=laastutabloo value="+ value +"'";

  exec(cmd, function (error, stdout, stderr) {
      // console.log('stdout: ' + stdout);
      // console.log('stderr: ' + stderr);
      // if (error !== null) {
      //   console.log('exec error: ' + error);
      // }
    });

}

////////////////////////////////////////////////////////////////////////////////////////////////////

  var currentQueries = [];


var animate_output = "";

function checkOutput(res) {

    if(animate_output==="") {
        setTimeout(checkOutput, 50, res);
        return;
    }

    res.send(animate_output);
    animate_output = "";

}


app.get('/sync_view', function (req, res2) {

  checkOutput(res2);


});



////////////////////////////////////////////////////////////////////////////////////////////////////


app.get('/get_animations', function (req, res) {

  var ip = req.connection.remoteAddress;

  var client = "other"
  if(ip=="::ffff:193.40.13.50"){
    client = "erm";
  }

    if(client=="erm"){
      logInflux("erm_request", counter);
    } else {
      logInflux("other_request", counter);
    }


   var requestId = currentQueries.length;
   currentQueries[requestId] = [];

  if(counter>20){
    counter = 0;
  } else {
    counter++;
  }


  var rando1 = Math.floor((Math.random() * ehak_length));
  var rando2 = Math.floor((Math.random() * queries.length));

  var rando_ehak = ehak[rando1].akood;
  var rando_query = queries[rando2];

  console.log("New request from " + ip +" / EHAK:" + rando_ehak);


  // rando_ehak = 9728;


  for (var i = 0; i < queries.length; i++) {
    
    getQuery(rando_ehak,queries[i],requestId);

  }

  setTimeout(function(id,res){

   var queries = combineQueries(id);
   if(queries){
       animateQueries(queries,res)
   } else {
    console.log("No data in queries! Empty respnose".red);
      res.send({});
   }


  },10000,requestId,res)

   // var url = "http://laastutabloo.erm.ee/json/query3.json";

  

})


function combineQueries(id){


    var combinedQueries = {};
    var district;


    for (var i = 0; i < currentQueries[id].length; i++) {

      if(!district){
        var district = currentQueries[id][i].district;
      }

      for(var query_id in currentQueries[id][i].queries){
        combinedQueries[query_id] = currentQueries[id][i].queries[query_id];
      }

    } // for

    if(district){

      var out = {"district":district,"queries":combinedQueries}
      return out;

    } else {
      return false;
    }


}


function animateQueries(queries,res){

       var slides = layout.createSlides(queries);

        logInflux("erm_slides", slides.length);


        var playlist = animator.animateSlides(slides);

        animate_output = playlist;

        res.send(playlist)
        var currdatetime = new Date();
        console.log("CURATOR VER: " + ver.green + " / PORT : "+ port);

        // console.log("SLIDES / EHAK: " + rando_ehak + " / Query ID: "+ rando_query + " / Datastore URL: "+ url);

        // console.log("SLIDES to client from " + client.yellow + " / IP:"+ ip.green);
        var str = "Last request:" + currdatetime.toString().green
        console.log(str);


}

function getQuery(ehak, query_id, request_id){

    var url = datastoreUrl(ehak,query_id);


    promiseLoadJson(url)
      .then(queries => new Promise(function(resolve, reject) {

        console.log("QUERY / EHAK: " + ehak + " / Query ID: "+ query_id + " / Data count: "+ queries.queries[query_id].data.length + " / Datastore URL: "+ url);

        if(queries.queries[query_id].data.length > 0){
          currentQueries[request_id].push(queries);
          resolve(true);
        }
        
      }));


}

////////////////////////////////////////////////////////////////////////////////////////////////////


function promiseLoadJson(url) {
  return fetch(url)
    .then(response => response.json());
}

function datastoreUrl(ehak,query_id){

  return  "http://laastutabloo.erm.ee:5000/render_query?query_id=" + query_id + "&ehak=" + ehak;

}


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
