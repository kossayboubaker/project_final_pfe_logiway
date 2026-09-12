/**
 * Helper class for date-related operations.
 */
export class DateHelper {
    static formatDate(date: Date): string {
        return date.toLocaleDateString();
    }

    static getToday(): Date {
        return new Date();
    }
}
