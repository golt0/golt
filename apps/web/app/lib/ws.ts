const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:4000';

let ws: WebSocket | null = null;

export function connect(token: string) {
    ws = new WebSocket(`${WS_URL}?token=${token}`);

    ws.onmessage = (event) => {
        const { event: type, data } = JSON.parse(event.data);
        const cb = listeners[type];
        if (cb) cb(data);
    };
}

export function joinProject(projectId: string) {
    ws?.send(JSON.stringify({ type: 'join', projectId }));
}

export function disconnect() {
    ws?.close();
    ws = null;
}


const listeners: Record<string, (data: any) => void> = {};

export function on(event: string, cb: (data: any) => void) {
    listeners[event] = cb;
}