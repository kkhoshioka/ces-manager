import 'dotenv/config';
declare const app: import("express-serve-static-core").Express;
export default app;
export declare const handleProjectStock: (tx: any, projectId: number, action: "deduct" | "revert") => Promise<void>;
