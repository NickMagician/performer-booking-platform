// Type definitions for supertest module
declare module 'supertest' {
  import { Application } from 'express';
  
  export interface Response {
    status: number;
    body: any;
    text: string;
    headers: { [key: string]: string };
    type: string;
    charset: string;
  }
  
  export interface Test extends Promise<Response> {
    expect(status: number): Test;
    expect(field: string, val: string | RegExp): Test;
    expect(body: any): Test;
    expect(callback: (res: Response) => void): Test;
    send(data: any): Test;
    query(data: any): Test;
    set(field: string, val: string): Test;
    set(fields: { [key: string]: string }): Test;
    attach(field: string, file: string, filename?: string): Test;
    field(name: string, val: string): Test;
    timeout(ms: number): Test;
    redirects(num: number): Test;
    type(type: string): Test;
    accept(type: string): Test;
    auth(user: string, pass: string): Test;
    ca(cert: string | Buffer): Test;
    cert(cert: string | Buffer): Test;
    key(key: string | Buffer): Test;
    pfx(pfx: string | Buffer): Test;
    end(callback?: (err: any, res: Response) => void): Test;
  }
  
  export interface SuperTest<T> {
    get(url: string): Test;
    post(url: string): Test;
    put(url: string): Test;
    patch(url: string): Test;
    head(url: string): Test;
    delete(url: string): Test;
    del(url: string): Test;
    options(url: string): Test;
    trace(url: string): Test;
    copy(url: string): Test;
    lock(url: string): Test;
    mkcol(url: string): Test;
    move(url: string): Test;
    purge(url: string): Test;
    propfind(url: string): Test;
    proppatch(url: string): Test;
    unlock(url: string): Test;
    report(url: string): Test;
    mkactivity(url: string): Test;
    checkout(url: string): Test;
    merge(url: string): Test;
    'm-search'(url: string): Test;
    notify(url: string): Test;
    subscribe(url: string): Test;
    unsubscribe(url: string): Test;
    search(url: string): Test;
    connect(url: string): Test;
  }
  
  function request(app: Application | string): SuperTest<Test>;
  
  export = request;
}
