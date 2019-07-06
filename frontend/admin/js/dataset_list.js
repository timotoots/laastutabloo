
var locale = function(number, index, total_sec) {
  // number: the timeago / timein number;
  // index: the index of array below;
  // total_sec: total seconds between date to be formatted and today's date;
  return [
    ['just now', 'right now'],
    ['%s seconds ago', '%s seconds'],
    ['1 minute ago', '1 minute'],
    ['%s minutes ago', '%s minutes'],
    ['1 hour ago', '1 hour'],
    ['%s hours ago', '%s hours'],
    ['1 day ago', '1 day'],
    ['%s days ago', '%s days'],
    ['1 week ago', '1 week'],
    ['%s weeks ago', '%s weeks'],
    ['1 month ago', '1 month'],
    ['%s months ago', '%s months'],
    ['1 year ago', '1 year'],
    ['%s years ago', '%s years']
  ][index];
};
timeago.register('custom', locale);



/////////////////////////////////////////

$.getJSON(providers_url,function(providers) {

  for (var i = 0; i < providers.length; i++) {
    addProvider( providers[i]);
    updateProvider(providers[i]);
  }
  
  // console.log(providers);
  apiUpdateDatasets();


});

///////////////////////////////////////////////////////////////////////////////////////

  function apiUpdateDatasets(){

    $.getJSON(datasets_url,function(datasets) {

        for (var i = 0; i < datasets.length; i++) {
            updateDatasetRow( datasets[i].provider , datasets[i]);
        } // for

        setTimeout(function(){
          // apiUpdateDatasets();
        },1000);
    });

  }

///////////////////////////////////////////////////////////////////////////////////////

  function addProvider(provider){

    // Check already have the div
     var div_id = "#provider_" + provider.id + " ";
     if($(div_id).length){
      return;
     }

    var html = [];

    html.push('<div id="provider_'+ provider.id +'">')
      html.push('<div class="row" style="padding:1rem 0rem 0rem 0rem;border-top: 1px solid black">');
        html.push('<div class="col-md-12 name" style="color:#4c4c4c"><b></b></div>');
      html.push('</div>');
    html.push('</div>');

    $(".container").append( html.join("") );

  }

///////////////////////////////////////////////////////////////////////////////////////

  function updateProvider(provider){

    var div_id = "#provider_" + provider.id + " ";

    $(div_id + " .name b").html( provider.meta.et.name + " ");


      // $(div_id + " .name").append('<a href="'+ provider.meta.et.url +'">_</a>');
      if(typeof provider.wms != "undefined"){
        wms_url = provider.wms[0] + provider.wms[1];

        $(div_id + " .name").append(' / Browse: <a href="wms_browser.php?wms_url='+ wms_url +'&wms_service=wms">WMS</a>');
        $(div_id + " .name").append(' <a href="wms_browser.php?wms_url='+ provider.meta.et.url +'&wms_service=wfs">WFS</a>'); 

      }
 
  }

  ///////////////////////////////////////////////////////////////////////////////////////
  // Dataset rows

    function createDatasetRow(provider_id, dataset){

        if(!$("#provider_" + provider_id).length){
         // console.log("No provider found: " + provider_id + ", put to unsorted;");
         provider_id = "unsorted";
        }

       // Check already have the div
       var div_id = "#provider_" + provider_id + " #dataset_"+dataset.id;
       if($(div_id).length){
        return;

       }

      var html = [];

      html.push('<div class="row" style="border-bottom: 0px solid black;padding:0.5rem 0 0.5rem 0" id="dataset_'+ dataset.id +'">');

        html.push(' <div class="col-md-4"><span class="dataset_status_private"></span> <span class="dataset_edit_button"></span> <span class="dataset_remote_button"></span> <b class="dataset_name">a</b> </div>');

        // html.push(' <div class="one columns"><span class="dataset_status_updater">updater</span></div>');
        html.push(' <div class="col-md-2"><span class="dataset_update_button"></span> <span class="dataset_updated">updated</span></div>');

        html.push(' <div class="col-md-1"><span class="dataset_status_converter"></span></div>');
        html.push(' <div class="col-md-1"><span class="dataset_status_rows">rows</span></div>');
        html.push(' <div class="col-md-1"></div>');

       html.push('</div>');

      $("#provider_" + provider_id).append( html.join("") );

  } // function createDatasetRow

  ///////////////////////////////////////////////////////////////////////////////////////

  function updateDatasetRow(provider_id, dataset){

      var div_id = "#dataset_" + dataset.id; 

      if(!$(div_id).length){
        createDatasetRow(provider_id, dataset);
      } 

      $(div_id + " .dataset_name").html( '<a href="dataset_edit.html?id='+ dataset.id +'" >' + dataset.id + "</a>");
      $(div_id + " .dataset_url").attr("href", dataset.url);

      //////////////////////////
      // Public-private

      if(dataset.private == true){
         $(div_id + " .dataset_status_private").html(getIcon('locked','red','Private dataset'));
      } else {
        $(div_id + " .dataset_status_private").html(getIcon('unlocked','white','Public dataset'));
      }

      //////////////////////////
      // Edit
      // $(div_id + " .dataset_edit_button").html('<a href="dataset_edit.html?id='+ dataset.id +'" >' + getIcon('edit','black','Edit dataset') + "</a>");

      $(div_id + " .dataset_remote_button").html('<a href="'+ dataset.url +'" >' + getIcon('remote','black','Remote file') + "</a>");

      if(typeof dataset.last_updated === "undefined" || dataset.last_updated=="" || dataset.last_updated==null){
        $(div_id + " .dataset_updated").html("Never");

      } else {
        $(div_id + " .dataset_updated").html(timeago.format(dataset.last_updated,"custom"));

      }

      //////////////////////////
      // Updater

      var danger = 0;

      if(dataset.status_updater=="done"){
        $(div_id + " .dataset_update_button").html('<a href="javascript://" onclick="triggerUpdater()" >' + getIcon('update','green','Download done') + "</a>");
        $(div_id + " .dataset_update_button svg").removeClass("rotater");
      } else if(dataset.status_updater=="started"){
        $(div_id + " .dataset_update_button").html( getIcon('update','blue','Downloading'));
        $(div_id + " .dataset_update_button svg").addClass("rotater");
      } else if(dataset.status_updater=="failed"){
        $(div_id + " .dataset_update_button").html('<a href="javascript://" onclick="triggerUpdater()" >' + getIcon('update','red','Download failed') + "</a>");
        $(div_id + " .dataset_update_button svg").removeClass("rotater");
        danger = 1;
       }else {
        $(div_id + " .dataset_update_button").html('<a href="javascript://" onclick="triggerUpdater()" >' + getIcon('update','yellow',dataset.status_updater) + "</a>");
        $(div_id + " .dataset_update_button svg").removeClass("rotater");
        danger = 1;
       }

      //////////////////////////
      // Converter

      if(dataset.status_converter=="done"){
           $(div_id + " .dataset_status_converter").html('<a href="javascript://" onclick="triggerUpdater()" >' + getIcon('converter','green','Conversion done') + "</a>");
      } else if(dataset.status_converter=="running"){
           $(div_id + " .dataset_status_converter").html( getIcon('converter','yellow','Converting'));
      } else if(dataset.status_converter=="failed"){
           $(div_id + " .dataset_status_converter").html('<a href="javascript://" onclick="triggerUpdater()" >' + getIcon('converter','red','Conversion failed') + "</a>");
           // danger = 1;
       }else {
           $(div_id + " .dataset_status_converter").html('<a href="javascript://" onclick="triggerUpdater()" >' + getIcon('converter','blue',dataset.status_converter) + "</a>");
           // danger = 1;
       }

       if(danger==1){
          $(div_id).addClass("bg-danger");
       } else {
          $(div_id).removeClass("bg-danger");
       }

  } // function

  ///////////////////////////////////////////////////////////////////////////////////////