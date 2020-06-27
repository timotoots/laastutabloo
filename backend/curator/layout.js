///////////////////////////////////////////////////////////////////////////
//
//  LAYOUT library - creates string tables based on data
// 
//
//
///////////////////////////////////////////////////////////////////////////


(function() {
  var Layout= (function() {

    var params = {
      laastX: 27, // number of shingles X
      laastY: 12 // number of shingles Y
    };

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
    var Layout = function(options) {
      console.log("Loaded Layout!");
      allowedLetters = options.allowedLetters;
      bigfont = options.bigfont;

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


    var headerLine = "".centerJustify(params.laastX,"*");


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
                  slide.lines[y] = setCharAt(slide.lines[y],x," ");
                }
              } // for
          }

        } // for

    }

    return slide;

  } // function


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

function forceWrap( str, width ) {

    if (!str) { return [str]; }

    width = width || 75;
    cut = true
    var regex =   '.{1,' + width + '}(\s|$)' + (cut ? '|.{' +width+ '}|.+$' : '|\S+?(\s|$)');
    return str.match( RegExp(regex, 'g') );
 
}

///////////////////////////////////////////////////////////////

function wordWrap(input, size){

  //https://github.com/gajus/table/blob/master/src/wrapWord.js

 let subject;

  subject = input;

  const chunks = [];

  // https://regex101.com/r/gY5kZ1/1
  const re = new RegExp('(^.{1,' + size + '}(\\s+|$))|(^.{1,' + (size - 1) + '}(\\\\|/|_|\\.|,|;|-))');

  do {
    let chunk;

    chunk = subject.match(re);

    if (chunk) {
      chunk = chunk[0];

      // subject = slice(subject, chuck.length);
      subject = subject.substr(chunk.length)

      chunk = chunk.trim();
    } else {
      // chunk = slice(subject, 0, size);
      // subject = slice(subject, size);

      chunk = subject.substr(0, size)
      subject = subject.substr(size)
    }

    chunks.push(chunk);
  } while (subject.length);

  return chunks;


}

///////////////////////////////////////////////////////////////

function formatText(str, width, height){

  //////////////////////

  // Prepare the text

  str.toString();

  if (!str) { return [str]; }

  try{

    // remove newlines
    str = str.replace(/[\r\n]+/g, ' ')
    // remove double spaces
    str = str.replace(/ +(?= )/g,'');
  } catch(e){
    console.log("string error:" + str)
    return [""];
  }

  if(str.length==0){
    return [""];
  }


  // Check if wrapping is nessecary

  if (str.length < width){
    return [str];
  }
  // console.log(str);

  // Check if nice wrapping works
  // str = wordwrap(str,width, false);
  str = wordWrap(str, width)

  console.log(str);
  return str;

 ///// todo
  if(str){
    if(str.length <= height){
      return str;
    }
  } 


  // Force wrapping
  str = forceWrap(str,width);
  return str;

}


///////////////////////////////////////////////////////////////

  function formatToTable(query){

     var conf = query.config;

     conf.column_widths = [27];
     conf.spaces = 1;
     conf.table_template = "table_2x2";
     // conf.columns = [
     //    {
     //      "name": "time"
     //    },

     //    {
     //      "name": "syndmus_liik"
     //    },
        
     // ];

     console.log(conf);

     var templates = {
      "table_2x2": 
      [
          [1],
          [1],
          [2],
          [2],
          [2],
          [3],
          [3]
      ],

    
     }

     var t = templates[conf.table_template];

     /////////////

     var slotConf = {};
     for (var y = 0; y < t.length; y++) {
       for (var x = 0; x < t[0].length; x++) {
          if(t[y][x]!=0){
            if(!slotConf[t[y][x]]){
              slotConf[t[y][x]] = {"lines":1,"width":conf.column_widths[x]};
            } else {
              slotConf[t[y][x]].lines++;
            }
          }
        }
     }

    // console.log("slotConf:");
    // console.log(slotConf);

    /////////////

     function createEmptyMatrix(template, widths){

      var emptyTableMatrix = []; 

       for (var y = 0; y < template.length; y++) {
              emptyTableMatrix.push([]);
             for (var x = 0; x < template[0].length; x++) {
                emptyTableMatrix[y].push("");
              }
           }
        return emptyTableMatrix;

     }
  

  /////////////
   

     function addToTemplate(slot, lines){

        var slotCount = 0;

       // console.log(lines);

        for (var y = 0; y < t.length; y++) {
         for (var x = 0; x < t[0].length; x++) {
         
         
              if(t[y][x]==slot){
                if(lines[slotCount]){
                  tableMatrix[y][x] = lines[slotCount];
                }
                slotCount++;
              }         
           }
        }

         // console.log(tableMatrix);
     } // addToTemplate

     function removeEmptyRows(template){

      // console.log(template);

        for (var y = 0; y < template.length; y++) {
          var emptyCount = 0;
         for (var x = 0; x < template[y].length; x++) {
          if(template[y][x]==""){
            emptyCount++;
          }
         }
         if(emptyCount==template[y].length){
          delete template[y];
         }
       }
       template = template.filter(function(){return true;});
       return template;

     }

     /*
     addToTemplate(1,["1A"]);
     addToTemplate(2,["2A","2B"])
     console.log(tableMatrix);
     */




     var table_data = [];


    for (var i = 0; i < query.data.length; i++) {

      var tableMatrix  = createEmptyMatrix(t,conf.column_widths);

      for (var slot_i = 1 ;slot_i <= query.config.columns.length; slot_i++){


        var column = query.config.columns[slot_i-1];

        if(typeof query.data[i][column.name] === "object"){
          var str = query.data[i][column.name]["et"];
        } else if(typeof query.data[i][column.name] != "undefined"){
          var str = query.data[i][column.name];
        } else {
          var str ="";
        }

        if(slotConf[slot_i]){
          var lines = formatText(str,slotConf[slot_i].width,slotConf[slot_i].lines);
        addToTemplate(slot_i, lines);           
        }
    

      } // for column config
      

      //table_data.push(table_row);
      // console.log(tableMatrix);
     tableMatrix = removeEmptyRows(tableMatrix);
        // console.log(tableMatrix);

      for (var tableMatrix_i = 0; tableMatrix_i < tableMatrix.length; tableMatrix_i++) {
          str = tableMatrix[tableMatrix_i].join("");
          str = str.toString();
          str = str.centerJustify(params.laastX," ");
          table_data.push(str)
      }
          table_data.push("===ROW==")

    } // for data

       // console.log(table_data);

        return table_data;


  }

///////////////////////////////////////////////////////////////
/*
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

*/

///////////////////////////////////////////////////////////////

function splitPages(lines){

  var pages = [];
  var currentPage = 0;
  var currentElementLines = [];

  pages[currentPage] = [];

  for (var i = 0; i < lines.length; i++) {



    // If element ends
    if(lines[i]=="===ROW=="){
      
      if(pages[currentPage].length + currentElementLines.length > 9){

         for(var j=0; j< 9 - pages[currentPage].length;j++){
          pages[currentPage].push("".centerJustify(params.laastX," "));
        }

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
      
      


        newSlides.push(createTimeSlide());
     // newSlides.push(createAnimationLibarySlide("jasper1"));

     // newSlides.push(createEmoticonSlide());

      for(var query_id in queries.queries){

        // Query metadata
        // queries.queries[query_id] = countQueryColumn(queries.queries[query_id]);
         queries.queries[query_id].data = queries.queries[query_id].data.splice(0,30);

        var query = queries.queries[query_id];
        var queryTitle  = formatSlideTitle(query.config.name);

        // Format data
        var lines = formatToTable(query);
        var pages = splitPages(lines);

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

        var max_pages = pages.length;
        if (pages.length>2){
          max_pages = 2;
        }

        for (var i = 0; i < max_pages; i++) {

            var slideLines = [];

            slideLines.push(districtHeaders["et"]);
            slideLines.push(queryTitle["et"]);
            slideLines.push(headerLine);
            slideLines = slideLines.concat(pages[i]);
            newSlides.push({"lines":slideLines});

        } // for pages

      }

      console.log(newSlides);

       for(var i in newSlides){
          newSlides[i] = cleanSlide(newSlides[i]);
       }

      return newSlides;

}


///////////////////////////////////////////////////////////////

    Layout.prototype.createSlides = createSlides;

    return Layout;

  })();

  if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
    module.exports = Layout;
  else
    window.Layout = Layout;
})();