const ipc = require('electron').ipcRenderer
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
var allSiteKeys = [];
var isAddKey = true;


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
	$("#SiteListBox").focus();
}

function setMaxLength(){
	var maxLength = $("#maxLength").val();
	pwd = pwd.substr(0, maxLength);
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
	var clearTextItemKey = "";
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
		sortSiteKeys();
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
		localPwd = localPwd + target.substring(2, target.length - specialChars.length);
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
	sortSiteKeys();
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
  // console.log(JSON.stringify(allSiteKeys));
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
			loadSiteKeyList(allSiteKeys[j]);
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


function replaceText(selector, text){
	const element = document.querySelector("#"+selector)
	if (element){ element.innerText = text;}
} 

function updateDetails(){	
	for (const type of ['chrome', 'node', 'electron']) {
		replaceText(`${type}-version`, process.versions[type]);
	}
}

ipc.on('getAppPath-reply', (event, arg) => {
	// arg is appDataPath as string
	replaceText(`app-path`,arg);
});

function initApp(){
	
	theCanvas = document.getElementById("mainGrid");
	ctx = theCanvas.getContext("2d");
	
	ctx.canvas.height  = 255;
	ctx.canvas.width = ctx.canvas.height;
	
	$(document).on("keydown", function (e) {
		if (e.which === 123 /* F12 */) {
			console.log("got F12");
			ipc.send('toggleDevTools',null);
		} else if (e.which === 116 /* F5 */) {
			location.reload();
		}
	});
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
	
	$("#passwordText").removeClass("noselect");

	initGrid();
	initSiteKeys();
	$('#SiteListBox option:last').prop('selected', true);
	siteListBoxChangeHandler();
	sortSiteKeys();
	updateDetails();
	ipc.send('getAppPath',null);
}

function sortSiteKeys(){
	// choose target dropdown
	var select = $('select');
	select.html(select.find('option').sort(function(x, y) {
	  // to change to descending order switch "<" for ">"
	  return $(x).text() > $(y).text() ? 1 : -1;
	}));
}

function SiteKey(initKey){
	if (typeof(initKey) === "object"){
		console.log("In if...");
		this.MaxLength =  initKey.MaxLength || 0;
		this.HasSpecialChars = initKey.HasSpecialChars || false;
		this.HasUpperCase = initKey.HasUpperCase || false;
		this.Key = btoa(initKey.Key);
		
	}
	else{
		console.log("In else...");
		this.MaxLength =  0;
		this.HasSpecialChars = false;
		this.HasUpperCase = false;
		this.Key = btoa(initKey);
	}
}

function getEncodedKey(keyValue){
	return btoa(keyValue);
}
function getDecodedKey(keyValue){
	try {
		return atob(keyValue);
	}
	catch (e){
		// handling this exception helps protect against the
		// isConverted value being lost when there are still good
		// sitekey values in localStorage.
		localStorage.setItem('isConverted','true');
		throw (e);
	}
}
