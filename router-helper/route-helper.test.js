import { catchToStatus } from './router-helper';

async function throwableAsync(what) {
  if (what === 'e') {
    throw new Error('throwed');
  }
  return what;
}

describe('catchToStatus', () => {
  test('when async throws send status instead', async () => {
    const response = {
      end: jest.fn(),
      status: jest.fn(() => response),
    };
    const logger = {
      error: jest.fn(),
    };
    const result = await catchToStatus(throwableAsync, response, 500, logger)('e');
    expect(result).not.toBe('e');
    expect(response.status.mock.calls.length).toBe(1);
    expect(response.end.mock.calls.length).toBe(1);
    expect(logger.error.mock.calls.length).toBe(1);
  });

  test('when async doesn\'t throw send status instead', async () => {
    const response = {
      end: jest.fn(),
      status: jest.fn(),
    };
    const logger = {
      error: jest.fn(),
    };
    const result = await catchToStatus(throwableAsync, response, 500, logger)('x');
    expect(result).toBe('x');
    expect(response.status.mock.calls.length).toBe(0);
    expect(response.end.mock.calls.length).toBe(0);
    expect(logger.error.mock.calls.length).toBe(0);
  });
});
