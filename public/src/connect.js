"use strict";

const nordicDfuServiceUuid = 0xfe59;
const nordicDfuControlCharacteristicUUID = '8ec90001-f315-4f60-9fb8-838830daea50';
const nordicDfuPacketCharacteristicUUID = '8ec90002-f315-4f60-9fb8-838830daea50';
const replDataServiceUuid = "6e400001-b5a3-f393-e0a9-e50e24dcca9e";
const replRxCharacteristicUuid = "6e400002-b5a3-f393-e0a9-e50e24dcca9e";
const replTxCharacteristicUuid = "6e400003-b5a3-f393-e0a9-e50e24dcca9e";
const rawDataServiceUuid = "e5700001-7bac-429a-b4ce-57ff900f479d";
const rawDataRxCharacteristicUuid = "e5700002-7bac-429a-b4ce-57ff900f479d";
const rawDataTxCharacteristicUuid = "e5700003-7bac-429a-b4ce-57ff900f479d";
const MAX_MTU = 125;
const EMPTY = new Uint8Array(0);
const ENCODER = new TextEncoder();
const DECODER = new TextDecoder();
const statusMsg = document.getElementById('status');
const connectBtn = document.getElementById('connectBtn');
const sendBtn = document.getElementById('send');
class Bytes {
    buf = EMPTY;
    len = 0;
    lck = false;
    subarray(pos, len) {
        if (len > this.len) {
            throw "Out of bounds";
        }
        return this.buf.subarray(pos, pos + len);
    }
    write(buf) {
        if (this.buf.length - this.len < buf.byteLength) {
            const old = this.buf;
            this.buf = new Uint8Array(this.len + buf.byteLength);
            this.buf.set(old);
        }
        this.buf.set(buf, this.len);
        this.len += buf.length;
    }
    read(len) {
        return this.subarray(0, Math.min(this.len, len));
    }
    read_lock(len) {
        this.lck = true;
        return this.read(len);
    }
    advance(len) {
        this.buf = this.buf.subarray(len);
        this.len -= len;
    }
    advance_unlock(len) {
        this.lck = false;
        this.advance(len);
    }
}
function transmit(channel, bytes) {
    if (bytes.len > 0 && !bytes.lck) {
        const tmp = bytes.read_lock(MAX_MTU);
        channel.writeValueWithoutResponse(tmp).then(() => bytes.advance_unlock(tmp.length)).catch(err => {
            // Unlock, but rethrow
            bytes.advance_unlock(tmp.length);
            Promise.reject(err);
        });
    }
}

var myMonocle
async function connect() {
    var _device$gatt;
    if (!navigator.bluetooth) {
        throw "This browser doesn't support WebBluetooth. " + "Make sure you're on Chrome Desktop/Android or BlueFy iOS.";
    }
    let device;
    if (/iPhone|iPad/.test(navigator.userAgent)) {
        device = await navigator.bluetooth.requestDevice({
            acceptAllDevices: true
        });
    } else {
        device = await navigator.bluetooth.requestDevice({
            filters: [{
                services: [replDataServiceUuid]
            }, {
                services: [nordicDfuServiceUuid]
            }],
            optionalServices: [rawDataServiceUuid]
        });
        statusMsg.innerHTML = "Connected";
        statusMsg.style.color = "#07fc03";
        connectBtn.style.visibility = "hidden";
        sendBtn.style.visibility = "visible";

    }
    const server = await ((_device$gatt = device.gatt) === null || _device$gatt === void 0 ? void 0 : _device$gatt.connect());
    if (!server) {
        throw "Bluetooth service undefined";
    }
    const dfu = await (server === null || server === void 0 ? void 0 : server.getPrimaryService(nordicDfuServiceUuid).catch(() => { }));
    if (dfu) {
        const dfuctr = await dfu.getCharacteristic(nordicDfuControlCharacteristicUUID);
        const dfupkt = await dfu.getCharacteristic(nordicDfuPacketCharacteristicUUID);
        const monocle = {
            kind: "dfu",
            server,
            dfu,
            dfuctr,
            dfupkt
        };
        device.ongattserverdisconnected = function () {
            if (monocle.disconnected) monocle.disconnected();
        };
        dfu.oncharacteristicvaluechanged = function (ev) {
            console.log("Dfu ", ev);
        };
        myMonocle = monocle
        return monocle;
    }
    const repl = await server.getPrimaryService(replDataServiceUuid);
    const data = await server.getPrimaryService(rawDataServiceUuid);
    const replrx = await repl.getCharacteristic(replRxCharacteristicUuid);
    const repltx = await repl.getCharacteristic(replTxCharacteristicUuid);
    const datarx = await data.getCharacteristic(rawDataRxCharacteristicUuid);
    const datatx = await data.getCharacteristic(rawDataTxCharacteristicUuid);
    const replbuf = new Bytes();
    const databuf = new Bytes();
    const repltask = setInterval(() => transmit(replrx, replbuf));
    const datatask = setInterval(() => transmit(datarx, databuf));
    const monocle = {
        kind: "data",
        raw: false,
        server,
        repltask,
        datatask,
        data_send(data) {
            if (typeof data == 'string') {
                data = ENCODER.encode(data);
            }
            replbuf.write(new Uint8Array(data));
        },
        async repl(data) {
            if (typeof data == 'string') {
                if (this.raw && /[\x20-\x7F]/.test(data)) {
                    data += '\x04';
                }
                data = ENCODER.encode(data);
            }
            replbuf.write(new Uint8Array(data));
            return new Promise(resolve => {
                this.repl_cb = data => resolve(data);
                setTimeout(() => resolve(''), 500);
            });
        },
        async set_raw(raw) {
            if (raw) {
                this.raw = true;
                await this.repl('\x03\x01');
            } else {
                this.raw = false;
                await this.repl('\x02');
            }
        },
        stop() {
            clearInterval(this.repltask);
            clearInterval(this.datatask);
        }
    };
    device.ongattserverdisconnected = function () {
        if (monocle.disconnected) monocle.disconnected();
    };
    let repl_str = '';
    repltx.oncharacteristicvaluechanged = event => {
        const target = event.target;
        if (!target.value) {
            return;
        }
        if (monocle.raw) {
            repl_str += DECODER.decode(target.value);

            // Once the end of response '>' is received, run the callbacks
            if (repl_str.endsWith('>') || repl_str.endsWith('>>> ')) {
                if (monocle.repl_cb) monocle.repl_cb(repl_str);
                repl_str = '';
            }
        } else {
            if (monocle.repl_cb) monocle.repl_cb(DECODER.decode(target.value));
        }
    };
    datatx.oncharacteristicvaluechanged = event => {
        const target = event.target;
        if (target.value && monocle.data_read) monocle.data_read(target.value);
    };
    await repltx.startNotifications();
    await datatx.startNotifications();
    await monocle.set_raw(true);
    myMonocle = monocle
    return monocle;
}

var jsonData;
function getJSON() {
    var notesData = document.getElementById("output_data");
    jsonData = JSON.stringify(notesData.getAttribute("data-notes"));
    jsonData = jsonData.substring(1, jsonData.length-1)


}

function send() {
    getJSON()
    if (!myMonocle) { console.error('no monocle found'); return; }
    var file = `import device; import os; f = open("data.json", "w"); f.write('${jsonData}'); f.close(); device.reset()`
    myMonocle.repl(file)
    console.log(file)
    console.log('json uploaded')
}

function slides() {
    //send()
    if (!myMonocle) { console.error('no monocle found'); return; }
    var os = "import display; display.show(display.Text('hello world', 0, 0, display.WHITE))"
    var file = `import os; import device; f=open("main.py", "w"); f.write(${os}); f.close(); device.reset()`
    .replaceAll("\n", ";")
    .replaceAll(":;", ":")
    myMonocle.repl(file)
    console.log('os uploaded')
}