// this function can be called on page load to run unit tests;
//
function unitTests() {
	boidAvoidWalls();
}


/**************** BOID RULES ****************/

// test the avoidWalls method
function boidAvoidWalls() {
//	console.log('');
	
	var w = canvas.width;
	var h = canvas.height;
	
	// the positions of all the boids we want to test in relation to the canvas size
	var testPoints = [
	{ 'x' : w *  1.50, 'y' : h *  0.75, 'loc' : 'outside right, inside top'    },
	{ 'x' : w *  0.75, 'y' : h *  1.50, 'loc' : 'inside right,  outside top'   },
	{ 'x' : w * -1.50, 'y' : h *  0.75, 'loc' : 'outside left,  inside top'    },
	{ 'x' : w * -0.75, 'y' : h *  1.50, 'loc' : 'outside left,  outside top'   },
	{ 'x' : w *  1.50, 'y' : h * -0.75, 'loc' : 'outside right, outside bottom'},
	{ 'x' : w *  0.75, 'y' : h * -1.50, 'loc' : 'inside right,  outside bottom' },
	{ 'x' : w * -1.50, 'y' : h * -0.75, 'loc' : 'outside left,  outside bottom' },
	{ 'x' : w * -0.75, 'y' : h * -1.50, 'loc' : 'outside left,  outside top'    },
	];
	
	// loop through all the positions we want to test, and create boids at those positions;
	// then log the positions and the points that avoidWalls() wants to aim them at
	for (var i=0; i<testPoints.length; i++) {
		console.log('---------- BOID ' + testPoints[i].loc + ' ----------');
		
		var boid = new Boid();
		var swarm = [boid];
		boid.pos.x = testPoints[i].x; // set the x position to whatever value we want to test
		boid.pos.y = testPoints[i].y; // set the y position to whatever value we want to test
		
		console.log('current position: ' + JSON.stringify(boid.pos));
		
		boid.avoidWalls();
		
		console.log('moveTo  position: ' + JSON.stringify(boid.move));
	}
}