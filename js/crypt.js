
var fs = require('fs');
let key = "";
let iv = "";
let isEncrypting = true;
let decryptionIsSuccess = true;
const DECRYPTION_ERROR_MSG = "ERROR!: Most likely you are using an incorrect pattern / password to decrypt the file with.";

function encryptDataBuffer(data,encryptedDataDTO){
    console.log("pwd : " + pwd);
    const key = pwdBuffer;//Crypto.createHash("sha256").update(localPwd).digest();
    const iv = Buffer.allocUnsafe(16);

    // Using proper method of generating iv (based on radnom string)
    Crypto.randomBytes(16).copy(iv);
    console.log(`iv.length ${iv.length}`);
    console.log(iv);

    // save the 16 bytes of the iv as a base64 string
    encryptedDataDTO.iv = iv.toString("base64");
    cipher = Crypto.createCipheriv("aes-256-cbc", key,iv);
    // 1. encrypt the byes (call final())
    // 2. return base64 of encrypted bytes
    var x = convertByteDataToString(data);
    console.log("x : " + x.length);
    var msg = [];
    msg.push(cipher.update(data, "binary", "base64"));//, "binary", "hex");
    //console.log(data);
    msg.push(cipher.final("base64"));
    return msg.join("");
}

function convertByteDataToString(data){
    var outString = "";
    for (var i =0;i<data.length;i++){
        outString += String.fromCharCode(data[i]);
    }
    return outString;
}

function decryptDataBuffer(data){
    console.log("pwd : " + pwd);
    const key = pwdBuffer;
    console.log(data.iv);

    // 2022-06-25 fixing iv which is now passed in
    const iv = Buffer.from(data.iv,"base64");
    var msg = [];
    console.log(iv);
    cipher = Crypto.createDecipheriv("aes-256-cbc", key, iv);
    // 1. encrypt the byes (call final())
    // 2. return base64 of encrypted bytes
    msg.push(cipher.update(data.data, "base64", "binary"));//, "hex", "binary");
    
    try{
        msg.push(cipher.final("binary"));
    }
    catch (ex){
        decryptionIsSuccess = false;
        alert(ex + " : " + DECRYPTION_ERROR_MSG);
        return;
    }
    return msg.join("");
}

function encryptFile(){
    isEncrypting = true;
    if (pwd != ""){
        createOutputFileFromInputData();
    }
    else{
        alert("Please create a pattern and/or add a password.");
        document.querySelector("#textBasedPassword").focus();
    }
}

function decryptFile(){
    isEncrypting = false;
    if (pwd != ""){
        createOutputFileFromInputData();
    }
    else{
        alert("Please create a pattern and/or add a password.");
        document.querySelector("#textBasedPassword").focus();
    }
}

function createOutputFileFromInputData(){
    decryptionIsSuccess = true;
    var currentSelectedFile = document.querySelector('#selected-file').innerHTML;
    if (currentSelectedFile == null){
        return;
    }
    alert("Processing file... " + currentSelectedFile);
    
    fs.readFile(currentSelectedFile, function (err, data) {
        if (err) return console.log(err);
        console.log("read the file!");
        
        if (isEncrypting){
            outputFileData = encryptDataBuffer(data);
        }
        else{
            var base64Data = data.toString("utf8");
            outputFileData = decryptDataBuffer(base64Data);
        }
        if (decryptionIsSuccess){
            writeTargetFile(outputFileData, isEncrypting);
        }
    });
}