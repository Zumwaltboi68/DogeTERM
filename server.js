const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const pty = require('node-pty');
const os = require('os');
const si = require('systeminformation');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static(__dirname));

wss.on('connection', ws => {
    const shell = os.platform() === 'win32' ? 'powershell.exe' : 'bash';

    const ptyProcess = pty.spawn(shell, [], {
        name: 'xterm-color',
        cols: 80,
        rows: 24,
        cwd: process.env.HOME,
        env: process.env
    });

    ptyProcess.onData(data => {
        ws.send(data);
    });

    ws.on('message', msg => {
        if (msg.startsWith('{"resize"')) {
            const { cols, rows } = JSON
if (msg.startsWith('{"resize"')) {
            const { cols, rows } = JSON.parse(msg);
            ptyProcess.resize(cols, rows);
        } else {
            ptyProcess.write(msg);
        }
    });

    ws.on('close', () => {
        ptyProcess.kill();
    });
});

// Route to provide system resource usage data
app.get('/resource-usage', async (req, res) => {
    try {
        const cpuData = await si.currentLoad();
        const memData = await si.mem();

        const cpuUsage = cpuData.currentLoad.toFixed(2);
        const ramUsage = (memData.active / (1024 * 1024)).toFixed(2);

        res.json({ cpu: cpuUsage, ram: ramUsage });
    } catch (error) {
        console.error('Error fetching system information:', error);
        res.status(500).json({ cpu: 'N/A', ram: 'N/A' });
    }
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`DogeTERM server running on port ${PORT}`);
});
