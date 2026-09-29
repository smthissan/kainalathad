// Trusted server layer for paid product downloads.
// Deploy as a Firebase Cloud Function with Firebase Admin SDK.
// The client must never receive a permanent getDownloadURL() for private files.

const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { getFirestore } = require('firebase-admin/firestore');
const { getStorage } = require('firebase-admin/storage');
const { initializeApp } = require('firebase-admin/app');

initializeApp();

const db = getFirestore();

exports.getProductDownloadUrl = onCall(async (request) => {
  // 1. Authentication is required
  if (!request.auth) {
    throw new HttpsError(
      'unauthenticated',
      'Authentication required.'
    );
  }

  // 2. Validate product ID
  const productId = String(
    request.data?.productId || ''
  ).trim();

  if (!productId) {
    throw new HttpsError(
      'invalid-argument',
      'productId is required.'
    );
  }

  // 3. Load product
  const productSnap = await db
    .collection('storeProducts')
    .doc(productId)
    .get();

  if (!productSnap.exists) {
    throw new HttpsError(
      'not-found',
      'Product not found.'
    );
  }

  const product = productSnap.data();

  // 4. Check primary administrator
  // No Custom Claims are used according to the agreed architecture.
  const userEmail = String(
    request.auth.token.email || ''
  ).toLowerCase();

  const isAdmin =
    userEmail === 'smthysan@gmail.com';

  // 5. Non-admin users must have a completed purchase
  if (!isAdmin) {
    const purchaseQuery = await db
      .collection('purchaseRequests')
      .where(
        'customerUid',
        '==',
        request.auth.uid
      )
      .where(
        'productId',
        '==',
        productId
      )
      .where(
        'status',
        '==',
        'completed'
      )
      .limit(1)
      .get();

    if (purchaseQuery.empty) {
      throw new HttpsError(
        'permission-denied',
        'Product is not available for this account.'
      );
    }
  }

  // 6. Validate the private file path
  const path = String(
    product.privateFilePath || ''
  );

  const expectedPrefix =
    `products/${productId}/file/`;

  if (
    !path ||
    !path.startsWith(expectedPrefix)
  ) {
    throw new HttpsError(
      'failed-precondition',
      'Private product file is not configured.'
    );
  }

  // 7. Access Firebase Storage server-side
  const bucket = getStorage().bucket();
  const file = bucket.file(path);

  // 8. Make sure the file actually exists
  const [exists] = await file.exists();

  if (!exists) {
    throw new HttpsError(
      'not-found',
      'Private file not found.'
    );
  }

  // 9. Generate a temporary signed URL
  // The URL expires after 5 minutes.
  const [url] = await file.getSignedUrl({
    version: 'v4',
    action: 'read',
    expires:
      Date.now() + 5 * 60 * 1000,
  });

  // 10. Return the temporary download URL
  return {
    url,
    expiresInSeconds: 300,
  };
});