import { collection, addDoc } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Persists a reclamation (complaint) so that admins can review it later.
 * Centralizing the logic here keeps screens/components thin and lets us reuse the same
 * Firestore shape everywhere in the app.
 *
 * @param {Object} payload - Data describing the reclamation
 * @param {string} payload.userId - UID of the reporter
 * @param {string} [payload.userEmail] - Email of the reporter (for quick admin context)
 * @param {string} [payload.userName] - Display name of the reporter
 * @param {string} [payload.userRole='user'] - 'user' | 'seller' | 'admin'
 * @param {string} payload.subject - Short title summarizing the issue (stored as `reason`)
 * @param {string} payload.message - Detailed explanation of the reclamation (stored as `details`)
 * @param {string} [payload.referenceId] - Optional reference (order #, product id, etc.)
 */
export const submitReclamation = async ({
  userId,
  userEmail = '',
  userName = '',
  userRole = 'user',
  subject,
  message,
  referenceId = '',
}) => {
  if (!userId) {
    throw new Error('Missing user identifier');
  }
  if (!subject || !message) {
    throw new Error('Subject and message are required');
  }

  const timestamps = new Date().toISOString();

  const payload = {
    userId,
    userEmail,
    userName,
    userRole,
    reason: subject.trim(),
    details: message.trim(),
    referenceId: referenceId.trim(),
    status: 'open',
    createdAt: timestamps,
    updatedAt: timestamps,
  };

  const docRef = await addDoc(collection(db, 'complaints'), payload);
  return docRef.id;
};

export default submitReclamation;

