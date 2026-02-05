// import app from '../server/index';

export default (req: any, res: any) => {
    res.status(200).json({ status: 'ok', message: 'Hello from Vercel Direct' });
};
