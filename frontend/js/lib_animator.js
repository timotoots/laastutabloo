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

    var table;
      // console.log(letters);
    var allowedLetters;
    var bigfont = {};

    const monthNames = {};

    monthNames["en"] = ["January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    monthNames["et"] = ["Jaanuar", "Veebruar", "Märts", "Aprill", "Mai", "Juuni",
      "Juuli", "August", "September", "Oktoober", "November", "Detsember"
    ];

    // Module init
    var Animator = function(options) {
      console.log("Loaded Lib Animator!");
      allowedLetters = options.allowedLetters;
      bigfont = options.bigfont;

      table = require("table");
    };

/////////////////////////////////////////////////////////////

  String.prototype.centerJustify = function( length, char ) {
    var i=0;
    var str= this;
    var toggle= true;
    while ( i + this.length < length ) {
      i++;
    if(toggle)
      str = str+ char;
    else
      str = char+str;
    toggle = !toggle;
    }
    return str;
}

/////////////////////////////////////////////////////////////

  function setCharAt(str,index,chr) {
      if(index > str.length-1) return str;
      return str.substr(0,index) + chr + str.substr(index+1);
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

    var emptySlide = [];
    for (var y = 0; y < params.laastY; y++) {
        emptySlide.push("".centerJustify(params.laastX," "));
    }

    var headerLine = "".centerJustify(params.laastX,"*");

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

    function cleanSlide(slide){

      // check if slides has lines
      if(!slide.lines && !slide.preset){
        return false;

      } else if (slide.lines){

        // check if has all lines
        for (var y = 0; y < params.laastY; y++) {
          if(!slide.lines[y]){
            slide.lines[y] = "".centerJustify(params.laastX," ");
          } else {

            // check if has all columns
             for(var x = 0; x < params.laastX; x++){
                if(!slide.lines[y][x]){
                  slide.lines[y] = setCharAt(slide.lines[y],x,".");
                } else {
                  // Convert to uppercase
                  slide.lines[y] = setCharAt(slide.lines[y],x,slide.lines[y][x].toUpperCase());
                }

                // Find not defined characters
                if(!allowedLetters[slide.lines[y][x]] && slide.lines[y][x]!=" "){
                  console.log("Character not found. Make one: " + slide.lines[y][x]);
                  slide.lines[y] = setCharAt(slide.lines[y],x,".");
                }
              } // for
          }

        } // for

    }

    return slide;

  } // function



///////////////////////////////////////////////////////////////
    
    function animateSlides(slides){

      // console.log("Animate clean slides:");


      var previousSlide = emptySlide;

      var playlist = [];

      for(var i in slides){


        if(slides[i].lines){

        // console.log("Slide:" + i);

        var slideQueue = makeEmptyQueue(); 

        slides[i] = cleanSlide(slides[i]);

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

        playlist.push({"sequence":slideQueue,"waitAfter":10000,"type":"contentSlide"});

        // Add random transition between slides
        var rand = 3;
        rand = Math.floor(Math.random()*(rand-1+1)+1);

        var transition = createTransition("random" + rand);
        playlist.push({"sequence":transition,"waitAfter":10000,"type":"effectTransition"});

        } else if(slides[i].customAnimation) {
          playlist.push({"sequence":false,"waitAfter":10000,"type":"customAnimation","customAnimation":slides[i].customAnimation})
        }




      } // for all slides

      return playlist;


    }


///////////////////////////////////////////////////////////////

function createBigfontSlide(str, enable_emoticons = false){

  var symbol = [];

  if(enable_emoticons){
      if(bigfont[str]){
          symbol.push(bigfont[str]);
      }
  } else {
      for (var i = 0; i < str.length; i++) {
        if(bigfont[str[i]]){
          symbol.push(bigfont[str[i]]);
        } else {
          symbol.push(bigfont[" "]);
        }
      }

  }

  if(enable_emoticons){
    var lines = [[],[],[],[],[],[],[],[],[],[],[],[]];
  } else {
    var lines = [[],[],[],[],[],[],[]];
  }


  for (var y = 0; y < lines.length; y++) {  
    for (var i = 0; i < symbol.length; i++) {
      if(symbol[i][y]){
        lines[y].push(symbol[i][y].replace(/#/g,"*") + " ");
      }
    }
  }

  for (var i = 0; i < lines.length; i++) {
    lines[i] = " " +lines[i].join("");
    lines[i] = lines[i].centerJustify(params.laastX," ");

  }



  return lines;

}

///////////////////////////////////////////////////////////////

function createTimeSlide(){

  var d = new Date();
  var time = (d.getHours() < 10 ? '0' : '') + d.getHours() + ":" + (d.getMinutes() < 10 ? '0' : '') + d.getMinutes();
  var date = d.getDate() + "." + monthNames["et"][d.getMonth()] + " " + d.getFullYear();

  var lines = [];
  lines.push("".centerJustify(params.laastX," "));
  lines = lines.concat(createBigfontSlide(time.toString()));
  lines.push("".centerJustify(params.laastX," "));
  lines.push((" " + date.toString() + " ").centerJustify(params.laastX,"*"));
  lines.push("".centerJustify(params.laastX," "));
  lines.push("".centerJustify(params.laastX," "));

  return {"lines":lines};

}

///////////////////////////////////////////////////////////////

function createAnimationLibarySlide(id){


  return {"lines":false,"customAnimation":id};


}

///////////////////////////////////////////////////////////////

function createEmoticonSlide(){

  var lines = [];
  lines = lines.concat(createBigfontSlide("_smile",true));

  return {"lines":lines};


}

///////////////////////////////////////////////////////////////

  function formatDistrictHeader(district){

      var districtName = district.name;
      var line = {};

      var titles = district.type;

      // Remove too long translations
      for(lang in titles){
        var title = " " + districtName + " " + titles[lang] + " ";
        if(title.length > params.laastX){
          delete(titles[lang]);
        } else {
          titles[lang] = title;
        }
      }

      // All translations too long, show only district name
      if(titles.length==0){
        titles["et"] = districtName;
      }


      for(lang in titles){
        line[lang] = titles[lang].centerJustify(params.laastX,"*");
      }

      return line;

  }

///////////////////////////////////////////////////////////////

  function formatSlideTitle(name){

     for(lang in name){
          name[lang] = name[lang].centerJustify(params.laastX,"*");
        }
        return name;

  }

///////////////////////////////////////////////////////////////

  function formatToTable(query){

    var table_data = [];

    var columnsConf = {};
    
    for (var j = 0 ;j < query.config.columns.length; j++){

      columnsConf[j] = {width:query.config.columns[j].text_width};

    }

    for (var i = 0; i < query.data.length; i++) {

      var table_row = [];

      for (var j = 0 ;j < query.config.columns.length; j++){

        var column = query.config.columns[j];

        if(typeof query.data[i][column.name] === "object"){
          table_row.push(query.data[i][column.name]["et"]);
        } else if(typeof query.data[i][column.name] != "undefined"){
          table_row.push(query.data[i][column.name]);
        } else {
          table_row.push("");
        }
        

      }
      

       table_data.push(table_row);


      //  // Add emtpy line
      // var table_row = [];
      // for (var j = 0 ;j < query.columns.length; j++){
      //     table_row.push("");
      // }
      // table_data.push(table_row);




    }


        var options = {

            border: {
              topBody: ``,
              topJoin: ``,
              topLeft: ``,
              topRight: ``,

              bottomBody: ``,
              bottomJoin: ``,
              bottomLeft: ``,
              bottomRight: ``,

              bodyLeft: ``,
              bodyRight: ``,
              bodyJoin: ``,

              joinBody: `=`,
              joinLeft: ``,
              joinRight: ``,
              joinJoin: ``
            },
            columnDefault: {
                paddingLeft: 0,
                paddingRight: 1
            },
            columns:columnsConf,
            drawHorizontalLine: () => {
                return true
            }
        };

        var output = table.table(table_data,options);

      //  console.log(output);


        return output;


  }

///////////////////////////////////////////////////////////////

function countQueryColumn(query){

   for (var j = 0 ;j < query.config.columns.length; j++){

    query.config.columns[j].text_lengths = {"none":[],"et":[]};
    query.config.columns[j].text_min = {"none":0,"et":0};
    query.config.columns[j].text_max = {"none":0,"et":0};
    // query.config.columns[j].text_avg = {"none":0,"et":0};

    var column_name = query.config.columns[j].name;

    var maxes = [];


    for (var i = 0; i < query.data.length; i++) {

          if(typeof query.data[i][column_name] === "object"){
            query.config.columns[j].text_lengths["et"].push(query.data[i][column_name]["et"].length);
          } else if(typeof query.data[i][column_name] != "undefined"){
            query.config.columns[j].text_lengths["none"].push(query.data[i][column_name].length);
          } else {
            query.config.columns[j].text_lengths["none"].push(0);
          }

    }

    query.config.columns[j].text_min["et"] = Math.min.apply(Math, query.config.columns[j].text_lengths["et"]);
    query.config.columns[j].text_max["et"] = Math.max.apply(Math, query.config.columns[j].text_lengths["et"]);
    maxes.push(query.config.columns[j].text_max["et"]);


    if( query.config.columns[j].text_lengths["none"].length>0){
      query.config.columns[j].text_min["none"] = Math.min.apply(Math, query.config.columns[j].text_lengths["none"]);
      query.config.columns[j].text_max["none"] = Math.max.apply(Math, query.config.columns[j].text_lengths["none"]);
      maxes.push(query.config.columns[j].text_max["none"]);
    }


    query.config.columns[j].text_supermax = Math.max.apply(Math, maxes);

    // default text width is the maximum of all languages
    query.config.columns[j].text_width = Math.max.apply(Math, maxes);


 
   // console.log( query.config.columns[j]);

  }

  var total_width = 0;
  // Calculate good column widths
   for (var j = 0 ;j < query.config.columns.length; j++){
    total_width = total_width + query.config.columns[j].text_supermax;
   }
     //  console.log(total_width);


   if(total_width > params.laastX){
      console.log("All text does NOT fit!")

   } else {
      console.log("All text fits!")    
   }

  return query;

}

///////////////////////////////////////////////////////////////

function splitPages(text){

  var lines = text.split("\n");
  var pages = [];
  var currentPage = 0;
  var currentElementLines = [];

  pages[currentPage] = [];

  for (var i = 0; i < lines.length; i++) {



    // If element ends
    if(lines[i].substr(0,5)=="====="){
      
      if(pages[currentPage].length + currentElementLines.length > 9){
        currentPage++;
        pages[currentPage] = [];
      }
      pages[currentPage] = pages[currentPage].concat(currentElementLines);
      currentElementLines = [];
    } else if(lines[i]!="") {
      currentElementLines.push(lines[i].replace("\n","").substr(0,27));
    }
  


  }
  
      pages[currentPage] = pages[currentPage].concat(currentElementLines);
      for(var i=0; i< 9 - pages[currentPage].length;i++){
        pages[currentPage].push("".centerJustify(params.laastX," "));
      }
    
     //  console.log("Pages:");
     // console.log(pages);

  return pages;

}

///////////////////////////////////////////////////////////////

function createSlides(queries, debug=0){

      var nextSlides = [];

      /*
      let data,
          output;

      data = [
          ['AA'.centerJustify(params.laastX,"*"), '0B', '0C'],
          ['1A', '1B', '1C'],
          ['2A', '2B', '2C']
      ];

      output = table.table(data);

      console.log(output);

*/

      var districtHeaders = formatDistrictHeader(queries.district);

      var newSlides = [];
      
      


     // newSlides.push(createTimeSlide());
     // newSlides.push(createAnimationLibarySlide("jasper1"));

     // newSlides.push(createEmoticonSlide());

      for(var query_id in queries.queries){

        // Query metadata
        queries.queries[query_id] = countQueryColumn(queries.queries[query_id]);
         queries.queries[query_id].data = queries.queries[query_id].data.splice(0,30);

        var query = queries.queries[query_id];
        var queryTitle  = formatSlideTitle(query.config.name);

        // Format data
        var text = formatToTable(query);
        var pages = splitPages(text);

        if(debug==1){
            console.log("debug output");
            var slideLines = [];
            slideLines.push(districtHeaders["et"]);
            slideLines.push(queryTitle["et"]);
            slideLines.push(headerLine);
            for (var i = 0; i < pages.length; i++) {
              slideLines = slideLines.concat(pages[i]);
              slideLines.push("".centerJustify(params.laastX,"="));

            }

            return slideLines
        }

        // Create slides from pages
        for (var i = 0; i < pages.length; i++) {

            var slideLines = [];

            slideLines.push(districtHeaders["et"]);
            slideLines.push(queryTitle["et"]);
            slideLines.push(headerLine);
            slideLines = slideLines.concat(pages[i]);
            newSlides.push({"lines":slideLines});

        } // for pages
        


      }

      return newSlides;


}

///////////////////////////////////////////////////////////////

function animateQueries(queries){


        var newSlides = createSlides(queries);

        var playlist = animateSlides(newSlides)

         // console.log("New playlist:");
         // console.log(playlist);

        return playlist;

    }



///////////////////////////////////////////////////////////////

    Animator.prototype.animateQueries = animateQueries;
    Animator.prototype.createSlides = createSlides;

    return Animator;

  })();

  if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
    module.exports = Animator;
  else
    window.Animator = Animator;
})();