import { isConnected, replDataTxQueue,connect,disconnect } from './bluetooth.mjs';
import { startNordicDFU } from './nordicdfu.mjs'; 
import { resolve } from 'path';
import { time, timeEnd } from 'console';
import util from 'util';
let cursorPosition = 0;
let replRawModeEnabled = false;
let rawReplResponseString = '';
let rawReplResponseCallback;
let fileWriteStart = false;
let internalOperation = false;
const decoder = new util.TextDecoder('utf-8');
const RESET_CMD = '\x03\x04';
const FILE_WRITE_MAX = 128;
let DIR_MAKE_CMD = `import os
def md(p):
    c=""
    for d in p.split("/"):
        c += "/"+d
        try:
            os.mkdir(c)
        except:
            pass
`;
export async function replRawMode(enable) {

    if (enable === true) {
        replRawModeEnabled = true;
        // extension: outputChannel.appendLine("Entering raw REPL mode");
        await replSend('\x03\x01');
        return;
    }

     // extension: outputChannel.appendLine("Leaving raw REPL mode");
    await replSend('\x02');
    replRawModeEnabled = false;
    

}

export async function replSend(string) {

    ensureConnected();
    // Strings will be thrown away if not connected
    if (!isConnected()) {
        return;
    }

    if (replRawModeEnabled) {

        // If string contains printable characters, append Ctrl-D
        if (/[\x20-\x7F]/.test(string)) {
            string += '\x04';
        }
        
        // extension: outputChannel.appendLine('Raw REPL ⬆️: ' +
        //string
        //    .replaceAll('\n', '\\n')
        //    .replaceAll('\x01', '\\x01')
        //    .replaceAll('\x02', '\\x02')
        //    .replaceAll('\x03', '\\x03')
        //    .replaceAll('\x04', '\\x04'));

    }

    // Encode the UTF-8 string into an array and populate the buffer
    const encoder = new util.TextEncoder('utf-8');
    replDataTxQueue.push.apply(replDataTxQueue, encoder.encode(string));

    // Return a promise which calls a function that'll eventually run when the
    // response handler calls the function associated with rawReplResponseCallback
    return new Promise(resolve => {
        rawReplResponseCallback = function (responseString) {
            // extension: outputChannel.appendLine('Raw REPL ⬇️: ' + responseString.replaceAll('\r\n', '\\r\\n'));
            console.log('Raw REPL ⬇️: ' + responseString.replaceAll('\r\n', '\\r\\n'));
            resolve(responseString);
        };
        setTimeout(() => {
            resolve(null);
        }, 5000);
    });
}

let initializedWorkspace = false;
export async function ensureConnected() {
    
    if (isConnected() === true) {
        return;
    }
    // extension: updateStatusBarItem("progress");
    try {
        let connectionResult = await connect();
        console.log(connectionResult);

        if (connectionResult === "dfu connected") {
            // infoText.innerHTML = "Starting firmware update..";
            // extension: updateStatusBarItem("connected","$(cloud-download) Updating");
            await startNordicDFU()
                .catch((error) => {
                    console.log(error);
                    disconnect();
                    throw Error("Bluetooth error. Reconnect or check console for details");
                });
            await disconnect();
            // vscode.window.showInformationMessage("Firmware Update done");
            // extension: updateStatusBarItem("progress");
            
            // after 2 sec try to connect;
            setTimeout(ensureConnected,2000);
            
            // return;
        }

        if (connectionResult === "repl connected") {
            /*
            // extension: updatePublishStatus();
            //vscode.commands.executeCommand('setContext', 'monocle.deviceConnected', true);
            // extension: updateStatusBarItem("connected");
            let allTerminals = vscode.window.terminals.filter(ter=>ter.name==='REPL');
            if(allTerminals.length>0){
                allTerminals[0].show();
                vscode.commands.executeCommand('workbench.action.terminal.clear');
            }
            await vscode.commands.executeCommand('workbench.actions.treeView.fileExplorer.refresh');
            */
        }
    }

    catch (error) {
        // Ignore User cancelled errors
        if (error.message && error.message.includes("cancelled")) {
            return;
        }
        // infoText.innerHTML = error;
        // console.error(error);
        // extension: updateStatusBarItem("Disconnected");
    }
}

export function replHandleResponse(string) {
    if (replRawModeEnabled === true) {

        // Combine the string until it's ready to handle
        rawReplResponseString += string;

        // Once the end of response '>' is received, run the callbacks
        if (string.endsWith('>') || string.endsWith('>>> ')) {
            rawReplResponseCallback(rawReplResponseString);
            rawReplResponseString = '';
        }

        // Don't show these strings on the console
        return;
    }
    if(fileWriteStart){
    // extension: writeEmitter.fire(string.slice(string.indexOf('>>>')));
        return;
    }
    if(internalOperation){
        return;
    }
    console.log("replHandleResponse: " + string);
    // extension: writeEmitter.fire(string);
}

export function onDisconnect() {
    
    // vscode.commands.executeCommand('setContext', 'monocle.deviceConnected', false);
    // extension: updateStatusBarItem("disconnected");
	// extension: writeEmitter.fire("Disconnected \r\n");
}

export function reportUpdatePercentage(perc){
    // extension: updateStatusBarItem("updating", perc.toFixed(2));
    
}
export function receiveRawData(data){
    console.log(data);
}

async function exitRawReplInternal(){
    await replRawMode(false);
    internalOperation = false;
}

async function enterRawReplInternal(){
    if (!isConnected()) {
        return false;
    }
    if(replRawModeEnabled || internalOperation){
        await new Promise(r => {
            let interval = setInterval(()=>{
                if(!replRawModeEnabled && !internalOperation){
                    setTimeout(()=>{
                        r("");
                    },10);
                    clearInterval(interval);
                }
            },10);
        });
    }
    internalOperation = true;
    await replRawMode(true);
    await new Promise(r => setTimeout(r, 10));
    return true;
}

export async function listFilesDevice(currentPath="/"){

    if(!await enterRawReplInternal()){return[];};
    let cmd = `import os,ujson;
d="${currentPath}"
l =[]
if os.stat(d)[0] & 0x4000:
    for f in os.ilistdir(d):
        if f[0] not in ('.', '..'):
            l.append({"name":f[0],"file":not f[1] & 0x4000})
print(ujson.dumps(l))
del(os,l,d)`;
    let response = await replSend(cmd);

    await exitRawReplInternal();

    if(response){
        try{
            let strList = response.slice(response.indexOf('OK')+2,response.indexOf('\r\n\x04'));
            strList = JSON.parse(strList);
            // strList.push('main.py');
            return strList;
        }catch(error){
            // extension: outputChannel.appendLine(error);
            return [];
        }
    }
    return [];
}

export async function createDirectoryDevice(devicePath){
   
    if(!await enterRawReplInternal()){return false;};
    let dirMakeCmd = DIR_MAKE_CMD+`md('${devicePath}');del(md,os)`;
    let response = await replSend(dirMakeCmd);
    await exitRawReplInternal();
    if(response && !response.includes("Error")){
        return true;
    }
    return false;
}

export async function renameFileDevice(oldDevicePath, newDevicePath){
    
    if(!await enterRawReplInternal()){return false;};

    let cmd = `import os;
os.rename('${oldDevicePath}','${newDevicePath}'); del(os)`;
    let response = await replSend(cmd);
    await replSend(RESET_CMD);
    await exitRawReplInternal();
    if(response &&  !response.includes("Error")){return true;};
    return false;
}

export async function readFileDevice(devicePath){
   
    if(!await enterRawReplInternal()){return false;};

    let cmd = `f=open('${devicePath}');print(f.read());f.close();del(f)`;
    let response = await replSend(cmd);
    await exitRawReplInternal();
    if(response &&  !response.includes("Error")){return response.slice(response.indexOf('OK')+2,response.indexOf('\r\n\x04'));};
    return false;
}


export async function deletFilesDevice(devicePath){

    if(!await enterRawReplInternal()){return false;};

    let cmd = `import os;
def rm(d):
    try:
        if os.stat(d)[0] & 0x4000:
            for f in os.ilistdir(d):
                if f[0] not in ('.', '..'):
                    rm("/".join((d, f[0])))
            os.rmdir(d)
        else:
            os.remove(d)
    except Exception as e:
        print("rm of '%s' failed" % d,e)
rm('${devicePath}'); del(os);del(rm)`;
    let response = await replSend(cmd);
    await replSend(RESET_CMD);
    await exitRawReplInternal();
    if(response &&  !response.includes("failed")){return true;};
    return false;
}
