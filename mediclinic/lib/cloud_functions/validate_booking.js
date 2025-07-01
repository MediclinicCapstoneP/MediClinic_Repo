exports.validateBooking = functions.firestore.document('appointments/{id}')
  .onCreate((snap, context) => {
    const data = snap.data();
    // Run ML model to check for suspicious patterns
    // If suspicious, mark as 'flagged'
    return snap.ref.update({status: 'flagged'});
  });