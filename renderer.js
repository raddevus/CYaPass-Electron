// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
// cyapass.js
"use strict";
let $ = require('jquery');
var modal = require('./node_modules/bootstrap/js/dist/modal');
window.$ = $;

//let bs = require('bootstrap');

var ctx = null;
var theCanvas = null;
window.addEventListener("load", initApp);

// *******************************
// ****** begin CYaPass code *****
// *******************************
var pwd = "";
var allSiteKeys = [];
var centerPoint = 50;
var postWidth = 6;
var numOfCells = 6;
var offset = 5;
var cellSize = 50;
var postSize = 6;
var allPosts = [];
var postOffset = Math.trunc(postSize / 2)
var us = new UserPath();
var isAddKey = true;

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

function generatePassword(){
    var selectedItemText = $("#SiteListBox option:selected").text();

	if (selectedItemText === null || selectedItemText === ""){
		return;
	}
	if (us.allSegments.length <= 0)
	{
		return;
	}
	ComputeHashBytes(selectedItemText);
	console.log("ComputeHashBytes() : " + pwd);
	addUppercaseLetter();
	console.log ("pwd 1: " + pwd);
	if ($("#addSpecialCharsCheckBox").attr('checked') || $("#addSpecialCharsCheckBox").prop('checked')){
		addSpecialChars();
	}
	if ($("#maxLengthCheckBox").attr('checked') || $("#maxLengthCheckBox").prop('checked')){
		setMaxLength();
	}
	
	$("#passwordText").val(pwd);
	$("#passwordText").select();
	document.execCommand("copy");
}

function setMaxLength(){
	var maxLength = $("#maxLength").val();
	pwd = pwd.substr(0, maxLength);
}

function ComputeHashBytes(selectedItemText){
	console.log("computing hash...");
    console.log("selectedItemText : " + selectedItemText);
	var hashValue = sha256(us.PointValue + selectedItemText);
	console.log(hashValue);
	pwd = hashValue;
}

function siteListBoxChangeHandler(){
	console.log("change handler...");
	var itemKey = $("#SiteListBox option:selected").val();
	console.log("itemKey : " + itemKey);
	var currentSiteKey = getExistingSiteKey(getEncodedKey(itemKey));

	if (currentSiteKey !== null){
		$("#addUppercaseCheckBox").prop("checked", currentSiteKey.HasUpperCase);
		$("#addSpecialCharsCheckBox").prop("checked", currentSiteKey.HasSpecialChars);
		$("#maxLengthCheckBox").prop("checked", currentSiteKey.MaxLength > 0);
		console.log(currentSiteKey.MaxLength);
		if (currentSiteKey.MaxLength > 0){
			$("#maxLength").val(currentSiteKey.MaxLength);
		}
		
	}
	generatePassword();
}

function getExistingSiteKey(encodedKey){
	// pass in a encoded SiteKey
	// and get an exisiting siteKey object or null back
	// I switched this to compare encoded key so there
	// is less work in this method (and specifically the for loop)
	for (var i = 0; i < allSiteKeys.length; i++){
		if (allSiteKeys[i].Key === encodedKey){
			console.log("found one : " + encodedKey);
			return allSiteKeys[i];
		}
	}
	return null;
}

function replaceSiteKeyInList(siteKey){
	for (var i = 0; i < allSiteKeys.length; i++){
		if (allSiteKeys[i].Key === siteKey.Key){
			allSiteKeys[i] = siteKey;
		}
	}
	
}

function setAddDialogControlValues(siteKey){
	$("#addSpecialCharsCheckboxDlg").prop("checked", siteKey.HasSpecialChars);
	$("#addUppercaseCheckboxDlg").prop("checked", siteKey.HasUpperCase);
	
	if (siteKey.MaxLength > 0){
		$("#maxLengthDlg").val(siteKey.MaxLength);
		$("#setMaxLengthCheckboxDlg").prop("checked", true);
	}
	else{
		$("#maxLengthDlg").val(32);
		$("#setMaxLengthCheckboxDlg").prop("checked", false);
	}
}

function initAddDialogControlValues(){
	$("#AddSiteKeyModal").data.currentSiteKey = null;
	$("#SiteKeyItem").val("");
	$("#addSpecialCharsCheckboxDlg").prop("checked", false);
	$("#addUppercaseCheckboxDlg").prop("checked", false);
	$("#setMaxLengthCheckboxDlg").prop("checked", false);
	$("#maxLengthDlg").val("32");
}
var localSiteKey;
function editButtonClick(){
	
	$("#siteKeyErrMsg").text("");
	var editItem = $("#SiteListBox option:selected").val();
	console.log("editItem : " + editItem);
	$("#SiteKeyItem").val(editItem);
	
	console.log("encodedKey : " + getEncodedKey(editItem));
	localSiteKey = getExistingSiteKey(getEncodedKey(editItem));
	setAddDialogControlValues(localSiteKey);
	isAddKey = false;
    $("#AddSiteKeyModal").modal('toggle');
    $("#AddSiteKeyLabel").text("Edit Existing Site/Key");
    var item = new SiteKey(clearTextItemKey);
	item.HasSpecialChars = $("#addSpecialCharsCheckboxDlg").prop("checked");
	item.HasUpperCase = $("#addUppercaseCheckboxDlg").prop("checked");

	if (item.Key !== null && item.Key !== ""){
		var localOption = new Option(clearTextItemKey, clearTextItemKey, false, true);
		$('#SiteListBox').append($(localOption) );
		$("#SiteKeyItem").val("");
		$('#SiteListBox').val(clearTextItemKey).change();
		allSiteKeys.push(item);
        saveToLocalStorage();
    }
}

function addButtonClick(){
	$("#siteKeyErrMsg").text("");
	initAddDialogControlValues();
	isAddKey = true;
	$("#AddSiteKeyModal").modal('toggle');
	$("#AddSiteKeyLabel").text("Add New Site/Key");
}

function addOrEditSiteKey(){
	if (isAddKey){
		addSiteKey();
	}
	else
	{
		editSiteKey();
	}
}

function editSiteKey(){
	
	//if ($("#AddSiteKeyModal").data.currentSiteKey !== null){
		//var localSiteKey = $("#AddSiteKeyModal").data.currentSiteKey;
		console.log(localSiteKey);
		localSiteKey.HasSpecialChars = $("#addSpecialCharsCheckboxDlg").prop("checked");
		localSiteKey.HasUpperCase = $("#addUppercaseCheckboxDlg").prop("checked");
		if ($("#setMaxLengthCheckboxDlg").prop("checked")){
			localSiteKey.MaxLength = $("#maxLengthDlg").val();
		}
		else{
			localSiteKey.MaxLength = 0;
		}
		replaceSiteKeyInList(localSiteKey);
		saveToLocalStorage();
		
		$("#AddSiteKeyModal").modal('hide');
		
		initAddDialogControlValues();
		$("#AddSiteKeyModal").data.currentSiteKey = null;
		siteListBoxChangeHandler();
		
		return true;
	//}
	
}

function addSiteKey(){

	console.log("addSiteKey 1");
	$("#siteKeyErrMsg").text("");
	var clearTextItemKey = $("#SiteKeyItem").val();
	var item = new SiteKey(clearTextItemKey);
	item.HasSpecialChars = $("#addSpecialCharsCheckboxDlg").prop("checked");
	item.HasUpperCase = $("#addUppercaseCheckboxDlg").prop("checked");
	if ($("#setMaxLengthCheckboxDlg").prop("checked")){
		item.MaxLength = $("#maxLengthDlg").val();
	}

	if (item.Key !== null && item.Key !== ""){
		var localOption = new Option(clearTextItemKey, clearTextItemKey, false, true);
		$('#SiteListBox').append($(localOption) );
		$("#SiteKeyItem").val("");
		$('#SiteListBox').val(clearTextItemKey).change();
		allSiteKeys.push(item);
		saveToLocalStorage();
		
		$('#AddSiteKeyModal').modal('hide');
	}
	else{
		$("#siteKeyErrMsg").text("Please type a valid site/key.");
	}
	initAddDialogControlValues();
	$("#AddSiteKeyModal").data.currentSiteKey = null;
	 $("#SiteListBox option:last").prop("selected",true);
	 siteListBoxChangeHandler();
}

function loadSiteKeyList(item){
	console.log("loadSiteKeyList item : " + item.Key);
	var localOption = new Option(getDecodedKey(item.Key), getDecodedKey(item.Key), false, false);
		$('#SiteListBox').append($(localOption) );
}

function addUppercaseLetter(){
	var target = pwd;

	if (target === null || target === ""){ return;}
	if ($("#addUppercaseCheckBox").attr('checked') || $("#addUppercaseCheckBox").prop('checked')){
		console.log("checked");
		
		var foundChar = "";
		for (var i =0; i < target.length;i++){
			//console.log("target.length : " + target.length);
			if (isNaN(target[i])){
				console.log(target[i]);
				foundChar = target[i];
				target[i].toUpperCase();// = target[i].toUpperCase();
				console.log(target[i].toUpperCase());
				i = target.length;
			}
		}
		if (foundChar != ""){
			pwd = target.replace(foundChar, foundChar.toUpperCase());
		}
		
	}
	else{
		pwd = target.toLowerCase();
	}
	console.log("adduppercaseletter...");
}

function addSpecialChars(){
	console.log("addSpecialChars...");
	var specialChars = $("#specialChars").val();
	if (specialChars == null || specialChars == ""){ return;}
	var target = pwd;
	if (target === null || target == ""){ return;}

	if ($("#addSpecialCharsCheckBox").attr('checked') || $("#addSpecialCharsCheckBox").prop('checked')){
		console.log("special chars...");
		var charOffset = 2;
        var localPwd = target.substring(0, charOffset);
		console.log("target : " + target);
		localPwd += specialChars;
		console.log("1 localPwd : " + localPwd);
		localPwd = localPwd + target.substring(2, target.length - charOffset);
		console.log("2 localPwd : " + localPwd);
		pwd = localPwd;
	}
	else{
		generatePassword();
	}
}

function handleEnterKey(e){
	if(e.which == 13) {
		console.log("Im in there..");
		addOrEditSiteKey();
	}
}
var selectedItem;
function deleteButtonClick(){
	//
	selectedItem = $("#SiteListBox option:selected").text();
	console.log(selectedItem);
	if (selectedItem !== null && selectedItem !== ""){
		$("#siteKeyDelMsg").text("Click [OK] to delete the site/key: ");
		$("#siteKeyDelValue").text(selectedItem);
		$("#DeleteSiteKeyModal").modal('toggle');
		//loadSiteKeyList();
	}
}

function clearButtonClick(){
	us = new UserPath();
	drawBackground();
	generateAllPosts();
	drawGridLines();
	drawPosts();
	$("#passwordText").val("");
	$("#hidePatternCheckBox").attr('checked',false);
	$("#hidePatternCheckBox").prop('checked',false)
}

function deleteSiteKey(){
	console.log("selectedItem : " );
	console.log(selectedItem);
	var removeItem = "#SiteListBox option[value='" + selectedItem + "']";
	$(removeItem).remove();
	deleteItemFromLocalStorage(getEncodedKey(selectedItem));
	$("#DeleteSiteKeyModal").modal('hide');
	$("#passwordText").val("");
	siteListBoxChangeHandler();
}

//###############################################################################
//############################### localStorage methods ##########################
//###############################################################################
function removeAllKeysFromLocalStorage()
{
	localStorage.removeItem('siteKeys'); 
	console.log("success remove!");
}

function saveToLocalStorage()
{
  // Put the object into storage

  localStorage.setItem('siteKeys', JSON.stringify(allSiteKeys));
  console.log(JSON.stringify(allSiteKeys));
  console.log("wrote siteKeys to localStorage");
  
}

function deleteItemFromLocalStorage(encodedKey){
	console.log("Removing : " + encodedKey);
	for (var i =0; i < allSiteKeys.length;i++){
		if (encodedKey == allSiteKeys[i].Key){
			allSiteKeys.splice(i,1);
			console.log("i : " + i);
			saveToLocalStorage();
			initSiteKeys();
		}
	}
}
// #####################################################################
// #####################################################################

function initSiteKeys(){
	$("#SiteListBox").empty();
	if (localStorage.getItem("siteKeys") !== null && localStorage.getItem("siteKeys") !== "null") {
		allSiteKeys = JSON.parse(localStorage["siteKeys"]);
			
		if (localStorage.getItem("isConverted") === null){
			convertSiteKeys();
		}
		
		for (var j = 0; j < allSiteKeys.length;j++)
		{
			console.log(allSiteKeys[j].Key);
			loadSiteKeyList(allSiteKeys[j]);
			console.log(allSiteKeys[j].Key);
		}
	}
	localStorage.setItem("isConverted", 'true');
}

function convertSiteKeys(){
	if (localStorage.getItem("siteKeys") !== null) {
		var tempString = localStorage["siteKeys"];
		allSiteKeys = JSON.parse(localStorage["siteKeys"]);
		var allSiteKeyObjects = [];
		
		for (var j=0; j < allSiteKeys.length;j++){
			var s = new SiteKey(getDecodedKey(allSiteKeys[j]));
			allSiteKeyObjects.push(s);
		}
		allSiteKeys = allSiteKeyObjects;
		saveToLocalStorage();
	}
}

function initApp(){
	
	theCanvas = document.getElementById("mainGrid");
	ctx = theCanvas.getContext("2d");
	
	ctx.canvas.height  = 255;
	ctx.canvas.width = ctx.canvas.height;
	$("#OKSiteKeyButton").click(addOrEditSiteKey);
	$("#OKDeleteButton").click(deleteSiteKey);
	$("#AddSiteKeyModal").keypress(handleEnterKey);
	$('#AddSiteKeyModal').on('shown.bs.modal', function () {
		$("#SiteKeyItem").focus();
	});
	$('#SiteListBox').on('change', siteListBoxChangeHandler);

	$('#addUppercaseCheckBox').on('change', generatePassword);
	$('#addSpecialCharsCheckBox').on('change', generatePassword);
	$("#specialChars").on('input', generatePassword);
	$("#maxLength").on('input', generatePassword);
	$("#maxLengthCheckBox").on('change', generatePassword);
	$("#hidePatternCheckBox").on('change', drawUserShape);
	
	$("#passwordText").removeClass("noselect");

	theCanvas.addEventListener("mousedown", mouseDownHandler);
	drawBackground();
	generateAllPosts();
	drawGridLines();
	drawPosts();
	initSiteKeys();
	$('#SiteListBox option:last').prop('selected', true);
	siteListBoxChangeHandler();
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

function SiteKey(initKey){
	if (typeof(initKey) === "object"){
		console.log("In if...");
		this.MaxLength =  initKey.MaxLength || 0;
		this.HasSpecialChars = initKey.HasSpecialChars || false;
		this.HasUpperCase = initKey.HasUpperCase || false;
		this.Key = btoa(encodeURI(initKey.Key));
		
	}
	else{
		console.log("In else...");
		this.MaxLength =  0;
		this.HasSpecialChars = false;
		this.HasUpperCase = false;
		this.Key = btoa(encodeURI(initKey));
	}
}

function getEncodedKey(keyValue){
	return btoa(encodeURI(keyValue));
}
function getDecodedKey(keyValue){
		try {
			return decodeURI(atob(keyValue));
		}
		catch (e){
			// handling this exception helps protect against the
			// isConverted value being lost when there are still good
			// sitekey values in localStorage.
			localStorage.setItem('isConverted','true');
			throw (e);
		}
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