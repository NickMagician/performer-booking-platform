// Global type declarations for the project

// Jest global functions
declare global {
  function describe(name: string, fn: () => void): void;
  function it(name: string, fn: () => void | Promise<void>): void;
  function test(name: string, fn: () => void | Promise<void>): void;
  function expect(actual: any): jest.Matchers<any>;
  
  namespace expect {
    function any(constructor: any): any;
  }
  function beforeAll(fn: () => void | Promise<void>): void;
  function afterAll(fn: () => void | Promise<void>): void;
  function beforeEach(fn: () => void | Promise<void>): void;
  function afterEach(fn: () => void | Promise<void>): void;

  namespace jest {
    interface Matchers<R> {
      toBe(expected: any): R;
      toEqual(expected: any): R;
      toMatchObject(expected: any): R;
      toHaveProperty(property: string, value?: any): R;
      toContain(item: any): R;
      toBeDefined(): R;
      toBeUndefined(): R;
      toBeNull(): R;
      toBeTruthy(): R;
      toBeFalsy(): R;
      toHaveLength(length: number): R;
      toMatch(regexp: RegExp | string): R;
      toThrow(error?: string | RegExp | Error): R;
      toHaveBeenCalled(): R;
      toHaveBeenCalledWith(...args: any[]): R;
      toHaveBeenCalledTimes(times: number): R;
    }
  }
}

// Node.js global types
declare const process: {
  env: { [key: string]: string | undefined };
  exit(code?: number): never;
  on(event: string, listener: (...args: any[]) => void): void;
};

declare const console: {
  log(...args: any[]): void;
  error(...args: any[]): void;
  warn(...args: any[]): void;
  info(...args: any[]): void;
  debug(...args: any[]): void;
};

// Supertest module declaration
declare module 'supertest' {
  import { Application } from 'express';
  
  interface Response {
    status: number;
    body: any;
    text: string;
    headers: { [key: string]: string };
  }
  
  interface Test {
    expect(status: number): Test;
    expect(field: string, val: string | RegExp): Test;
    expect(body: any): Test;
    send(data: any): Test;
    set(field: string, val: string): Test;
    set(fields: { [key: string]: string }): Test;
    then(resolve: (res: Response) => void, reject?: (err: any) => void): Promise<Response>;
  }
  
  interface SuperTest {
    get(url: string): Test;
    post(url: string): Test;
    put(url: string): Test;
    patch(url: string): Test;
    delete(url: string): Test;
  }
  
  function request(app: Application): SuperTest;
  export = request;
}

export {};
