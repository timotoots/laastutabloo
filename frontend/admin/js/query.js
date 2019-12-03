var dataset = {};
var providers = {};
var providers_list = [];
var providers_names = [];
var provider_meta = {};

var datasets_enum = [];
var datasets_enum_labels = [];

var datasets = {};

var queries = {};
var query_states = {};


///////////////////////////////////////////////////////////////////////////////

// START UP THE SCRIPT


  console.log("Query start");

  loadJson(queries_url)
   .then(data => new Promise(function(resolve, reject) {
      
      for (var i = 0; i < data.length; i++) {

         if(typeof query_states[data[i].query_id] === "undefined"){

           query_states[data[i].query_id] = {};
           query_states[data[i].query_id].show_tabulator = 0;
           query_states[data[i].query_id].show_map = 0;

         }

          // for list
          queries[data[i].query_id] = data[i];

          if( (params.id && params.id == data[i].query_id) || !params.id ){
            createQueryRow(data[i]);

          }


          // for edit
          // providers_list.push(data[i].id);
          // providers_names.push(data[i].meta.et.name);
      }

      console.log("Queries loaded.");
      if(params.id){
        resolve(true);
      } else {
        reject("List page, no form needed");
      }

    }))
   .then(a => loadJson(providers_url))
   .then(data => new Promise(function(resolve, reject) {

      providers = data;

      for (var i = 0; i < data.length; i++) {

          // for list
          providers[data[i].id] = data[i];

          // for edit
          // providers_list.push(data[i].id);
          // providers_names.push(data[i].meta.et.name);
      }
      console.log("Providers loaded.");
      resolve(true);

    }))
   .then(a => loadJson(datasets_url))
   .then(datasets2 => new Promise(function(resolve,reject){


        for (var i = 0; i < datasets2.length; i++) {

          datasets_enum.push(datasets2[i].id);
          datasets_enum_labels.push(datasets2[i].provider + " > " + datasets2[i].id );

          datasets[datasets2[i].id] = datasets2[i];

        //if( datasets[i].id==params.id){

         // dataset = datasets[i];
          
       //   if(typeof providers[dataset.provider] != "undefined"){
       //     provider_meta = providers[dataset.provider];
            // if(typeof provider_meta.wms != "undefined"){
            //   dataset.url =  provider_meta.wms.join('');
            // }
        //  }

          // dataset.schema = JSON.stringify(dataset.schema);


    //    }
      } // for

          console.log("Dataset loaded.");
          // console.log(dataset);
           if(params.id){
            create_form();
            createMap();
          }
          resolve(true);

   }))
      .catch( error =>  console.log(error) );


/////////////////////////////////////////////////////////

    function createQueryRow(query){

    
        // Check already have the div
       var div_id = "#query_"+query.id;
       if($(div_id).length){
        return;
       }

      var html = [];

      ///////////////////////////////////
      // Side bar

      if(params.id){

        html.push('<div id="query_'+ query.query_id +'">');
        html.push(`
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

        `);

        html.push('</div>');

        $("#sidebar").prepend( html.join("") );
        
        // // Show log button logic
        // $('#dataset_'+dataset_id+" .btn-show-log").click(dataset_id,showLogButtonHandler);
        // $('#dataset_'+dataset_id+' .btn-run-updater').click(dataset_id,triggerUpdater);
        $('#query_'+query.query_id+' .btn-show-table').click(query.query_id,showTabulatorHandler);
        $('#query_'+query.query_id+' .btn-show-map').click(query.query_id,showMapHandler);
        $('#query_'+query.query_id+' .btn-show-tabloo').click(query.query_id,showTablooHandler);


        function showMapHandler(event){


            if(!params.id){
              var selector =  "#query_" +params.id+" #map";
            } else {
              var selector = ".map";
            }

            $(selector).html();


             if(query_states[event.data].show_map==0){
              query_states[event.data].show_map = 1;
              var url =  render_query + "?query_id=" + event.data+"&ehak=8151&output=geojson";
              console.log(url);
              // url = "data_examples/tabulator_example.json";
              loadGeoJson(url, "", selector);
              $( selector).show();
            } else {
              query_states[event.data].show_map = 0;
              //$(selector).hide();
            }



        }

        function showTablooHandler(event){

          if(!params.id){
              var selector =  "#query_" +params.id+" .tabloo_display";
            } else {
              var selector = ".tabloo_display";
            }

            $( selector).show();
            var url =  render_query + "?query_id=" + event.data+"&ehak=8151&limit=100";

          $.getJSON( url, function( data ) {
              var animations = ta.createSlides(data,1);
              $(".tabloo_content1").html("<pre>"+ animations.join("\n") +"</pre>")
              //console.log(animations);
            });



        }





      } else {
      
      ///////////////////////////////////
      // Query list

      if(!query.name){
        query.name = {"et" : "no name!!"};
      }

        html.push('<div class="row shuffle-row" style="border-bottom: 0px solid black;padding:0.5rem 0 0.5rem 0; width:100%" id="query_'+ query.query_id +'" data-groups="[]" data-private="" data-status="">');

        html.push(' <div class="col-md-6 col-sm-6 col-xs-6"><b class="dataset_name"> <a href="?p=query&id='+ query.query_id +'" >' + query.name.et + '</a></b>  </div>');

        // html.push(' <div class="one columns"><span class="dataset_status_updater">updater</span></div>');
        html.push(' <div class="col-md-2 col-sm-2  col-xs-2"><span class="dataset_update_button"></span> <span>'+ query.query_id +'</span></div>');

  
           html.push(` <div class="col-md-4 col-sm-1 col-xs-1" style="text-align:right">

          <button type="button" class="btn btn-default sidebar-btn btn-show-table">
            <span class="glyphicon glyphicon-align-left icon-black" aria-hidden="true"></span> Preview
          </button>

          </div>

         <div class="col-md-12 col-sm-12 col-xs-12 log_display" style="color:black;display:none">log</div>`);

       html.push('</div>');

      // $("#provider_" + provider_id).append( html.join("") );
      $(".container").append( html.join("") );

        // $('#dataset_'+dataset_id+" .btn-show-log").click(dataset_id,showLogButtonHandler);
        // $('#dataset_'+dataset_id+' .btn-run-updater').click(dataset_id,triggerUpdater);
        $('#query_'+query.query_id+' .btn-show-table').click(query.query_id,showTabulatorHandler);

      }

    

  } // function createDatasetRow


  function showTabulatorHandler(event){


        if(!params.id){
          var selector =  "#query_" + event.data+" .log_display";
        } else {
          var selector = ".log_display";
        }
  
        console.log(selector);

        $(selector).html();

         if(query_states[event.data].show_tabulator==0){
          query_states[event.data].show_tabulator = 1;
          var url =  query_preview_url+"?query_id=" + event.data+"&limit=10";
          // var url =  render_query +"?query_id=" + event.data+"&ehak=10";
          // var url = "http://laastutabloo.erm.ee:5000/render_query?query_id=avalik&ehak=1021";
          // console.log(url);
          // url = "data_examples/tabulator_example.json";
          createTabulator(url, "", selector);
          $( selector).show();
        } else {
          query_states[event.data].show_tabulator = 0;
          $(selector).hide();

        }

}





    function saveButtonHandler_notused(event){


      var control = $("#form1").alpaca("get");
      var data = control.getValue();

      data.devel=0;

       

        $.ajax(save_query_url+"/"+data.query_id, {
          contentType: "application/json",
          type: "POST",
          data: JSON.stringify(data)
        }).done(function( msg ) {
          console.log( "Data Saved!");
        //if (devel==1){
          //  console.log("run query");
            //runQuery();
          //}
        });

        console.log("Save query:");
        console.log(data);

      } // function saveButtonHandler

/////////////////////////////

    function saveButtonHandler(event){


      var control = $("#form1").alpaca("get");
      var data = control.getValue();


      saveData("query", data.query_id, data);

    }




function create_form(){

    console.log("Form loaded.");

     // queries[params.id].schema = [{"active":true,"name":"AAA","width":15,"sort_order":"1","sort_direction":"ASC","align":"center","wrap":"truncate"}];
    
    var formSchemaProperties = {

      "subtitle_general":{
          "type":"any", 
          "title":"Basic info",
          "fieldOptions":{
            "fieldClass":"customSubTitle"
          }
      },

      "query_id": { 
          "type": "string", 
          "title": "Unique ID",
          "pattern":"^[a-z]+$",
          "fieldOptions":{
            "disallowEmptySpaces":true,
          }
      },

      "name":{
        "type":"object",
        "title":"Query title",
        "properties": form_lang_choices,
        "fieldOptions":{
          "helper":"Title of the slide appears on the display. If not filled, that language is not used"
        }
      },

       "subtitle_datasets":{
          "type":"any", 
          "title":"Choose data",
          "fieldOptions":{
            "fieldClass":"customSubTitle"
          }
      },



      "dataset_id":{
        "type": "string",
        "enum": datasets_enum,
        "title": "Select dataset",
        "fieldOptions":{
          "optionLabels":datasets_enum_labels,
  
              

        },
       
      }, 
     "where":{
        "type": "string",
        "title": "SQL where clause",
        "fieldOptions":{
          "type":"text",
          "helper":"For advanced use!",
          "buttons":{
              "load_fields":{
                  "title": '<span class="glyphicon glyphicon-arrow-down icon-green" aria-hidden="true"></span> Load fields',
                  "click": loadFieldsButtonHandler
              }
              
          },

        }
        }, 
   "show_sql": {
      "type": "boolean",
      "title": "Custom SQL?",
      "fieldOptions":{}
  },

      "sql":{
        "type": "string",
        "title": "Custom SQL",
        "fieldOptions":{
          "type":"textarea",
          "helper":"For advanced usage only, overrides dataset selection and sorting!",

           "dependencies": { "show_sql": true }
      

        }
        }, 




       "subtitle_sortby":{
          "type":"any", 
          "title":"Sort data",
          "fieldOptions":{
            "fieldClass":"customSubTitle"
          }
      },


    "orderby":{
      "type":"array",
      "title":"Order data",
      "items": {
        "type": "object",
        "properties": {
            
            "orderby_column": {
                "type": "string",
                "title": "Column",
                "readonly":false
            },
            "orderby_direction": {
                "type": "string",
                "enum": ["None","ASC","DESC"],
                "title": "Sort direction"
            }            
        }
    },
    "fieldOptions":{
      "type": "table",
      "title":"Order data",

      "items": {
      "fields": {
         "orderby_direction": {
            "type": "select"
          }
        },

      },

    }
  },




   "subtitle_data_style":{
          "type":"any", 
          "title":"Design data",
          "fieldOptions":{
            "fieldClass":"customSubTitle"
          }
      },


  "style":{
    "title":"",
     "type": "object",
      "properties": {
            "template":{
                "type": "string",
                "enum":["table","one_per_page"],
                "title": "Style template",
              }, 

            "num_of_pages":{
                "type": "string",
                "enum":[1,2,3,4],
                "title": "Maximum number of pages",
              }, 

            "align":{
                "type": "string",
                "enum":["left","center","right"],
                "title": "Align page",
              }
      },
      "fieldOptions":{
        "fields": {
           "template": {
              "type": "select"
            },"num_of_pages": {
              "type": "select"
            },"align": {
              "type": "select"
            }
          },


      }

  },

    "columns":{
      "type":"array",
      "title":"Columns",
      "items": {
        "type": "object",
        "properties": {
            
            "name": {
                "type": "string",
                "title": "Column",
                "readonly":false
            },
             "width": {
                "type": "string",
                "enum":[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20],
                "title": "Width"
            },
             "enable": {
                "type": "boolean",
                "title": "Enable?"
            },           
             "wrap": {
                "type": "string",
                "enum": ["truncate","wrap","wrap1", "wrap2","wrap3"],
                "title": "Wrap"
            },
             "align": {
                "type": "string",
                "enum": ["right","center","left"],
                "title": "Align"
            },
            "prefix": {
                "type": "string",
                "enum":["Kaugus: %data km"],
                "title": "Format"
            }
           
            
            
        }
    },
    "fieldOptions":{
      "type": "table",
      "items": {
      "fields": {
         "orderby_direction": {
            "type": "select"
          },"prefix": {
            "type": "select"
          },"wrap": {
            "type": "select"
          },"align": {
            "type": "select"
          }
        },

      },

    }
  },

      "buttons_updater":{
      "type":"any",
      "title":"Testing area",
      "fieldOptions":{
        "fieldClass":"customSubTitle",
        "buttons":{
              "save":{
                  "title": '<span class="glyphicon glyphicon-ok icon-green" aria-hidden="true"></span> Save query',
                  "click": saveButtonHandler
              }
              
          }
      }
  }

  };


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


// Not used, TODO: fix it!
 var columnsDataSource = function(callback) {
    
    console.log("Update columns");

      var value = this.observable("/dataset_id").get();
     if(typeof value != "undefined"){
      callback([{"active":true,"name":"BBB","width":15,"sort_order":"1","sort_direction":"ASC"}]);
    } else {
      callback([]);
    }

};

  // formOptionsFields["columns_order"].dataSource = columnsDataSource;


    $("#form1").alpaca({
      "data": queries[params.id],
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



function loadFieldsButtonHandler(event){

        var control = $("#form1").alpaca("get");


        ///////////////////
        // Check if new dataset is good one

        var dataset_id_control = control.childrenByPropertyId["dataset_id"];
        var new_dataset_id = dataset_id_control.getValue();

        if(!datasets[new_dataset_id].schema){
          console.err("No schema in this dataset!");
          return false;
        }

        ///////////////////
        // Prepare new form fields and data

        var orderby_enum = [];
        var orderby_data = [];

        var style_data = []
 
        for(var i in datasets[new_dataset_id].schema){

            var column_name = datasets[new_dataset_id].schema[i].column;

            // Preferred orderby columns
            if(column_name=="time"){
              orderby_data.push({"orderby_column":column_name,"orderby_direction":"DESC"})
            }

            // 
            if(column_name=="lat" || column_name=="lon" ){
                var column_enable = false;
            } else{
                var column_enable = true;
            }

            orderby_enum.push(column_name);
            style_data.push({"name":column_name,"enable":column_enable,"width":1,"align":"center","wrap":"wrap1","prefix":"None"});
        }

  

        ///////////////////
        // Push to forms

        var orderby_control = control.childrenByPropertyId["orderby"];

        // set data of orderby
        if(orderby_data.length!=0){
          orderby_control.setValue(orderby_data);
          // orderby_control.refresh();
        }


        var style_data_control = control.childrenByPropertyId["columns"];
        style_data_control.setValue(style_data);

        // set enum of orderby columns
        orderby_control.schema.items.properties.orderby_column.enum = orderby_enum;



       orderby_control.refresh();
       style_data_control.refresh();


}



  function postRender(control) {

    /*
        var dataset_id = control.childrenByPropertyId["dataset_id"];
        var columns_order = control.childrenByPropertyId["columns_order"];

        // console.log(dataset_id.getValue());
        // console.log(columns.getValue());

        // console.log(columns);

        columns_order.subscribe(dataset_id, function(val) {

            if(!datasets[val].schema){
              console.err("No schema in this dataset!");
              return false;
            }

            var new_columns_order = [];

            for(var i in datasets[val].schema){
              console.log(datasets[val].schema[i].column);
              new_columns_order.push({"name":datasets[val].schema[i].column,"orderby_direction":"ASC","enable":true})
            }
            this.setValue(new_columns_order);
            // this.schema.enum = this.options.optionLabels = teams[val];
            this.refresh();
        });

*/

      
    }

} // create_form

