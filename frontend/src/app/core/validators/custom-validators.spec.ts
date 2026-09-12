import { FormControl } from '@angular/forms';
import { CustomValidators } from './custom-validators';

describe('CustomValidators', () => {

  // ─── patternValidator() ───────────────────────────────────────
  describe('patternValidator()', () => {

    it('should return null for empty/null control value', () => {
      const validator = CustomValidators.patternValidator(/^[A-Z]+$/, { uppercase: true });
      const control = new FormControl('');
      expect(validator(control)).toBeNull();
    });

    it('should return null when pattern matches', () => {
      const validator = CustomValidators.patternValidator(/^[A-Z]+$/, { uppercase: true });
      const control = new FormControl('HELLO');
      expect(validator(control)).toBeNull();
    });

    it('should return error object when pattern does not match', () => {
      const validator = CustomValidators.patternValidator(/^[A-Z]+$/, { uppercase: true });
      const control = new FormControl('hello');
      expect(validator(control)).toEqual({ uppercase: true });
    });

    it('should work with number pattern', () => {
      const validator = CustomValidators.patternValidator(/^\d+$/, { numbersOnly: true });
      const numControl = new FormControl('12345');
      const textControl = new FormControl('abc123');
      expect(validator(numControl)).toBeNull();
      expect(validator(textControl)).toEqual({ numbersOnly: true });
    });

    it('should work with email-like pattern', () => {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      const validator = CustomValidators.patternValidator(emailRegex, { invalidEmail: true });
      expect(validator(new FormControl('test@example.com'))).toBeNull();
      expect(validator(new FormControl('not-an-email'))).toEqual({ invalidEmail: true });
    });

    it('should work with password strength pattern', () => {
      // At least 1 uppercase, 1 lowercase, 1 digit
      const strongPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/;
      const validator = CustomValidators.patternValidator(strongPassword, { weakPassword: true });
      expect(validator(new FormControl('Password1'))).toBeNull();
      expect(validator(new FormControl('password'))).toEqual({ weakPassword: true });
      expect(validator(new FormControl('PASSWORD1'))).toEqual({ weakPassword: true });
    });

    it('should handle null control value', () => {
      const validator = CustomValidators.patternValidator(/^\d+$/, { error: true });
      const control = new FormControl(null);
      expect(validator(control)).toBeNull();
    });

    it('should handle undefined control value', () => {
      const validator = CustomValidators.patternValidator(/^\d+$/, { error: true });
      const control = new FormControl(undefined);
      expect(validator(control)).toBeNull();
    });

    it('should return the exact error object provided', () => {
      const customError = { minLength: true, customCode: 42 };
      const validator = CustomValidators.patternValidator(/^.{8,}$/, customError);
      const control = new FormControl('short');
      expect(validator(control)).toEqual(customError);
    });

    it('should return null for valid input with min-length pattern', () => {
      const validator = CustomValidators.patternValidator(/^.{8,}$/, { minLength: true });
      expect(validator(new FormControl('longenough'))).toBeNull();
    });
  });
});
