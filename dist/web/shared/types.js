export class CustomError extends Error {
    name = 'CustomError';
    prettyPrintColor = '';
    prettyPrintNoColor = '';
    constructor(message) {
        super(message);
        // Note: Bun.inspect may not be available in all environments
        this.prettyPrintColor = message;
        this.prettyPrintNoColor = message;
    }
    toJSON() {
        const obj = {};
        Object.getOwnPropertyNames(this).forEach((key) => {
            obj[key] = this[key];
        });
        return obj;
    }
}
//# sourceMappingURL=types.js.map