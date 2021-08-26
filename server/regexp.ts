// regular expressions for database input validation
export const alphaNumRegex: RegExp = /^[a-z0-9]+$/i;            // alphanumeric
export const alphaNumSpaceRegex: RegExp = /^[a-z0-9\s]+$/i;     // alphanumeric + space
export const fileRegex: RegExp = /^[a-f0-9]{64}\.[a-z]{1,4}$/i; // filename uploads