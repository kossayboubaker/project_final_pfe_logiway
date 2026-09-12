import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

describe('debug subscribe', () => {
  it('shim spy and.returnValue works with subscribe observer object', () => {
    const spy = jasmine.createSpy('s').and.returnValue(of('x'));
    let got: string | null = null;
    (spy() as any).subscribe({
      next: (v: string) => { got = v; },
      error: () => { got = 'err'; }
    });
    expect(spy).toHaveBeenCalled();
    expect(got).toBe('x');
  });

  it('throwError via and.returnValue reaches error callback', () => {
    const spy = jasmine.createSpy('s').and.returnValue(
      (require('rxjs') as any).throwError(() => new Error('boom'))
    );
    let got: string | null = null;
    (spy() as any).subscribe({
      next: () => { got = 'next'; },
      error: () => { got = 'err'; }
    });
    expect(got).toBe('err');
  });
});
