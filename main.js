const {Client} = require("openrgb-sdk");
const os = require("os-utils");

const name = "orgb";
const port = 6742;
const host = "localhost";
const deviceId = parseInt(process.argv[2]);

const client = new Client(name, port, host);

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const cpuUsage = () => new Promise(resolve => os.cpuUsage(resolve));

let running = true;

const doSetColor = async (id, colors) => {
	if (!running) return;

	const usage = await cpuUsage();

	const absUsage = (usage * 0xFF);

	const coef = 0x91

	const stress = coef - (absUsage * (coef / 0xFF));

	colors[0] = {
		red: 0xFF,
		green: stress,
		blue: 0x00,
	};

	try {
		await client.updateLeds(id, colors);
	} catch (_) {
	}
};


process.on("SIGINT", () => {
	running = false;
	// failsafe
	setTimeout(() => process.exit(0), 2000);
});


(async function () {
	let connected = false;

	while (!connected) {
		try {
			await client.connect();
			connected = true;
		} catch (_) {
		}
		await wait(250);
	}

	let deviceList = [await client.getControllerData(deviceId)];
	if (deviceList.length <= deviceId) return;

	let colors = Array(deviceList[deviceId].colors.length).fill({
		red: 0x00,
		green: 0x00,
		blue: 0x00,
	});

	while (running) {
		doSetColor(deviceId, colors);
		await wait(250);
	}

	try {
		await client.disconnect();
	} catch (_) {
	}
})();

