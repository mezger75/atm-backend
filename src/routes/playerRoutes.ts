import { Router } from 'express';
import {
  deposit,
  withdraw,
  getBalance,
  getHistory,
  transfer,
  createPlayer,
} from '../controllers/playerController';

const router = Router();

router.post('/create-player', createPlayer);
router.post('/deposit', deposit);
router.post('/withdraw', withdraw);
router.get('/balance/:playerId', getBalance);
router.get('/history/:playerId', getHistory);
router.post('/transfer', transfer);

export default router;
