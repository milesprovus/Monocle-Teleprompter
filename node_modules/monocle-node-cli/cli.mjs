import { replSend, replRawMode, ensureConnected, listFilesDevice } from './index.mjs';

import { createInterface } from 'readline';

const readline = createInterface({
input: process.stdin,
output: process.stdout,
});

const enter = '\x1B[F\r';

console.log("Connecting");
await ensureConnected();
console.log("Connected, waiting for input");
replSend("import device; device.battery_level();" + enter);
replSend("import led; led.off(led.RED);" + enter);

readline.on('line', (input) => {
    replSend(`import display; text = display.Text("${input}", 320, 200, display.WHITE, justify=display.MIDDLE_CENTER); display.show(text);` + enter);
}); 