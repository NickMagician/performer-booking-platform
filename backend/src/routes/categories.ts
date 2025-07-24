import { Router } from 'express';
import { getCategories, getCategoryBySlug } from '../controllers/categories';

const router = Router();

/**
 * @route   GET /api/categories
 * @desc    Get all categories with pagination
 * @access  Public
 */
router.get('/', getCategories);

/**
 * @route   GET /api/categories/:slug
 * @desc    Get category by slug with featured performers
 * @access  Public
 */
router.get('/:slug', getCategoryBySlug);

export default router;
