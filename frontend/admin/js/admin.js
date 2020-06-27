
/////////////////////////////////////////////////////////////////////////////////////

// Laastutabloo Ohjur common functions

/////////////////////////////////////////////////////////////////////////////////////

// URLs

var backend_server = "http://laastutabloo.erm.ee:5000";

// Live version
var datasets_url = backend_server + "/datasets";
var providers_url = backend_server + "/list_providers";
var dataset_log_url = backend_server + "/get_log";
var dataset_preview_url = backend_server + "/dataset_preview";

var queries_url = backend_server + "/list_queries";

var scripts_url = backend_server + "/scripts";

var text_url = backend_server + "/get_text";

var query_preview_url = render_query = backend_server + "/render_query"; //?query_id=avalik&ehak=1234

var save_query_url = backend_server + "/query";


var form_lang_choices = {
  "et":{
    "type":"string",
    "title":"Estonian"
    },
    "en":{
    "type":"string",
    "title":"English"
    },
    "ru":{
    "type":"string",
    "title":"Russian"
    }
};

var form_lang_textarea = {
    "et":{
        "type":"textarea",
    },"en":{
        "type":"textarea",
    },"ru":{
        "type":"textarea",
    }
}



// Testing version
// var datasets_url = "http://laastutabloo.erm.ee/admin/js/datasets_example.json";
// var providers_url = "http://laastutabloo.erm.ee/admin/js/providers_example.json";

var server = "http://laastutabloo.erm.ee";


function loadJS(file) {
    // DOM: Create the script element
    var jsElm = document.createElement("script");
    // set the type attribute
    jsElm.type = "application/javascript";
    // make the script element load file
    jsElm.src = file;
    // finally insert the element to the body element in order to load the script
    document.body.appendChild(jsElm);
}


function createScriptEnum(scripts, types){

  var out = {"enum":[],"labels":[]};
  var t = {};

  // Prepare for easier checking
  for(var i in types){
    t[types[i]] = true;
  }

  for(var i in scripts){
    if(t[scripts[i].type]){
      out.enum.push(scripts[i].id);
      out.labels.push(scripts[i].id);
    }
  }

  return out;
   
}




/////////////////////////////////////////////////////////////////////////////////////

// Icons 

var icons = {};

icons.unlocked = '<svg role="img" xmlns="http://www.w3.org/2000/svg" width="48px" height="48px" viewBox="0 0 24 24" aria-labelledby="lockAltOpenIconTitle lockAltOpenIconDesc" stroke="#000000" stroke-width="1" stroke-linecap="square" stroke-linejoin="miter" fill="none" color="#000000"><path d="M7,7.625 L7,7 C7,4.23857625 9.23857625,2 12,2 L12,2 C14.7614237,2 17,4.23857625 17,7 L17,11"/> <rect width="14" height="10" x="5" y="11"/> <circle cx="12" cy="16" r="1"/> </svg>';

icons.locked = '<svg role="img" xmlns="http://www.w3.org/2000/svg" width="48px" height="48px" viewBox="0 0 24 24" aria-labelledby="lockAltIconTitle lockAltIconDesc" stroke="#000000" stroke-width="1" stroke-linecap="square" stroke-linejoin="miter" fill="none" color="#000000">  <rect width="14" height="10" x="5" y="11"/> <path d="M12,3 L12,3 C14.7614237,3 17,5.23857625 17,8 L17,11 L7,11 L7,8 C7,5.23857625 9.23857625,3 12,3 Z"/> <circle cx="12" cy="16" r="1"/> </svg>';

icons.edit = '<svg role="img" xmlns="http://www.w3.org/2000/svg" width="48px" height="48px" viewBox="0 0 24 24" aria-labelledby="settingsIconTitle settingsIconDesc" stroke="#000000" stroke-width="1" stroke-linecap="square" stroke-linejoin="miter" fill="none" color="#000000"> <path d="M5.03506429,12.7050339 C5.01187484,12.4731696 5,12.2379716 5,12 C5,11.7620284 5.01187484,11.5268304 5.03506429,11.2949661 L3.20577137,9.23205081 L5.20577137,5.76794919 L7.9069713,6.32070904 C8.28729123,6.0461342 8.69629298,5.80882212 9.12862533,5.61412402 L10,3 L14,3 L14.8713747,5.61412402 C15.303707,5.80882212 15.7127088,6.0461342 16.0930287,6.32070904 L18.7942286,5.76794919 L20.7942286,9.23205081 L18.9649357,11.2949661 C18.9881252,11.5268304 19,11.7620284 19,12 C19,12.2379716 18.9881252,12.4731696 18.9649357,12.7050339 L20.7942286,14.7679492 L18.7942286,18.2320508 L16.0930287,17.679291 C15.7127088,17.9538658 15.303707,18.1911779 14.8713747,18.385876 L14,21 L10,21 L9.12862533,18.385876 C8.69629298,18.1911779 8.28729123,17.9538658 7.9069713,17.679291 L5.20577137,18.2320508 L3.20577137,14.7679492 L5.03506429,12.7050339 Z"/> <circle cx="12" cy="12" r="1"/> </svg>';

icons.remote = '<svg role="img" xmlns="http://www.w3.org/2000/svg" width="48px" height="48px" viewBox="0 0 24 24" aria-labelledby="downloadIconTitle downloadIconDesc" stroke="#000000" stroke-width="1" stroke-linecap="square" stroke-linejoin="miter" fill="none" color="#000000">  <path d="M12,3 L12,16"/> <polyline points="7 12 12 17 17 12"/> <path d="M20,21 L4,21"/> </svg>';

icons.update = '<svg role="img" xmlns="http://www.w3.org/2000/svg" width="48px" height="48px" viewBox="0 0 24 24" aria-labelledby="rotateIconTitle rotateIconDesc" stroke="#000000" stroke-width="1" stroke-linecap="square" stroke-linejoin="miter" fill="none" color="#000000">  <path d="M22 12l-3 3-3-3"/> <path d="M2 12l3-3 3 3"/> <path d="M19.016 14v-1.95A7.05 7.05 0 0 0 8 6.22"/> <path d="M16.016 17.845A7.05 7.05 0 0 1 5 12.015V10"/> <path stroke-linecap="round" d="M5 10V9"/> <path stroke-linecap="round" d="M19 15v-1"/> </svg>';

icons.converter = '<svg role="img" xmlns="http://www.w3.org/2000/svg" width="48px" height="48px" viewBox="0 0 24 24" aria-labelledby="shuffleIconTitle shuffleIconDesc" stroke="#000000" stroke-width="1" stroke-linecap="square" stroke-linejoin="miter" fill="none" color="#000000"> <path d="M21,8 L17.7707324,8 C15.816391,8 13.9845112,8.95183403 12.8610966,10.5510181 L10.7972528,13.4889058 C9.67383811,15.0880899 7.84195835,16.0399239 5.88761696,16.0399239 L2,16.0399239"/> <path d="M21,16.0399239 L17.7707324,16.0399239 C15.816391,16.0399239 13.9845112,15.0880899 12.8610966,13.4889058 L10.7972528,10.5510181 C9.67383811,8.95183403 7.84195835,8 5.88761696,8 L3,8"/> <polyline points="20 6 22 8 20 10 20 10"/> <polyline points="20 14 22 16 20 18 20 18"/> </svg>';


/////////////////////////////////////////////////////////////////////////////////////

// Colorful icons

function getIcon(id,color,tooltip){

  if(color == "red"){
    color = "red";
  } else if(color == "green"){
    color = "#2cff00";
  }

  var icon = icons[id].replace("#000000",color);
  icon = icon.replace("<svg","<span title='"+ tooltip +"'><svg class='svg_icons'");
  icon = icon.replace("</svg>","</svg></span>");

  return icon;

} // function


/////////////////////////////////////////////////////////////////////////////////////

  function testApiCall(endpoint, data){

    $.getJSON(backend_server + "/" + endpoint,function(returned_data) {

      console.log(returned_data);

    });

  }

/////////////////////////////////////////////////////////////////////////////////////

function runConverterHandler(clickHandler){

  runUpdaterHandler(clickHandler,1);
  showLogButtonHandler(clickHandler,1);

}

/////////////////////////////////////////////////////////////////////////////////////

function runUpdaterHandler(clickHandler, convert_only = 0){

  var dataset_id = clickHandler.data;

  var url = backend_server + "/run_updater?dataset_id=" + dataset_id;

  if(convert_only){
   url += "&convert_only=1";
  } 

    $.getJSON(url,function(returned_data) {

      console.log(returned_data);

    });
  

}

/////////////////////////////////////////////////////////////////////////////////////

function create_header(){

  var html = [];
  html.push('<img src="images/logo.png" style="width: 80%;"/>');

  $("#header").html(html);

}

function getFormData($form){
    var unindexed_array = $form.serializeArray();
    var indexed_array = {};

    $.map(unindexed_array, function(n, i){
        indexed_array[n['name']] = n['value'];
    });

    return indexed_array;
}


function changeIconColor(element, color){

  if($(element).hasClass("icon-"+color)){
    return true;
  } else {
      // remove styles
     $(element).removeClass("icon-black");
     $(element).removeClass("icon-gray");
     $(element).removeClass("icon-blue");
     $(element).removeClass("icon-green");
     $(element).removeClass("icon-red");
     $(element).removeClass("icon-transparent");

     $(element).addClass("icon-"+color);

  }
 

  


}

var table ;

function createTabulator(url, data, element){

  // Create table if not exists

  if(!$(element+" .tabulator-tableHolder").length){

    // $(element).html('<div class="tabulator"></table>');

      table = new Tabulator(element, {
  
      height:205, // set height of table (in CSS or here), this enables the Virtual DOM and improves render speed dramatically (can be any valid css height value)
      // data:tabledata, //assign data to table
      // layout:"fitColumns", //fit columns to width of table (optional)
      // columns:[ //Define Table Columns
       //   {title:"Name", field:"name", width:150},
       //   {title:"Age", field:"age", align:"left", formatter:"progress"},
       //   {title:"Favourite Color", field:"col"},
       //   {title:"Date Of Birth", field:"dob", sorter:"date", align:"center"},
      // ],
      autoColumns:true,
      rowClick:function(e, row){ //trigger an alert message when the row is clicked
        alert("Row " + row.getData().id + " Clicked!!!!");
      },
    });

  }

    table.setData(url, data);

    var colDefs = table.getColumnDefinitions() //get column definition array

    console.log(colDefs);

    table.setColumns(colDefs) //overwrite existing columns with new columns definition array

}


/////////////////////////////////////////////////////////////////////////////////////

// URI Params

var uri = new URI();
params = uri.search(true);

/////////////////////////////////////////////////////////////////////////////////////

// Human readable time ago

var locale = function(number, index, total_sec) {
  // number: the timeago / timein number;
  // index: the index of array below;
  // total_sec: total seconds between date to be formatted and today's date;
  return [
    ['now!', 'right now'],
    ['%ss', '%s seconds'],
    ['1m', '1 minute'],
    ['%sm', '%s minutes'],
    ['1h', '1 hour'],
    ['%sh', '%s hours'],
    ['1d', '1 day'],
    ['%sd', '%s days'],
    ['1w', '1 week'],
    ['%sw', '%s weeks'],
    ['1month', '1 month'],
    ['%smonths', '%s months'],
    ['1y', '1 year'],
    ['%sy', '%s years']
  ][index];
};
timeago.register('custom', locale);

    // ['just now', 'right now'],
    // ['%s seconds ago', '%s seconds'],
    // ['1 minute ago', '1 minute'],
    // ['%s minutes ago', '%s minutes'],
    // ['1 hour ago', '1 hour'],
    // ['%s hours ago', '%s hours'],
    // ['1 day ago', '1 day'],
    // ['%s days ago', '%s days'],
    // ['1 week ago', '1 week'],
    // ['%s weeks ago', '%s weeks'],
    // ['1 month ago', '1 month'],
    // ['%s months ago', '%s months'],
    // ['1 year ago', '1 year'],
    // ['%s years ago', '%s years']


/////////////////////////////////////////////////////////////////////////////////////

// Load specific scripts

function loadJson(url) {
  return fetch(url)
    .then(response => response.json());
}


function loadHtmlWithScript(page){

  var url = "html/" + page + ".html"

    $.ajax({url: url,
        type: 'GET',
        async: true,
        success: function (result) {


        $("body").append(result);

         if(page=="query_edit" || page=="explorer") {
            // loadJS("../lib/bundle.min.js");
            loadJS("../js/lib_animator.js");
            
          }
        if(page=="dataset_list" || page=="dataset_edit"){
          loadJS("js/dataset.js");
        } else if(page=="provider_list" || page=="provider_edit"){
          loadJS("js/provider.js");
        } else if(page=="script_list" || page=="script_edit"){
          loadJS("js/script.js");
        } else if(page=="text_list" || page=="text_edit"){
          loadJS("js/text.js");
        } else if(page=="query_list" || page=="query_edit"){
          loadJS("js/query.js");

         

        } else if(page != "404"){
          loadJS("js/" + page + ".js");
        }

        

        if(page=="explorer"){
          setTimeout(function(){
            loadJS("js/emulator.js");
          },1000);
          
        }
   }});

}

$( document ).ready(function() {

  var page = "404";

  if(typeof params.p==="undefined"){
    page = "front_page"
  } if(params.p=="shufflejs"){
    page = "../devel/" + params.p;

  } if(params.p=="help" || params.p=="explorer"){
    page = params.p;

  } else if ( params.p=="dataset" || params.p=="query" || params.p=="provider" || params.p=="script" || params.p=="text"){

    if(typeof params.id === "undefined"){
       page = params.p + "_list";
    } else {
       page = params.p + "_edit";
    }

  } 

    loadHtmlWithScript(page); 


});



/////////////////////////////////////////////////////////////////////////////////////

    function saveData(type, id, data){

      if(type!="query" && type!="dataset" && type!="provider" && type!="script" && type!="text"){
        console.log("No such type as " + type);
        return false;
      } 

      var url = backend_server + "/" + type + "/" + id;
      
      console.log("Save query:");
      console.log(data);

      $.ajax(url, {
        contentType: "application/json",
        type: "POST",
        data: JSON.stringify(data)
      }).done(function(msg) {
        console.log("Data Saved!");
        console.log(msg);
      });


    } // function saveData


/////////////////////////////////////////////////////////////////////////////////////

function sortMeBy(arg, sel, elem, order) {
        arg = "data-" + arg;
        var $selector = $(sel),
        $element = $selector.children(elem);
        $element.sort(function(a, b) {
                var an = a.getAttribute(arg)
                bn = b.getAttribute(arg)
                if (order == "asc") {
                        if (an > bn)
                        return 1;
                        if (an < bn)
                        return -1;
                } else if (order == "desc") {
                        if (an < bn)
                        return 1;
                        if (an > bn)
                        return -1;
                }
                return 0;
        });
        $element.detach().appendTo($selector);
}

