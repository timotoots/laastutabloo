



var dataset = {};
var providers = {};
var providers_list = [];
var providers_names = [];

var master_dataset_list = [];
var master_dataset_names = [];


var provider_meta = {};

var datasets_info = [];
var datasets_states = {};

var customScripts = {"enum":[],"labels":[]};

var sortField = "provider";

///////////////////////////////////////////////////////////////////////////////

// START UP THE SCRIPT



  console.log("Dataset start");

  loadJson(scripts_url)
   .then(data => new Promise(function(resolve, reject) {
      
      customScripts = createScriptEnum(data,["converter_python","converter_sql"]);

      

      console.log(data);
      console.log("Scripts loaded.");
      resolve(true);

    }))
   .then(a => loadJson(providers_url))
   .then(data => new Promise(function(resolve, reject) {
          providers = data;
        

      for (var i = 0; i < data.length; i++) {

          // for list
          providers[data[i].id] = data[i];

          // for edit
          providers_list.push(data[i].id);
          providers_names.push(data[i].meta.name.et);
      }
      console.log("Providers loaded.");
      resolve(true);

    }))
   .then(a => loadJson(datasets_url))
   .then(datasets => new Promise(function(resolve,reject){


        for (var i = 0; i < datasets.length; i++) {


         

        if( datasets[i].id==params.id){

          dataset = datasets[i];


          
          if(typeof providers[dataset.provider] != "undefined"){
            provider_meta = providers[dataset.provider];
            // if(typeof provider_meta.wms != "undefined"){
            //   dataset.url =  provider_meta.wms.join('');
            // }
          }

          // dataset.schema = JSON.stringify(dataset.schema);


        } else {
           master_dataset_list.push(datasets[i].id);
           master_dataset_names.push(datasets[i].provider + " / " + datasets[i].id);

        }
      } // for

          console.log("Dataset loaded.");
          // console.log(dataset);
          resolve(true);

   })).then(a => new Promise(function(resolve, reject){
    if(params.id){
      create_form();
    } 
    
    pollDatasets();
    resolve();
   }))





///////////////////////////////////////////////////////////////////////////////

function pollDatasets(){

    $.getJSON(datasets_url,function(datasets) {

         for (var i = 0; i < datasets.length; i++) {

            if(datasets[i].id==params.id || !params.id){
              datasets_info[datasets[i].id] = datasets[i];
            }

         }

      for (var id in datasets_info){

        if(typeof datasets_states[id] === "undefined"){

            var pattern = /[^A-Za-z0-9\d_\d-]+/g;

            datasets_states[id] = {};
            datasets_states[id].id = id;
            datasets_states[id].div_id = id.replace(pattern, "");
            datasets_states[id].show_log = 0;
            datasets_states[id].show_tabulator = 0;

            datasets_states[id].last_log = [];

        }
        updateDatasetRow( datasets_info[id]);
        // console.log(datasets_states);

      } // for
       

        setTimeout(function(){
           pollDatasets();
        },1000);
    });

  }


///////////////////////////////////////////////////////////////////////////////////////

function updateDatasetRow(dataset){

      var dataset_id = datasets_states[dataset.id].div_id;

      var div_id = "#dataset_" + dataset_id; 

      if(!$(div_id).length){
        createDatasetRow(dataset);
      } 

        
      // addToDataGroups(div_id, "private");

      $(div_id + " .dataset_name").html( '<a href="?p=dataset&id='+ dataset.id +'" >' + dataset.id + "</a>");
      $(div_id + " .dataset_url").attr("href", dataset.url);

      //////////////////////////
      // Public-private

      if(dataset.private == true){
         // $(div_id + " .dataset_status_private").html(getIcon('locked','red','Private dataset'));
         $(div_id + " .dataset_status_private").html('<span class="glyphicon glyphicon-briefcase icon-black" aria-hidden="true" ></span>');

       //  addToDataGroups(div_id, "private");

      } else {
         $(div_id + " .dataset_status_private").html('<span class="glyphicon glyphicon-eye-open icon-transparent" aria-hidden="true" ></span>');

        // $(div_id + " .dataset_status_private").html(getIcon('unlocked','white','Public dataset'));
     //   addToDataGroups(div_id, "public");

      }

      //////////////////////////
      // Edit
      // $(div_id + " .dataset_edit_button").html('<a href="dataset_edit.html?id='+ dataset.id +'" >' + getIcon('edit','black','Edit dataset') + "</a>");

      $(div_id + " .dataset_remote_button").html('<a href="'+ dataset.url +'" >' + '<span class="glyphicon glyphicon-link icon-black" aria-hidden="true" ></span>'+ "</a>");

      if(typeof dataset.last_updated === "undefined" || dataset.last_updated=="" || dataset.last_updated==null || dataset.last_updated=="Thu, 01 Jan 1970 00:00:00 GMT"){
        $(div_id + " .dataset_updated").html("Never");
      } else {
        $(div_id + " .dataset_updated").html(timeago.format(dataset.last_updated,"custom"));
      }

      //////////////////////////
      // Updater

      var danger = 0;

      var icon_selector = div_id + " .dataset_status_updater .glyphicon";
         // console.log(dataset.status_updater)

      if(dataset.status_updater=="done"){
         $(icon_selector).removeClass("rotater");
         changeIconColor(icon_selector,"green");
      } else if(dataset.status_updater=="converting"){
       $(icon_selector).addClass("rotater");
        changeIconColor(icon_selector,"blue");
      } else if(dataset.status_updater=="failed"){
        $(icon_selector).removeClass("rotater");
        changeIconColor(icon_selector,"red");
        danger = 1;
      } else {
        // $(div_id + " .dataset_update_button").html('<a href="javascript://" id="'+dataset_id+'_updateButton"  >' + getIcon('update','yellow',dataset.status_updater) + "</a>");
        // $(div_id + " .dataset_update_button svg").removeClass("rotater");
        // console.log("updater no status");
        danger = 1;
       }

      // $('#'+dataset_id+'_updateButton').click(dataset_id,triggerUpdater);


      //////////////////////////
      // Converter

      var icon_selector = div_id + " .dataset_status_converter .glyphicon";

      if(dataset.status_converter=="done"){
         $(icon_selector).removeClass("rotater");
         changeIconColor(icon_selector,"green");
      } else if(dataset.status_converter=="running"){
         $(icon_selector).addClass("rotater");
         changeIconColor(icon_selector,"blue");
      } else if(dataset.status_converter=="failed"){
         $(icon_selector).removeClass("rotater");
         changeIconColor(icon_selector,"red");
       } else {
        // console.log("converter no status");
       }

       if(!params.id){
          if(danger==1){
            $(div_id).addClass("bg-danger");
         } else {
            $(div_id).removeClass("bg-danger");
         }
       }
       

       if(dataset.update_frequency){
             $(div_id + " .dataset_update_frequency").html(dataset.update_frequency);
      
       }

       if(dataset.data_count){
             $(div_id + " .dataset_status_rows").html(dataset.data_count + "");
      
       }
       
       if(sortField!="provider"){
           $(".provider_visible").css("display","none");
       } else {
            $(".provider_visible").css("display","");
       
       }
       var deferred = sortMeBy(sortField, ".container_rows", "div", "asc");



  } // function

  ///////////////////////////////////////////////////////////////////////////////////////

  function addToDataGroups(div_id, group){

       var groups = $(div_id).attr("data-groups");
     
        groups = JSON.parse(groups);
     
       var isElementInCurrentGroup = groups.indexOf(group) !== -1;
       if (isElementInCurrentGroup) {
          return false;
       } else {
         groups.push(group);
         $(div_id).attr("data-groups",JSON.stringify(groups));
         return true;
       }

  }

  function removeFromDataGroups(div_id, group){

       var groups = $(div_id).attr("data-groups");
     
       groups = JSON.parse(groups);
     
       var isElementInCurrentGroup = groups.indexOf(group) !== -1;
       if (isElementInCurrentGroup) {
         groups.pop(group);
         $(div_id).attr("data-groups",JSON.stringify(groups));
          return true;
       } else {
         return false;
       }

  }


///////////////////////////////////////////////////////////////////////////////

// LOG FUNCTIONS

var last_log = [];

// apiUpdateLog("aircrafts","#dataset_aircrafts .log_display");

  function apiUpdateLog(dataset_id, html_element){

    // var dataset_id = "aircrafts";
    // var html_element = "#dataset_"+dataset_id+" .log_display";


    $.getJSON(dataset_log_url+"?dataset_id="+dataset_id +"&limit=20",function(logs) {

      if($.isArray(logs)){

        logs = logs.reverse(); 

        if(logs.length>20){
          var num_lines = 20;
        } else{
          var num_lines = logs.length;
        }


        var html = [];

        // TODO: compare with last logs
        // var res = logs.filter( function(n) { return !this.has(n) }, new Set(last_log) );
        // last_log = logs;

        for (var i = 0; i < num_lines; i++) {
          if(logs[i].level=="CRITICAL"){
            var color = "red";
          } else {
             var color = "gray";
          }
          html.push("<p style='color:"+ color +";margin-bottom:0px;margin-top:0'>" + logs[i].time + " / "+ logs[i].pid + " "+ logs[i].level + " " + logs[i].message+"</p> ");
        }

        $(html_element).html(html.join("<br/>") );

      } else {

        $(html_element).html("No log found!");
        
      } 
 
      setTimeout(function(){

            if(datasets_states[dataset_id].show_log==true){
             apiUpdateLog(dataset_id,html_element);
            }
        },1000);
    });

  }

/*

  function addProvider(provider){

    // Check already have the div
     var div_id = "#provider_" + provider.id + " ";
     if($(div_id).length){
      return;
     }

    var html = [];

    html.push('<div id="provider_'+ provider.id +'" class="shuffle-row" style="width:100%">')
      html.push('<div class="row" style="padding:1rem 0rem 0rem 0rem;border-top: 1px solid black">');
        html.push('<div class="col-md-12 name" style="color:#4c4c4c"><b>'+ provider.meta.et.name +'</b></div>');
      html.push('</div>');
    html.push('</div>');

    $(".container").append( html.join("") );

  }
  */

  ///////////////////////////////////////////////////////////////////////////////////////
  // Dataset rows

  var lastProviderId = "";

    function createDatasetRow(dataset){

      provider_id = dataset.provider;

      var pattern = /[^A-Za-z0-9\d_\d-]+/g;
      var dataset_id = dataset.id.replace(pattern, "");

        // display_states[dataset.id] = {};
        // display_states[dataset.id].id = dataset.id;
        // display_states[dataset.id].div_id = "#dataset_" + dataset_id;
        // display_states[dataset.id].show_log = 0;
        // display_states[dataset.id].last_log = [];


        if(typeof providers[dataset.provider] === "undefined"){
         console.log("No provider found: " + provider_id + ", put to unsorted;");
         provider_id = "unsorted";
        } else {
          provider_id = dataset.provider;
        }

        if(provider_id != lastProviderId && !params.id){
          var provider_class = "provider_visible";
        } else {
          var provider_class = "provider_hidden";
        }
        
        lastProviderId = provider_id;


       // Check already have the div
       // var div_id = "#provider_" + provider_id + " #dataset_"+dataset_id;
       // if($(div_id).length){
       //  return;

       // }

      var html = [];

      ///////////////////////////////////
      // Side bar

      // sorting ordering
      // https://www.shift8web.ca/2017/01/use-jquery-sort-reorganize-content/

      if(params.id){

        html.push('<div id="dataset_'+ dataset_id +'">');
        html.push(`
              <ul class="nav nav-sidebar">
            <li class="dataset_status_updater"><div><b>Dataset status:</b></div></li>
            <li class="dataset_status_updater"><div><span class="glyphicon glyphicon-repeat icon-gray" aria-hidden="true"></span> Updater</div></li>
            <li class="dataset_status_converter"><div><span class="glyphicon glyphicon-refresh icon-gray" aria-hidden="true" ></span> Converter</div></li>
            <li class="dataset_status_converter"><div>Updated: <span class="dataset_updated">updated</span></div></li>
            <li class="dataset_status_converter"><div>Rows: <span class="dataset_status_rows"></span></div></li>
            </ul>

          <hr>

          <ul class="nav nav-sidebar">
            <li class="dataset_status_updater"><div><b>Actions:</b></div></li>
            <li><a href="#log_display" class="btn-save-dataset"> <span class="glyphicon glyphicon-ok icon-green" aria-hidden="true"></span> Save dataset</a></li>
            <li><a href="#log_display" class="btn-run-updater"> <span class="glyphicon glyphicon-repeat icon-blue" aria-hidden="true" ></span> Update and convert</a></li>
            <li><a href="#log_display" class="btn-run-converter"> <span class="glyphicon glyphicon-refresh icon-blue" aria-hidden="true" ></span> Convert only</a></li>
          </ul>
  
          <hr>

            
            <ul class="nav nav-sidebar">
            <li class="dataset_status_updater"><div><b>Debug:</b></div></li>

            <li><a href="#log_display" class="btn-show-log"> <span class="glyphicon glyphicon-align-left icon-black btn-show-log" aria-hidden="true"></span> Show log</a></li>
            <li><a href="#raw_display" class="btn-show-raw"> <span class="glyphicon glyphicon-arrow-right icon-black " aria-hidden="true"></span> Preview raw</a></li>
            <li><a href="#tabulator_display" class="btn-show-table"> <span class="glyphicon glyphicon-arrow-left icon-black " aria-hidden="true"></span> Preview converted</a></li>

          </ul>

        `);

        html.push('</div>');

        $("#sidebar").prepend( html.join("") );
        
        // Show log button logic
        $('#dataset_'+dataset_id+" .btn-show-log").click(dataset_id,showLogButtonHandler);
        $('#dataset_'+dataset_id+' .btn-run-updater').click(dataset_id,runUpdaterHandler);
        $('#dataset_'+dataset_id+' .btn-run-converter').click(dataset_id,runConverterHandler);
        $('#dataset_'+dataset_id+' .btn-show-table').click(dataset_id,showTabulatorHandler);
        $('#dataset_'+dataset_id+' .btn-show-raw').click(dataset_id,showRawHandler);
        $('#dataset_'+dataset_id+' .btn-save-dataset').click(dataset_id,saveButtonHandler);




      } else {
      
      ///////////////////////////////////
      // Dataset list


        html.push('<div class="col-md-12 col-sm-12 col-xs-12 shuffle-row" style="border-bottom: 0px solid black;padding:0.5rem 0 0.5rem 0; width:100%" id="dataset_'+ dataset_id +'" data-groups="[]" data-private="" data-status="" data-provider="'+ providers[provider_id].meta.name.et +'">');
    
        html.push(' <div class="col-md-12 col-sm-12 col-xs-12 '+ provider_class +'"><b class="provider_name">'+ providers[provider_id].meta.name.et +'</b> </div>');

        html.push(' <div class="col-md-4 col-sm-4 col-xs-4"><span class="dataset_status_private"></span> <span class="dataset_edit_button"></span> <span class="dataset_remote_button"></span> <b class="dataset_name">row</b> </div>');

        // html.push(' <div class="one columns"><span class="dataset_status_updater">updater</span></div>');
        html.push(' <div class="col-md-1 col-sm-1  col-xs-1"><span class="dataset_update_button"></span> <span class="dataset_updated">updated</span></div>');

        html.push(` <div class="col-md-1 col-sm-1 col-xs-1">
            <span class="dataset_status_updater"><span class="glyphicon glyphicon-repeat icon-gray" aria-hidden="true" ></span></span> 
            <span class="dataset_status_converter"><span class="glyphicon glyphicon-refresh icon-gray" aria-hidden="true" ></span></span>
          </div>`);
        html.push(' <div class="col-md-1 col-sm-1 col-xs-1"><span class="dataset_status_rows"></span></div>');
        html.push(' <div class="col-md-1 col-sm-1 col-xs-1"><span class="dataset_update_frequency">.</span></div>');
        html.push(` <div class="col-md-4 col-sm-1 col-xs-1" style="text-align:right">



          <button type="button" class="btn btn-default sidebar-btn btn-run-updater">
            <span class="glyphicon glyphicon-refresh icon-blue" aria-hidden="true"></span> Update
          </button>

          <button type="button" class="btn btn-default sidebar-btn btn-show-log">
            <span class="glyphicon glyphicon-align-left icon-black" aria-hidden="true"></span> Log
          </button>

          </div>

         <div class="col-md-12 col-sm-12 col-xs-12 log_display" style="color:black;display:none">log</div>
         <div class="col-md-12 col-sm-12 col-xs-12 raw_display" style="color:black;display:none">raw</div>
         <div class="col-md-12 col-sm-12 col-xs-12 tabulator_display" style="color:black;display:none">tabulator</div>`);

       html.push('</div>');

      // $("#provider_" + provider_id).append( html.join("") );
      $(".container_rows").append( html.join("") );

        $('#dataset_'+dataset_id+" .btn-show-log").click(dataset_id,showLogButtonHandler);
        $('#dataset_'+dataset_id+' .btn-run-updater').click(dataset_id,runUpdaterHandler);
        $('#dataset_'+dataset_id+' .btn-show-table').click(dataset_id,showTabulatorHandler);



      }

    

  } // function createDatasetRow



  ///////////////////////////////////////////////////////////////////////////////////////

function showLogButtonHandler(event, force = 0){

        console.log(event.data);

        if(!params.id){
          var selector =  content_selector = "#dataset_" + datasets_states[event.data].div_id+" .log_display";
        } else {
          var selector = ".log_display";
          var content_selector = selector + " .log_display_content";
        }

        $(selector).html();
        if(datasets_states[event.data].show_log==0 || force==1){
          datasets_states[event.data].show_log = 1;
          console.log(datasets_states[event.data]);
          apiUpdateLog(event.data, content_selector);
          $( selector).show();
        } else {
          datasets_states[event.data].show_log = 0;
          $(selector).hide();

        }


}

function showTabulatorHandler(event){

        if(!params.id){
          var selector = content_selector =  "#dataset_" + datasets_states[event.data].div_id+" .tabulator_display";
        } else {
          var selector = ".tabulator_display";
          var content_selector = selector + " .tabulator_display_content";

        }

        $(selector).html();


         if(datasets_states[event.data].show_tabulator==0 || 1==1){
          datasets_states[event.data].show_tabulator = 1;
          var url =  dataset_preview_url+"?dataset_id=" + event.data+"&limit=10";
          console.log(url);
          // url = "data_examples/tabulator_example.json";
          createTabulator(url, "", content_selector);
          $( selector).show();
        } else {
          datasets_states[event.data].show_tabulator = 0;
          //$(selector).hide();

        }

}


function showRawHandler(event){

  console.log("raw button");
  console.log(event.data);

      if(!params.id){
          var selector =  content_selector = "#dataset_" + datasets_states[event.data].div_id+" .raw_display";
        } else {
          var selector = ".raw_display";
          var content_selector = selector + " .raw_display_content";
        }

$(selector).show();
  
  var url = "http://laastutabloo.erm.ee:5000/dataset_raw?dataset_id="+event.data+"&limit=10000"
   $.getJSON( url, function( data ) {
    // console.log(data);
    $(content_selector).html("<pre>"+data+"<pre>")
    });



  //
  
}


///////////////////////////////////////////////////////////////////////////////

// FORM FUNCTIONS


function buttonViewFile(){

  // do something here...!
  var win = window.open(this.data, '_blank');
  if (win) {
      //Browser has allowed it to be opened
      win.focus();
  } else {
      //Browser has blocked it
      alert('Please allow popups for this website');
  }


}

/////////////////////////////

function buttonSave() {
    var val = $("#form1").getValue();

    if (this.isValid(true)) {
        delete val.remote_updated;
        delete val.last_updated;
        console.log("Valid value: " + JSON.stringify(val, null, "  "));

        $.ajax(backend_server + '/dataset/' + dataset.id, {
          contentType: "application/json",
          type: "POST",
          data: JSON.stringify(val)
        }).done(function( msg ) {
          console.log( "Data Saved!");
                    console.log( msg);


        });

        // this.ajaxSubmit().done(function() {
        //     alert("Posted!");
        // });
    } else {
         console.log("Invalid value: " + JSON.stringify(val, null, "  "));
    }
} // buttonSave

/////////////////////////////

    function saveButtonHandler(event){


      var control = $("#form1").alpaca("get");
      var data = control.getValue();

      delete data.remote_updated;
      delete data.last_updated;
      delete data.show_headers;
      delete data.show_zip;
      delete data.show_password;

      saveData("dataset", dataset.id, data);

    }


/////////////////////////////

function buttonPreview() {
      var val = this.getValue();
      if (this.isValid(true)) {
          delete val.remote_updated;
          delete val.last_updated;
          console.log(val);
      } else {
           console.log("Invalid value: " + JSON.stringify(val, null, "  "));
      }
  } // buttonSave



///////////////////////////////////////////////////////////////////////////////



///////////////////////////////////////////////////////////////////////////////





///////////////////////////////////////////////////////////////////////////////
// formOptionsFields




// formOptionsFields

///////////////////////////////////////////////////////////////////////////////


function create_form(){

console.log("Form loaded.");

  var formSchemaProperties = {

  "subtitle_general":{
      "type":"any", 
      "title":"Dataset source",
      "fieldOptions":{
        "fieldClass":"customSubTitle"
      }
  },


  "id": { 
      "type": "string", 
      "title": "Unique ID",
      "pattern":"^[a-z0-9_]+$",         
      "fieldOptions":{
        "disallowEmptySpaces":true
      }
  },


  "provider": { "type": "string",
      "title": "Data provider",
      "enum":providers_list,
      "fieldOptions":{
        "optionLabels": providers_names
      }
  },

  "dataset_type": {
      "type": "string",
      "title": "Dataset type",
      "default":"regular",
      "enum": ["regular","merged","joined"],
      "fieldOptions":{ 
        "optionLabels": ["Regular (download and convert)", "Merged (download and merge to similar dataset)", "Joined (create new from multiple datasets)"],
        "sort":false,
        "removeDefaultNone": true
    }
  },

  "private": {
      "type": "boolean",
      "title": "Private dataset?",
      "fieldOptions":{
        "dependencies": { "dataset_type": ["regular"] }
      }
  },

  "subtitle_download_parameters":{
      "type":"any",
      "title":"Download parameters",
      "fieldOptions":{
        "fieldClass":"customSubTitle",
        "dependencies": { "dataset_type": ["regular","merged"] }
      }
  },

  "url": {
      "type": "string",
      "title": "Remote file URL",
      "format": "uri",
      "fieldOptions":{
        "type": "url",
          "buttons": {
            "check": {
              "value": "View file",
              "click": buttonViewFile
            }
          },
       "dependencies": { "dataset_type": ["regular","merged"] }
      }
  },

  "show_password": {
      "type": "boolean",
      "title": "Password protected?",
      "fieldOptions":{
        "dependencies": { "dataset_type": ["regular"] }
      }
  },

  "username": {
      "type": "string",
      "title": "URL username",
      "fieldOptions":{     
       "dependencies": { "dataset_type": ["regular"],"show_password":true }  
      }
  },

  "password": {
      "type": "string",
      "title": "URL password",
      "fieldOptions":{     
       "dependencies": { "dataset_type": ["regular"],"show_password":true }    
      }
  },

  "show_headers": {
      "type": "boolean",
      "title": "Custom HTTP headers?",
      "fieldOptions":{
        "dependencies": { "dataset_type": ["regular"] }
      }
  },
  "http_header": {
      "type": "array",

      "items": {
            "title": "Header",
            "type": "string"
        },
      "fieldOptions":{    
        "dependencies": { "dataset_type": ["regular"],"show_headers":true }    
      }
  },

  "show_zip": {
      "type": "boolean",
      "title": "File in zip package?",
      "fieldOptions":{
        "dependencies": { "dataset_type": ["regular"] }
      }
  },

  "file_in_package": {
      "type": "string",
      "title": "Filename in zip package",
      "fieldOptions":{
         "dependencies": { "dataset_type": ["regular","merged"],"show_zip":true }  
      }
  },   


  "type": {
      "type": "string",
      "title": "File format",
      "enum": ["json", "csv", "xml", "geojson","wms","ods","shapefile"],
      "fieldOptions":{
         "dependencies": { "dataset_type": ["regular"] }  
      }
  },


  "delimiter": {
      "type": "string",
      "title": "CSV delimiter",
      "enum": ["",",","\t",";",":"],
      "fieldOptions":{
        "optionLabels": ["None","Tab","Comma (,)","Semi-colon (;)","Colon (:)"],
        "sort":false,
        "dependencies": { "type": "csv", "dataset_type": ["regular"]  }
      }
  }, 


  "converter_top_element":{
      "type":"string",
      "title":"Tree top element",
      "fieldOptions":{
        "dependencies": { "type": ["json","xml","wms"], "dataset_type": ["regular"] }
      }
  },


  "wms_layer":{
      "type":"string",
      "title":"WMS Layer name",
      "fieldOptions":{
        "dependencies": { "type": ["wms"],"dataset_type": ["regular"]  }
      }
  },

 "master_dataset": { "type": "string",
      "title": "Merge to master dataset",
      "enum":master_dataset_list,
      "fieldOptions":{
        "optionLabels": master_dataset_names,
        "dependencies": { "dataset_type": ["merged"] }
      }
  },


  "subtitle_join":{
      "type":"any",
      "title":"Join datasets",
      "fieldOptions":{
        "fieldClass":"customSubTitle",
         "dependencies": { "dataset_type": ["joined"]  }
      }
  },

 "join_1": { "type": "string",
      "title": "Dataset 1",
      "enum":master_dataset_list,
      "fieldOptions":{
        "optionLabels": master_dataset_names,
        "dependencies": { "dataset_type": ["joined"] }
      }
  },

 "join_2": { "type": "string",
      "title": "Dataset 2",
      "enum":master_dataset_list,
      "fieldOptions":{
        "optionLabels": master_dataset_names,
        "dependencies": { "dataset_type": ["joined"] }
      }
  },

  "join_field": {
      "type": "string",
      "title": "Join by field",
      "fieldOptions":{     
       "dependencies": { "dataset_type": ["joined"] }    
      }
  },

  "subtitle_content_parser":{
      "type":"any",
      "title":"Converter options",
      "fieldOptions":{
        "fieldClass":"customSubTitle",
         "dependencies": { "dataset_type": ["regular"]  }
      }
  },


  "schema":{
      "type":"array",
      "title":"Schema",

      "items": {
        "type": "object",
        "properties": {
             "column": {
                "type": "string",
                "title": "Column"
            },
            "type": {
                "type": "string",
                "enum": ["float", "int", "text","timestamp","geom"],
                "title": "Type"
            },
            "field": {
                "type": "string",
                "title": "Field"
            },
           
            "script": {
                "type": "string",
                "enum": customScripts.enum,
                "title": "Script"
            }
            
        }
    },
    "fieldOptions":{
      "type": "table",
       "helper":"Use these column names for location data: lest_x, lest_y, lat, lon, ehak",
      "items": {
      "fields": {
         "type": {
            "type": "select"
          },
          "script": {
            "type": "select",
            "optionLabels":customScripts.labels
          }
        },

      },
    "dependencies":{"dataset_type": ["regular"] }
    }
  },

  
   "script_sql": { 
      "type": "string", 
      "title": "Custom SQL script",
      "pattern":"^[a-z_.]+$",
      "fieldOptions":{
        "disallowEmptySpaces":true,
        "dependencies":{"dataset_type": ["regular"] }
      }
  },

  "subtitle_updater":{
      "type":"any",
      "title":"Updater options",
      "fieldOptions":{
        "fieldClass":"customSubTitle",
        "dependencies":{"dataset_type": ["regular","merged"] }
      }
  },



  "update_frequency":{
      "type": "string",
      "title": "Update frequency",
      "required":true,
      "enum": ["manual","minutely","hourly","daily", "weekly", "monthly","yearly","custom"],
      "fieldOptions":{
         "dependencies":{"dataset_type": ["regular","merged"] }
      }
  },     


  "cron_minutes":{
      "type": "string",
      "title": "Minutes",
      "enum":["","*",0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59],
      "fieldOptions":{
        "dependencies": { "update_frequency": ["hourly"],"dataset_type": ["regular","merged"]}
      }
  },


  "cron_hour":{
      "type": "string",
      "enum": ["","*",0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23],
      "title": "Hour",
      "fieldOptions":{
        "dependencies": { "update_frequency": ["daily"],"dataset_type": ["regular","merged"]}
      }
  },


  "cron_day_of_month":{
      "type": "string",
      "enum": ["","*",1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31],
      "title":"Day of Month",
      "fieldOptions":{
        "dependencies": { "update_frequency": ["montly"],"dataset_type": ["regular","merged"]}
      }
  },


  "cron_day_of_week":{
      "type": "string",
      "enum": ["","*","MON","TUE","WED","THU","FRI","SAT","SUN"],
      "title": "Day of Week",
      "fieldOptions":{
        "optionLabels": ["None","Every day","On Mondays","On Tuesdays","On Wednesdays","On Thursdays","On Fridays","On Saturdays","On Sundays"],
        "sort":false,
         "dependencies": { "update_frequency": ["weekly"],"dataset_type": ["regular","merged"]}
      }
  },


  "cron_month":{
       "type": "string",
       "enum": ["","*","JAN","FEB","MAR","APR","JUN","JUL","AUG","SEP","NOV","DEC"],
       "title": "Month",
      "fieldOptions":{
        "dependencies": { "update_frequency": ["yearly"],"dataset_type": ["regular","merged"]}
      }
  }, 


  "cron_custom":{
       "type": "string",
       "title": "Custom cron time",
       "default":"* * * * *",
      "fieldOptions":{
        "dependencies": { "update_frequency": ["custom"] ,"dataset_type": ["regular","merged"]}
      }
  },


  "last_updated":{
      "type": "string",
      "title": "Last updated",
      "readonly":true,
      "fieldOptions":{
        "dependencies": { "dataset_type": ["regular","merged"]}
      }
  },


  "remote_updated":{
      "type": "string",
      "title": "Remote file updated",
      "readonly":true,
      "fieldOptions":{
        "dependencies": { "dataset_type": ["regular","merged"]}
      }
  },

  "devel":{
      "type": "boolean",
      "title": "Devel version?",
      "fieldOptions":  {     
          }
  },

  "buttons_updater":{
      "type":"any",
      "title":"Testing area",
      "fieldOptions":{
        "fieldClass":"customSubTitle",
        "buttons":{
              "save":{
                  "title": '<span class="glyphicon glyphicon-ok icon-green" aria-hidden="true" ></span> Save dataset',
                  "click": saveButtonHandler
              }
              
          }
      }
  },


}; // formSchemaProperties

var formOptionsFields = {};

var dependencies = {};

  for(var key in formSchemaProperties){

    if(typeof formSchemaProperties[key].fieldOptions != "undefined"){
      formOptionsFields[key] = formSchemaProperties[key].fieldOptions;
      if(typeof formSchemaProperties[key].fieldOptions.dependencies != "undefined"){
        dependencies[key] = [];
        for(var dep_key in formSchemaProperties[key].fieldOptions.dependencies){
          dependencies[key].push(dep_key);
        }
      }
    }

  }

//  console.log(dependencies);
/*

{
              "url":["dataset_type"],
              "subtitle_download_parameters":["dataset_type"],
              "username":["dataset_type"],
              "password":["dataset_type"],
              "schema":["dataset_type"],
              "file_in_package":["dataset_type"],
              "type":["dataset_type"],
              "merge_to_dataset":["dataset_type"],
              "delimiter": ["dataset_type","type"],
              "converter_top_element": ["dataset_type","type"],
              "wms_layer":["dataset_type","type"],
              "cron_minutes":["dataset_type","update_frequency"],
              "cron_hour":["dataset_type","update_frequency"],
              "cron_day_of_month":["dataset_type","update_frequency"],
              "cron_day_of_week":["dataset_type","update_frequency"],
              "cron_month":["dataset_type","update_frequency"] ,
              "cron_custom":  ["dataset_type","update_frequency"]         
          }

          */

  if(dataset.password == "false" ){
    dataset.password = "";
  }  
  if(dataset.username == "false" ){
    dataset.username = "";
  }  


  if(dataset.username || dataset.password ){
    dataset.show_password = true;
  }

  if(dataset.http_header  ){
    dataset.show_headers = true;
  }  

  if(dataset.file_in_package ){
    dataset.show_zip = true;
  }  



  $("#form1").alpaca({
      "data": dataset,
      "schema": {
          "type": "object",
          "properties": formSchemaProperties,
          "dependencies": dependencies
      }, 
      "options": {
        "fields":formOptionsFields,
        "form":{
          "buttons":{
              
          }
        }
        }
  });

  } // create_form
