
//////////////////////////////////////////////////////////////

var terms = {};
var textslides = {};

var json_loaded = 0;

var params = {};

var checkList = {};

var api;


/////////////////////////////////////////////////////////////

window.addEventListener("load", function(){

  // get_next_slides();
  // setTimeout("show_next_slide()",3000);


});


		function createMenu(){


			$(function() {
				$('nav#menu').mmenu({
					extensions	: [ 'theme-dark' ],
					setSelected	: true,
					counters	: true,
					searchfield : {
						placeholder		: 'Search'
					},
					navbar:{
						title:"Laastutabloo"
					},  
					hooks: {
            "openPanel:start": function( $panel ) {
            	if($panel.attr( "id" )=="panel-menu"){
            		console.log("Main menu");
            		 $(".breadcrumb_first").show();
            		 $(".mm-navbar__breadcrumbs").css("margin-left",0);
            	} else {
            		console.log("Other menu");
					 $(".breadcrumb_first").hide();
					 $(".mm-navbar__breadcrumbs").css("margin-left",0);

            	}
               console.log( "This panel is now opening: #" + $panel.attr( "id" ) );
            },
            "closePanel:before": function( $panel ) {
               console.log( "This panel closes now: #" + $panel.attr( "id" ) );
            }
         },
					// iconbar		: {
					// 	add 		: true,
					// 	size		: 40,
					// 	top 		: [ 
					// 		'<a href="#/"><span class="fa fa-home"></span></a>'
					// 	],
					// 	bottom 		: [
					// 		'<a href="#/"  target="_blank"><span class="fa fa-twitter"></span></a>',
					// 		'<a href="#/"  target="_blank"><span class="fa fa-facebook"></span></a>',
					// 		'<a href="https://www.instagram.com/explore/tags/laastutabloo/" target="_blank"><span class="fa fa-instagram"></span></a>'
					// 	]
					// },
					// sidebar		: {
					// 	collapsed		: {
					// 		use 			: '(min-width: 450px)',
					// 		size			: 40,
					// 		hideNavbar		: false
					// 	},
					// 	expanded		: {
					// 		use 			: '(min-width: 992px)',
					// 		size			: 35
					// 	}
					// },
					 keyboardNavigation: {
					 	enable: "default",
					 	enhance: true
               // keyboardNavigation options
            },
					navbars		: [
						// {
						// 	position	: 'top',
						// 	content		: [ '<a href="javascript://" onclick="closePanel()">LAASTUTABLOO</a>' ]
						// },
						{
               "position": "bottom",
               "content": [
                  "<a href='?lang=et' id='lang_et'>EST</a>",
                  "<a href='?lang=en' id='lang_en'>ENG</a>",
                  "<a href='?lang=ru' id='lang_ru'>RUS</a>",
               ]
            }, {
							content		: [ 'prev', '<span class="breadcrumb_first">LAASTUTABLOO<span>','breadcrumbs', "<span class='mm-btn' onclick='closePanel();openFullscreen()' style='margin-right:-16px;'><img src='images/fullscreen.png' style='width:10px'/></span>","close"]
						},{
							position	: 'bottom',
							content		: [ 'searchfield' ]
						}
					]
				}, {
					searchfield : {
						clear 		: true
					},
					navbars		: {
						breadcrumbs	: {
							removeFirst	: true
						}
					}
				});

				$('a[href^="#/"]').click(function() {
					alert( 'Thank you for clicking, but that\'s a demo link' );
					return false;
				})
			});



			// panelHooks();

			} // function createMenu



/* Get the documentElement (<html>) to display the page in fullscreen */
var elem = document.documentElement;

/* View in fullscreen */
function openFullscreen() {
  if (elem.requestFullscreen) {
    elem.requestFullscreen();
  } else if (elem.mozRequestFullScreen) { /* Firefox */
    elem.mozRequestFullScreen();
  } else if (elem.webkitRequestFullscreen) { /* Chrome, Safari and Opera */
    elem.webkitRequestFullscreen();
  } else if (elem.msRequestFullscreen) { /* IE/Edge */
    elem.msRequestFullscreen();
  }
}

/* Close fullscreen */
function closeFullscreen() {
  if (document.exitFullscreen) {
    document.exitFullscreen();
  } else if (document.mozCancelFullScreen) { /* Firefox */
    document.mozCancelFullScreen();
  } else if (document.webkitExitFullscreen) { /* Chrome, Safari and Opera */
    document.webkitExitFullscreen();
  } else if (document.msExitFullscreen) { /* IE/Edge */
    document.msExitFullscreen();
  }
}



function closePanel(){

	var api = $("nav#menu").data( "mmenu" );
	console.log(api);
	  api.close();

 	

}

function panelHooks(){

	var $menu = $("nav#menu");

      //   With the hooks option
      $menu.mmenu({
         hooks: {
            "openPanel:start": function( $panel ) {
               console.log( "This panel is now opening: #" + $panel.attr( "id" ) );
            },
            "openPanel:finish": function( $panel ) {
               console.log( "This panel is now opened: #" + $panel.attr( "id" ) );
            }
         }
      });

      //   With the API bind method
      var api = $("nav#menu").data( "mmenu" );

      api.bind( "openPanel:start", function( $panel ) {
         console.log( "This panel is now opening: #" + $panel.attr( "id" ) );
      });
      api.bind( "openPanel:finish", function( $panel ) {
         console.log( "This panel is now opened: #" + $panel.attr( "id" ) );
      });

}


	/////////////////////////////////////////////////////////////

	function getParams(){

		/////////////////////
		// Get starting params from URL

		var uri = new URI();
		params = uri.search(true);
		params.sources = parseCommaSources(params.sources);


		/////////////////////
		// If no params in URL, we use params from the cookies.

		if(Object.keys(params).length == 0){
			params = Cookies.getJSON('tabloo_params');
			console.log("Use params from cookies");
		} 

		/////////////////////
		// Default is Estonian language

		if(!params.lang){
			params.lang = "et";
		}



	}
	
	/////////////////////////////////////////////////////////////

	function saveParams(){


		params.extra = "ohoo";
		params.exclude_ehak = '0123,1232';



		/////////////////////
		// Format data for the nice URL

		var params_out = params;

		params_out.sources = params_out.sources.join(",");
		params_out.include_ehak = params_out.include_ehak.join(",");

		/////////////////////
		// Create nice URL from existing URL

		var uri = new URI();
		var new_uri = new URI(uri.origin() + uri.path());
		new_uri.search(params_out);

		console.log("New URI: " + new_uri.readable());
		window.history.pushState({}, "Laastutabloo", new_uri.readable());

		/////////////////////
		// Save parameters to cookies

		Cookies.set('tabloo_params', params);

	}

	/////////////////////////////////////////////////////////////




	

getParams();


//////////////////////////////////////////////////////////////

function startPage(){


	json_loaded++;

	if(json_loaded==4){
	
			makeGrid();


		getParams();

		createMenu();
		translate_terms(params.lang);
		saveParams();
	


	}


	console.log(params.sources);

	
}

function makeGrid(){

	var html = [];


	for (var x = 0; x < 10; x++) {
		html.push("<tr>");
		for (var y = 0; y < 10; y++) {
			html.push("<td>" + y + "</td>");
		}
		html.push("</tr>");
	}

	// console.log(html);

	$("#tabloo").append( html.join("") );

}

//////////////////////////////////////////////////////////////

function parseCommaSources(str){

	if(typeof str === "undefined"){
		return false;
	}
	str =  str.split(",");
	for (var i = 0; i < str.length; i++) {
		str[i] = str[i].trim();
	}
	return str;

}

//////////////////////////////////////////////////////////////
// CHECKBOXES


function multiCheck(checkListId, checkedValue = true){


	$(".checkListId-"+ checkListId +".in-checkList").prop('checked', checkedValue);
	getCheckList(checkListId);


}

function getCheckList(checkListId){

		console.log("getCheckList for "+ checkListId);

		var checked_selector = ".checkListId-"+ checkListId +".in-checkList:checked";
		var unchecked_selector = ".checkListId-"+ checkListId +".in-checkList:not(:checked)";
		
		var uncheckedLength = $(unchecked_selector).length;
		var checkedLength = $(checked_selector).length;

		if(typeof checkList[checkListId] === "undefined"){
			checkList[checkListId] = {"include":true,"exclude":false};
		}

		//////////////
		// All checked, include all

		if (uncheckedLength == 0){

			checkList[checkListId].include = true;
			checkList[checkListId].exclude = false;

		} else if (checkedLength == 0){
			
			//////////////
			// All unchecked, exclude all

			checkList[checkListId].include = false;
			checkList[checkListId].exclude = true;

		} else if(uncheckedLength > checkedLength){

			//////////////
			// More unchecked than checked

			checkList[checkListId].include = [];
			checkList[checkListId].exclude = false;
		
			// Use include
			$(checked_selector).each(function(){
				checkList[checkListId].include.push($(this).attr('id'))
			});

		} else {

			// more checked than unchecked

			checkList[checkListId].exclude = [];
			checkList[checkListId].include = false;		

			// Use exclude
			$(unchecked_selector).each(function(){
				checkList[checkListId].exclude.push($(this).attr('id'))
			});


		}

		//////////////
		
		// console.log(checkList);

		saveChecklist();

	}


function saveChecklist(){


	var out = {"include_full_counties":[],"include_district":[],"exclude_full_counties":[],"exclude_district":[]};


	for (var key in checkList) {

		if(key=="terms"){

		} else if(key=="settings"){


		} else {

			console.log(checkList[key]);
			if(checkList[key].include==true && checkList[key].exclude==false){
				// All selected in county
				out.include_full_counties.push(key);
			} else if(checkList[key].include==false && checkList[key].exclude==true){
				// All selected in county
				out.exclude_full_counties.push(key);
			} else if(checkList[key].include==false && checkList[key].exclude.length > 0){
				// out.include_counties.push(key);
				for (var i = 0; i < checkList[key].exclude.length; i++) {
					out.exclude_district.push(checkList[key].exclude[i]);
				}	
			} else if(checkList[key].exclude==false && checkList[key].include.length > 0){
				// out.exclude_counties.push(key);
				for (var i = 0; i < checkList[key].include.length; i++) {
					out.include_district.push(checkList[key].include[i]);
				}
			}

		}


	}


	if(out.exclude_full_counties.length > out.include_full_counties.length){

		//	out.exclude_full_counties = [];

	} else {

		//out.include_full_counties = [];
	
	}

	console.log(out);




}

//////////////////////////////////////////////////////////////
//
// Counties and districts
//

var ehakSelected = {};

	$.getJSON( "json/ehak_et.json", function( data ) {

		var html = [];

		$.each( data, function( county_name, county_val ) {

			ehakSelected[county_val.ehak] = {};

			checkList[county_val.ehak] = {"include":true,"exclude":false};

			html.push("<li><span>" + county_name + "</span><ul>");	
			html.push("<li class='Divider Spacer'></li>");

			html.push("<li onclick='multiCheck(\""+county_val.ehak+"\",true);'>\<span data-term='Show all'>Show all</span></li>");

			html.push("<li onclick='multiCheck(\""+county_val.ehak+"\",false);'><span data-term='Hide all'>Hide all</span></li>");

			html.push("<li id='' class='Divider Spacer' data-term='" + county_name + "'>" + county_name + "</li>");

			$.each( county_val.districts, function( distric_key, district_val ) {



				html.push( '\
					<li>\
						<span>' + district_val.name + '</span>\
						<input type="checkbox" id="' + district_val.id + '" checked \
							class="Check in-checkList checkListId-'+county_val.ehak+'" \
							onclick="getCheckList(\''+county_val.ehak+'\');" />\
					</li>' );

			});
			html.push("</ul></li>");

		});

		$( "#districts").append( html.join( "" ) );
		startPage();

	});

//////////////////////////////////////////////////////////////

var selectedTerms = {};

	$.getJSON( "json/page_data.json", function( data ) {

		//////////////////////////

		var html = [];
		// Update Text slides

		$.each( data.textslides, function(  textslide_key, textslide_val ) {

			html.push( '<li><span>' + textslide_val.titles["et"] + '</span><input type="checkbox" id="' + textslide_key + '" checked class="Check in-checkList checkListId-terms" onclick="getCheckList(\'terms\');" /></li>' );


		});

		//////////////////////////

		$( "#textslides").append( html.join( "" ) );


		terms = data.terms;
		textslides = data.textslides;

		startPage();

	});

	//////////////////////////////////////////////////////////////

	function getOrganizations(){

		var html = [];

		var url = "http://data.laastutabloo.ee/api/3/action/organization_list?all_fields=true&include_extras=true&rand=1";

		$.getJSON( url, function( data ) {

			console.log(data);

			 $.each( data.result, function( i, val ) {
			 	if(params.lang=="en" && typeof val.title_translated != "undefined"){
			 		var name = val.title_translated["en"];
			 	} else if(params.lang=="ru" && typeof val.title_translated != "undefined"){
					var name = val.title_translated["ru"];
			 	} else {
					var name = val.display_name;
			 	}
			 	// console.log(val);

			 	html.push( '<li><span>'+ name +'</span><div><strong>'+ name  +'</strong><br/><br/>'+ val.description + '</div></li>');

			 });

			 $( "#data_providers").append( html.join( "" ) );
			startPage();


		});

	}

	getOrganizations();

	//////////////////////////////////////////////////////////////


	function getPages(){

		var html = [];

		var url = "http://data.laastutabloo.ee/api/3/action/ckanext_pages_list?i=2";

		$.getJSON( url, function( data ) {

			 $.each( data.result, function( i, val ) {

			 	if(val.name=="laastutabloost"){
			 		 $("#laastutabloost").html(val.content);
			 	} else if(val.name=="about_museum"){
			 		 $("#about_museum").html(val.content);
			 	}

			 });

			startPage();


		});



	}

	getPages();


	

	//////////////////////////////////////////////////////////////

	function translate_terms(lang){

		console.log("Translate to " + lang);
		
		$(".active_lang").removeClass('active_lang');
		$("#lang_" + lang).addClass('active_lang');
		
		$("[data-term]").each(function( index ) {
			if( typeof terms[$(this).data("term")] != "undefined"){
				if( typeof terms[$(this).data("term")][lang] != "undefined"){
					$(this).html(terms[$(this).data("term")][lang]);
				} else {
					console.log("Missing language " + lang + " for term:" + $(this).data("term"));
				}
			} else {
					console.log("Not translated term:" + $(this).html());
			}
		});

		$("span[data-textslide-id]").each(function( index ) {

			if( typeof textslides[$(this).data("textslide-id")].titles[lang] != "undefined"){
				$(this).html(textslides[$(this).data("textslide-id")].titles[lang]);
			}

		});

	}


	//////////////////////////////////////////////////////////////
