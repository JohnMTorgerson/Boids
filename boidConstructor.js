// the boid constructor
function Boid() {
	// ----- default properties ----- //
	// set them to the values assigned by the global vars
	//	console.log('constructor: this.angle == ' + this.angle);
	this.angle = Math.random() * 2 * Math.PI; // initial angle
	this.forwardVelocity = forwardVelocity * Math.random() / 5 + .9; // how far to move forward (0.9-1.1)
	this.wanderVelocity = wanderVelocity * this.forwardVelocity; // percentage of random velocity changes per step
	this.wanderAngle = wanderAngle * 2 * Math.PI; // range of random angle wandering (0 - 2π)
	this.size = size; // size (length in pixels)
	this.maxSpeed = maxSpeed;
	this.maxAngleChange = maxAngleChange;
	this.sightRadius = sightRadius * this.size; // how far it can see
	this.boidAvoidRadius = boidAvoidRadius * this.size; // personal space it likes
	this.nbrAvoidPower = nbrAvoidPower; // increase weight by <distance> / <power>
	this.wallAvoidRadius = wallAvoidRadius * this.size; // stay this far away from walls
	this.wallAvoidPower = wallAvoidPower; // increase weight by <distance> / <power>
	this.pos = {} // the x and y coordinates we're at now
	this.pos.x = Math.random() * canvas.width// - (2 * this.forwardVelocity + this.forwardVelocity); // initial x-position w/buffer
	this.pos.y = Math.random() * canvas.height// - (2 * this.forwardVelocity + this.forwardVelocity); // initial y-position w/buffer
	this.move = { 'x' : 0, 'y' : 0 }; // the coordinate distances we will move by each step
	// ----- rule weights ----- //
	// set them to the values assigned by the global vars
	this.nbrAlignWeight = nbrAlignWeight;
	this.nbrClumpWeight = nbrClumpWeight;
	this.nbrAvoidWeight = nbrAvoidWeight;
	this.wallAvoidWeight = wallAvoidWeight;

	// draw the boid on the canvas
	this.display = function() {  
		var xTail = this.pos.x - this.size * Math.cos(this.angle);
		var yTail = this.pos.y - this.size * Math.sin(this.angle);

		ctx.beginPath();
		ctx.moveTo(this.pos.x, canvas.height - this.pos.y); // display it upside down, helps w/ angle shit
		ctx.lineTo(xTail, canvas.height - yTail); // display it upside down, helps w/ angle shit
		ctx.closePath();
		ctx.lineWidth = 1;
		ctx.strokeStyle = 'black';
		ctx.globalAlpha = '1';
		ctx.stroke();
	}

	// just for testing/debugging purposes, display the vector from this.pos to this.mov
	this.addDebugVector = function(color) {
		return;
		var size = 15; // multiply the vectors by this factor to make them more visible
		var startX = this.pos.x + size * this.oldMove.x; // the x coord to start the path on (the end of the last vector)
		var startY = this.pos.y + size * this.oldMove.y; // the y coord to start the path on (the end of the last vector)
		var endX   = this.pos.x + size * this.move.x; // the x coord to end the path on
		var endY   = this.pos.y + size * this.move.y; // the y coord to end the path on

		ctx.beginPath();
		ctx.moveTo(startX, canvas.height - startY); // display it upside down, helps w/ angle shit
		ctx.lineTo(endX, canvas.height - endY); // display it upside down, helps w/ angle shit
		ctx.closePath();
		
		if (typeof color == 'undefined') {
			color = '0,0,0'; // black will be the default color (<opacity> is a global variable)
		}
		ctx.strokeStyle = 'rgba(' + color + ',' + vectorOpacity + ')';
		ctx.lineWidth = .5;
		ctx.stroke();


//		console.log('this.oldMove == ' + JSON.stringify(this.oldMove) + '   this.move == ' + JSON.stringify(this.move));
//		console.log('Start: [' + startX + ',' + startY + ']   End: [' + endX + ',' + endY + ']  (' + color + ')');

		this.oldMove = {x:this.move.x,y:this.move.y}; // save this.move in this.oldMove
	}
	
	this.displayVectors = function() {
	}

	// this is the decision-maker method;
	// it applies all the rules and calculates
	// the new position to display for each step
	this.updatePosition = function() {
		var neighbors = this.findNeighbors(this.sightRadius);

		// reset the coordinate distances we want to move by
		this.move.x = 0;
		this.move.y = 0;
		this.oldMove = {x:'0',y:'0'}; // this is just for debugging purposes
		
		// EXECUTE RULES
		// each of these rules adds to 'this.move'
		this.goForward(); // simply go forward at a preset rate
		this.addDebugVector(goForwardColor);
		this.wander(); // a slight random wandering
		this.addDebugVector(wanderColor);
		this.nbrClump(neighbors); // tend to get near neighbors
		this.addDebugVector(nbrClumpColor);		this.nbrAvoid(swarm); // avoid nearby boids
		this.addDebugVector(nbrAvoidColor);
		this.nbrAlign(neighbors); // tend to align angle with neighbors
		this.addDebugVector(nbrAlignColor);
		this.avoidWalls(); // steer away from walls
		this.addDebugVector(avoidWallsColor);

		// IMPOSE VELOCITY AND ANGLE LIMITS HERE
		this.limitMove();
		
		var oldCoords = {'x':this.pos.x,'y':this.pos.y}//Object.assign({},this.pos); // clone the current position into a copy
//		this.angle = this.findAngle({x:this.pos.x,y:this.pos.y},{x:this.pos.x + this.move.x,y:this.pos.y + this.move.y});
		// update position coordinates
//		console.log('updatePosition() : move == ' + this.move.x + ',' + this.move.y);
		this.pos = this.sumProps(this.pos, this.move);
//		this.pos.x += this.move.x;
//		this.pos.y += this.move.y;
		// update angle
		var newAngle = this.findAngle(oldCoords,this.pos);
		if (newAngle != undefined) { // newAngle will be undefined if there was no movement
//			console.log('Setting new angle to ' + newAngle);
			this.angle = newAngle; // if there was any movement, set new angle
		}

		// impose toroidal geometry so the little bastards don't get away
		/*		this.x = this.x % canvas.width;
			this.y = this.y % canvas.height;
			if (this.x < 0) this.x = canvas.width + this.x;
			if (this.y < 0) this.y = canvas.height + this.y;
			*/
		
		// console.log(this.angle / Math.PI + " pi");
	}

	// method to find all the other boids within 'radius'
	// and return them in an array
	this.findNeighbors = function(radius) {
		// set a default sight radius
		if (radius === 'undefined') {
			radius = 3 * this.size; // default radius
		}
		// loop through all the boids and find the close ones
		var neighbors = [];
		for (var i = 0; i < swarm.length; i++) {
			var other = swarm[i];
			if (other != this) { // don't count ourself as a neighbor
				var distance = this.getDistance(this,other);
				// if we're close enough to see this guy, he's our bud
				if (distance <= radius) {
					neighbors.push(other);
				}
			}
		}
		return neighbors;
	}

	// find the distance between two points
	this.getDistance = function(p1,p2) {
		// get x and y distances in (1-dimensional) circular space
		//				var distX = this.circularDistance(other.x, this.x, canvas.width);
		//				var distY = this.circularDistance(other.y, this.y, canvas.height);
		
		var distX, distY, p1x, p1y, p2x, p2y;
		
		// allow the parameters to contain the coordinates within either *.pos or directly on the object itself
		if ('pos' in p1) {
			p1x = p1.pos.x;
			p1y = p1.pos.y;
		} else {
			p1x = p1.x;
			p1y = p1.y;
		}
		if ('pos' in p2) {
			p2x = p2.pos.x;
			p2y = p2.pos.y;
		} else {
			p2x = p2.x;
			p2y = p2.y;
		}

		// get x and y distances
		var distX = p1x - p2x;
		var distY = p1y - p2y;

		// get high on potenuse
		return Math.sqrt(Math.pow(distX, 2) + Math.pow(distY, 2));
	}

	// find 1-dimensional distance in circular space;
	this.circularDistance = function(p1, p2, size) {
		return Math.min(Math.abs(p1 - p2), size / 2);
	}

	/*
	// method to calculate new angle
	// based on x and y coords to aim at
	// and a weight (0-1 multiplier) to adjust by
	this.adjustAngle = function(newX, newY, weight) {
		var x = this.pos.x - newX;
		var y = this.pos.y - newY;
		var newAngle = Math.atan2(y,x) + Math.PI;
		var difference = newAngle - this.angle;
		if (difference > Math.abs(difference - 2 * Math.PI)) difference = difference - 2 * Math.PI; // always take the shorter way around
		var tempAngle = this.angle + difference * weight;
		this.angle = tempAngle < 0 ? tempAngle + 2 * Math.PI : tempAngle; // force angle to always be positive
	}
	*/

	// find an angle from 'here' to 'there'
	// 'here' and 'there' should be objects that contain coordinates: obj.x and obj.y
	this.findAngle = function(here, there) {		
		var x = here.x - there.x;
		var y = here.y - there.y;
		
		if (x==0 && y==0) {
			return undefined;
		}
		
		var newAngle = Math.atan2(y,x) + Math.PI;
		
		return newAngle;
		/*    var difference = newAngle - this.angle;
	if (difference > Math.abs(difference - 2 * Math.PI)) difference = difference - 2 * Math.PI; // always take the shorter way around
		var tempAngle = this.angle + difference * weight;
		this.angle = tempAngle < 0 ? tempAngle + 2 * Math.PI : tempAngle; // force angle to always be positive*/
	}

	// given a set of coordinates to aim at or an angle
	// ('aim' can be either, so if coords we convert into an angle)
	// and a 'weight', which is treated as a vector magnitude
	// and (optionally) a location to calculate the vector from (current position by default if parameter is not passed)
	// calculate and return the vector addend (which should then be added to the running vector sum
	// which will eventually be added to the current position to determine the coordinates to move to on the next step)
	this.calcMove = function(aim, weight, here) {
//		console.log('this.addMove: aim.typeof == ' + typeof aim);
		var move = {};
		var angle;

		// if we were only passed coordinates with no weight
		// then all we need to do is add those coordinates
		// to the 'move' object and return it
		// (we should never be passed only an angle with no weight)
		if (typeof weight === 'undefined' && typeof aim === 'object') {
			// add new coordinates to the 'move' object, and return it
			move.x = aim.x - this.pos.x;
			move.y = aim.y - this.pos.y;
			return move;
		}
		// default position to calculate from is the one we're on
		if (typeof here === 'undefined') {
			here = this.pos;
		}
		// if 'aim' is a number, then it's an angle
		if (typeof aim === 'number') {
			angle = aim;
		}
		// if 'aim' is an object, then it's coordinates: {'x':x,'y':y}
		else if (typeof aim === 'object') {
			// calculate the angle from here to those coordinates
			angle = this.findAngle(here,aim);
//			console.log('this.addMove: angle == ' + angle);
		}
		
		// if angle comes back undefined, that's because we're in the same position
		// that we're trying to get to
//			console.log('calcMove() : angle == ' + angle);
		
		// add new coordinates to the 'move' object, and return it
		move.x = weight * Math.cos(angle);
		move.y = weight * Math.sin(angle);
		return move;
	}
	
	// this method is called by each of the RULE methods each step to change our course;
	// given a set of coords or an angle to aim at and a weight,
	// we call calcMove() to find a new set of coords to go to
	// which we will vector-add to the 'this.move' property
	// which will ultimately be used to change the course of the boid each step
	this.addMove = function(aim, weight) {
		var move = this.calcMove(aim, weight);
		
//		this.move.x += move.x;
//		this.move.y += move.y;
		this.move = this.sumProps(this.move,move);
	}
	
	// limit the total vector sum each step
	// to a maximum determined by maxSpeed and maxAngleChange
	this.limitMove = function() {
//		console.log('LIMITING MOVE: this.pos==' + JSON.stringify(this.pos) + '\n               this.move==' + JSON.stringify(this.move));
		
		var angle = this.findAngle(this.pos,this.sumProps(this.pos,this.move)); // the angle we want to move to
		var angleChange = angle - this.angle; // might be negative
		var magnitude = this.getDistance(this.pos,this.sumProps(this.pos,this.move)); // the magnitude we want to move by
		
		// limit the magnitude and angle change of the move
		if (magnitude > this.maxSpeed) { // if the magnitude exceeds the maximum
			magnitude = this.maxSpeed; // set it to the maximum
		}
		if (Math.abs(angleChange) > this.maxAngleChange) { // if the angle change exceeds the maximum
			angleChange *= Math.abs(this.maxAngleChange / angleChange); // set it to the maximum (preserving sign)
			angle = this.angle + angleChange; // add limited angle change to this.angle to get the new angle
			if (angle < 0) { // if the resulting angle is negative
				angle = angle + 2 * Math.PI; // add 2pi to make it positive
			}
			angle = angle % (2 * Math.PI); // if it's greater than 2pi, wrap it around
		}
		
		// reset the this.move coordinates to the adjusted values
		this.move = this.calcMove(angle, magnitude);
	}
	
	// add the values of two objects together
	// this method is not recursive, and will yield useless/unexpected results
	// on object attributes that are not addable (i.e. anything but numbers, strings)
	// if an attribute is not common to both objects, put it in the resulting object as-is
	this.sumProps = function(obj1,obj2) {
		var objSum = {};
		
		// loop through obj1 and add any attributes it has in common with obj2
		// if it has an attribute and ob2 doesn't, simply give objSum that attr with obj1's value
		for (var attr in obj1) {
			if (obj1.hasOwnProperty(attr)) {
				if (obj2.hasOwnProperty(attr)) {
					objSum[attr] = obj1[attr] + obj2[attr];
				} else {
					objSum[attr] = obj1[attr];
				}
			}
		}
		// now loop through obj2 and give any of its attributes not in obj1 to sumObj
		for (var attr in obj2) {
			if (!objSum.hasOwnProperty(attr) && obj2.hasOwnProperty(attr)) {
				objSum[attr] = obj2[attr];
			}
		}
		return objSum;
	}
	
	// calculate avoidance of a given position
	this.avoidPos = function(here, avoid, weight, power) {
		var awayAngle = (this.findAngle(here,avoid) + Math.PI) % (2 * Math.PI); // calculate angle away from 'avoid'
		var distance = this.getDistance(here, avoid);
//		console.log('away angle: ' + awayAngle);
//		console.log('distance: ' + distance);
		var magnitude = 0;
		if (distance != 0) { // calculate magnitude only if distance isn't zero
			magnitude = weight / Math.abs(Math.pow(distance,power)); // magnitude is (coefficient / distance^power)
		}
//		console.log('distance magnitude: ' + magnitude);
		var thisMove = this.calcMove(awayAngle, magnitude, here);
		return this.sumProps(here,thisMove);
	}

	// ************************************************** //
	// ************************************************** //
	// ************************************************** //
	// -------------------------------------------------- //
	// ------------------- R U L E S -------------------- //
	// -------------------------------------------------- //
	// ************************************************** //
	// ************************************************** //
	// ************************************************** //


	// ----- basic move rules ----- //
	// go forward in a straight line by a globally specified velocity
	this.goForward = function() {
//		console.log('this.goForward: this.angle == ' + this.angle);
		this.addMove(this.angle,this.forwardVelocity);
	}
	// randomly wander a little bit
	this.wander = function() {
		var angle = this.wanderAngle * (2 * Math.random() - 1);
		var velocity = this.wanderVelocity * (2 * Math.random() - 1);
		this.addMove(angle,velocity);
	}

	// ----- obstacle avoidance rules ----- //
	// avoid canvas boundaries
	// if distance to nearest x and/or y wall is less than threshold,
	// move away from them; if both are less than threshold, avoid both separately
	// and each vector will be added to the move
	this.OLDavoidWalls = function() {
		var moveTo; // the point to move towards in order to avoid the wall (or to move back towards it if we're out of bounds)
		
		// find distance to nearest walls
		var distX = Math.min(this.pos.x - 0, canvas.width - this.pos.x);
		var distY = Math.min(this.pos.y - 0, canvas.height - this.pos.y);
		var distance = Math.min(distX,distY);
//		console.log('distX: ' + distX + ', distY: ' + distY + ', distance: ' + distance);
 
		// if we're too close to a wall, aim away from the nearest point on the wall
		// (or if we're past the wall, aim back towards it)
		if (distance < this.wallAvoidRadius) {
			var nearestPoint = {}; // the coordinates of the nearest point on the wall that we want to go away from
			var nearestX = this.pos.x < canvas.width / 2 ? 0 : canvas.width; // nearest wall in the x-axis
			var nearestY = this.pos.y < canvas.height / 2 ? 0 : canvas.height; // nearest wall in the y-axis
			if (distX < distY) { // if the nearest wall is left/right (instead of top/bottom)
				nearestPoint.x = nearestX;
				nearestPoint.y = this.pos.y;
			} else { // the nearest wall is top/bottom (instead of left/right), or else they're equidistant (so we'll privilege y I guess... it probably doesn't really matter)
				nearestPoint.x = this.pos.x;
				nearestPoint.y = nearestY;
			}
			// so now that we know the coordinates of the nearest walls, we need to
			// either avoid or move towards the coordinates, depending on whether we're in or out of bounds, respectively
			if (distance > 0) { // we're inside the walls, so avoid the walls
				moveTo = this.avoidPos(this.pos, nearestPoint, this.wallAvoidWeight, 2);
			} else { // we're outside the walls, so move toward the walls
				var angle = this.findAngle(this.pos,nearestPoint);
//				console.log('angle towards nearestPoint: ' + angle);
				if (typeof angle !== 'undefined') { // we'll have an angle as long as the distance != 0
					var weight = this.wallAvoidWeight * Math.abs(Math.pow(distance,2)); // compensate for the weight so that it increases as we get farther away from the wall
//					console.log('weight: ' + weight);
					moveTo = this.sumProps(this.pos,this.calcMove(angle, weight)); // calculate coordinates TOWARDS the wall
				} else { // if the distance == 0, the angle will be undefined
					moveTo = this.pos; // so we just go nowhere
				}
			}
//			console.log('move to: ' + JSON.stringify(moveTo));

			// add the coordinates to the master vector
			this.addMove(moveTo);
		}
	}
	this.avoidWalls = function() {
		var moveTo; // the point to move towards in order to avoid the wall (or to move back towards it if we're out of bounds)
		
		// find distance to nearest walls
		var distX = Math.min(this.pos.x - 0, canvas.width - this.pos.x);
		var distY = Math.min(this.pos.y - 0, canvas.height - this.pos.y);
//		console.log('distX: ' + distX + ', distY: ' + distY);
		
		// if we're too close to a wall, aim away from the nearest point on the wall
		// (or if we're past the wall, aim back towards it)
		if (distX < this.wallAvoidRadius) {
			this.avoidWall(distX,'x');
		}
		if (distY < this.wallAvoidRadius) {
			this.avoidWall(distY,'y');
		}

		
	}
	
	// called by this.avoidWalls() when we're within this.wallAvoidRadius of a wall
	// avoid a specific wall (whether x or y)
	// <distance> is the distance to the wall we care about
	// <axis> is a string, either 'x' or 'y', which tells us whether it's a vertical or horizontal wall, respectively
	this.avoidWall = function(distance,axis) { 
		var nearestPoint = {}; // the coordinates of the nearest point on the wall that we want to go away from
		var otherAxis = axis == 'x' ? 'y' : 'x'; // the opposite axis of <axis>
		var widthOrHeight = axis == 'x' ? 'width' : 'height'; // 'width' or 'height' depending on whether <axis> is 'x' or 'y'
		var nearestWall = this.pos[axis] < canvas[widthOrHeight] / 2 ? 0 : canvas[widthOrHeight]; // coord of nearest wall in the axis we care about
		
		// find the nearest point on the wall we care about;
		nearestPoint[axis] = nearestWall; // e.g. nearestPoint.x == 0 if we're doing the x-axis and we're closer to the left than to the right
		nearestPoint[otherAxis] = this.pos[otherAxis]; // e.g. nearestPoint.y == this.pos.y if we're doing the x-axis
		
		// so now that we know the coordinates of the nearest walls, we need to
		// either avoid or move towards the coordinates, depending on whether we're in or out of bounds, respectively
		if (distance > 0) { // we're inside the walls, so avoid the walls
			moveTo = this.avoidPos(this.pos, nearestPoint, this.wallAvoidWeight, this.wallAvoidPower);
		} else { // we're outside the walls, so move toward the walls
			var angle = this.findAngle(this.pos,nearestPoint);
//			console.log('angle towards nearestPoint: ' + angle);
			if (typeof angle !== 'undefined') { // we'll have an angle as long as the distance != 0
				var weight = this.wallAvoidWeight * Math.abs(Math.pow(distance,this.wallAvoidPower)); // compensate for the weight so that it increases as we get farther away from the wall
//				console.log('weight: ' + weight);
				moveTo = this.sumProps(this.pos,this.calcMove(angle, weight)); // calculate coordinates TOWARDS the wall
			} else { // if the distance == 0, the angle will be undefined
				moveTo = this.pos; // so we just go nowhere
			}
		}
//		console.log('move to: ' + JSON.stringify(moveTo));

		// add the coordinates to the master vector
		this.addMove(moveTo);
		
	}

	
	// ----- neighbor (nbr) rules ----- //
	// align to mean angle of neighbors
	this.nbrAlign = function(neighbors) {
		if (neighbors.length > 0) {
			var meanX = 0;
			var meanY = 0;
			for (var i = 0; i < neighbors.length; i++) {
				meanX += Math.cos(neighbors[i].angle);
				meanY += Math.sin(neighbors[i].angle);
			}
			var meanAngle = Math.atan2(meanY,meanX);
			this.addMove(meanAngle, this.nbrAlignWeight);
			//        this.angle += (meanAngle - this.angle) * this.nbrAlignWeight;
		}
	}
	// aim to mean position of neighbors
	this.nbrClump = function(neighbors) {
		if (neighbors.length > 0) {
			var mean = {};
			mean.x = 0;
			mean.y = 0;
			for (var i = 0; i < neighbors.length; i++) {
				mean.x += neighbors[i].pos.x;
				mean.y += neighbors[i].pos.y;
			}
			mean.x /= neighbors.length;
			mean.y /= neighbors.length;

			//        return this.adjustAngle(meanX, meanY, this.nbrClumpWeight);
			this.addMove(mean,this.nbrClumpWeight);
		}
	}
	// move away from neighbors if we get too close
	this.nbrAvoid = function(swarm) {
		var moveTo = {x:this.pos.x,y:this.pos.y};
		for (var i=0; i<swarm.length; i++) { // loop through every boid
			var other = swarm[i];
			var distance = this.getDistance(this, other);
			
			// only care about boids within the boidAvoidRadus and boids that are farther away than 0
			// (this should also stop us avoiding ourself, which would result in an 'undefined' return from this.findAngle())
			if (distance > 0 && distance < this.boidAvoidRadius) {
				// calculate coordinates to move to
				// and add them to moveTo
				moveTo = this.avoidPos(moveTo,other.pos,this.nbrAvoidWeight,this.nbrAvoidPower);
			}
		}
		// add total vector to the sum of our current trajectory
		this.addMove(moveTo);
	}
}
