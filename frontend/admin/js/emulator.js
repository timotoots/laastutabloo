// Global parameters
var emulator_params = {
	laastX: 27, // Global: number of shingles X
	laastY: 12 // Global: number of shingles Y
};

// Letters in different formats
var letterMapping = {};
var allowedLetters = {};

// Animator Library
var ta;

	 function promiseLoadJson(url) {
      return fetch(url)
        .then(response => response.json());
    }

    promiseLoadJson("../json/letters.json")
	.then(data => new Promise(function(resolve, reject) {

   		for (var i = 0; i < data.length; i++) {
        	allowedLetters[data[i].letter] = true;
        	delete data[i].segments; // do not need segements in emulator
      	}
      	letterMapping = data;
   		console.log("Letters loaded");
        resolve(true);

    })).then(a => promiseLoadJson("../json/bigfont.json"))
    .then(bigfont => new Promise(function(resolve, reject){

   		console.log("Bigfont loaded!");

   		// Load animator
    	var animatorParams = emulator_params;
    	animatorParams.bigfont = bigfont;
    	animatorParams.runInBrowser = 1;
    	animatorParams.allowedLetters = allowedLetters;
   		ta = new Animator(animatorParams);


   		console.log("Libraries loaded");

   		resolve(true);
   } )).then(a => new Promise(function(resolve, reject){
   		// init_emulator();
   		var url = "http://laastutabloo.erm.ee:5000/render_query?query_id=avalik&ehak=1021"
   		// var url = "http://laastutabloo.erm.ee/json/query.json";
   		 $.getJSON( url, function( data ) {
   			var animations = ta.createSlides(data,1);
   			console.log(animations);
   		});
   		
   		resolve(true);
   } ));
