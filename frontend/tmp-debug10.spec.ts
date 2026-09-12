jest.mock('html2canvas', () => {
  const defaultFn = () => 'CANVAS';
  return { __esModule: true, default: defaultFn };
});

describe('debug dynamic mock', () => {
  it('what does require return?', () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const m: any = require('html2canvas');
    console.log('typeof m:', typeof m);
    console.log('keys:', m && typeof m === 'object' ? Object.keys(m).join(',') : '(fn)');
    console.log('m.default:', typeof m.default);
    console.log('m.__esModule:', m && m.__esModule);

    const p = import('html2canvas');
    p.then((mod: any) => {
      console.log('dynamic import keys:', Object.keys(mod).join(','));
      console.log('dynamic default type:', typeof mod.default);
    });
  });
});
