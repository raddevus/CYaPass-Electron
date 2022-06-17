const Crypto = require('crypto');

// #######################
var centerPoint = 50;
var postWidth = 6;
var numOfCells = 6;
var offset = 5;
var cellSize = 50;
var postSize = 6;
var allPosts = [];
var postOffset = Math.trunc(postSize / 2)
var us = new UserPath();
let pwd = "";
let pwdBuffer = null;

function Point (p){
	this.x = p.x || -1;
	this.y = p.y || -1;
}

function generateAllPosts(){
	allPosts = [];
	for (var x = 0; x < numOfCells; x++)
	{
		for (var y = 0; y < numOfCells; y++)
		{
			allPosts.push(new Point({x:(centerPoint * x) - (postWidth / 2),y:(centerPoint * y) - (postWidth / 2)}));
			//console.log(allPosts[allPosts.length-1]);
		}
	}
	console.log("generateAllPosts() post count: " + allPosts.length);
}

function drawPosts(){
	for (var pointCounter = 0; pointCounter < allPosts.length;pointCounter++) {
		drawCircle(allPosts[pointCounter], "OrangeRed", "OrangeRed", postSize);
	}

}

function drawGridLines(){
	for (var y = 0; y < numOfCells; ++y)
	{
		drawLine(new Point({x:0, y:y * cellSize}), new Point({x:numOfCells * cellSize,y:y * cellSize}),"black");
	}

	for (var x = 0; x < numOfCells; ++x)
	{
		drawLine(new Point({x: x * cellSize, y:0}),new Point({x: x * cellSize, y:numOfCells * cellSize}), "black");
	}
}

function drawLine(p, p2, color, lineWidth, isUsingOffset){
	ctx.beginPath();
	var currentStrokeStyle = ctx.strokeStyle;
	ctx.strokeStyle = color;
	ctx.globalAlpha = 1;
	ctx.lineWidth = lineWidth || 1;
	if (isUsingOffset != undefined && isUsingOffset){
		ctx.moveTo(p.x + offset/2, p.y+offset/2);
		ctx.lineTo(p2.x + offset/2, p2.y+offset/2);
		console.log("using offset...");
	}
	else{
		ctx.moveTo(p.x,p.y);
		ctx.lineTo(p2.x, p2.y);
	}
	// console.log ("p.x : " + p.x + " p.y : " + p.y + " p2.x : " + p2.x + " p2.y : " +  p2.y);
	ctx.stroke();
	ctx.strokeStyle = currentStrokeStyle;
	ctx.globalAlpha = 1;
}

function drawBackground() {
	ctx.globalAlpha = 1;
	
	ctx.fillStyle=  "#F0F0F0";//"lightgrey";
	ctx.fillRect(0,0,ctx.canvas.height,ctx.canvas.width);
}

function drawCircle(pt, fillStyle, strokeStyle, circleSize, lineWidth){
		ctx.fillStyle = fillStyle;
		ctx.strokeStyle= strokeStyle;
		ctx.globalAlpha = 1;
		ctx.lineWidth = lineWidth || 1;
		ctx.beginPath();
		ctx.arc(pt.x + postOffset, pt.y + postOffset,circleSize,0,2*Math.PI);
		ctx.stroke();
		ctx.fill();
		// reset opacity
		ctx.globalAlpha = 1;
}

function hitTest(p, pointArray, areaSize){
	// iterate through all points
	var loopCount = 0;
	for (var x = 0;x<pointArray.length;x++){
		if ((Math.abs(p.x - pointArray[x].x) <= areaSize) && Math.abs(p.y - pointArray[x].y) <= areaSize){
			return x;
		}
	} 
	return -1;
}

function getMousePos(evt) {
	
	var rect = theCanvas.getBoundingClientRect();
	var currentPoint = {};
	currentPoint.x = evt.clientX - rect.left;
	currentPoint.y = evt.clientY - rect.top;
	console.log(currentPoint);
	return currentPoint;
}

function mouseDownHandler(event){
	if ($("#hidePatternCheckBox").attr('checked') || $("#hidePatternCheckBox").prop('checked')){
			// get out of here because the user has the pattern hidden
			// user must unhide pattern to add to it.
			return;
	}
	selectNewPoint(event)
	drawHighlight();
	drawUserShape();
	generatePassword();
	//console.log("mouseDown");
}

function selectNewPoint(event){
	var currentPoint = getMousePos(event);
	var hitTestIdx = hitTest(currentPoint, allPosts, postSize + 9);
	if (hitTestIdx == -1){
		return;
	}
	console.log("hitTestIdx : " + hitTestIdx);
	currentPoint = allPosts[hitTestIdx]; // this sets it to the exact values of the post center
	us.append(currentPoint, Math.trunc(hitTestIdx + (hitTestIdx * Math.trunc(hitTestIdx / numOfCells) * 10)));
	us.CalculateGeometricValue();
	console.log(currentPoint.x + " : " + currentPoint.y);
}

function drawHighlight(){
	// there are no points so return without attempting highlight
	if (us.allPoints.length < 1){return;}
	
	drawCircle(new Point({x:us.allPoints[0].x, y:us.allPoints[0].y}), "rgba(0, 0, 0, 0)", "orange", 10, 2);
}

function drawUserShape(){
	if (!$("#hidePatternCheckBox").attr('checked') && !$("#hidePatternCheckBox").prop('checked')){
		for (var i = 0; i < us.allSegments.length;i++){
			drawLine(us.allSegments[i].Begin, us.allSegments[i].End, "green", 4, true);
		}
	}
	else{
		drawBackground();
		generateAllPosts();
		drawGridLines();
		drawPosts();
	}
}

function ComputeHashBytes(textBasedPassword){
    let hashValue = "";
    console.log("computing hash...");
    console.log(us.PointValue);
	if (textBasedPassword == undefined ||
		textBasedPassword == null){
			textBasedPassword = "";
		}
	console.log("selectedItemText : " + textBasedPassword);
	if (us.PointValue > 0){
		pwdBuffer = Crypto.createHash("sha256").update(us.PointValue.toString() + textBasedPassword).digest();
		hashValue = pwdBuffer.toString("hex");
        console.log(`hashValue : ${hashValue}`);
	}
	else{
		pwdBuffer = Crypto.createHash("sha256").update(textBasedPassword).digest();
		hashValue = pwdBuffer.toString("hex");
	}
	pwd = hashValue;
}

function Segment(begin, end, pointValue){
	this.Begin = begin;
	this.End = end;
	this.PointValue = pointValue;
}

function UserPath(){
	this.allSegments = [];
	this.currentPoint = null;
	this.allPoints = [];
	this.previousPostValue = 0;
	this.PointValue = 0;
	
	this.append = function(currentPoint, postValue){
		this.currentPoint = currentPoint;
		if (this.allPoints.length >= 1)
		{
			if (this.allPoints[this.allPoints.length - 1].x == this.currentPoint.x && 
				this.allPoints[this.allPoints.length - 1].y == this.currentPoint.y)
                {
                    // user clicked the same point twice
					console.log("clicked same point twice: return");
                    return;
                }
			console.log("postValue + this.previousPostValue : " + (postValue + this.previousPostValue));
			if (this.isSegmentUnique(postValue + this.previousPostValue)){
				// segment has never been added to add it.
				this.allSegments.push(new Segment(this.allPoints[this.allPoints.length-1], this.currentPoint, postValue + this.previousPostValue));
			}
		}
		this.allPoints.push(this.currentPoint);
		console.log("allPoints.length : " + this.allPoints.length);
		this.previousPostValue = postValue;
	}
	
	this.isSegmentUnique = function (pointValue){
		// Insures that the same segment is not added to segment array and not calculated for points
		//returns false if the segment is already in the array, else true (segment is unique)
		for (var z = 0; z < this.allSegments.length;z++){
			if (this.allSegments[z].PointValue == pointValue){
				return false;
			}
		}
		return true;
	}
	
	this.CalculateGeometricValue = function(){
		this.PointValue = 0;
		for (var i =0; i < this.allSegments.length;i++){
			this.PointValue += this.allSegments[i].PointValue;
		}
		console.log(this.PointValue);
    }
}

function initGrid(){
	theCanvas = document.getElementById("mainGrid");
	ctx = theCanvas.getContext("2d");
	
	ctx.canvas.height  = 255;
	ctx.canvas.width = ctx.canvas.height;
	
	$("#hidePatternCheckBox").on('change', drawUserShape);
	// $("#textBasedPasswordCheckBox").on('change', generatePassword);
	// $("#textBasedPassword").on('input', generatePassword);
	
	theCanvas.addEventListener("mousedown", mouseDownHandler);
	drawBackground();
	generateAllPosts();
	drawGridLines();
	drawPosts();
}

function clearButtonClick(){
	us = new UserPath();
	drawBackground();
	generateAllPosts();
	drawGridLines();
	drawPosts();
	$("#hidePatternCheckBox").attr('checked',false);
	$("#hidePatternCheckBox").prop('checked',false)

	if ($("#textBasedPasswordCheckBox").attr('checked') || $("#textBasedPasswordCheckBox").prop('checked')){
		generatePassword();
		return;
	}
	pwd = "";
	
}

function generatePassword(){
	
	if (us.allSegments.length <=0 && 
		(!$("#textBasedPasswordCheckBox").attr('checked') && !$("#textBasedPasswordCheckBox").prop('checked')))
	{
		pwd = "";
	 	return;
	}
	if (us.allSegments.length <= 0 && $("#textBasedPassword").val() == "")
	{
		pwd = "";
		return;
    }

	if ($("#textBasedPasswordCheckBox").attr('checked') || $("#textBasedPasswordCheckBox").prop('checked')){
		 let currentPwd = $("#textBasedPassword").val();
		 console.log("currentPwd : " + currentPwd);
         ComputeHashBytes(currentPwd);
     }
     else{
         // compute with only the drawn pattern.
         ComputeHashBytes(undefined);
     }
	console.log("ComputeHashBytes() : " + pwd);
	console.log ("pwd 1: " + pwd);
}

// #######################