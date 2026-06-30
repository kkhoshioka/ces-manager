import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Get all active internal reps
router.get('/', async (req, res) => {
    try {
        const reps = await prisma.internalRep.findMany({
            orderBy: { id: 'asc' }
        });
        res.json(reps);
    } catch (error) {
        console.error('Error fetching internal reps:', error);
        res.status(500).json({ error: 'Failed to fetch internal reps' });
    }
});

// Create internal rep
router.post('/', async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({ error: 'Name is required' });
        }
        const rep = await prisma.internalRep.create({
            data: { name }
        });
        res.status(201).json(rep);
    } catch (error: any) {
        console.error('Error creating internal rep:', error);
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'この名前は既に登録されています' });
        }
        res.status(500).json({ error: 'Failed to create internal rep' });
    }
});

// Update internal rep
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, isActive } = req.body;
        const rep = await prisma.internalRep.update({
            where: { id: parseInt(id, 10) },
            data: { name, isActive }
        });
        res.json(rep);
    } catch (error) {
        console.error('Error updating internal rep:', error);
        res.status(500).json({ error: 'Failed to update internal rep' });
    }
});

// Delete internal rep
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.internalRep.delete({
            where: { id: parseInt(id, 10) }
        });
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting internal rep:', error);
        res.status(500).json({ error: 'Failed to delete internal rep' });
    }
});

export default router;
