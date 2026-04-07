export declare class CallbackManager implements Disposable {
    private server;
    constructor(server: {
        publish: (topic: string, data: string) => void;
    });
    private sessionUpdateCallback;
    private rawOutputCallback;
    [Symbol.dispose](): void;
}
//# sourceMappingURL=callback-manager.d.ts.map