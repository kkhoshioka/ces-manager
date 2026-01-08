
import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Get all settings
router.get('/', async (req, res) => {
    try {
        const settings = await prisma.systemSetting.findMany();
        // Convert to key-value object for frontend convenience
        const settingsMap: Record<string, string> = {};
        settings.forEach(s => {
            settingsMap[s.key] = s.value;
        });
        res.json(settingsMap);
    } catch (error) {
        console.error('Failed to fetch system settings', error);
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
});

// Update settings (bulk or single)
router.post('/', async (req, res) => {
    const updates = req.body; // Expect { key: value, key2: value2 }

    try {
        const promises = Object.entries(updates).map(([key, value]) => {
            return prisma.systemSetting.upsert({
                where: { key },
                update: { value: String(value) },
                create: { key, value: String(value) }
            });
        });

        await Promise.all(promises);
        res.json({ success: true });
    } catch (error) {
        console.error('Failed to update system settings', error);
        res.status(500).json({ error: 'Failed to update settings' });
    }
});

export default router;
