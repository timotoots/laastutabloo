///////////////////////////////////////////////////////////////////////////
//
//  TablooData - downloading and displaying data on the screen
// 
//  For both web and museum versions
//
///////////////////////////////////////////////////////////////////////////


(function() {
  var TablooData = (function() {






    var params = {
      laastX: 27, // number of shingles X
      laastY: 12 // number of shingles Y
    };



    console.log(queue);

    // Module init
    var TablooData = function(options) {
      console.log("Start TablooData!");
      getLetters();
      getSlides();
      init();
    };


    var queue;
    

    function init(){

      emptyQueue();
      // setTimeout(function(){ effect("random"); },3000);
      // setTimeout(function(){ effect("random2"); },14000);
        

    }

    /////////////////////////////////////////////////////////////

    function emptyQueue() {

      queue = {};
    
      for(var x = 0; x < params.laastX; x++){
        queue[x] = {};
        for (var y = 0; y < params.laastY; y++) {
          queue[x][y] = [];
         }
      }

    } // emptyQueue

    /////////////////////////////////////////////////////////////


    function getLetters(){

      loadJSON( "json/letters.json", function( data ) {
        tc.loadLetters(data);

      });


    }

    /////////////////////////////////////////////////////////////
    
    function rotateRow(x,deg,dir){

      for (var i = 0; i < params.laastX; i++) {
        setTimeout(function(i,x,dir){
          tc.rotateLaast(i,x,deg,dir,0);
        },Math.random()*1000,i,x,dir);
        
      }

    }

    /////////////////////////////////////////////////////////////


    function addToQueue(x,y,time,parameter,value=0, value2=0){

      var msg = {};
      msg.time = time;
      msg.parameter = parameter;
      msg.value = value;
      msg.value2 = value2;
     
      queue[x][y].push(msg);

    }

    /////////////////////////////////////////////////////////////



    function effect(id){


      ///////////////////////////////

      if(id=="random"){

        dir = 1;
        deg = 1080;

        for (var y = 0; y < params.laastY; y++) {
          for(var x = 0; x < params.laastX; x++){

           addToQueue(x,y,Math.random()*1000+2000,"delay",0);
           addToQueue(x,y,4000,"rotate",deg,dir);


          } // for
        } // for

       

      ///////////////////////////////

      } else if(id=="random2"){

        dir = 1;
        deg = 3600;

        for (var y = 0; y < params.laastY; y++) {
          for(var x = 0; x < params.laastX; x++){

          addToQueue(x,y,Math.random()*500 + y*500+100,"delay",0);
          addToQueue(x,y,5000,"rotate",deg,dir);

          } // for
        } // for

      } else {
        return false;
      }
      
      ///////////////////////////////




    } //   function effect


    ///////////////////////////////////////////////////////////////
    
    function changeSlide(){

      effect("random2");
      for (var y = 0; y < nextSlides[0].length; y++) {
        for(var x = 0; x < params.laastX; x++){
          if(nextSlides[0][y][x] == " "){
            addToQueue(x,y,10,"letter","tyhik")
          } else {
            addToQueue(x,y,10,"letter",nextSlides[0][y][x].toUpperCase())
          }
        }


      }


      tc.runQueue(queue);
      emptyQueue();

    } 

    /////////////////////////////////////////////////////////////

    var nextSlides = [];

    function parseSlides(slides){

      var newSlides = [];

      for (var i = 0; i < slides.queries.length; i++) {

        if(slides.queries[i].pages){

            for (var j = 0; j < slides.queries[i].pages.length; j++) {

              newSlides.push(slides.queries[i].pages[j]);

            }


        }
      }

      nextSlides = newSlides;
      changeSlide();


    }

  /////////////////////////////////////////////////////////////


  function loadJSON(path, success, error){

      var xhr = new XMLHttpRequest();
      xhr.onreadystatechange = function(){

          if (xhr.readyState === XMLHttpRequest.DONE) {
              if (xhr.status === 200) {
                  if (success)
                      success(JSON.parse(xhr.responseText));
              } else {
                  if (error)
                      error(xhr);
              }
          }
      };
      xhr.open("GET", path, true);
      xhr.send();

  }

  /////////////////////////////////////////////////////////////

  function getSlides(ehak,queries,language){

    loadJSON( "json/slides.json", function( data ) {

      parseSlides(data);

    });

  } // function

  /////////////////////////////////////////////////////////////

    TablooData.prototype.rotateRow = rotateRow;

    return TablooData;

  })();

  if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
    module.exports = TablooData;
  else
    window.TablooData = TablooData;
})();