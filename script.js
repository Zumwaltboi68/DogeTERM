document.addEventListener("DOMContentLoaded", () => {
    let terminals = {};
    let currentTabId = 1;

    function createTerminal(tabId) {
        const term = new Terminal({
            theme: {
                foreground: '#333333',
                background: '#f5deb3',
                cursor: '#daa520',
                selection: 'rgba(218, 165, 32, 0.3)',
                black: '#000000',
                red: '#ff4500',
                green: '#32cd32',
                yellow: '#ffd700',
                blue: '#1e90ff',
                magenta: '#ff1493',
                cyan: '#00ced1',
                white: '#f5f5f5',
                brightBlack: '#696969',
                brightRed: '#ff6347',
                brightGreen: '#7cfc00',
                brightYellow: '#ffff00',
                brightBlue: '#87ceeb',
                brightMagenta: '#ff69b4',
                brightCyan: '#e0ffff',
                brightWhite: '#ffffff'
            },
            cursorBlink: true,
            fontFamily: '"Courier New", monospace',
            fontSize: 16
        });

        const fitAddon = new FitAddon.FitAddon();
        term.loadAddon(fitAddon);
        term.open(document.getElementById('terminal-content'));
        fitAddon.fit();

        const socket = new WebSocket('ws://localhost:3000');

        socket.onopen = () => {
            term.write('Connected to DogeTERM. Much power.\r\n');
        };

        term.onData(data => {
            socket.send(data);
        });

        socket.onmessage = event => {
            term.write(event.data);
        };

        term.onResize(({ cols, rows }) => {
            socket.send(JSON.stringify({ resize: true, cols, rows }));
        });

        socket.onclose = () => {
            term.write('\r\nConnection closed by the server.\r\n');
        };

        terminals[tabId] = { term, socket };
    }

    function switchTab(tabId) {
        document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
        document.querySelector(`.tab[data-id="${tabId}"]`).classList.add('active');

        document.getElementById('terminal-content').innerHTML = '';
        terminals[tabId].term.open(document.getElementById('terminal-content'));
        terminals[tabId].term.focus();
        currentTabId = tabId;
    }

    document.getElementById('new-tab').addEventListener('click', () => {
        const newTabId = Object.keys(terminals).length + 1;
        const newTab = document.createElement('div');
        newTab.className = 'tab';
        newTab.dataset.id = newTabId;
        newTab.textContent = `Tab ${newTabId}`;
        document.getElementById('tabs').insertBefore(newTab, document.getElementById('new-tab'));

        createTerminal(newTabId);
        switchTab(newTabId);

        newTab.addEventListener('click', () => switchTab(newTabId));
    });

    createTerminal(1);

    setInterval(() => {
        fetch('/resource-usage').then(response => response.json()).then(data => {
            document.getElementById('cpu-usage').textContent = `${data.cpu}%`;
            document.getElementById('ram-usage').textContent = `${data.ram}MB`;
        });
    }, 1000);
});
