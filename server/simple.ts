import express from 'express';
const app = express();
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Hello from Simple TS' });
});
export default app;
