///////////////////////////////////////////////////////////////////////////
//
//  ANIMATOR library - creates animations based on data
// 
//  Used for both web and museum versions
//
///////////////////////////////////////////////////////////////////////////


(function() {
  var TablooAnim= (function() {

    var params = {
      laastX: 27, // number of shingles X
      laastY: 12 // number of shingles Y
    };

    var table;

    // Module init
    var TablooAnim = function(options) {
      console.log("Start TablooAnim!");
      table = require("table");
      init();
    };


    var queue;
    

    function init(){

      emptyQueue();
        

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
    
    function rotateRow(x,deg,dir){

      for (var i = 0; i < params.laastX; i++) {
        setTimeout(function(i,x,dir){
          tc.rotateLaast(i,x,deg,dir,0);
        },Math.random()*1000,i,x,dir);
        
      }

    }

    /////////////////////////////////////////////////////////////


    function addToQueue(x,y,time,parameter,value=0, value2=0){

      if(parameter == "letter" && value ==" "){
        value = "tyhik";
      }

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



    ///////////////////////////////////////////////////////////////
    
    function changeSlide(){

      effect("random2");

      for (var y = 0; y < nextSlides[0].length; y++) {

        // put
        if(typeof nextSlides[0][y] === "string"){
          console.log("string");
          var a = nextSlides[0][y];

          nextSlides[0][y] =  {};
          nextSlides[0][y]["et"] = a;

        } 

        console.log("Next slides:");
        console.log(nextSlides);

        for(var x = 0; x < params.laastX; x++){
          if(typeof nextSlides[0][y]["et"] != "undefined"){
             addToQueue(x,y,10,"letter",nextSlides[0][y]["et"][x].toUpperCase())
          }
        }




      }



      tc.runQueue(queue);
      emptyQueue();

    } 

    /////////////////////////////////////////////////////////////


    function createDistrictHeader(queries){

        var districtName = queries.district.name;
        var line = {};

        var titles = queries.district.type;

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

        console.log(line);
        return line;

     

    }

  /////////////////////////////////////////////////////////////

  function createSlideTitle(query){

     for(lang in query.name){
          query.name[lang] = query.name[lang].centerJustify(params.laastX,"*");
        }
        return query.name;

  }

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

        console.log(output);


        return output;


  }

/////////////////////////////////////////////////////////////

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


 
    console.log( query.config.columns[j]);

  }

  var total_width = 0;
  // Calculate good column widths
   for (var j = 0 ;j < query.config.columns.length; j++){
    total_width = total_width + query.config.columns[j].text_supermax;
   }
       console.log(total_width);


   if(total_width > params.laastX){
      console.log("All text does NOT fit!")

   } else {
      console.log("All text fits!")    
   }

  return query;

}

/////////////////////////////////////////////////////////////

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
      console.log("Pages:");
     console.log(pages);

  return pages;

}

/////////////////////////////////////////////////////////////

    var nextSlides = [];

function parseQueries(queries){


      let data,
          output;

      data = [
          ['AA'.centerJustify(params.laastX,"*"), '0B', '0C'],
          ['1A', '1B', '1C'],
          ['2A', '2B', '2C']
      ];

      output = table.table(data);

      console.log(output);


      var districtHeader = createDistrictHeader(queries);

      var headerLine = "".centerJustify(params.laastX,"*");

      var lines = [];

      lines.push(districtHeader);
      lines.push(headerLine);



      var newSlides = [];
       


      for(var query_id in queries.queries){

        var slideLines = lines;



        queries.queries[query_id] = countQueryColumn(queries.queries[query_id]);

        var query = queries.queries[query_id];

        var queryTitle  = createSlideTitle(query);

        var text = formatToTable(query);

        var pages = splitPages(text);

        for (var i = 0; i < pages.length; i++) {
          newSlides.push(slideLines.concat(pages[i]))
        }
        


      }

        console.log("New slides:");

        console.log(newSlides);

      // for (var i = 0; i < slides.queries.length; i++) {

      //   if(slides.queries[i].data){


      //     if()

      //       for (var j = 0; j < slides.queries[i].pages.length; j++) {

      //         newSlides.push(slides.queries[i].pages[j]);

      //       }


      //   }
      // }

      nextSlides = newSlides;
      changeSlide();


    }

  /////////////////////////////////////////////////////////////

  
/////////////////////////////////////////////////////////////
  function loadJSON(path, success_func, error_func){

    if (typeof window === 'undefined'){

      require("request")(
        {url: path,json: true}, 
        function (error, response, body) {
          if (!error && response.statusCode === 200) {
              success_func(body);
          } else if(error_func) {
              error_func(body);
          }
        });
    

    } else {

        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function(){

            if (xhr.readyState === XMLHttpRequest.DONE) {
                if (xhr.status === 200) {
                    if (success_func)
                        success_func(JSON.parse(xhr.responseText));
                } else {
                    if (error)
                        error_func(xhr);
                }
            }
        };
        xhr.open("GET", path, true);
        xhr.send();
    }

  }



  /////////////////////////////////////////////////////////////

    TablooAnim.prototype.rotateRow = rotateRow;
    TablooAnim.prototype.parseQueries = parseQueries;

    return TablooAnim;

  })();

  if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
    module.exports = TablooAnim;
  else
    window.TablooAnim = TablooAnim;
})();