import mongoose from 'mongoose';
import { ApiError } from '../../../utils/ApiError.js';
import { ApiResponse } from '../../../utils/ApiResponse.js';
import { asyncHandler } from '../../../utils/asyncHandler.js';

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
        userType: 'vendor',
        userName: req.user.storeName || req.user.firstName,
        answer
    });

    await questionDoc.save();

    res.status(201).json(new ApiResponse(201, questionDoc, 'Answer posted successfully.'));
});
