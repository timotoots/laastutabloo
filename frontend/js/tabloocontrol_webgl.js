///////////////////////////////////////////////////////////////////////////
//
//  TablooControl interface of WebGL version
// 
//  Exposes functions: changeLetter, rotateLaast, runQueue
//
///////////////////////////////////////////////////////////////////////////

(function() {

  var TablooControl = (function() {


	// Constructor function

    var TablooControl = function(params_in) {
      	
      	console.log("Start TablooControl WebGL!");
		
		params = params_in;
		params.laastW = 180; // width of a shingle
		params.laastH = 295; // height of a shingle
		params.laastD = 10; // depth of a shingle
		params.margin = 50; // margins around a shingle

      	init();
	  	animate();

    };


    // Global variables
  	var params;

	var camera, scene, renderer, controls, stats;
	var mesh;
	var meshes = [];

	var clock;

	var letters = {};
	var lastTime = 0;

	var laastud = [];

	///////////////////////////////


function init() {


	params.offsetX = (params.laastX * ( params.laastW + params.margin) - params.margin) / 2;	
	params.offsetY = (params.laastY * ( params.laastH + params.margin) - params.margin) / 2;	


	params.renderW = window.innerWidth;
	params.renderH = window.innerWidth/160*100;

	if(params.renderW > 1920){
		params.textureSize = 200;
	} else if(params.renderW > 1000){
		params.textureSize = 100;
	} else {
		params.textureSize = 50;
	}


	// Camera
	camera = new THREE.PerspectiveCamera( 40, params.renderW / params.renderH, 1, 10000 );
	camera.position.y = 8000;

	// Renderer
	renderer = new THREE.WebGLRenderer( { antialias: true } );
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( params.renderW, params.renderH);
	document.getElementById("tabloo_wrapper").appendChild( renderer.domElement );

	// FPS Stats
	// stats = new Stats();
	// document.getElementById("body").appendChild( stats.dom );

	// Controls
	controls = new THREE.OrbitControls( camera, renderer.domElement );
	controls.minDistance = 100;
	controls.maxDistance = 8000;
	controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
	controls.dampingFactor = 0.25;
	controls.screenSpacePanning = false;
	// controls.maxPolarAngle = Math.PI / 2;

	// Others
	scene = new THREE.Scene();
	clock = new THREE.Clock();


	///////////////////////////////
	// Init shingle array

	for (var x = 0; x < params.laastX; x++) {
		if(typeof laastud[x] === "undefined"){
			laastud[x] = [];
		}

		for (var y = 0; y < params.laastY; y++) {
			if(typeof laastud[x][y] === "undefined"){
				laastud[x][y] = {};
			}

			laastud[x][y].targetRotation = 0;
			laastud[x][y].rotateDirection = -1;
			if(x==1 && y==1){
				laastud[x][y].targetRotation = 360;
				laastud[x][y].rotateDirection = 1;
			}

			laastud[x][y].currentLetter = 0;
			laastud[x][y].newLetter = 0;

		}
	}

	///////////////////////////////
	// Load letters as textures

	// for (var i = 0; i < Things.length; i++) {
	// 	Things[i]
	// }

	// for (var i = 0; i < 9; i++) {
		
	// 	letters[i] = {};
	// 	letters[i].texture = new THREE.TextureLoader().load( 'letters/letter_'+ i +'.jpg' );
	// 	letters[i].material = new THREE.MeshBasicMaterial( { map: letters[i].texture } );

	// }

	// Get letters



	
	var default_texture = new THREE.TextureLoader().load( 'letters2/jpg'+ params.textureSize +'/letter_tyhik.jpg' );
	var default_material = new THREE.MeshBasicMaterial( { map: default_texture } );

	///////////////////////////////
	// Create meshes

	var geometry = new THREE.BoxBufferGeometry(params.laastW, params.laastD,params.laastH);

	for (var x = 0; x < params.laastX; x++) {
		
		if(typeof meshes[x] === "undefined"){

			meshes[x] = [];

		}
		

		for (var y = 0; y < params.laastY; y++) {

			meshes[x][y] = new THREE.Mesh( geometry, default_material );
			meshes[x][y].position.x =  -params.offsetX + (params.laastW + params.margin)*x - params.margin/2;
			meshes[x][y].position.y = 0;
			meshes[x][y].position.z =  -params.offsetY + (params.laastH + params.margin)*y - params.margin/2;
			scene.add( meshes[x][y] );

		}
	}


	///////////////////////////////
	// Listen to events	

	// window.addEventListener( 'resize', onWindowResize, false );

}

	function loadLetters(data){

		for (var i = 0; i < data.length; i++) {
			
			var id = data[i].letter;
			
			letters[id] = data[i];
			letters[id].texture = new THREE.TextureLoader().load( 'letters2/jpg'+ params.textureSize +'/letter_'+ data[i].filename +'.jpg' );
			letters[id].material = new THREE.MeshBasicMaterial( { map: letters[id].texture } );

		}

	}


	/////////////////////////////////////////////////////////////

	function onWindowResize() {

		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();

		renderer.setSize( window.innerWidth, window.innerHeight );

	}

	/////////////////////////////////////////////////////////////
	// Shingle controls 

	function rotateLaast(x,y,deg,dir,time){

		laastud[x][y].rotateDirection = dir;
		laastud[x][y].targetRotation = deg;

	}


	function changeLetter(x,y,letter){

		laastud[x][y].newLetter = letter;

	}

	/////////////////////////////////////////////////////////////

	function runQueue(queue){

      console.log("Run Queue");

        for(var x = 0; x < params.laastX; x++){
          for (var y = 0; y < params.laastY; y++) {
           
          	queue[x][y].laastTime = 0;

            for (var i in queue[x][y]){

              var msg = queue[x][y][i];


              if(msg.parameter == "delay"){

                queue[x][y].laastTime += msg.time;

              } else if(msg.parameter == "rotate"){

                queue[x][y].laastTime += msg.time;

                setTimeout(function(x,y,deg,dir){
                   rotateLaast(x,y,deg,dir,0);
                 },queue[x][y].laastTime,x,y,msg.value,msg.value2,0);


              } else if(msg.parameter == "letter"){

                setTimeout(function(x,y,letter){
                   changeLetter(x,y,letter);
                 },queue[x][y].laastTime,x,y,msg.value);

                queue[x][y].laastTime += msg.time;
              }

            }


          }
        }



    }


	/////////////////////////////////////////////////////////////

	function animate() {

		requestAnimationFrame( animate );

			/////////////////////////////////////////////////////////////
			// Timing and speed

			time = clock.getElapsedTime();
			delta = clock.getDelta();
			if(time - lastTime > 1){
				// console.log(time);
				lastTime = time;
			}

			/////////////////////////////////////////////////////////////
			// Update all shingles

		for (var x = 0; x < params.laastX; x++) {					
			for (var y = 0; y < params.laastY; y++) {

				///////////////////////////////
				// Change letter textures

				

				if(laastud[x][y].currentLetter != laastud[x][y].newLetter){

					// console.log("Change letter to " + laastud[x][y].newLetter);

					meshes[x][y].material = letters[laastud[x][y].newLetter].material;
					laastud[x][y].newLetter = laastud[x][y].currentLetter;
				}


				///////////////////////////////
				// Change shingle rotation

				var rot = laastud[x][y].rotateDirection * 3;

				var targetRotation = rad2deg(meshes[x][y].rotation.x) + rot;
				
				if(targetRotation > laastud[x][y].targetRotation && rot > 0){
					// console.log("target reached");
					meshes[x][y].rotation.x = deg2rad(laastud[x][y].targetRotation);
					laastud[x][y].rotateDirection = 0;

				} else if(targetRotation < laastud[x][y].targetRotation && rot < 0){
					// console.log("target reached");
					meshes[x][y].rotation.x = deg2rad(laastud[x][y].targetRotation);
					laastud[x][y].rotateDirection = 0;
				} else if(targetRotation == laastud[x][y].targetRotation || rot == 0){
					 //console.log("target reached");
				} else {
					meshes[x][y].rotation.x += deg2rad(rot);
					// console.log(rot);
					// console.log(meshes[x][y].rotation.x);
				}

				///////////////////////////////



			} // for
		} // for

			/////////////////////////////////////////////////////////////
			// Other updates

		renderer.render( scene, camera );
		// stats.update();
		controls.update();

	}

	/////////////////////////////////////////////////////////////
	// Useful functions

	// Converts from degrees to radians.
	function deg2rad(degrees) {
	  return degrees * Math.PI / 180;
	};

	// Converts from radians to degrees.
	function rad2deg(radians) {
	  return radians * 180 / Math.PI;
	};

	/////////////////////////////////////////////////////////////
	// Functions exposed



    TablooControl.prototype.changeLetter = changeLetter;
    TablooControl.prototype.rotateLaast = rotateLaast;
	TablooControl.prototype.loadLetters = loadLetters;
	TablooControl.prototype.runQueue = runQueue;



	/////////////////////////////////////////////////////////////

    return TablooControl;
  })();

  if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
    module.exports = TablooControl;
  else
    window.TablooControl = TablooControl;
})();
