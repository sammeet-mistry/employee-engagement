const http = require('node:http');
const https = require('node:https');
const { URL } = require('node:url');

const MAX_RESPONSE_BYTES = 1024 * 1024;
const DEFAULT_TIMEOUT_MS = 185000;

class RagAgentNotConfiguredError extends Error {
  constructor(message = 'The HR knowledge assistant is not configured.') {
    super(message);
    this.name = 'RagAgentNotConfiguredError';
    this.code = 'RAG_AGENT_NOT_CONFIGURED';
  }
}

class RagAgentTimeoutError extends Error {
  constructor() {
    super('The HR knowledge assistant request timed out.');
    this.name = 'RagAgentTimeoutError';
    this.code = 'RAG_AGENT_TIMEOUT';
  }
}

class RagAgentUpstreamError extends Error {
  constructor(kind = 'upstream', statusCode, upstreamCode) {
    super('The HR knowledge assistant returned an invalid response or is unavailable.');
    this.name = 'RagAgentUpstreamError';
    this.code = 'RAG_AGENT_UPSTREAM_ERROR';
    this.kind = kind;
    this.statusCode = statusCode;
    this.upstreamCode = upstreamCode;
  }
}

const parseSource = (value) => {
  if (typeof value !== 'string' || !value.trim() || /no sufficiently relevant source found/i.test(value)) {
    return null;
  }

  const source = value.trim();
  const pageReference = source.match(/^(.+?)\s*-\s*Page\s+(\d+|Unknown)$/i);
  if (!pageReference) return { title: source.slice(0, 300) };

  return {
    title: pageReference[1].trim().slice(0, 300),
    ...(pageReference[2].toLowerCase() !== 'unknown' ? { page: Number(pageReference[2]) } : {})
  };
};

const classifyUpstreamAnswer = (answer) => {
  if (/took too long to respond/i.test(answer)) {
    throw new RagAgentTimeoutError();
  }
  if (
    /there was an error while running the handbook ai/i.test(answer)
    || /something went wrong while connecting to the handbook ai/i.test(answer)
    || /an error occurred while processing your question/i.test(answer)
    || /couldn't generate an answer from the handbook/i.test(answer)
    || /^(no question received|please enter a question)\.?$/i.test(answer.trim())
  ) {
    throw new RagAgentUpstreamError();
  }
};

const readAgentResponse = ({ endpoint, payload, headers, timeoutMs }) => new Promise((resolve, reject) => {
  const transport = endpoint.protocol === 'https:' ? https : http;
  const request = transport.request(endpoint, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...headers
    }
  }, (response) => {
    const chunks = [];
    let responseBytes = 0;

    response.on('data', (chunk) => {
      responseBytes += chunk.length;
      if (responseBytes > MAX_RESPONSE_BYTES) {
        response.destroy(new RagAgentUpstreamError());
        return;
      }
      chunks.push(chunk);
    });

    response.on('error', () => reject(new RagAgentUpstreamError()));
    response.on('end', () => {
      if (response.statusCode < 200 || response.statusCode >= 300) {
        reject(new RagAgentUpstreamError('http', response.statusCode));
        return;
      }

      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch {
        reject(new RagAgentUpstreamError('invalid_json', response.statusCode));
      }
    });
  });

  request.setTimeout(timeoutMs, () => request.destroy(new RagAgentTimeoutError()));
  request.on('error', (error) => {
    reject(error instanceof RagAgentTimeoutError ? error : new RagAgentUpstreamError('transport', undefined, error.code));
  });
  request.end(payload);
});

const getTimeoutMs = () => {
  const configuredTimeout = process.env.RAG_AGENT_TIMEOUT_MS;
  if (!configuredTimeout) return DEFAULT_TIMEOUT_MS;

  const timeoutMs = Number(configuredTimeout);
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1000 || timeoutMs > 300000) {
    throw new RagAgentNotConfiguredError('RAG_AGENT_TIMEOUT_MS must be between 1000 and 300000.');
  }
  return timeoutMs;
};

const getAuthHeaders = () => {
  const headerName = process.env.RAG_AGENT_AUTH_HEADER?.trim();
  const headerValue = process.env.RAG_AGENT_AUTH_VALUE;
  const hasHeaderName = Boolean(headerName);
  const hasHeaderValue = Boolean(headerValue);

  if (hasHeaderName !== hasHeaderValue) {
    throw new RagAgentNotConfiguredError('Configure both RAG_AGENT_AUTH_HEADER and RAG_AGENT_AUTH_VALUE.');
  }

  if (process.env.NODE_ENV === 'production' && (!hasHeaderName || process.env.RAG_AGENT_AUTH_VERIFIED !== 'true')) {
    throw new RagAgentNotConfiguredError('Verified RAG agent authentication is required in production.');
  }

  if (hasHeaderName) {
    try {
      http.validateHeaderName(headerName);
      http.validateHeaderValue(headerName, headerValue);
    } catch {
      throw new RagAgentNotConfiguredError('RAG agent authentication header configuration is invalid.');
    }
  }

  return hasHeaderName ? { [headerName]: headerValue } : {};
};

const queryHrKnowledgeBase = async ({ question }) => {
  if (typeof question !== 'string' || !question.trim()) {
    throw new TypeError('The HR knowledge assistant requires a question.');
  }

  const configuredUrl = process.env.RAG_AGENT_URL;
  if (!configuredUrl) {
    throw new RagAgentNotConfiguredError('Set RAG_AGENT_URL to the existing HR agent /ask endpoint.');
  }

  let endpoint;
  try {
    endpoint = new URL(configuredUrl);
  } catch {
    throw new RagAgentNotConfiguredError('RAG_AGENT_URL must be an absolute HTTP or HTTPS URL.');
  }

  if (!['http:', 'https:'].includes(endpoint.protocol) || endpoint.username || endpoint.password) {
    throw new RagAgentNotConfiguredError('RAG_AGENT_URL must be an HTTP or HTTPS URL without embedded credentials.');
  }

  const response = await readAgentResponse({
    endpoint,
    payload: JSON.stringify({ question: question.trim() }),
    headers: getAuthHeaders(),
    timeoutMs: getTimeoutMs()
  });

  if (!response || typeof response.answer !== 'string' || !Array.isArray(response.sources)) {
    throw new RagAgentUpstreamError('invalid_shape', 200);
  }

  classifyUpstreamAnswer(response.answer);
  const sources = response.sources.map(parseSource).filter(Boolean);
  const reliable = sources.length > 0 && !/couldn't find that information in the employee handbook/i.test(response.answer);

  return { answer: response.answer.trim(), reliable, sources };
};

module.exports = {
  queryHrKnowledgeBase,
  RagAgentNotConfiguredError,
  RagAgentTimeoutError,
  RagAgentUpstreamError
};
