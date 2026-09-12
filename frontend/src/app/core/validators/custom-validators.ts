import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Collection of custom validators for the application.
 */
export class CustomValidators {
    static patternValidator(regex: RegExp, error: ValidationErrors): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            if (!control.value) {
                return null;
            }
            const valid = regex.test(control.value);
            return valid ? null : error;
        };
    }
}
