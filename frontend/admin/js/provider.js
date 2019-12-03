
var providers = {};


///////////////////////////////////////////////////////////////////////////////

// START UP THE SCRIPT

  console.log("Provider start");

  loadJson(providers_url)
   .then(data => new Promise(function(resolve, reject) {
      

      for (var i = 0; i < data.length; i++) {




        

          // for list
          providers[data[i].id] = data[i];

          if( (params.id && params.id == data[i].provider_id) || !params.id ){
            createListRow(data[i]);
          }

      }

      console.log("Providers loaded.");

      if(params.id){
        create_form();
        if(params.id!="new"){
          createListRow(providers[params.id]);
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

        if(!rowdata.meta.name.et){
          rowdata.meta.name.et = {"et" : "no name!!"};
        }

        var html = `

          <div class="row" style="border-bottom: 0px solid black;padding:0.5rem 0 0.5rem 0; width:100%" id="datarow_`+ rowdata.id +`">

              <div class="col-md-6 col-sm-6 col-xs-6"><b> <a href="?p=provider&id=`+ rowdata.id +`" >` + rowdata.meta.name.et + `</a></b></div>

              <div class="col-md-4 col-sm-4  col-xs-4"><span class="dataset_update_button"></span> <span>`+ rowdata.id +`</span></div>

                <div class="col-md-2 col-sm-2 col-xs-2" style="text-align:right">

              <a href="`+ rowdata.meta.url +`"><button type="button" class="btn btn-default sidebar-btn btn-button1">
                <span class="glyphicon glyphicon-align-left icon-black" aria-hidden="true"></span> Website
              </button></a>

          </div>
          </div>
        `;    

      $(".container").append(html );
      $('#datarow_' + rowdata.id+' .btn-button1').click(rowdata.url,button1Handler);

      }


  } // function createListRow

  function button1Handler(event){

      console.log(event);

  }


//////////////////////////////////////////////////////////

// ALPACA FORM 

// Handlers

function saveButtonHandler(event){


  var control = $("#form1").alpaca("get");
  var data = control.getValue();

  data.meta = {};
  data.meta_internal = {};

  data.meta.name = data.name;
  delete data.name;

  data.meta.show_public = data.show_public;
  delete data.show_public;

  data.meta.description = data.description;
  delete data.description;

  data.meta.url = data.url;
  delete data.url;

  data.meta_internal.contact_person = data.contact_person;
  delete data.contact_person;

  data.meta_internal.notes = data.notes;
  delete data.notes;

  data.wms = {}
  if(data.show_wms){

    if(data.wms_capabilities_url){
        data.wms.capabilities_url = data.wms_capabilities_url;
        delete data.wms_capabilities_url;
    }
    if(data.wms_request_url){
        data.wms.request_url = data.wms_request_url;
        delete data.wms_request_url;
    }
    delete data.show_wms;
  }

  saveData("provider", data.id, data);

}

// Form schema

function create_form(){

    console.log("Form loaded.");
    
    var formSchemaProperties = {

      "subtitle_general":{
          "type":"any", 
          "title":"Basic info",
          "fieldOptions":{
            "fieldClass":"customSubTitle"
          }
      },

      "id": { 
          "type": "string",
          "title": "Unique ID",
          "pattern":"^[a-z_-]+$",
          "fieldOptions":{
            "disallowEmptySpaces":true,
          }
      },

      "url": { 
          "type": "string",
          "title": "Website address URL",
          "helper":"Should start with https:// or http://",
          "fieldOptions":{
            "disallowEmptySpaces":true,
          }
      },
 
       "show_wms": {
          "type": "boolean",
          "title": "Is a WMS service?",
          "fieldOptions":{}
      },  
       "wms_capabilities_url": { 
          "type": "string",
          "title": "WMS Get capabilities URL",
          "helper":"WMS Get capabilities",
          "fieldOptions":{
            "type":"textarea",
             "dependencies": { "show_wms": true },
            "disallowEmptySpaces":true,
          }
      },
      "wms_request_url": { 
          "type": "string",
          "title": "WMS request URL",
          "helper":"If is set, it will be used on all datasets for this provider.",
          "fieldOptions":{
            "type":"textarea",
             "dependencies": { "show_wms": true },
            "disallowEmptySpaces":true,
          }
      },


      "subtitle_public_info":{
          "type":"any", 
          "title":"Public info",
          "fieldOptions":{
            "fieldClass":"customSubTitle"
          }
      },
       "show_public": {
          "type": "boolean",
          "title": "Show on the website?",
          "fieldOptions":{}
      },
      "name":{
        "type":"object",
        "title":"Name",
        "properties": form_lang_choices,
        "fieldOptions":{
          "helper":"Name of the provider"
        }
      },

      "description":{
        "type":"object",
        "title":"Description",
        "properties": form_lang_choices,
        "fieldOptions":{
          "fields":form_lang_textarea,
          "helper":"Short text about the data provider"
        }
      },

     "subtitle_internal_info":{
          "type":"any", 
          "title":"Internal info",
          "fieldOptions":{
            "fieldClass":"customSubTitle"
          }
      },
    
      "contact_person": { 
          "type": "string",
          "title": "Contact person",
          "helper":"Name, phone number, e-mail of the person",
          "fieldOptions":{
            "type":"textarea",
            
          }
      },

      "notes": {
          "type": "string",
          "title": "Notes",
          "helper":"Anything important",
          "fieldOptions":{
            "type":"textarea",
           
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


  if(params.id!="new"){
    

  var form_data = providers[params.id];

  if(form_data.meta){
    form_data.name = form_data.meta.name;
    form_data.description =  form_data.meta.description
    form_data.url = form_data.meta.url
    form_data.show_public = form_data.meta.show_public;
    delete form_data.meta;
  }
  if(form_data.meta_internal){
    form_data.contact_person = form_data.meta_internal.contact_person
    form_data.notes = form_data.meta_internal.notes
    delete form_data.meta_internal;
  }

  form_data.show_wms = false;

  if(form_data.wms){


    if(form_data.wms.capabilities_url){
      form_data.wms_capabilities_url = form_data.wms.capabilities_url
      delete form_data.wms.capabilities_url;
      form_data.show_wms = true;
    }
    if(form_data.wms.request_url){
      form_data.wms_request_url = form_data.wms.request_url
      delete form_data.wms.request_url;
      form_data.show_wms = true;
    }   
    

  }


  }

// Create form

  $("#form1").alpaca({
    "data": form_data,
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

