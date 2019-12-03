
var texts = {};


///////////////////////////////////////////////////////////////////////////////

// START UP THE SCRIPT

  console.log("Text start");

  loadJson(text_url)
   .then(data => new Promise(function(resolve, reject) {
      

      for (var i = 0; i < data.length; i++) {

          // for list
          texts[data[i].id] = data[i];

          if( (params.id && params.id == data[i].provider_id) || !params.id ){
            createListRow(data[i]);
          }

      }

      console.log("Providers loaded.");

      if(params.id){
        create_form();
        if(params.id!="new"){
          createListRow(texts[params.id]);
        }
        resolve(true);
      } else {

        reject("List page, no form needed");
      }

    }))
    .catch( error =>  console.log(error) );


/////////////////////////////////////////////////////////

// CREATE A LIST OR SIDEBAR

    function createListRow(rowdata){

        // Check already have the div
       var div_id = "#datarow_" + rowdata.id;
       if($(div_id).length){
        return;
       }

  
      ///////////////////////////////////
      // Side bar

      if(params.id){

        var html = `
          <div id="datarow_`+ rowdata.id +`">
              <ul class="nav nav-sidebar">
            <li class="dataset_status_updater"><div><b>Query status:</b></div></li>
            <li class="dataset_status_converter"><div>Updated: <span class="dataset_updated">updated</span></div></li>
            <li class="dataset_status_converter"><div>Rows: <span class="dataset_status_rows"></span></div></li>
            </ul>

          <hr>

          <ul class="nav nav-sidebar">
            <li class="dataset_status_updater"><div><b>Actions:</b></div></li>
            <li><a href="#"> <span class="glyphicon glyphicon-ok icon-green" aria-hidden="true"></span> Save query</a></li>
          </ul>
  
          <hr>

            
            <ul class="nav nav-sidebar">
            <li class="dataset_status_updater"><div><b>Debug:</b></div></li>

            <li><a href="#log_display" class="btn-show-log"> <span class="glyphicon glyphicon-align-left icon-black btn-show-log" aria-hidden="true"></span> Show log</a></li>
            <li><a href="#tabulator_display" class="btn-show-table"> <span class="glyphicon glyphicon-arrow-right icon-black " aria-hidden="true"></span> Preview as table</a></li>
            <li><a href="#taboo_display" class="btn-show-tabloo"> <span class="glyphicon glyphicon-arrow-right icon-black " aria-hidden="true"></span> Preview design</a></li>
            <li><a href="#map" class="btn-show-map"> <span class="glyphicon glyphicon-arrow-left icon-black " aria-hidden="true"></span> Preview map</a></li>

          </ul>
        </div>
        `;

       // $("#sidebar").prepend(html);
        

      } else {
      
      ///////////////////////////////////
      // List

        if(!rowdata.meta.title.et){
          rowdata.meta.title = {"et" : "no name!!"};
        }

        var html = `

          <div class="row" style="border-bottom: 0px solid black;padding:0.5rem 0 0.5rem 0; width:100%" id="datarow_`+ rowdata.id +`">

              <div class="col-md-6 col-sm-6 col-xs-6"><b> <a href="?p=provider&id=`+ rowdata.id +`" >` + rowdata.meta.title.et + `</a></b></div>

              <div class="col-md-2 col-sm-2  col-xs-2"><span class="dataset_update_button"></span> <span>`+ rowdata.id +`</span></div>

                <div class="col-md-4 col-sm-1 col-xs-1" style="text-align:right">

             

          </div>
          </div>
        `;

    
      $(".container").append(html );


      }


  } // function createListRow




//////////////////////////////////////////////////////////

// ALPACA FORM 

// Handlers

function saveButtonHandler(event){


  var control = $("#form1").alpaca("get");
  var data = control.getValue();

  data.meta = {};

  data.meta.title = data.title;
  delete data.title;

  data.meta.content = data.content;
  delete data.content;

  saveData("text", data.id, data);

}

// Form schema

function create_form(){

    console.log("Form loaded.");
    
    var formSchemaProperties = {


      "id": { 
          "type": "string",
          "title": "Unique ID",
          "pattern":"^[a-z]+$",
          "fieldOptions":{
            "disallowEmptySpaces":true,
          }
      },

      "title":{
        "type":"object",
        "title":"Title",
        "properties": form_lang_choices,
        "fieldOptions":{
          "helper":""
        }
      },

      "content":{
        "type":"object",
        "title":"Description",
        "properties": form_lang_choices,
        "fieldOptions":{
          "fields":form_lang_textarea,
          "helper":"Short text"
        }
      },

      "buttons_updater":{
      "type":"any",
      "title":"",
      "fieldOptions":{
        "fieldClass":"customSubTitle",
        "buttons":{
              "save":{
                  "title": '<span class="glyphicon glyphicon-ok icon-green" aria-hidden="true"></span> Save',
                  "click": saveButtonHandler
              }
              
          }
      }
  }

  };

// Restructure form data for alapaca

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


// Create form

  $("#form1").alpaca({
    "data": providers[params.id],
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
      },   
       "postRender": postRender

  });

  // 

  function postRender(control) {

  }

} // create_form

