import mongoose from 'mongoose';
import { ApiError } from '../../../utils/ApiError.js';
import { ApiResponse } from '../../../utils/ApiResponse.js';
import { asyncHandler } from '../../../utils/asyncHandler.js';

export const askQuestion = asyncHandler(async (req, res) => {
    const ProductQuestion = mongoose.model('ProductQuestion');
    const Product = mongoose.model('Product');
    const { productId, question } = req.body;

    if (!productId || !question) {
        throw new ApiError(400, 'Product ID and question are required.');
    }

    const product = await Product.findById(productId);
    if (!product) throw new ApiError(404, 'Product not found.');

    const newQuestion = await ProductQuestion.create({
        productId,
        userId: req.user.id,
        userName: req.user.name || 'Anonymous Buyer',
        question
    });

    res.status(201).json(new ApiResponse(201, newQuestion, 'Question posted successfully.'));
});

export const answerQuestion = asyncHandler(async (req, res) => {
    const ProductQuestion = mongoose.model('ProductQuestion');
    const { answer } = req.body;
    const { questionId } = req.params;

    if (!answer) {
        throw new ApiError(400, 'Answer is required.');
    }

    const questionDoc = await ProductQuestion.findById(questionId);
    if (!questionDoc) throw new ApiError(404, 'Question not found.');

    questionDoc.answers.push({
        userId: req.user.id,
        userType: 'buyer',
        userName: req.user.name || 'Anonymous Buyer',
        answer
    });

    await questionDoc.save();

    res.status(201).json(new ApiResponse(201, questionDoc, 'Answer posted successfully.'));
});
