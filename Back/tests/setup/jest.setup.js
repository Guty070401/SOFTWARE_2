jest.setTimeout(10000);

afterEach(() => {
  jest.clearAllMocks();
  jest.restoreAllMocks();
});
