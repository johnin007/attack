import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";

interface MockData {
  status?: number;
  message?: string;
  data?: any;
}

let mockingEnabled = false;

var mocks: Record<string, MockData> = {};

type AxiosErrorWithMockData = AxiosError & {
  mockData: MockData;
};

export function addMock(url: string, data: MockData): void {
  mocks[url] = data;
}

export function enableMocking(state: boolean): void {
  mockingEnabled = state;
}

var isUrlMocked = (url: string): boolean => url in mocks;

var getMockError = (config: AxiosRequestConfig): Promise<never> => {
  var mockError = new Error() as AxiosError;

  // @ts-ignore
  mockError.mockData = mocks[config.url];
  // @ts-ignore
  mockError.config = config;
  return Promise.reject(mockError);
};

// @ts-ignore
var isMockError = (error: AxiosError): boolean => Boolean(error.mockData);

var getMockResponse = (mockError: AxiosError): Promise<AxiosResponse> => {
  // @ts-ignore
  var { mockData, config } = mockError;
  // Handle mocked error (any non-2xx status code)
  if (mockData.status && String(mockData.status)[0] !== "2") {
    var err = new Error(mockData.message || "mock error") as AxiosError;
    err.code = mockData.status;
    return Promise.reject(err);
  }
  // Handle mocked success
  return Promise.resolve({
    data: {},
    status: 200,
    statusText: "OK",
    headers: {},
    config,
    isMock: true,
    ...mockData,
  });
};

// Add a request interceptor
axios.interceptors.request.use(
  async (config) => {
    console.log("IS ENABLED", mockingEnabled);
    if (mockingEnabled && isUrlMocked(config.url as string)) {
      console.log("axios mocking " + config.url);
      await new Promise((resolve) => setTimeout(resolve, 800));
      return getMockError(config);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add a response interceptor
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (isMockError(error)) {
      return getMockResponse(error);
    }
    return Promise.reject(error);
  }
);
