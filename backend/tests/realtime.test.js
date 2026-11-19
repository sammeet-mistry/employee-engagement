const test = require('node:test');
const assert = require('node:assert/strict');
const { emitFeedbackEvent, emitSessionEvent } = require('../utils/realtime');

const captureEmissions = () => {
  const emissions = [];
  return {
    emissions,
    to(room) {
      return {
        emit(event, payload) {
          emissions.push({ room, event, payload });
        }
      };
    }
  };
};

test('feedback events target only the feedback owner and admins', () => {
  const io = captureEmissions();
  emitFeedbackEvent(io, 'feedback:updated', {
    _id: 'feedback-1',
    submittedBy: 'employee-1'
  });

  assert.deepEqual(io.emissions.map(({ room }) => room), ['user:employee-1', 'admins']);
});

test('chat events target only the chat owner and admins', () => {
  const io = captureEmissions();
  emitSessionEvent(io, 'chat:session-updated', {
    _id: 'chat-1',
    user: { _id: 'employee-2' }
  });

  assert.deepEqual(io.emissions.map(({ room }) => room), ['user:employee-2', 'admins']);
  assert.deepEqual(io.emissions[0].payload, { sessionId: 'chat-1' });
});
