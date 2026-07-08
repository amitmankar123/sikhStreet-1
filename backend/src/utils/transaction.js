import mongoose from 'mongoose';

/**
 * Executes a callback within a MongoDB/Mongoose transaction.
 * If MongoDB is running as a standalone server (no replica set),
 * it will automatically fall back to executing the callback without a transaction session.
 *
 * @param {Function} callback - Async function to run. Receives the `session` object (or null if fallback).
 * @returns {Promise<any>} - Returns the result of the callback.
 */

// Cache: once we know this is a standalone instance, skip sessions on all future calls.
let isStandaloneMode = false;

function isReplicaSetError(error) {
  if (!error) return false;
  const msg = String(error.message || error.errmsg || '').toLowerCase();
  const code = Number(error.code ?? error.result?.code ?? error.errorResponse?.code ?? NaN);
  const codeName = String(error.codeName || error.result?.codeName || '').toLowerCase();

  return (
    msg.includes('replica set') ||
    msg.includes('mongos') ||
    msg.includes('retryable') ||
    msg.includes('illegalooperation') ||
    msg.includes('transaction numbers are only allowed') ||
    msg.includes('does not support retryable writes') ||
    msg.includes('does not support transactions') ||
    code === 20 ||
    codeName === 'illegalooperation'
  );
}

export async function runInTransaction(callback) {
  // If we already know this is standalone, skip session overhead entirely.
  if (isStandaloneMode) {
    return await callback(null);
  }

  let session;
  try {
    session = await mongoose.startSession();
  } catch (err) {
    if (isReplicaSetError(err)) {
      console.warn('⚠️ MongoDB standalone mode detected (session start failed). Running without transaction.');
      isStandaloneMode = true;
      return await callback(null);
    }
    throw err;
  }

  try {
    let result;
    await session.withTransaction(async () => {
      result = await callback(session);
    });
    return result;
  } catch (error) {
    if (isReplicaSetError(error)) {
      console.warn('⚠️ MongoDB standalone mode detected (transaction failed). Falling back to non-transactional execution.');
      isStandaloneMode = true;
      return await callback(null);
    }
    throw error;
  } finally {
    session?.endSession().catch(() => {});
  }
}
