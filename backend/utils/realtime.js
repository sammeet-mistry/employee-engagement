const userRoom = (userId) => `user:${userId}`;

const emitFeedbackEvent = (io, event, feedback) => {
  if (!io || !feedback) return;

  const submitterId = feedback.submittedBy?._id || feedback.submittedBy;
  if (submitterId) {
    io.to(userRoom(submitterId)).emit(event, { feedbackId: feedback._id });
  }
  io.to('admins').emit(event, { feedbackId: feedback._id });
};

const emitSessionEvent = (io, event, session) => {
  if (!io || !session) return;

  const ownerId = session.user?._id || session.user;
  const payload = { sessionId: session._id };
  if (ownerId) io.to(userRoom(ownerId)).emit(event, payload);
  io.to('admins').emit(event, payload);
};

module.exports = { userRoom, emitFeedbackEvent, emitSessionEvent };
