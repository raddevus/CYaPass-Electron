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
    var selectedItemText = document.querySelector("#SiteListBox option:checked").value;

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
	if (document.querySelector("#addSpecialCharsCheckBox").checked){
		addSpecialChars();
	}
	if (document.querySelector("#maxLengthCheckBox").checked){
		setMaxLength();
	}
	
	document.querySelector("#passwordText").value = pwd;
	document.querySelector("#passwordText").select();
	document.execCommand("copy");
	document.querySelector("#SiteListBox").focus();
}

function setMaxLength(){
	var maxLength = document.querySelector("#maxLength").value;
	pwd = pwd.substr(0, maxLength);
}

function siteListBoxChangeHandler(){
	console.log("change handler...");
	var itemKey = null;
	try{
	var itemKey = document.querySelector("#SiteListBox option:checked").value;
	}
	catch{
		console.log("exception occurred because no item is selected. Non-fatal error.");
		return;
	}
	console.log("itemKey : " + itemKey);
	var currentSiteKey = getExistingSiteKey(getEncodedKey(itemKey));

	if (currentSiteKey !== null){
		document.querySelector("#addUppercaseCheckBox").checked = currentSiteKey.HasUpperCase;
		document.querySelector("#addSpecialCharsCheckBox").checked = currentSiteKey.HasSpecialChars;
		document.querySelector("#maxLengthCheckBox").checked = (currentSiteKey.MaxLength > 0);
		console.log(currentSiteKey.MaxLength);
		if (currentSiteKey.MaxLength > 0){
			document.querySelector("#maxLength").value = currentSiteKey.MaxLength;
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
	document.querySelector("#addSpecialCharsCheckboxDlg").checked = siteKey.HasSpecialChars;
	document.querySelector("#addUppercaseCheckboxDlg").checked = siteKey.HasUpperCase;
	
	if (siteKey.MaxLength > 0){
		document.querySelector("#maxLengthDlg").value = siteKey.MaxLength;
		document.querySelector("#setMaxLengthCheckboxDlg").checked = true;
	}
	else{
		document.querySelector("#maxLengthDlg").value = 32;
		document.querySelector("#setMaxLengthCheckboxDlg").checked = false;
	}
}

function initAddDialogControlValues(){
	$("#AddSiteKeyModal").data.currentSiteKey = null;
	document.querySelector("#SiteKeyItem").value = "";
	document.querySelector("#addSpecialCharsCheckboxDlg").checked = false;
	document.querySelector("#addUppercaseCheckboxDlg").checked = false;
	document.querySelector("#setMaxLengthCheckboxDlg").checked = false;
	document.querySelector("#maxLengthDlg").value = 32;
}
var localSiteKey;
function editButtonClick(){
	var clearTextItemKey = "";
	document.querySelector("#siteKeyErrMsg").innerHTML = "";
	var editItem = document.querySelector("#SiteListBox option:checked").value;
	console.log("editItem : " + editItem);
	document.querySelector("#SiteKeyItem").value = editItem;
	
	console.log("encodedKey : " + getEncodedKey(editItem));
	localSiteKey = getExistingSiteKey(getEncodedKey(editItem));
	setAddDialogControlValues(localSiteKey);
	isAddKey = false;
    $("#AddSiteKeyModal").modal('toggle');
	document.querySelector("#AddSiteKeyLabel").innerHTML = "Edit Existing Site/Key";
}

function addButtonClick(){
	document.querySelector("#siteKeyErrMsg").innerHTML = "";
	initAddDialogControlValues();
	isAddKey = true;
	$("#AddSiteKeyModal").modal('toggle');
	document.querySelector("#AddSiteKeyLabel").innerHTML = "Add New Site/Key";
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
	console.log(localSiteKey);
	localSiteKey.HasSpecialChars = document.querySelector("#addSpecialCharsCheckboxDlg").checked;
	localSiteKey.HasUpperCase = document.querySelector("#addUppercaseCheckboxDlg").checked;
	if (document.querySelector("#setMaxLengthCheckboxDlg").checked){
		localSiteKey.MaxLength = document.querySelector("#maxLengthDlg").value;
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
}

function addSiteKey(){

	console.log("addSiteKey 1");
	document.querySelector("#siteKeyErrMsg").innerHTML = "";
	var clearTextItemKey = document.querySelector("#SiteKeyItem").value;
	var item = new SiteKey(clearTextItemKey);
	item.HasSpecialChars = document.querySelector("#addSpecialCharsCheckboxDlg").checked;
	item.HasUpperCase = document.querySelector("#addUppercaseCheckboxDlg").checked;
	if (document.querySelector("#setMaxLengthCheckboxDlg").checked){
		item.MaxLength = document.querySelector("#maxLengthDlg").value;
	}

	if (item.Key !== null && item.Key !== ""){
		var localOption = new Option(clearTextItemKey, clearTextItemKey, false, true);
		document.querySelector('#SiteListBox').add(localOption);
		document.querySelector("#SiteKeyItem").value = "";
		document.querySelector('#SiteListBox').value = clearTextItemKey;
		allSiteKeys.push(item);
		saveToLocalStorage();
		
		$('#AddSiteKeyModal').modal('hide');
	}
	else{
		document.querySelector("#siteKeyErrMsg").innerHTML = "Please type a valid site/key.";
	}
	initAddDialogControlValues();
	$("#AddSiteKeyModal").data.currentSiteKey = null;
	$("#SiteListBox option:last").prop("selected",true);
	siteListBoxChangeHandler();
}

function exportSiteKeys(){
	if (pwd == ""){
		$("#ExportMsgModal").modal('toggle');
		return;
	}
	$("#ExportModal").modal('toggle');
	const formDataX = new FormData();
	formDataX.append("key","1857Ac032904e72");
	formDataX.append("data","this is data from CYA-ELECTRON")

	fetch("http://localhost:5243/Cya/SaveData", {
	method: 'POST',
	body: formDataX,
	})
	.then(response => response.json())
	.then(data => console.log(data));

}

function importSiteKeys(){
	$("#ImportModal").modal('toggle');
}

function loadSiteKeyList(item){
	var localOption = new Option(getDecodedKey(item.Key), getDecodedKey(item.Key), false, false);
	document.querySelector('#SiteListBox').add(localOption);
}

function addUppercaseLetter(){
	var target = pwd;

	if (target === null || target === ""){ return;}
	if ( document.querySelector("#addUppercaseCheckBox").checked){
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
	var specialChars = document.querySelector("#specialChars").value;
	if (specialChars == null || specialChars == ""){ return;}
	var target = pwd;
	if (target === null || target == ""){ return;}

	if (document.querySelector("#addSpecialCharsCheckBox").checked){
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
	selectedItem = document.querySelector("#SiteListBox option:checked").innerHTML;
	console.log(selectedItem);
	if (selectedItem !== null && selectedItem !== ""){
		document.querySelector("#siteKeyDelMsg").innerHTML = "Click [OK] to delete the site/key: ";
		document.querySelector("#siteKeyDelValue").innerHTML = selectedItem;
		$("#DeleteSiteKeyModal").modal('toggle');
	}
}

function clearButtonClick(){
	us = new UserPath();
	drawBackground();
	generateAllPosts();
	drawGridLines();
	drawPosts();
	document.querySelector("#passwordText").value = "";
	document.querySelector("#hidePatternCheckBox").checked = false;
	pwd = "";
}

function deleteSiteKey(){
	console.log("selectedItem : " );
	console.log(selectedItem);
	var removeItem = "#SiteListBox option[value='" + selectedItem + "']";
	document.querySelector(removeItem).remove();
	deleteItemFromLocalStorage(getEncodedKey(selectedItem));
	$("#DeleteSiteKeyModal").modal('hide');
	document.querySelector("#passwordText").value ="";
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
	// There is not good native JS to remove all the items
	// in the option list box so I'm using jQuery empty()
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
	
	
	document.querySelector("html").addEventListener("keydown", function (e) {
		if (e.which === 123 /* F12 */) {
			console.log("got F12");
			ipc.send('toggleDevTools',null);
		} else if (e.which === 116 /* F5 */) {
			location.reload();
		}
	});

	document.querySelector("#OKSiteKeyButton").addEventListener("click",addOrEditSiteKey);
	document.querySelector("#OKDeleteButton").addEventListener("click",deleteSiteKey);
	document.querySelector("#AddSiteKeyModal").addEventListener("keypress",handleEnterKey);
	document.querySelector("#OKExportButton").addEventListener("click",exportSiteKeys)
	$('#AddSiteKeyModal').on('shown.bs.modal', function () {
		document.querySelector("#SiteKeyItem").focus();
	});
	document.querySelector('#SiteListBox').addEventListener('change', siteListBoxChangeHandler);

	document.querySelector('#addUppercaseCheckBox').addEventListener('change', generatePassword);
	document.querySelector('#addSpecialCharsCheckBox').addEventListener('change', generatePassword);
	document.querySelector("#specialChars").addEventListener('input', generatePassword);
	document.querySelector("#maxLength").addEventListener('input', generatePassword);
	document.querySelector("#maxLengthCheckBox").addEventListener('change', generatePassword);
	
	document.querySelector("#passwordText").classList.remove("noselect");

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
