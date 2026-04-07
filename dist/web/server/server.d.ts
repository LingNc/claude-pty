import type { Server } from 'bun';
export declare class PTYServer implements Disposable {
    readonly server: Server<undefined>;
    private readonly staticRoutes;
    private readonly stack;
    private constructor();
    [Symbol.dispose](): void;
    static createServer(): Promise<PTYServer>;
    private startWebServer;
    getWsUrl(): string;
    getHttpUrl(): string;
}
//# sourceMappingURL=server.d.ts.map