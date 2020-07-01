var camera, scene, renderer, controls, stats;
var mesh;
var meshes = [];

var clock;

var params = {
	laastX: 27, // number of shingles X
	laastY: 12, // number of shingles Y
	laastW: 180, // width of a shingle
	laastH: 295, // height of a shingle
	laastD: 10, // depth of a shingle
	margin: 50 // margins around a shingle
};

var letters = {};
var lastTime = 0;


params.offsetX = (params.laastX * ( params.laastW + params.margin) - params.margin) / 2;	
params.offsetY = (params.laastY * ( params.laastH + params.margin) - params.margin) / 2;	
		
var laastud = [];

params.renderW = window.innerWidth;
params.renderH = window.innerWidth/160*100;

if(params.renderW > 1920){
	params.textureSize = 200;
} else if(params.renderW > 1000){
	params.textureSize = 100;
} else {
	params.textureSize = 50;
}

init();
animate();



 

function getLetters(){

	$.getJSON( "json/letters.json", function( data ) {

		for (var i = 0; i < data.length; i++) {
			
			var id = data[i].letter;
			
			letters[id] = data[i];
			letters[id].texture = new THREE.TextureLoader().load( 'letters2/jpg'+ params.textureSize +'/letter_'+ data[i].filename +'.jpg' );
			letters[id].material = new THREE.MeshBasicMaterial( { map: letters[id].texture } );

		}
	});

}

function init() {

	getSlides();

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

	getLetters();
	
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

/////////////////////////////////////////////////////////////

var nextSlides = [];

function parseSlides(slides){

	var newSlides = [];

	for (var i = 0; i < slides.queries.length; i++) {

		if(slides.queries[i].pages){

				for (var j = 0; j < slides.queries[i].pages.length; j++) {

					newSlides.push(slides.queries[i].pages[j]);

				}


		}
	}

	nextSlides = newSlides;
	changeSlide();

	console.log(nextSlides);

}

/////////////////////////////////////////////////////////////

function getSlides(ehak,queries,language){

	$.getJSON( "json/slides.json", function( data ) {

		parseSlides(data);

	});

} // function

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

function rotateRow(x,deg,dir){

	for (var i = 0; i < params.laastX; i++) {
		setTimeout(function(i,x,dir){
			rotateLaast(i,x,deg,dir,0);
		},Math.random()*1000,i,x,dir);
		
	}

}

function changeLetter(x,y,letter){

	laastud[x][y].newLetter = letter;

}

function changeSlide(){

	for (var y = 0; y < nextSlides[0].length; y++) {
		for(var x = 0; x < params.laastX; x++){
			if(nextSlides[0][y][x] == " "){
				laastud[x][y].newLetter = "tyhik";

			} else {
				laastud[x][y].newLetter = nextSlides[0][y][x].toUpperCase();
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

				console.log("Change letter to " + laastud[x][y].newLetter);

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

