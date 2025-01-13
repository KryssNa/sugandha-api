// utils/cron.ts
import cron from 'node-cron';
import { CartService } from '../services/cart.service';

// Run cleanup every day at midnight
cron.schedule('0 0 * * *', async () => {
  try {
    await CartService.cleanupExpiredCarts();
    console.log('Expired carts cleanup completed');
  } catch (error) {
    console.error('Failed to cleanup expired carts:', error);
  }
});