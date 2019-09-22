

var providers = {};

var display_states = {};

/////////////////////////////////////////

$.getJSON(providers_url,function(providers_data) {

  for (var i = 0; i < providers_data.length; i++) {

    providers[providers_data[i].id] = providers_data[i];
  }
  
  apiUpdateDatasets();


});

///////////////////////////////////////////////////////////////////////////////////////

  function apiUpdateDatasets(){

    $.getJSON(datasets_url,function(datasets) {

        for (var i = 0; i < datasets.length; i++) {
            updateDatasetRow( datasets[i]);
        } // for

        setTimeout(function(){
           apiUpdateDatasets();
        },1000);
    });

  }

///////////////////////////////////////////////////////////////////////////////////////

var last_log = [];

  function apiUpdateLog(dataset_id, html_element){

    // var dataset_id = "aircrafts";
    // var html_element = "#dataset_"+dataset_id+" .log_display";


    $.getJSON(dataset_log_url+"?dataset_id="+dataset_id ,function(logs) {

      if($.isArray(logs)){

        logs = logs.reverse(); 

        if(logs.length>10){
          var num_lines = 10;
        } else{
          var num_lines = logs.length;
        }


        var html = [];

        // TODO: compare with last logs
        var res = logs.filter( function(n) { return !this.has(n) }, new Set(last_log) );
        last_log = logs;
        console.log(res);

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

            if(display_states[dataset_id].show_log==true){
             apiUpdateLog(dataset_id,html_element);
            }
        },1000);
    });

  }


apiUpdateLog("aircrafts","#dataset_aircrafts .log_display");

///////////////////////////////////////////////////////////////////////////////////////

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




  ///////////////////////////////////////////////////////////////////////////////////////
  // Dataset rows

  var lastProviderId = "";

    function createDatasetRow(dataset){

      provider_id = dataset.provider;

      var pattern = /[^A-Za-z0-9\d_\d-]+/g;
      var dataset_id = dataset.id.replace(pattern, "");

        display_states[dataset.id] = {};
        display_states[dataset.id].id = dataset.id;
        display_states[dataset.id].div_id = "#dataset_" + dataset_id;
        display_states[dataset.id].show_log = 0;
        display_states[dataset.id].last_log = [];


        if(typeof providers[dataset.provider] === "undefined"){
         console.log("No provider found: " + provider_id + ", put to unsorted;");
         provider_id = "unsorted";
        }

        if(provider_id != lastProviderId){
          addProvider(providers[provider_id]);
        }
        



       // Check already have the div
       var div_id = "#provider_" + provider_id + " #dataset_"+dataset_id;
       if($(div_id).length){
        return;

       }

      var html = [];

      html.push('<div class="row shuffle-row" style="border-bottom: 0px solid black;padding:0.5rem 0 0.5rem 0; width:100%" id="dataset_'+ dataset_id +'" data-groups="[]" data-private="" data-status="">');

        html.push(' <div class="col-md-4"><span class="dataset_status_private"></span> <span class="dataset_edit_button"></span> <span class="dataset_remote_button"></span> <b class="dataset_name">row</b> </div>');

        // html.push(' <div class="one columns"><span class="dataset_status_updater">updater</span></div>');
        html.push(' <div class="col-md-2"><span class="dataset_update_button"></span> <span class="dataset_updated">updated</span></div>');

        html.push(' <div class="col-md-1"><span class="dataset_status_converter"></span></div>');
        html.push(' <div class="col-md-1"><span class="dataset_status_rows">rows</span></div>');
        html.push(` <div class="col-md-1"><span class="dataset_update_frequency"></span>

          <button type="button" class="btn btn-default sidebar-btn btn-show-log">
            <span class="glyphicon glyphicon-align-left" aria-hidden="true" style="color:#2cff00;"></span> Log
          </button>


          </div>

         <div class="col-md-1"></div> <div class="col-md-12 log_display" style="color:black;display:none">log</div>`);

       html.push('</div>');

      // $("#provider_" + provider_id).append( html.join("") );
      $(".container").append( html.join("") );



      // Show log button logic
      $('#dataset_'+dataset_id+" .btn-show-log").click(dataset_id,function(event){
        console.log(event.data);

        if(display_states[event.data].show_log==0){
          display_states[event.data].show_log = 1;
          console.log(display_states[event.data]);
          apiUpdateLog(event.data, display_states[event.data].div_id+" .log_display");
          $( display_states[event.data].div_id+" .log_display").show();
        } else {
          display_states[event.data].show_log = 0;
          $( display_states[event.data].div_id+" .log_display").hide();

        }

      });


  } // function createDatasetRow

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

///////////////////////////////////////////////////////////////////////////////////////

  function updateDatasetRow(dataset){

      var pattern = /[^A-Za-z0-9\d_\d-]+/g;
      var dataset_id = dataset.id.replace(pattern, "");
      

      var div_id = "#dataset_" + dataset_id; 

      if(!$(div_id).length){
        createDatasetRow(dataset);
      } 

      $(div_id + " .dataset_name").html( '<a href="?p=dataset&id='+ dataset_id +'" >' + dataset.id + "</a>");
      $(div_id + " .dataset_url").attr("href", dataset.url);



      //////////////////////////
      // Public-private

      if(dataset.private == true){
         $(div_id + " .dataset_status_private").html(getIcon('locked','red','Private dataset'));
         addToDataGroups(div_id, "private");

      } else {
        $(div_id + " .dataset_status_private").html(getIcon('unlocked','white','Public dataset'));
        addToDataGroups(div_id, "public");

      }



      //////////////////////////
      // Edit
      // $(div_id + " .dataset_edit_button").html('<a href="dataset_edit.html?id='+ dataset.id +'" >' + getIcon('edit','black','Edit dataset') + "</a>");

      $(div_id + " .dataset_remote_button").html('<a href="'+ dataset.url +'" >' + getIcon('remote','black','Remote file') + "</a>");

      if(typeof dataset.last_updated === "undefined" || dataset.last_updated=="" || dataset.last_updated==null || dataset.last_updated=="Thu, 01 Jan 1970 00:00:00 GMT"){
        $(div_id + " .dataset_updated").html("Never");

      } else {
        $(div_id + " .dataset_updated").html(timeago.format(dataset.last_updated,"custom"));

      }

      //////////////////////////
      // Updater

      var danger = 0;

      if(dataset.status_updater=="done"){
        $(div_id + " .dataset_update_button").html('<a href="javascript://" id="'+dataset_id+'_updateButton"  >' + getIcon('update','green','Download done') + "</a>");
        $(div_id + " .dataset_update_button svg").removeClass("rotater");
      } else if(dataset.status_updater=="started"){
        $(div_id + " .dataset_update_button").html( getIcon('update','blue','Downloading'));
        $(div_id + " .dataset_update_button svg").addClass("rotater");
      } else if(dataset.status_updater=="failed"){
        $(div_id + " .dataset_update_button").html('<a href="javascript://" id="'+dataset_id+'_updateButton" >' + getIcon('update','red','Download failed') + "</a>");
        $(div_id + " .dataset_update_button svg").removeClass("rotater");
        danger = 1;
       }else {
        $(div_id + " .dataset_update_button").html('<a href="javascript://" id="'+dataset_id+'_updateButton"  >' + getIcon('update','yellow',dataset.status_updater) + "</a>");
        $(div_id + " .dataset_update_button svg").removeClass("rotater");
        danger = 1;
       }

      $('#'+dataset_id+'_updateButton').click(dataset_id,triggerUpdater);


      //////////////////////////
      // Converter

      if(dataset.status_converter=="done"){
           $(div_id + " .dataset_status_converter").html('<a href="javascript://" >' + getIcon('converter','green','Conversion done') + "</a>");
      } else if(dataset.status_converter=="running"){
           $(div_id + " .dataset_status_converter").html( getIcon('converter','yellow','Converting'));
      } else if(dataset.status_converter=="failed"){
           $(div_id + " .dataset_status_converter").html('<a href="javascript://"  >' + getIcon('converter','red','Conversion failed') + "</a>");
           // danger = 1;
       }else {
           $(div_id + " .dataset_status_converter").html('<a href="javascript://"  >' + getIcon('converter','blue',dataset.status_converter) + "</a>");
           // danger = 1;
       }

       if(danger==1){
          $(div_id).addClass("bg-danger");
       } else {
          $(div_id).removeClass("bg-danger");
       }

       if(dataset.update_frequency){
             $(div_id + " .dataset_update_frequency").html(dataset.update_frequency);
      
       }



  } // function

  ///////////////////////////////////////////////////////////////////////////////////////

