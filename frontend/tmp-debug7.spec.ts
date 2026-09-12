describe('debug token identity', () => {
  it('compare', () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mat = require('@angular/material/snack-bar');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const comp: any = require('./src/app/features/affectation-vehicule/affectation-vehicule.component');
    const CompClass = comp.AffectationVehiculeComponent;
    const params = CompClass.ctorParameters();
    console.log('ctor param types:', params.map((p: any) => p.type && p.type.name).join(','));
    console.log('MatSnackBar token match:', params[1].type === mat.MatSnackBar);
    console.log('mat keys count:', Object.keys(mat).length);
    console.log('resolved path:', require.resolve('@angular/material/snack-bar'));
    expect(true).toBe(true);
  });
});
