import { ensureConnected, reportUpdatePercentage, receiveRawData, onDisconnect } from "./bluetooth/main";
import { replSend, listFilesDevice } from './bluetooth/repl';

const lineCharLimit = 27;
const lineLimit = 6;
var connected = false;
var connectBtn = document.getElementById('connectBtn');
var statusMsg = document.getElementById('status');
connectBtn.addEventListener("click", async function test(){ 
    getConnection();
})

async function getConnection(){
    ensureConnected()
    connected = true

}
