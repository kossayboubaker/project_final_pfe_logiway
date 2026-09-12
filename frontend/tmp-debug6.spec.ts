describe('debug tokens', () => {
  it('inspect', () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const comp: any = require('./src/app/features/affectation-vehicule/affectation-vehicule.component');
    const CompClass = comp.AffectationVehiculeComponent;
    const src = CompClass.toString();
    console.log('CTOR SOURCE:\n' + src.slice(0, 1200));
    const decoKeys = Object.getOwnPropertyNames(CompClass);
    console.log('props:', decoKeys.join(','));
    console.log('ɵcmp?', !!CompClass.ɵcmp, 'ɵfac?', !!CompClass.ɵfac);
    if (CompClass.ɵfac) {
      console.log('FAC SOURCE:\n' + CompClass.ɵfac.toString().slice(0, 800));
    }
    expect(true).toBe(true);
  });
});
