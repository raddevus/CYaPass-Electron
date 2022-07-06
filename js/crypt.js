var fs = require('fs');
let key = "";
let iv = "";
let isEncrypting = true;
let decryptionIsSuccess = true;
const DECRYPTION_ERROR_MSG = "ERROR!: Most likely you are using an incorrect pattern / password to decrypt the file with.";

function encryptDataBuffer(data, iv_out){
    console.log("pwd : " + pwd);
    const key = pwdBuffer;
    console.log(`key : ${key}`);
    const iv = Buffer.allocUnsafe(16);

    // Using proper method of generating iv (based on radnom string)
    Crypto.randomBytes(16).copy(iv);
    console.log(`iv.length ${iv.length}`);
    console.log(iv);
    // iv_out is an object which holds the String value of the 16 bytes as 32-char hex value
    // each 2 hex values = 1 byte - iv_out is passed by ref & we use the iv value outside this JS file
    iv_out.value = iv.toString("hex");
    console.log(`iv_out : ${iv_out}`);

    cipher = Crypto.createCipheriv("aes-256-cbc", key,iv);
    var msg = [];
    // 1. encrypt the byes (call final())
    // 2. return base64 of encrypted bytes
    msg.push(cipher.update(data, "binary", "base64"));//, "binary", "hex");
    //console.log(data);
    msg.push(cipher.final("base64"));
    return msg.join("");
}

function decryptDataBuffer(data,in_iv){
    console.log("pwd : " + pwd);
    const key = pwdBuffer;
    console.log(`iv : ${in_iv}`);

    // 2022-06-25 fixing iv which is now passed in
    //const iv = Buffer.from(iv,"base64");
    const iv = Buffer.from(in_iv,"hex");
    console.log("decryptDataBuffer() 1");
    console.log(iv);
    var msg = [];
    cipher = Crypto.createDecipheriv("aes-256-cbc", key, iv);
    // 1. encrypt the byes (call final())
    // 2. return base64 of encrypted bytes
    msg.push(cipher.update(data, "base64", "binary"));//, "hex", "binary");
    
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

function generateHmac(encryptedData, in_iv){
    // format of data is iv:encryptedData
    
    return Crypto.createHmac('sha256', pwdBuffer.toString("hex"))
                .update(`${in_iv}:${encryptedData}`)
                .digest('hex');
}