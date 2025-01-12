// Message from the Server
export type ServerMessage = { SearchResults: string[] }

// Message from the client
export type ClientMessage = { Search: string }


export type Keys<T> = T extends T ? keyof T : never;
export type Concrete<T, K extends Keys<T>> = T extends { [P in K]: infer V }
  ? V
  : never;

export type NothingHandler = () => void;
export type ErrorHandler = (error?: string | Error | object) => void;
export type MessageHandler<T, K extends Keys<T>> = (msg: Concrete<T, K>) => void;
export type MessageHandlerMap<M extends object> = {
  [K in Keys<M>]?: MessageHandler<M, K>;
};

/**
 * WebSocket Disconnect Codes
 * @see https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent/code
 */
export const WEBSOCKET_CODES = {
  CLOSE_NORMAL: 1000,
  CLOSE_GOING_AWAY: 1001,
  CLOSE_ABNORMAL: 1006,
  SERVER_ERROR: 1011,
  SERVICE_RESTART: 1012,
};

export type WSEvent =
  | { Disconnect: CloseEvent }
  | { Connect: void }
  | { Error: Event };

export class WebSocketHandler {
  public lastMessage?: Date;

  private connection!: WebSocket;
  private endpoint!: string;

  private handlers: MessageHandlerMap<ServerMessage> = {};
  private metaHandlers: MessageHandlerMap<WSEvent> = {};

  constructor(endpoint: string) {
    this.connect(endpoint);
  }

  public reconnect(force: boolean = false) {
    // Don't try to reconnect if there is a connection already
    if (this.connection?.readyState === this.connection.OPEN && force) return;

    this.disconnect();
    this.connect(this.endpoint);
  }

  public connect(endpoint: string) {
    console.log("Connecting to", endpoint);
    this.endpoint = endpoint;
    this.connection = new WebSocket(endpoint);
    this.connection.onerror = (e) => this.metaHandlers["Error"]?.(e);
    this.connection.onclose = (e) => this.metaHandlers["Disconnect"]?.(e);
    this.connection.onopen = () => this.metaHandlers["Connect"]?.();
    this.connection.onmessage = async (e) => {
      const msg = await e.data.text() as string;
      const res = this.parseMsg(msg);
      if (res) this.handleMessage(res);
    };
  }

  private parseMsg(msg: string): ServerMessage | undefined {
    try {
      const json = JSON.parse(msg) as ServerMessage;
      return json;
    } catch (e) {
      this.metaHandlers.Error?.(e as Event);
      return undefined;
    }
  }

  private handleMessage(msg: ServerMessage) {
    this.lastMessage = new Date();
    for (const key in msg) {
      const handler = key as Keys<ServerMessage>;
      if (!this.handlers[handler])
        console.warn("No message handler found for message type " + handler);
      this.handlers[handler]?.(msg[key as keyof ServerMessage]);
    }
  }

  public register<T extends Keys<ServerMessage>>(
    type: T,
    handler: MessageHandlerMap<ServerMessage>[T]
  ): WebSocketHandler {
    this.handlers[type] = handler;
    return this;
  }

  public registerEvent<T extends Keys<WSEvent>>(
    type: T,
    handler: MessageHandlerMap<WSEvent>[T]
  ) {
    this.metaHandlers[type] = handler;
    return this;
  }

  public send(msg: ClientMessage) {
    this.connection.send(JSON.stringify(msg));
  }

  public disconnect() {
    this.connection.close();
  }
}
