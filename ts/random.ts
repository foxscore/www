class Random extends Static {
    public static bool(): boolean {
        return Boolean(Math.round(Math.random()));
    }
    public static int(min: number, max: number): number {
        return Math.floor(Math.random() * (max - min + 1) + min);
    }
}