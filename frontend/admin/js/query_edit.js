     	/////////////////////////////////////////////////////

     	function listQueries(){


		$.getJSON('http://www.laastutabloo.ee:5000/list_queries', function(data) {
	          	console.log(data);
	    			$('#query_list').html(data);

	           });


     	}
    

    	/////////////////////////////////////////////////////

     	function saveQuery(test = 0){

     		var query_id = $("#query_id").val();

     		var query = $("#CustomSQL").val();
     		query = query + " limit 10";

     		var meta = {};
     		meta.num_of_pages = $("#meta_num_pages").val();
      		meta.name_et = $("#name_et").val();	
      		meta.name_en = $("#name_en").val();	

      		var data = {
	            query_id:query_id,
    	        query:query,
    	        meta:meta,
    	        test:test
	        };

     		$.getJSON('http://www.laastutabloo.ee:5000/save_query', data, function(data) {
	          	console.log(data);
	    			// $('#all_entries').html(data.html_string_selected);
					// $('#all_entries').val("");
					if (test==1){
						console.log("run query");
						runQuery();
					}
	           });

     		console.log("Save query:");
     		console.log(data);

     	} // function saveQuery

     	/////////////////////////////////////////////////////

     	function runQuery(){

     		var query_id = $("#query_id").val();

			table.setData("http://www.laastutabloo.ee:5000/run_query", {query_id:query_id, test:1, val1:1586, lat:58.0987895, lon:26.5563315, radius:34});

			var colDefs = table.getColumnDefinitions() //get column definition array

			console.log(colDefs);

			table.setColumns(colDefs) //overwrite existing columns with new columns definition array


     	}

     	/////////////////////////////////////////////////////



		$(document).ready(function(){
			$("#hideSQL").click(function(){
				$(this).hide();
				$('#readSQL').hide();
				$('#readSQLinfo').hide();
				$('#showSQL').show();
			});
		});
		
		$(document).ready(function(){
			$("#showSQL").click(function(){
				$(this).hide();
				$('#readSQL').show();
				$('#readSQLinfo').show();
				$('#hideSQL').show();
			});
		});
		
		$(document).ready(function(){
			$("#hideCSQL").click(function(){
				$(this).hide();
				$('#CustomSQL').hide();
				$('#readCSQLinfo').hide();
				$('#showCSQL').show();
			});
		});
		
		$(document).ready(function(){
			$("#showCSQL").click(function(){
				$(this).hide();
				$('#CustomSQL').show();
				$('#readCSQLinfo').show();
				$('#hideCSQL').show();
			});
		});
		
		$(document).ready(function(){
			$("#hideTemp").click(function(){
				$(this).hide();
				$('#templateSQL').hide();
				$('#templateinfo').hide();
				$('#showTemp').show();
			});
		});
		
		$(document).ready(function(){
			$("#showTemp").click(function(){
				$(this).hide();
				$('#templateSQL').show();
				$('#templateinfo').show();
				$('#hideTemp').show();
			});
		});


     ////////////////////////////////////////////////////
		

		var myId = "";
		var rList = "";
		var sList = "";
		var readSQLplaceholder = $('#readSQL').val();
		
		$("#all_classes").change(function() {
			rList = "";
			sList = "";
			$('input[name="radio"]').removeAttr("checked");
			$('input[name="checkbox"]').removeAttr("checked");			
			$('#readSQL').val(readSQLplaceholder);
			$("select[id='all_entries']").removeAttr("disabled");
			$('#all_entries option:selected').hide();

		});
	
		$("#all_entries").change(function() {
			rList = "";
			sList = "";
			$('input[name="radio"]').removeAttr("checked");
			$('input[name="checkbox"]').removeAttr("checked");	
			myId = $("#all_entries option:selected").text();
			updateReadSQL();		
		});
		
		$('input[name="radio"]').click(function () {	
			rList = "";
			$('input[name="radio"]').each(function () {
				var rThisVal = this.value;
				if (this.checked && (rThisVal == "ASC" || rThisVal == "DESC")){
					var rThisId = this.id;
					var rSplitId = rThisId.split("_");
					var textId = 'checkbox_'+rSplitId[1];
					var rValue = $("#"+textId).val();
					var rListAdd = rValue + " " + rThisVal;
					rList += (rList=="" ? rListAdd : ", " + rListAdd);					
				}				
			});
			updateReadSQL();

		});
		
		$('input[name="checkbox"]').click(function () {
			sList="";
			$('input[type=checkbox]').each(function () {
				if (this.checked) {				
					var sThisVal = this.value;
					sList += (sList=="" ? sThisVal : ", " + sThisVal);
				}
			});
			updateReadSQL();
		});	
		
		function updateReadSQL(){
			if (myId != ""){
				if (sList != "" && rList == ""){					
					$('#readSQL').val('SELECT ' + sList + ' FROM ' + myId);		
					return;
				}
				if (sList != "" && rList != ""){
						$('#readSQL').val('SELECT ' + sList + ' FROM ' + myId + ' ORDER BY ' + rList);		
						return;
					}
				if (sList == "" && rList != ""){
						$('#readSQL').val('SELECT * FROM ' + myId + ' ORDER BY ' + rList);		
						return;
					}
				
				$('#readSQL').val('SELECT * FROM ' + myId);	
			}
			
		}

	////////////////////////////////////////////////////


		var table = new Tabulator("#tablepreview", {
 	
		 	height:205, // set height of table (in CSS or here), this enables the Virtual DOM and improves render speed dramatically (can be any valid css height value)
		 	// data:tabledata, //assign data to table
		 	// layout:"fitColumns", //fit columns to width of table (optional)
		 	// columns:[ //Define Table Columns
			 // 	{title:"Name", field:"name", width:150},
			 // 	{title:"Age", field:"age", align:"left", formatter:"progress"},
			 // 	{title:"Favourite Color", field:"col"},
			 // 	{title:"Date Of Birth", field:"dob", sorter:"date", align:"center"},
		 	// ],
		 	autoColumns:true,
		 	rowClick:function(e, row){ //trigger an alert message when the row is clicked
		 		alert("Row " + row.getData().id + " Clicked!!!!");
		 	},
		});


	////////////////////////////////////////////////////


      $(document).ready(function() {

      	listQueries();

   		loadGeoJson("http://www.laastutabloo.ee:5000/run_query_geojson?query_id=geojson_from_avalik&val1='SyndmusLiik,JuhtumId'&val2=8151");


    //   	   $.getJSON('http://www.laastutabloo.ee:5000/_get_field_values', {
    //         // selected_class: $('#all_classes').val()


    //       }).success(function(data) {
    //       	console.log(data);
    // //             $('#all_entries').html(data.html_string_selected);
				// // $('#all_entries').val("");
    //        });


          // Run query
 		


        $('#all_classes').change(function(){
	
          $.getJSON('http://www.laastutabloo.ee:5000/_update_dropdown', {
            selected_class: $('#all_classes').val()

          }).success(function(data) {
                $('#all_entries').html(data.html_string_selected);
				$('#all_entries').val("");
           })
        });
        $('#process_input').bind('click', function() {

            /*$.getJSON('/_process_data', {
                selected_class: $('#all_classes').val(),
                selected_entry: $('#all_entries').val(),


            }).success(function(data) {
                $('#processed_results').text(data.random_text);
            })*/
          return false;

        });
      });