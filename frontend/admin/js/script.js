
var scripts = {};


///////////////////////////////////////////////////////////////////////////////

// START UP THE SCRIPT

  console.log("Script start");

  loadJson(scripts_url)
   .then(data => new Promise(function(resolve, reject) {
      

      for (var i = 0; i < data.length; i++) {

          // for list
          scripts[data[i].id] = data[i];

          if( (params.id && params.id == data[i].script_id) || !params.id ){
            createListRow(data[i]);
          }

      }

      console.log("Scripts loaded.");

      if(params.id){
        create_form();
        if(params.id!="new"){
          createListRow(scripts[params.id]);
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

        var html = ``;

       // $("#sidebar").prepend(html);
        

      } else {
      
      ///////////////////////////////////
      // List


        var html = `

          <div class="row" style="border-bottom: 0px solid black;padding:0.5rem 0 0.5rem 0; width:100%" id="datarow_`+ rowdata.id +`">

              <div class="col-md-6 col-sm-6 col-xs-6"><b> <a href="?p=script&id=`+ rowdata.id +`" >` + rowdata.name + `</a></b></div>

              <div class="col-md-2 col-sm-2  col-xs-2"><span class="dataset_update_button"></span> <span>`+ rowdata.id +`</span></div>

              <div class="col-md-4 col-sm-1 col-xs-1" style="text-align:right">`+ rowdata.type +`</div>

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

  /*
  data.meta = {};
  data.meta_internal = {};

  data.meta.name = data.name;
  delete data.name;

  data.meta.description = data.description;
  delete data.description;

  data.meta.url = data.url;
  delete data.url;

  data.meta_internal.contact_person = data.contact_person;
  delete data.contact_person;

  data.meta_internal.notes = data.notes;
  delete data.notes;

*/

  saveData("script", data.id, data);

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

      "type": { 
          "type": "string",
          "title": "type",
          "enum":["converter_sql","query_sql","import_python"],
          "helper":"",
          "fieldOptions":{
            "optionLabels":["Converter: SQL for fields","Query: SQL for fields","Converter: Python for fields"],
          }
      },
      
      "script": { 
          "type": "string",
          "title": "Script",
         
          "fieldOptions":{
            "type":"textarea",
             "helper":"Be very careful!",
            "disallowEmptySpaces":true,
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
    "data": scripts[params.id],
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

