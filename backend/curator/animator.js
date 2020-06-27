///////////////////////////////////////////////////////////////////////////
//
//  ANIMATOR library - creates animations based on data
// 
//  Used for both web and museum versions
//
///////////////////////////////////////////////////////////////////////////


(function() {
  var Animator= (function() {

    var params = {
      laastX: 27, // number of shingles X
      laastY: 12 // number of shingles Y
    };


    // Module init
    var Animator = function(options) {
    console.log("Loaded Lib Animator!");

    };

/////////////////////////////////////////////////////////////

    var emptySlide = [];
    for (var y = 0; y < params.laastY; y++) {
        var str = "";
        for (var x = 0; x < params.laastY; x++){
          str = str+" ";
        }
        emptySlide.push(str);
    }

/////////////////////////////////////////////////////////////

    function makeEmptyQueue(){

      var emptyQueue = [];
      for(var x = 0; x < params.laastX; x++){
        emptyQueue[x] = [];
        for (var y = 0; y < params.laastY; y++) {
          emptyQueue[x][y] = [];
         }
      }
      return emptyQueue;

    }


/////////////////////////////////////////////////////////////

   function newQueueElement(delay, cmd, value1 = false, value2 = false, value3 = false){

      var msg = {};
      msg.delay = Math.round(delay);
      msg.cmd = cmd;

      ///////////////

      if(cmd == "change_letter" && value1){

         value1 = value1.toUpperCase();
         if(value1 == " "){
          value1 = "tyhik";
         }

         msg.letter = value1;
         return msg;

      }

      ///////////////

      if(cmd == "flip" && value1 != 0 && (value2 == "F" || value2 == "B") && value3 > 0){

        msg.rotations = value1;
        msg.direction = value2;
        msg.speed = value3;

        return msg;

      } 

      ///////////////

      if(cmd == "rotate" && value1 != false && (value2 == "F" || value2 == "B") && value3 > 0){

        msg.degree = value1;
        msg.direction = value2;
        msg.speed = value3;
        return msg;

      } 

      ///////////////
      
      console.error("Queue element not made");
      console.error(msg);   
      
      return false;

    }


/////////////////////////////////////////////////////////////

    function createTransition(id){

       var slideQueue = makeEmptyQueue();

       // id= "random3";

      ///////////////////////////////

      if(id=="random1"){

        dir = "B";
        deg = 1080;

        for (var y = 0; y < params.laastY; y++) {
          for(var x = 0; x < params.laastX; x++){


          slideQueue[x][y].push(newQueueElement(Math.random()*100 + x*150,"flip",2,dir,10) );


          } // for
        } // for
          return slideQueue;

      ///////////////////////////////

      } else if(id=="random2"){


        dir = "F";
        deg = 360;

        for (var y = 0; y < params.laastY; y++) {
          for(var x = 0; x < params.laastX; x++){

          slideQueue[x][y].push(newQueueElement(Math.random()*100 + y*200+100,"flip",1,dir,10) );

          } // for
        } // for
        return slideQueue;

      } else if(id=="random3"){


        for (var y = 0; y < params.laastY; y++) {
          for(var x = 0; x < params.laastX; x++){

          var rando = Math.round(Math.random()*65+50);

          slideQueue[x][y].push(newQueueElement(0,"rotate",rando,"F",10) );
          slideQueue[x][y].push(newQueueElement(Math.random()*1000+3000,"rotate",360-rando,"F",10) );

          } // for
        } // for
        return slideQueue;

      } else {
        return false;
      }
      
      ///////////////////////////////


    } //   function effect


///////////////////////////////////////////////////////////////
    
    function animateSlides(slides){

      // console.log("Animate clean slides:");


      var previousSlide = emptySlide;

      var playlist = [];

      for(var i in slides){


        if(slides[i].lines){

        // console.log("Slide:" + i);

        var slideQueue = makeEmptyQueue(); 

        // slides[i] = cleanSlide(slides[i]);

        // console.log(slides[i]);
        
        if(slides[i].lines) {

            for (var y = 0; y < params.laastY; y++) {
              for(var x = 0; x < params.laastX; x++){
                if(slides[i].lines[y][x]){
                  var rando = Math.random()*300;

                  slideQueue[x][y].push(newQueueElement(rando,"flip",2,"F",10));
                  slideQueue[x][y].push(newQueueElement(rando + 500,"change_letter",slides[i].lines[y][x]));
                }
              } 
            }
        }

        playlist.push({"sequence":slideQueue,"waitAfter":10000,"type":"contentSlide","preview":slides[i].lines});

        // Add random transition between slides
        var rand = 2;
        rand = Math.floor(Math.random()*(rand-1+1)+1);

        var transition = createTransition("random" + rand);
        playlist.push({"sequence":transition,"waitAfter":4000,"type":"effectTransition"});

        } else if(slides[i].customAnimation) {
          playlist.push({"sequence":false,"waitAfter":10000,"type":"customAnimation","customAnimation":slides[i].customAnimation})
        }




      } // for all slides

      return playlist;


    }




///////////////////////////////////////////////////////////////

function createAnimationLibarySlide(id){

  return {"lines":false,"customAnimation":id};

}

///////////////////////////////////////////////////////////////

    Animator.prototype.animateSlides = animateSlides;

    return Animator;

  })();

  if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
    module.exports = Animator;
  else
    window.Animator = Animator;
})();