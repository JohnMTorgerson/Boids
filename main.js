// ---------- declare some global vars ---------- //
// html elements
var canvas;
var ctx;
var infoBox;

// animation variables
var stepRepeat; // the setInterval() object which loops each step
var isRunning = false; // whether the simulation is currently running or not
var interval = 20; // step interval in ms
var originalInterval = interval; // save the initial interval time (in case the user changes it)

// global boid properties
var swarm = []; // the array of boids
var numBoids = 100; // the number of boids
var size = 5; // length of boid in pixels
var maxAngleChange = 0.02 * 2 * Math.PI; // hard limit on angle change per step
var maxSpeed = 1.25 * size; // hard limit on vector magnitude per step (pixels * body length)
var forwardVelocity = 1; // forward velocity multiplier
var wanderVelocity = 0.10; // percentage of random velocity changes per step
var wanderAngle = 0.20; // percentage of random angle changes per step
var sightRadius = 15; // how many body-lengths the boid can see
// ^^^^ should break this out into alignRadius and clumpRadius to treat them separately
var boidAvoidRadius = 1.5; // how many body-lengths of personal space the boid notices
// ^^^^ should rename this nbrAvoidRadius
var nbrAvoidPower = 1.5; // increase weight by <distance> / <power>
var wallAvoidRadius = 20; // how many body-lengths the boid wants to stay away from walls
var wallAvoidPower = 2; // increase weight by <distance> / <power>

// for debugging, colors to display for each rule vector
var vectorOpacity = .5;
var goForwardColor  = '0,0,0';     //black
var wanderColor     = '255,165,0'; // orange
var avoidWallsColor = '255,0,255'; // magenta
var nbrClumpColor   = '0,255,255'; // cyan
var nbrAlignColor   = '0,255,0';   //green
var nbrAvoidColor   = '255,0,0';   // red

// ---------- RULE WEIGHTS ---------- //
// neighbor attraction rules
var nbrAlignWeight = 2;
var nbrClumpWeight = .5;
var nbrAvoidWeight = 15;
// obstacle avoidance rules
var wallAvoidWeight = 100000;

// create the boids and start the sim
function initiate() {
	// assign canvas elements
	canvas = document.getElementById("theCanvas");
	ctx = canvas.getContext("2d");
	
	infoBox = document.getElementById("info");
	infoBox.style.position = 'absolute';
	infoBox.style.left = canvas.width + 15 + 'px';
	
	
	// user events
	canvas.addEventListener("click", function() {
		togglePause(); // toggle play/pause
	}, false);
	window.addEventListener("keydown", function(e) {
		switch (e.keyCode) {
			case 32: // space bar
				console.log('**********  PLAY/PAUSE  **********');
				e.preventDefault();
				togglePause(); // toggle play/pause
				break;
			case 189: // minus
				console.log('**********    SLOWER    **********');
				slower(); // slow animation
				break;
			case 187: // plus
				console.log('**********    FASTER    **********');
				faster(); // speed up animation
				break;
			case 48: // 0
				console.log('********** NORMAL SPEED **********');
				resetSpeed(); // reset animation to original speed
				break;

		}	
	}, false);


	for (var i = 0; i < numBoids; i++) {
		swarm.push(new Boid());
		swarm[i].display();
//		console.log(swarm[i].forwardVelocity);
	}
	
	// start animation
	play();
}

// run each time step
function runStep() {
	console.log('----------- S T E P -----------');
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	for (var i = 0; i < swarm.length; i++) {
//		console.log('********* Boid ' + i + ' *********');
		swarm[i].updatePosition();
		swarm[i].display();
	}
}

// play animation
function play() {
	stepRepeat = setInterval(runStep, interval);
	isRunning = true;
}

// pause animation
function pause() {
	clearInterval(stepRepeat);
	isRunning = false;
}

// clear and restart interval
function resetInterval() {
	clearInterval(stepRepeat);
	stepRepeat = setInterval(runStep, interval);
	isRunning = true;
}


// toggle play/pause of the animation
function togglePause() {
	if (isRunning) {
		pause();
	} else {
		play();
	}
}

function slower() {
	interval *= 2;
	resetInterval();
}

function faster() {
	interval /= 2;
	resetInterval();
}

function resetSpeed() {
	interval = originalInterval;
	resetInterval();
}