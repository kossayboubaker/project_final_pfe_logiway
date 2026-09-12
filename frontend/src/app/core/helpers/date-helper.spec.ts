import { DateHelper } from './date-helper';

describe('DateHelper', () => {
    it('formatDate retourne la date au format local', () => {
        const date = new Date(2024, 0, 15, 10, 30);
        expect(DateHelper.formatDate(date)).toBe(date.toLocaleDateString());
    });

    it('getToday retourne une instance de Date proche de maintenant', () => {
        const before = Date.now();
        const today = DateHelper.getToday();

        expect(today).toBeInstanceOf(Date);
        expect(today.getTime()).toBeGreaterThanOrEqual(before - 1000);
        expect(today.getTime()).toBeLessThanOrEqual(Date.now() + 1000);
    });
});
