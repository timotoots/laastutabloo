///////////////////////////////////////////////////////////////////////////
//
//  TablooControl interface of museum installation
// 
//  Exposes functions: loadLetters, changeLetter, rotateLaast
//
///////////////////////////////////////////////////////////////////////////

(function() {

  var TablooControl = (function() {
    var TablooControl = function(options) {
        console.log("Start TablooControl Museum!");
    };

    /////////////////////////////////////////////////////////////

    // Variables

    var letters;

    /////////////////////////////////////////////////////////////

    function loadLetters(data){

      for (var i = 0; i < data.length; i++) {
        
        var id = data[i].letter;
        letters[id] = data[i];

      }
      console.log("Letters loaded");
      console.log(letters);

    }

    /////////////////////////////////////////////////////////////

    function changeLetter(x,y,letter){
      console.log("Change letter: " + letter);
    }

    /////////////////////////////////////////////////////////////

    function rotateLaast(x,y,deg,dir,time){
      console.log("Rotate laast: " + deg);
    }

    /////////////////////////////////////////////////////////////
    // Functions exposed

    TablooControl.prototype.changeLetter = changeLetter;
    TablooControl.prototype.rotateLaast = rotateLaast;
    TablooControl.prototype.loadLetters = loadLetters;

    return TablooControl;
  
  })();

  if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
    module.exports = TablooControl;
  else
    window.TablooControl = TablooControl;

})();
