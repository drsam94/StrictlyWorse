export class Timer {
    private currentMs: number;

    constructor() {
        this.currentMs = performance.now();
    }

    public reset(): void {
        this.currentMs = performance.now();
    }
    public checkpoint(desc: string): void {
        const now = performance.now();
        const delta = now - this.currentMs;
        console.log(desc + ": " + delta + "ms");
        this.currentMs = now;
    }
};