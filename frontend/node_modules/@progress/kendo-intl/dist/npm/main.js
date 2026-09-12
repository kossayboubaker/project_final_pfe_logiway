'use strict';

var defaultData = {
    en: {
        name: "en",
        identity: {
            version: {
                _unicodeVersion: "14.0.0",
                _cldrVersion: "41"
            },
            language: "en"
        },
        territory: "US",
        numbers: {
            symbols: {
                decimal: ".",
                group: ",",
                list: ";",
                percentSign: "%",
                plusSign: "+",
                minusSign: "-",
                exponential: "E",
                superscriptingExponent: "×",
                perMille: "‰",
                infinity: "∞",
                nan: "NaN",
                timeSeparator: ":",
                approximatelySign: "~"
            },
            decimal: {
                patterns: [
                    "n"
                ],
                groupSize: [
                    3
                ]
            },
            scientific: {
                patterns: [
                    "nEn"
                ],
                groupSize: []
            },
            percent: {
                patterns: [
                    "n%"
                ],
                groupSize: [
                    3
                ]
            },
            currency: {
                patterns: [
                    "$n"
                ],
                groupSize: [
                    3
                ],
                "unitPattern-count-one": "n $",
                "unitPattern-count-other": "n $"
            },
            currencies: {
                BGN: {
                    displayName: "Bulgarian Lev",
                    "displayName-count-one": "Bulgarian lev",
                    "displayName-count-other": "Bulgarian leva",
                    symbol: "BGN"
                },
                EUR: {
                    displayName: "Euro",
                    "displayName-count-one": "euro",
                    "displayName-count-other": "euros",
                    symbol: "€",
                    "symbol-alt-narrow": "€"
                },
                USD: {
                    displayName: "US Dollar",
                    "displayName-count-one": "US dollar",
                    "displayName-count-other": "US dollars",
                    symbol: "$",
                    "symbol-alt-narrow": "$"
                }
            },
            localeCurrency: "USD",
            accounting: {
                patterns: [
                    "$n",
                    "($n)"
                ],
                groupSize: [
                    3
                ]
            }
        },
        calendar: {
            gmtFormat: "GMT{0}",
            gmtZeroFormat: "GMT",
            patterns: {
                d: "M/d/y",
                D: "EEEE, MMMM d, y",
                m: "MMM d",
                M: "MMMM d",
                y: "MMM y",
                Y: "MMMM y",
                F: "EEEE, MMMM d, y h:mm:ss a",
                g: "M/d/y h:mm a",
                G: "M/d/y h:mm:ss a",
                t: "h:mm a",
                T: "h:mm:ss a",
                s: "yyyy'-'MM'-'dd'T'HH':'mm':'ss",
                u: "yyyy'-'MM'-'dd HH':'mm':'ss'Z'"
            },
            dateTimeFormats: {
                full: "{1}, {0}",
                long: "{1}, {0}",
                medium: "{1}, {0}",
                short: "{1}, {0}",
                availableFormats: {
                    Bh: "h B",
                    Bhm: "h:mm B",
                    Bhms: "h:mm:ss B",
                    d: "d",
                    E: "ccc",
                    EBh: "E h B",
                    EBhm: "E h:mm B",
                    EBhms: "E h:mm:ss B",
                    Ed: "d E",
                    Eh: "E h a",
                    Ehm: "E h:mm a",
                    EHm: "E HH:mm",
                    Ehms: "E h:mm:ss a",
                    EHms: "E HH:mm:ss",
                    Gy: "y G",
                    GyM: "M/y G",
                    GyMd: "M/d/y G",
                    GyMEd: "E, M/d/y G",
                    GyMMM: "MMM y G",
                    GyMMMd: "MMM d, y G",
                    GyMMMEd: "E, MMM d, y G",
                    h: "h a",
                    H: "HH",
                    hm: "h:mm a",
                    Hm: "HH:mm",
                    hms: "h:mm:ss a",
                    Hms: "HH:mm:ss",
                    hmsv: "h:mm:ss a v",
                    Hmsv: "HH:mm:ss v",
                    hmv: "h:mm a v",
                    Hmv: "HH:mm v",
                    hv: "h a v",
                    Hv: "HH'h' v",
                    M: "L",
                    Md: "M/d",
                    MEd: "E, M/d",
                    MMM: "LLL",
                    MMMd: "MMM d",
                    MMMEd: "E, MMM d",
                    MMMMd: "MMMM d",
                    "MMMMW-count-one": "'week' W 'of' MMMM",
                    "MMMMW-count-other": "'week' W 'of' MMMM",
                    ms: "mm:ss",
                    y: "y",
                    yM: "M/y",
                    yMd: "M/d/y",
                    yMEd: "E, M/d/y",
                    yMMM: "MMM y",
                    yMMMd: "MMM d, y",
                    yMMMEd: "E, MMM d, y",
                    yMMMM: "MMMM y",
                    yQQQ: "QQQ y",
                    yQQQQ: "QQQQ y",
                    "yw-count-one": "'week' w 'of' Y",
                    "yw-count-other": "'week' w 'of' Y"
                }
            },
            timeFormats: {
                full: "h:mm:ss a zzzz",
                long: "h:mm:ss a z",
                medium: "h:mm:ss a",
                short: "h:mm a"
            },
            dateFormats: {
                full: "EEEE, MMMM d, y",
                long: "MMMM d, y",
                medium: "MMM d, y",
                short: "M/d/yy"
            },
            days: {
                format: {
                    abbreviated: [
                        "Sun",
                        "Mon",
                        "Tue",
                        "Wed",
                        "Thu",
                        "Fri",
                        "Sat"
                    ],
                    narrow: [
                        "S",
                        "M",
                        "T",
                        "W",
                        "T",
                        "F",
                        "S"
                    ],
                    short: [
                        "Su",
                        "Mo",
                        "Tu",
                        "We",
                        "Th",
                        "Fr",
                        "Sa"
                    ],
                    wide: [
                        "Sunday",
                        "Monday",
                        "Tuesday",
                        "Wednesday",
                        "Thursday",
                        "Friday",
                        "Saturday"
                    ]
                },
                "stand-alone": {
                    abbreviated: [
                        "Sun",
                        "Mon",
                        "Tue",
                        "Wed",
                        "Thu",
                        "Fri",
                        "Sat"
                    ],
                    narrow: [
                        "S",
                        "M",
                        "T",
                        "W",
                        "T",
                        "F",
                        "S"
                    ],
                    short: [
                        "Su",
                        "Mo",
                        "Tu",
                        "We",
                        "Th",
                        "Fr",
                        "Sa"
                    ],
                    wide: [
                        "Sunday",
                        "Monday",
                        "Tuesday",
                        "Wednesday",
                        "Thursday",
                        "Friday",
                        "Saturday"
                    ]
                }
            },
            months: {
                format: {
                    abbreviated: [
                        "Jan",
                        "Feb",
                        "Mar",
                        "Apr",
                        "May",
                        "Jun",
                        "Jul",
                        "Aug",
                        "Sep",
                        "Oct",
                        "Nov",
                        "Dec"
                    ],
                    narrow: [
                        "J",
                        "F",
                        "M",
                        "A",
                        "M",
                        "J",
                        "J",
                        "A",
                        "S",
                        "O",
                        "N",
                        "D"
                    ],
                    wide: [
                        "January",
                        "February",
                        "March",
                        "April",
                        "May",
                        "June",
                        "July",
                        "August",
                        "September",
                        "October",
                        "November",
                        "December"
                    ]
                },
                "stand-alone": {
                    abbreviated: [
                        "Jan",
                        "Feb",
                        "Mar",
                        "Apr",
                        "May",
                        "Jun",
                        "Jul",
                        "Aug",
                        "Sep",
                        "Oct",
                        "Nov",
                        "Dec"
                    ],
                    narrow: [
                        "J",
                        "F",
                        "M",
                        "A",
                        "M",
                        "J",
                        "J",
                        "A",
                        "S",
                        "O",
                        "N",
                        "D"
                    ],
                    wide: [
                        "January",
                        "February",
                        "March",
                        "April",
                        "May",
                        "June",
                        "July",
                        "August",
                        "September",
                        "October",
                        "November",
                        "December"
                    ]
                }
            },
            quarters: {
                format: {
                    abbreviated: [
                        "Q1",
                        "Q2",
                        "Q3",
                        "Q4"
                    ],
                    narrow: [
                        "1",
                        "2",
                        "3",
                        "4"
                    ],
                    wide: [
                        "1st quarter",
                        "2nd quarter",
                        "3rd quarter",
                        "4th quarter"
                    ]
                },
                "stand-alone": {
                    abbreviated: [
                        "Q1",
                        "Q2",
                        "Q3",
                        "Q4"
                    ],
                    narrow: [
                        "1",
                        "2",
                        "3",
                        "4"
                    ],
                    wide: [
                        "1st quarter",
                        "2nd quarter",
                        "3rd quarter",
                        "4th quarter"
                    ]
                }
            },
            dayPeriods: {
                format: {
                    abbreviated: {
                        midnight: "midnight",
                        am: "AM",
                        "am-alt-variant": "am",
                        noon: "noon",
                        pm: "PM",
                        "pm-alt-variant": "pm",
                        morning1: "in the morning",
                        afternoon1: "in the afternoon",
                        evening1: "in the evening",
                        night1: "at night"
                    },
                    narrow: {
                        midnight: "mi",
                        am: "a",
                        "am-alt-variant": "am",
                        noon: "n",
                        pm: "p",
                        "pm-alt-variant": "pm",
                        morning1: "in the morning",
                        afternoon1: "in the afternoon",
                        evening1: "in the evening",
                        night1: "at night"
                    },
                    wide: {
                        midnight: "midnight",
                        am: "AM",
                        "am-alt-variant": "am",
                        noon: "noon",
                        pm: "PM",
                        "pm-alt-variant": "pm",
                        morning1: "in the morning",
                        afternoon1: "in the afternoon",
                        evening1: "in the evening",
                        night1: "at night"
                    }
                },
                "stand-alone": {
                    abbreviated: {
                        midnight: "midnight",
                        am: "AM",
                        "am-alt-variant": "am",
                        noon: "noon",
                        pm: "PM",
                        "pm-alt-variant": "pm",
                        morning1: "morning",
                        afternoon1: "afternoon",
                        evening1: "evening",
                        night1: "night"
                    },
                    narrow: {
                        midnight: "midnight",
                        am: "AM",
                        "am-alt-variant": "am",
                        noon: "noon",
                        pm: "PM",
                        "pm-alt-variant": "pm",
                        morning1: "morning",
                        afternoon1: "afternoon",
                        evening1: "evening",
                        night1: "night"
                    },
                    wide: {
                        midnight: "midnight",
                        am: "AM",
                        "am-alt-variant": "am",
                        noon: "noon",
                        pm: "PM",
                        "pm-alt-variant": "pm",
                        morning1: "morning",
                        afternoon1: "afternoon",
                        evening1: "evening",
                        night1: "night"
                    }
                }
            },
            eras: {
                format: {
                    wide: {
                        "0": "Before Christ",
                        "1": "Anno Domini",
                        "0-alt-variant": "Before Common Era",
                        "1-alt-variant": "Common Era"
                    },
                    abbreviated: {
                        "0": "BC",
                        "1": "AD",
                        "0-alt-variant": "BCE",
                        "1-alt-variant": "CE"
                    },
                    narrow: {
                        "0": "B",
                        "1": "A",
                        "0-alt-variant": "BCE",
                        "1-alt-variant": "CE"
                    }
                }
            },
            dateFields: {
                era: {
                    wide: "era",
                    short: "era",
                    narrow: "era"
                },
                year: {
                    wide: "year",
                    short: "yr.",
                    narrow: "yr."
                },
                quarter: {
                    wide: "quarter",
                    short: "qtr.",
                    narrow: "qtr."
                },
                month: {
                    wide: "month",
                    short: "mo.",
                    narrow: "mo."
                },
                week: {
                    wide: "week",
                    short: "wk.",
                    narrow: "wk."
                },
                weekOfMonth: {
                    wide: "week of month",
                    short: "wk. of mo.",
                    narrow: "wk. of mo."
                },
                day: {
                    wide: "day",
                    short: "day",
                    narrow: "day"
                },
                dayOfYear: {
                    wide: "day of year",
                    short: "day of yr.",
                    narrow: "day of yr."
                },
                weekday: {
                    wide: "day of the week",
                    short: "day of wk.",
                    narrow: "day of wk."
                },
                weekdayOfMonth: {
                    wide: "weekday of the month",
                    short: "wkday. of mo.",
                    narrow: "wkday. of mo."
                },
                dayperiod: {
                    short: "AM/PM",
                    wide: "AM/PM",
                    narrow: "AM/PM"
                },
                hour: {
                    wide: "hour",
                    short: "hr.",
                    narrow: "hr."
                },
                minute: {
                    wide: "minute",
                    short: "min.",
                    narrow: "min."
                },
                second: {
                    wide: "second",
                    short: "sec.",
                    narrow: "sec."
                },
                zone: {
                    wide: "time zone",
                    short: "zone",
                    narrow: "zone"
                },
                millisecond: {
                    narrow: "ms",
                    short: "ms",
                    wide: "millisecond"
                }
            }
        }
    },
    supplemental: {
        likelySubtags: {
            en: "en-Latn-US"
        },
        currencyData: {
            region: {
                US: [
                    {
                        USD: {
                            _from: "1792-01-01"
                        }
                    }
                ]
            }
        },
        weekData: {
            firstDay: {
                US: "sun"
            },
            weekendStart: {
                "001": "sat"
            },
            weekendEnd: {
                "001": "sun"
            }
        }
    }
};

function isString(value) {
    return typeof value === "string";
}

//The error is represented by unique name and corresponding message
//The message can contain placeholders with index, e.g. {0}, {1}

var errorDetails = {
    "NoLocale": "Missing locale info for '{0}'",
    "NoCurrency": "Cannot determine currency information. Please load the locale currencies data.",
    "NoSupplementalCurrency": "Cannot determine currency. Please load the supplemental currencyData.",
    "NoCurrencyRegion": "No currency data for region '{0}'",
    "NoCurrencyDisplay": "Cannot determine currency display information. Please load the locale currencies data. The default culture does not include the all currencies data.",
    "NoGMTInfo": "Cannot determine locale GMT format. Please load the locale timeZoneNames data.",
    "NoWeekData": "Cannot determine locale first day of week. Please load the supplemental weekData.",
    "NoFirstDay": "Cannot determine locale first day of week. Please load the supplemental weekData. The default culture includes only the 'en-US' first day info.",
    "NoValidCurrency": "Cannot determine a default currency for the {0} locale. Please specify explicitly the currency with the format options.",
    "NoDateFieldNames": "Cannot determine the locale date field names. Please load the locale dateFields data."
};

var formatRegExp$2 = /\{(\d+)}?\}/g;

var IntlError = function IntlError(ref) {
    var name = ref.name;
    var message = ref.message;

    if (!name || !message) {
        throw new Error("{ name: string, message: string } object is required!");
    }

    this.name = name;
    this.message = message;
};

IntlError.prototype.formatMessage = function formatMessage () {
        var values = [], len = arguments.length;
        while ( len-- ) values[ len ] = arguments[ len ];

    var flattenValues = flatten(values);

    var formattedMessage = this.message.replace(formatRegExp$2, function(match, index) {
        return flattenValues[parseInt(index, 10)];
    });

    return ((this.name) + ": " + formattedMessage);
};

IntlError.prototype.error = function error () {
        var values = [], len = arguments.length;
        while ( len-- ) values[ len ] = arguments[ len ];

    return new Error(this.formatMessage(values));
};

var flatten = function(arr) {
    return arr.reduce(function (a, b) { return a.concat(b); }, []);
};

var toIntlErrors = function(errors) {
    var predicate = function(prev, name) {
        prev[name] = new IntlError({ name: name, message: errors[name] });
        return prev;
    };

    return Object.keys(errors).reduce(predicate, {});
};

var errors = toIntlErrors(errorDetails);

function availableLocaleInfo(fullName, suffixes) {
    var parts = fullName.split("-");
    var language = parts[0];
    var script = parts[1];
    var territory = parts[2];

    return cldr[fullName] || (suffixes.indexOf(territory) !== -1 && cldr[language + "-" + territory]) || (suffixes.indexOf(script) !== -1 && cldr[language + "-" + script]) || cldr[language];
}

function localeFullName(language, suffixes) {
    var likelySubtags = cldr.supplemental.likelySubtags;

    for (var idx = 0; idx < suffixes.length; idx++) {
        var name = likelySubtags[language + "-" + suffixes[idx ]];
        if (name) {
            return name;
        }
    }

    if (likelySubtags[language]) {
        return likelySubtags[language];
    }
}

var cldr = defaultData;

function getLocaleInfo(locale) {
    var info;
    if (isString(locale)) {
        info = localeInfo(locale);
    } else {
        info = locale;
    }
    return info;
}

function localeInfo(locale) {
    if (cldr[locale]) {
        return cldr[locale];
    }

    var likelySubtags = cldr.supplemental.likelySubtags;
    if (likelySubtags) {
        var parts = locale.split("-");
        var language = parts[0];
        var suffixes = parts.slice(1);
        var fullName = localeFullName(language, suffixes);
        var info = fullName ? availableLocaleInfo(fullName, suffixes) : null;
        if (info) {
            return info;
        }
    }

    throw errors.NoLocale.error(locale);
}

var DECIMAL = "decimal";
var CURRENCY = "currency";
var ACCOUNTING = "accounting";
var PERCENT = "percent";
var SCIENTIFIC = "scientific";

var CURRENCY_PLACEHOLDER = "$";
var PERCENT_PLACEHOLDER = "%";
var NUMBER_PLACEHOLDER = "n";

var LIST_SEPARATOR = ";";
var GROUP_SEPARATOR = ",";

var POINT = ".";
var EMPTY = "";

var DEFAULT_LOCALE = "en";

var LATIN_NUMBER_FORMATS = "Formats-numberSystem-latn";
var LATIN_NUMBER_SYMBOLS = "symbols-numberSystem-latn";

var patternRegExp = /([#,0.]+)/g;
var cldrCurrencyRegExp = /¤/g;

function getPatterns(pattern) {
    patternRegExp.lastIndex = 0;

    return pattern.replace(cldrCurrencyRegExp, CURRENCY_PLACEHOLDER).replace(patternRegExp, NUMBER_PLACEHOLDER).split(LIST_SEPARATOR);
}

function getGroupSize(pattern) {
    patternRegExp.lastIndex = 0;

    var numberPatterns = patternRegExp.exec(pattern.split(LIST_SEPARATOR)[0])[0].split(POINT);
    var integer = numberPatterns[0];

    var groupSize = integer.split(GROUP_SEPARATOR).slice(1).map(function(group) {
        return group.length;
    }).reverse();

    return groupSize;
}

function loadCurrencyUnitPatterns(currencyInfo, currencyFormats) {
    for (var field in currencyFormats) {
        if (field.startsWith("unitPattern")) {
            currencyInfo[field] = currencyFormats[field].replace("{0}", NUMBER_PLACEHOLDER).replace("{1}", CURRENCY_PLACEHOLDER);
        }
    }
}

function loadNumbersInfo(locale, info) {
    var localeInfo = cldr[locale];
    var numbers = localeInfo.numbers = localeInfo.numbers || {};
    numbers.symbols = numbers.symbols || {};
    for (var field in info) {
        if (field === LATIN_NUMBER_SYMBOLS) {
            Object.assign(numbers.symbols, info[field]);
        } else if (field.includes(LATIN_NUMBER_FORMATS)) {
            var style = field.substring(0, field.indexOf(LATIN_NUMBER_FORMATS));
            var pattern = info[field].standard;
            if (pattern) {
                numbers[style] = {
                    patterns: getPatterns(pattern)
                };
            }

            if (style === CURRENCY) {
                numbers[style] = numbers[style] || {};
                numbers[style].groupSize = getGroupSize((info[DECIMAL + LATIN_NUMBER_FORMATS] || info[field]).standard);
                loadCurrencyUnitPatterns(numbers[style], info[field]);
                numbers[ACCOUNTING] = {
                    patterns: getPatterns(info[field][ACCOUNTING]),
                    groupSize: numbers[style].groupSize
                };
            } else if (pattern) {
                numbers[style].groupSize = getGroupSize(pattern);
            }
        } else if (field === "currencies") {
            numbers.currencies = info[field];
        }
    }
}

var predefinedDatePatterns = {
    s: "yyyy'-'MM'-'dd'T'HH':'mm':'ss",
    u: "yyyy'-'MM'-'dd HH':'mm':'ss'Z'"
};

var YEAR_REGEX = /y+/g;
var SHORT_DATE = [ [ "dateFormats", "short" ] ];
var ALT_ASCII_REGEX = /-alt-ascii$/;

var datePatterns = {
    D: [ [ "dateFormats", "full" ] ],
    m: [ [ "dateTimeFormats", "availableFormats", "MMMd" ] ],
    M: [ [ "dateTimeFormats", "availableFormats", "MMMMd" ] ],
    y: [ [ "dateTimeFormats", "availableFormats", "yMMM" ] ],
    Y: [ [ "dateTimeFormats", "availableFormats", "yMMMM" ] ],
    F: [ [ "dateFormats", "full" ], [ "timeFormats", "medium" ] ],
    g: [ [ "dateTimeFormats", "availableFormats", "yMd" ], [ "timeFormats", "short" ] ],
    G: [ [ "dateTimeFormats", "availableFormats", "yMd" ], [ "timeFormats", "medium" ] ],
    t: [ [ "timeFormats", "short" ] ],
    T: [ [ "timeFormats", "medium" ] ]
};

function toArray(obj) {
    var result = [];
    var names = Object.getOwnPropertyNames(obj);
    for (var idx = 0; idx < names.length; idx++) {
        var value = obj[names[idx]];
        result.push(value);
    }
    return result;
}

function getCalendarNames(info, isObj) {
    var result = {};
    for (var formatType in info) {
        var names = result[formatType] = {};
        for (var format in info[formatType]) {
            var formats = info[formatType][format];
            names[format] = isObj ? formats : toArray(formats);
        }
    }
    return result;
}

function getEraNames(eras) {
    var result = {};
    var format = result.format = {};
    var eraNameMap = {
        eraAbbr: "abbreviated",
        eraNames: "wide",
        eraNarrow: "narrow"
    };

    for (var eraFormatName in eras) {
        var formatName = eraNameMap[eraFormatName];
        format[formatName] = eras[eraFormatName];
    }

    return result;
}

function loadCalendarNames(locale, calendar) {
    var localeCalendar = cldr[locale].calendar;
    localeCalendar.days = getCalendarNames(calendar.days);
    localeCalendar.months = getCalendarNames(calendar.months);
    localeCalendar.quarters = getCalendarNames(calendar.quarters);
    localeCalendar.dayPeriods = getCalendarNames(calendar.dayPeriods, true);

    localeCalendar.eras = getEraNames(calendar.eras);
}

function loadCalendarDateFields(locale, fields) {
    var localeCalendar = cldr[locale].calendar;
    var dateFields = {};

    for (var field in fields) {
        var ref = field.split('-');
        var fieldName = ref[0];
        var formatType = ref[1]; if ( formatType === void 0 ) formatType = 'wide';
        var fieldInfo = dateFields[fieldName] || {};
        var displayName = fields[field].displayName;

        if (!displayName) { continue; }

        fieldInfo[formatType] = displayName;
        dateFields[fieldName] = fieldInfo;
    }

    localeCalendar.dateFields = dateFields;
}

function getPredefinedFormat(paths, calendar) {
    var result = [];

    for (var pathIdx = 0; pathIdx < paths.length; pathIdx++) {
        var fields = paths[ pathIdx ];
        var pattern = calendar;
        for (var idx = 0; idx < fields.length; idx++) {
            pattern = pattern[fields[idx]];
        }
        result.push(pattern);
    }

    return result.join(" ");
}

function filterFormats(formats) {
    var result = {};
    for (var format in formats) {
        // Removes -alt-ascii formats in favor of the regular, Unicode formats
        if (!ALT_ASCII_REGEX.test(format)) {
            result[format] = formats[format];
        }
    }

    return result;
}


function loadCalendarPatterns(locale, calendar) {
    var cldrCalendar = cldr[locale].calendar;
    var patterns = cldrCalendar.patterns = {};

    patterns.d = getPredefinedFormat(SHORT_DATE, calendar).replace(YEAR_REGEX, 'y');

    for (var pattern in datePatterns) {
        patterns[pattern] = getPredefinedFormat(datePatterns[pattern], calendar);
    }

    for (var pattern$1 in predefinedDatePatterns) {
        patterns[pattern$1] = predefinedDatePatterns[pattern$1];
    }

    var dateTimeFormats = calendar.dateTimeFormats;
    cldrCalendar.dateTimeFormats = {
        full: dateTimeFormats.full,
        long: dateTimeFormats.long,
        medium: dateTimeFormats.medium,
        short: dateTimeFormats.short,
        availableFormats: filterFormats(dateTimeFormats.availableFormats)
    };
    cldrCalendar.timeFormats = filterFormats(calendar.timeFormats);
    cldrCalendar.dateFormats = filterFormats(calendar.dateFormats);
}


function loadCalendarInfo(locale, info) {
    var calendar = cldr[locale].calendar = cldr[locale].calendar || {};
    for (var field in info) {
        if (field === "timeZoneNames") {
            calendar.gmtFormat = info[field].gmtFormat;
            calendar.gmtZeroFormat = info[field].gmtZeroFormat;
        } else if (field === "calendars" && info[field].gregorian) {
            loadCalendarPatterns(locale, info[field].gregorian);
            loadCalendarNames(locale, info[field].gregorian);
        } else if (field === "fields") {
            loadCalendarDateFields(locale, info.fields);
        }
    }
}

function territoryFromName(name, identity) {
    var likelySubtags = cldr.supplemental.likelySubtags;
    var parts = name.split("-");
    if (likelySubtags) {
        var likelyName = likelySubtags[name] || likelySubtags[parts[0]];
        if (likelyName) {
            parts = likelyName.split("-");
        }
    }

    if (identity) {
        for (var idx = parts.length - 1; idx >= 1; idx--) {
            var part = parts[idx];
            if (part === identity.variant || part === identity.script) {
                parts.splice(idx, 1);
            }
        }
    }

    var length = parts.length;

    if (length > 1) {
        var territory = parts[length - 1];
        return territory.toUpperCase();
    }
}

function localeTerritory(info) {
    if (info.territory) {
        return info.territory;
    }

    var name = info.name;
    var identity = info.identity;
    var territory;

    if (identity && identity.territory) {
        territory = identity.territory;
    } else {
        territory = territoryFromName(name, identity);
    }

    info.territory = territory;

    return territory;
}

var MILLISECOND = 'duration-millisecond';
var UNIT_PATTERN_ONE = 'unitPattern-count-one';
var UNIT_PATTERN_OTHER = 'unitPattern-count-other';
var placeholderPattern = /\{0\}\s?/;

function extractUnit(unit) {
    var value = unit[UNIT_PATTERN_ONE] || unit[UNIT_PATTERN_OTHER];
    return value.replace(placeholderPattern, '');
}

function loadUnits(localeInfo, units) {
    localeInfo.calendar.dateFields.millisecond = {
        narrow: extractUnit(units.narrow[MILLISECOND]),
        short: extractUnit(units.short[MILLISECOND]),
        wide: extractUnit(units.long[MILLISECOND])
    };
}

function loadLocale(locale, info) {
    for (var field in info) {
        if (field === "numbers") {
            loadNumbersInfo(locale, info[field]);
        } else if (field === "dates") {
            loadCalendarInfo(locale, info[field]);
        }
    }
}

function load() {
    var arguments$1 = arguments;

    var length = arguments.length;
    for (var idx = 0; idx < length; idx++) {
        var entry = arguments$1[idx];
        if (entry.main) {
            var locale = Object.keys(entry.main)[0];
            var info = entry.main[locale];
            var localeInfo = cldr[locale] = cldr[locale] || {};

            if (info.units) {
                loadUnits(localeInfo, info.units);
            } else {
                localeInfo.name = localeInfo.name || locale;
                localeInfo.identity = localeInfo.identity || info.identity;

                localeTerritory(localeInfo);
                loadLocale(locale, info);
            }
        } else if (entry.supplemental) {
            if (entry.supplemental.weekData) {
                cldr.supplemental.weekData = {
                    firstDay: entry.supplemental.weekData.firstDay,
                    weekendStart: entry.supplemental.weekData.weekendStart,
                    weekendEnd: entry.supplemental.weekData.weekendEnd
                };
            } else if (entry.supplemental.likelySubtags) {
                cldr.supplemental.likelySubtags = Object.assign(cldr.supplemental.likelySubtags, entry.supplemental.likelySubtags);
            } else if (entry.supplemental.currencyData) {
                var currencyData = cldr.supplemental.currencyData;
                currencyData.region = Object.assign(currencyData.region || {}, entry.supplemental.currencyData.region);
                currencyData.fractions = Object.assign(currencyData.fractions || {}, entry.supplemental.currencyData.fractions);
            }
        }
    }
}

function setData(data) {
    var locale = data.name;
    var info = cldr[locale] = cldr[locale] || {};
    var supplemental = cldr.supplemental = cldr.supplemental || {};

    if (data.likelySubtags) {
        supplemental.likelySubtags = Object.assign(supplemental.likelySubtags || {}, data.likelySubtags);
    }

    if (data.currencyData) {
        supplemental.currencyData = supplemental.currencyData || {};
        supplemental.currencyData.fractions = Object.assign(supplemental.currencyData.fractions || {}, data.currencyData);
    }

    var numbers = info.numbers;

    Object.assign(info, data);

    if (numbers && data.numbers) {
        info.numbers = Object.assign({}, numbers, data.numbers);
    }
}

function dateFieldName(options, locale) {
    if ( locale === void 0 ) locale = DEFAULT_LOCALE;

    var info = localeInfo(locale);
    var dateFields = info.calendar.dateFields;
    if (!dateFields) {
        throw errors.NoDateFieldNames.error();
    }

    var fieldNameInfo = dateFields[options.type] || {};

    return fieldNameInfo[options.nameType] || fieldNameInfo['wide'];
}

function lowerArray(arr) {
    var result = [];
    for (var idx = 0; idx < arr.length; idx++) {
        result.push(arr[idx].toLowerCase());
    }
    return result;
}

function lowerObject(obj) {
    var result = {};
    for (var field in obj) {
        result[field] = obj[field].toLowerCase();
    }
    return result;
}

function cloneLower(obj) {
    var result = Array.isArray(obj) ? lowerArray(obj) : lowerObject(obj);
    return result;
}

function dateFormatNames(locale, options) {
    var type = options.type;
    var nameType = options.nameType;
    var standAlone = options.standAlone;
    var lower = options.lower;
    var info = getLocaleInfo(locale);
    var formatType = standAlone ? "stand-alone" : "format";
    var lowerNameType = (lower ? "lower-" : EMPTY) + nameType;
    var formatNames = info.calendar[type][formatType];
    var result = formatNames[lowerNameType];
    if (!result && lower) {
        result = formatNames[lowerNameType] = cloneLower(formatNames[nameType]);
    }
    return result;
}

function parseRangeDate(value) {
    var parts = value.split('-');
    var year = parseInt(parts[0], 10);
    var month = parseInt(parts[1], 10) - 1;
    var day = parseInt(parts[2], 10);

    return new Date(year, month, day);
}

var NoCurrency = errors.NoCurrency;
var NoCurrencyDisplay = errors.NoCurrencyDisplay;
var NoSupplementalCurrency = errors.NoSupplementalCurrency;
var NoCurrencyRegion = errors.NoCurrencyRegion;
var NoValidCurrency = errors.NoValidCurrency;

var DEFAULT_CURRENCY_FRACTIONS = 2;
var SYMBOL = "symbol";
var INVALID_CURRENCY_CODE = 'XXX';

var GLOBAL_CURRENCIES = {
    '001': 'USD', // 001 refers to world. not sure if it is correct to assume USD but seems better than throw an error
    '150': 'EUR' // 150 territory for Europe

};

function getCurrencyInfo(locale, currency, throwIfNoValid) {
    var info = getLocaleInfo(locale);
    var currencies = info.numbers.currencies;
    if (!currencies) {
        if (throwIfNoValid) {
            throw NoCurrency.error();
        }

        return;
    }

    var currencyDisplayInfo = currencies[currency];

    if (!currencyDisplayInfo) {
        if (throwIfNoValid) {
            throw NoCurrencyDisplay.error();
        }

        return;
    }

    return currencyDisplayInfo;
}

function lengthComparer(a, b) {
    return b.length - a.length;
}

function regionCurrency(regionCurrencies) {
    var latestValidUntil, latestValidUntilRange;
    var latestStillValid, latestStillValidDate;

    for (var idx = 0; idx < regionCurrencies.length; idx++) {
        var currency = regionCurrencies[idx];
        var code = Object.keys(currency)[0];
        var info = currency[code];
        if (code !== INVALID_CURRENCY_CODE && info._tender !== 'false' && info._from) {
            if (!info._to) {
                var stillValidDate = parseRangeDate(info._from);
                if (!latestStillValidDate || latestStillValidDate < stillValidDate) {
                    latestStillValid = code;
                    latestStillValidDate = stillValidDate;
                }
            } else if (!latestStillValid) {
                var validFrom = parseRangeDate(info._from);
                var validTo = parseRangeDate(info._to);
                if (!latestValidUntilRange || latestValidUntilRange.to < validTo || latestValidUntilRange.from < validFrom) {
                    latestValidUntil = code;
                    latestValidUntilRange = {
                        from: validFrom,
                        to: validTo
                    };
                }
            }
        }
    }

    return latestStillValid || latestValidUntil;
}

function currencyDisplays(locale, currency, throwIfNoValid) {
    if ( throwIfNoValid === void 0 ) throwIfNoValid = true;

    var currencyInfo = getCurrencyInfo(locale, currency, throwIfNoValid);
    if (!currencyInfo) {
        return;
    }

    if (!currencyInfo.displays) {
        var displays = [ currency ];
        for (var field in currencyInfo) {
            displays.push(currencyInfo[field]);
        }
        displays.sort(lengthComparer);
        currencyInfo.displays = displays;
    }

    return currencyInfo.displays;
}

function currencyDisplay(locale, options) {
    var value = options.value;
    var currency = options.currency;
    var currencyDisplay = options.currencyDisplay; if ( currencyDisplay === void 0 ) currencyDisplay = SYMBOL;

    if (currencyDisplay === "code") {
        return currency;
    }

    var currencyInfo = getCurrencyInfo(locale, currency, true);
    var result;

    if (currencyDisplay === SYMBOL) {
        result = currencyInfo["symbol-alt-narrow"] || currencyInfo[SYMBOL] || currency;
    } else {
        if (typeof value === "undefined" || value !== 1) {
            result = currencyInfo["displayName-count-other"];
        } else {
            result = currencyInfo["displayName-count-one"];
        }
    }

    return result;
}

function currencyFractionOptions(code) {
    var minimumFractionDigits = DEFAULT_CURRENCY_FRACTIONS;
    var maximumFractionDigits = DEFAULT_CURRENCY_FRACTIONS;

    var fractions = ((cldr.supplemental.currencyData || {}).fractions || {})[code];

    if (fractions && fractions._digits) {
        maximumFractionDigits = minimumFractionDigits = parseInt(fractions._digits, 10);
    }

    return {
        minimumFractionDigits: minimumFractionDigits,
        maximumFractionDigits: maximumFractionDigits
    };
}

function territoryCurrencyCode(territory, throwIfNoValid) {
    if ( throwIfNoValid === void 0 ) throwIfNoValid = true;

    if (GLOBAL_CURRENCIES[territory]) {
        return GLOBAL_CURRENCIES[territory];
    }

    var currencyData = cldr.supplemental.currencyData;
    if (!currencyData) {
        if (throwIfNoValid) {
            throw NoSupplementalCurrency.error();
        }

        return;
    }

    var regionCurrencies = currencyData.region[territory];

    if (!regionCurrencies) {
        if (throwIfNoValid) {
            throw NoCurrencyRegion.error(territory);
        }

        return;
    }

    var currencyCode = regionCurrency(regionCurrencies);

    return currencyCode;
}

function localeCurrency(locale, throwIfNoValid) {
    var info = getLocaleInfo(locale);
    var numbers = info.numbers;

    if (!numbers.localeCurrency) {
        var currency = territoryCurrencyCode(localeTerritory(info), throwIfNoValid);

        if (!currency && throwIfNoValid) {
            throw NoValidCurrency.error(info.name);
        }

        numbers.localeCurrency = currency;
    }

    return numbers.localeCurrency;
}

var DAYS_OF_WEEK = [ "sun", "mon", "tue", "wed", "thu", "fri", "sat" ];

var DEFAULT_TERRITORY = '001';

var NoWeekData$1 = errors.NoWeekData;
var NoFirstDay = errors.NoFirstDay;

function firstDay(locale) {
    var info = getLocaleInfo(locale);

    if (!isNaN(info.firstDay)) {
        return info.firstDay;
    }

    var weekData = cldr.supplemental.weekData;
    if (!weekData) {
        throw NoWeekData$1.error();
    }

    var firstDay = weekData.firstDay[localeTerritory(info)] || weekData.firstDay[DEFAULT_TERRITORY];

    if (!firstDay) {
        throw NoFirstDay.error();
    }

    info.firstDay = DAYS_OF_WEEK.indexOf(firstDay);

    return info.firstDay;
}

var NoWeekData = errors.NoWeekData;

function weekendRange(locale) {
    var info = getLocaleInfo(locale);

    if (info.weekendRange) {
        return info.weekendRange;
    }

    var weekData = cldr.supplemental.weekData;
    if (!weekData) {
        throw NoWeekData.error();
    }

    var territory = localeTerritory(info);
    var start = weekData.weekendStart[territory] || weekData.weekendStart[DEFAULT_TERRITORY];
    var end = weekData.weekendEnd[territory] || weekData.weekendEnd[DEFAULT_TERRITORY];

    info.weekendRange = {
        start: DAYS_OF_WEEK.indexOf(start),
        end: DAYS_OF_WEEK.indexOf(end)
    };

    return info.weekendRange;
}

function numberSymbols(locale) {
    var info = getLocaleInfo(locale);

    return info.numbers.symbols;
}

function isNegativeZero(value) {
    return (1 / value === -Infinity);
}

function formatCurrencySymbol(info, options) {
    if ( options === void 0 ) options = {};

    if (!options.currency) {
        options.currency = localeCurrency(info, true);
    }

    var display = currencyDisplay(info, options);

    return display;
}

function groupInteger(number, start, end, options, info) {
    var symbols = info.numbers.symbols;
    var decimalIndex = number.indexOf(symbols.decimal);
    var groupSizes = options.groupSize.slice();
    var groupSize = groupSizes.shift();

    var integerEnd = decimalIndex !== -1 ? decimalIndex : end + 1;

    var integer = number.substring(start, integerEnd);
    var result = number;
    var integerLength = integer.length;

    if (integerLength >= groupSize) {
        var idx = integerLength;
        var parts = [];

        while (idx > -1) {
            var value = integer.substring(idx - groupSize, idx);
            if (value) {
                parts.push(value);
            }
            idx -= groupSize;
            var newGroupSize = groupSizes.shift();
            groupSize = newGroupSize !== undefined ? newGroupSize : groupSize;

            if (groupSize === 0) {
                value = integer.substring(0, idx);
                if (value) {
                    parts.push(value);
                }
                break;
            }
        }

        integer = parts.reverse().join(symbols.group);
        result = number.substring(0, start) + integer + number.substring(integerEnd);
    }

    return result;
}

function isCurrencyStyle(style) {
    return style === CURRENCY || style === ACCOUNTING;
}

function pad(number, digits, right) {
    if ( digits === void 0 ) digits = 2;
    if ( right === void 0 ) right = false;

    var count = digits - String(number).length;
    var result = number;

    if (count > 0) {
        var padString = new Array(count + 1).join("0");
        result = right ? number + padString : padString + number;
    }

    return result;
}

var MAX_PRECISION = 20;

function round(value, precision) {
    var result = value;
    var decimals = precision || 0;

    result = result.toString().split('e');
    result = Math.round(Number(result[0] + 'e' + (result[1] ? (Number(result[1]) + decimals) : decimals)));

    result = result.toString().split('e');
    result = Number(result[0] + 'e' + (result[1] ? (Number(result[1]) - decimals) : -decimals));

    return result.toFixed(Math.min(decimals, MAX_PRECISION));
}

var DEFAULT_DECIMAL_ROUNDING = 3;
var DEFAULT_PERCENT_ROUNDING = 0;

var trailingZeroRegex = /0+$/;

function fractionOptions(options) {
    var minimumFractionDigits = options.minimumFractionDigits;
    var maximumFractionDigits = options.maximumFractionDigits;
    var style = options.style;
    var isCurrency = isCurrencyStyle(style);
    var currencyFractions;
    if (isCurrency) {
        currencyFractions = currencyFractionOptions(options.currency);
    }

    if (minimumFractionDigits === undefined) {
        minimumFractionDigits = isCurrency ? currencyFractions.minimumFractionDigits : 0;
    }

    if (maximumFractionDigits === undefined) {
        if (style === PERCENT) {
            maximumFractionDigits = Math.max(minimumFractionDigits, DEFAULT_PERCENT_ROUNDING);
        } else if (isCurrency) {
            maximumFractionDigits = Math.max(minimumFractionDigits, currencyFractions.maximumFractionDigits);
        } else {
            maximumFractionDigits = Math.max(minimumFractionDigits, DEFAULT_DECIMAL_ROUNDING);
        }
    }

    return {
        minimumFractionDigits: minimumFractionDigits,
        maximumFractionDigits: maximumFractionDigits
    };
}

function applyPattern(value, pattern, symbol) {
    var result = EMPTY;
    for (var idx = 0, length = pattern.length; idx < length; idx++) {
        var ch = pattern.charAt(idx);

        if (ch === NUMBER_PLACEHOLDER) {
            result += value;
        } else if (ch === CURRENCY_PLACEHOLDER || ch === PERCENT_PLACEHOLDER) {
            result += symbol;
        } else {
            result += ch;
        }
    }
    return result;
}

function currencyUnitPattern(info, value) {
    var currencyInfo = info.numbers.currency;
    var pattern = value !== 1 ? currencyInfo["unitPattern-count-other"] : currencyInfo["unitPattern-count-one"];
    if (value < 0) {
        pattern = pattern.replace(NUMBER_PLACEHOLDER, ("-" + NUMBER_PLACEHOLDER));
    }

    return pattern;
}


function standardNumberFormat(number, options, info) {
    var symbols = info.numbers.symbols;
    var style = options.style;
    var isCurrency = isCurrencyStyle(style);

    //return number in exponential format
    if (style === SCIENTIFIC) {
        var exponential = options.minimumFractionDigits !== undefined ? number.toExponential(options.minimumFractionDigits) : number.toExponential();
        return exponential.replace(POINT, symbols.decimal);
    }

    var value = number;
    var symbol;

    if (isCurrency) {
        options.value = value;
        symbol = formatCurrencySymbol(info, options);
    }

    if (style === PERCENT) {
        value *= 100;
        symbol = symbols.percentSign;
    }

    var ref = fractionOptions(options);
    var minimumFractionDigits = ref.minimumFractionDigits;
    var maximumFractionDigits = ref.maximumFractionDigits;

    value = round(value, maximumFractionDigits);

    var negative = value < 0;
    var negativeZero = isNegativeZero(number);

    var parts = value.split(POINT);

    var integer = parts[0];
    var fraction = pad(parts[1] ? parts[1].replace(trailingZeroRegex, EMPTY) : EMPTY, minimumFractionDigits, true);

    //exclude "-" if number is negative.
    if (negative) {
        integer = integer.substring(1);
    }

    if (options.minimumIntegerDigits) {
        integer = pad(integer, options.minimumIntegerDigits);
    }

    var formattedValue = options.useGrouping !== false ? groupInteger(integer, 0, integer.length, options, info) : integer;

    if (fraction) {
        formattedValue += symbols.decimal + fraction;
    }

    var pattern;

    if (isCurrency && options.currencyDisplay === "name") {
        pattern = currencyUnitPattern(info, number);
    } else {
        var patterns = options.patterns;
        pattern = (negative || negativeZero) ? patterns[1] || ("-" + patterns[0]) : patterns[0];
    }

    if (pattern === NUMBER_PLACEHOLDER && !negative) {
        return formattedValue;
    }

    var result = applyPattern(formattedValue, pattern, symbol);

    return result;
}

var literalRegExp = /(\\.)|(['][^']*[']?)|(["][^"]*["]?)/g;
var PLACEHOLDER$1 = "__??__";

function setStyleOptions(formatOptions, info) {
    var format = formatOptions.format;

    //multiply number if the format has percent
    if (format.indexOf(PERCENT_PLACEHOLDER) !== -1) {
        formatOptions.style = PERCENT;
        formatOptions.symbol = info.numbers.symbols.percentSign;
        formatOptions.number *= 100;
    }

    if (format.indexOf(CURRENCY_PLACEHOLDER) !== -1) {
        formatOptions.style = CURRENCY;
        formatOptions.symbol = formatCurrencySymbol(info);
    }
}

function setFormatLiterals(formatOptions) {
    var format = formatOptions.format;
    if (format.indexOf("'") > -1 || format.indexOf("\"") > -1 || format.indexOf("\\") > -1) {
        var literals = formatOptions.literals = [];
        formatOptions.format = format.replace(literalRegExp, function(match) {
            var quoteChar = match.charAt(0).replace("\\", EMPTY);
            var literal = match.slice(1).replace(quoteChar, EMPTY);

            literals.push(literal);

            return PLACEHOLDER$1;
        });
    }
}

function replaceLiterals(number, literals) {
    var result = number;
    if (literals) {
        var length = literals.length;
        for (var idx = 0; idx < length; idx++) {
            result = result.replace(PLACEHOLDER$1, literals[idx]);
        }
    }
    return result;
}

var SHARP = "#";
var ZERO = "0";

var trailingZerosRegExp = /(\.(?:[0-9]*[1-9])?)0+$/g;
var trailingPointRegExp = /\.$/;
var commaRegExp = /,/g;

function trimTrailingZeros(value, lastZero) {
    var trimRegex;

    if (lastZero === 0) {
        trimRegex = trailingZerosRegExp;
    } else {
        trimRegex = new RegExp(("(\\.[0-9]{" + lastZero + "}[1-9]*)0+$"), 'g');
    }

    return value.replace(trimRegex, '$1').replace(trailingPointRegExp, EMPTY);
}

function roundNumber(formatOptions) {
    var number = formatOptions.number;
    var format = formatOptions.format;
    var decimalIndex = format.indexOf(POINT);

    if (decimalIndex !== -1) {
        var zeroIndex = format.lastIndexOf(ZERO) - decimalIndex;
        var sharpIndex = format.lastIndexOf(SHARP) - decimalIndex;
        var hasZero = zeroIndex > -1;
        var hasSharp = sharpIndex > -1;
        var fraction = number.toString().split("e");

        if (fraction[1]) {
            fraction = round(number, Math.abs(fraction[1]));
        } else {
            fraction = fraction[0];
        }
        fraction = fraction.split(POINT)[1] || EMPTY;

        var precision = fraction.length;
        var trailingZeros = -1;

        if (!hasZero && !hasSharp) {
            formatOptions.format = format.substring(0, decimalIndex) + format.substring(decimalIndex + 1);
            decimalIndex = -1;
            precision = 0;
        } else if (hasZero && zeroIndex > sharpIndex) {
            precision = zeroIndex;
        } else if (sharpIndex > zeroIndex) {
            if (hasSharp && precision > sharpIndex) {
                precision = sharpIndex;
            } else if (hasZero && precision < zeroIndex) {
                precision = zeroIndex;
            }

            trailingZeros = hasZero ? zeroIndex : 0;
        }

        if (precision > -1) {
            number = round(number, precision);
            if (trailingZeros > -1) {
                number = trimTrailingZeros(number, trailingZeros);
            }
        }
    } else {
        number = round(number);
    }

    if (formatOptions.negative && (number * -1) >= 0 && !formatOptions.negativeZero) {
        formatOptions.negative = false;
    }

    formatOptions.number = number;
    formatOptions.decimalIndex = decimalIndex;
}

function isConstantFormat(format) {
    return format.indexOf(SHARP) === -1 && format.indexOf(ZERO) === -1;
}

function setValueSpecificFormat(formatOptions) {
    var number = formatOptions.number;
    var format = formatOptions.format;
    format = format.split(LIST_SEPARATOR);
    if ((formatOptions.negative || formatOptions.negativeZero) && format[1]) {
        format = format[1];
        formatOptions.hasNegativeFormat = true;
    } else if (number === 0) {
        var zeroFormat = format[2];
        format = zeroFormat || format[0];
        if (zeroFormat && isConstantFormat(zeroFormat)) {
            formatOptions.constant = zeroFormat;
        }
    } else {
        format = format[0];
    }

    formatOptions.format = format;
}

function setGroupOptions(formatOptions) {
    formatOptions.hasGroup = formatOptions.format.indexOf(GROUP_SEPARATOR) > -1;
    if (formatOptions.hasGroup) {
        formatOptions.format = formatOptions.format.replace(commaRegExp, EMPTY);
    }
}

function placeholderIndex(index1, index2, start) {
    var index;
    if (index1 === -1 && index2 !== -1) {
        index = index2;
    } else if (index1 !== -1 && index2 === -1) {
        index = index1;
    } else {
        index = start ? Math.min(index1, index2) : Math.max(index1, index2);
    }
    return index;
}

function setPlaceholderIndices(formatOptions) {
    var format = formatOptions.format;
    var sharpIndex = format.indexOf(SHARP);
    var zeroIndex = format.indexOf(ZERO);

    var start = placeholderIndex(sharpIndex, zeroIndex, true);

    sharpIndex = format.lastIndexOf(SHARP);
    zeroIndex = format.lastIndexOf(ZERO);

    var end = placeholderIndex(sharpIndex, zeroIndex);

    if (start === format.length) {
        end = start;
    }

    formatOptions.start = start;
    formatOptions.end = end;
    formatOptions.lastZeroIndex = zeroIndex;
}

function replaceStyleSymbols(number, style, symbol) {
    var result = number;
    if (style === CURRENCY || style === PERCENT) {
        result = EMPTY;
        for (var idx = 0, length = number.length; idx < length; idx++) {
            var ch = number.charAt(idx);
            result += (ch === CURRENCY_PLACEHOLDER || ch === PERCENT_PLACEHOLDER) ? symbol : ch;
        }
    }
    return result;
}

function replacePlaceHolders(formatOptions, info) {
    var start = formatOptions.start;
    var end = formatOptions.end;
    var negative = formatOptions.negative;
    var negativeZero = formatOptions.negativeZero;
    var format = formatOptions.format;
    var decimalIndex = formatOptions.decimalIndex;
    var lastZeroIndex = formatOptions.lastZeroIndex;
    var hasNegativeFormat = formatOptions.hasNegativeFormat;
    var hasGroup = formatOptions.hasGroup;
    var number = formatOptions.number;
    var value = number.toString().split(POINT);
    var length = format.length;
    var integer = value[0];
    var fraction = value[1] || EMPTY;
    var integerLength = integer.length;
    var replacement = EMPTY;

    number = format.substring(0, start);

    if ((negative || negativeZero) && !hasNegativeFormat) {
        number += "-";
    }

    for (var idx = start; idx < length; idx++) {
        var ch = format.charAt(idx);

        if (decimalIndex === -1) {
            if (end - idx < integerLength) {

                number += integer;
                break;
            }
        } else {
            if (lastZeroIndex !== -1 && lastZeroIndex < idx) {
                replacement = EMPTY;
            }

            if ((decimalIndex - idx) <= integerLength && decimalIndex - idx > -1) {
                number += integer;
                idx = decimalIndex;
            }

            if (decimalIndex === idx) {
                number += (fraction ? info.numbers.symbols.decimal : EMPTY) + fraction;
                idx += end - decimalIndex + 1;
                continue;
            }
        }

        if (ch === ZERO) {
            number += ch;
            replacement = ch;
        } else if (ch === SHARP) {
            number += replacement;
        }
    }

    if (hasGroup) {
        number = groupInteger(number, start + (negative && !hasNegativeFormat ? 1 : 0), Math.max(end, (integerLength + start)), info.numbers.decimal, info);
    }

    if (end >= start) {
        number += format.substring(end + 1);
    }

    return number;
}

function applyCustomFormat(formatOptions, info) {
    var number = formatOptions.number;
    if (formatOptions.start !== -1) {
        number = replacePlaceHolders(formatOptions, info);
        number = replaceStyleSymbols(number, formatOptions.style, formatOptions.symbol);
        number = replaceLiterals(number, formatOptions.literals);
    }

    return number;
}

function customNumberFormat(number, format, info) {
    var formatOptions = {
        negative: number < 0,
        number: Math.abs(number),
        negativeZero: isNegativeZero(number),
        format: format
    };

    setValueSpecificFormat(formatOptions);

    if (formatOptions.constant) {
        return formatOptions.constant;
    }

    setFormatLiterals(formatOptions);
    setStyleOptions(formatOptions, info);
    setGroupOptions(formatOptions);
    roundNumber(formatOptions);
    setPlaceholderIndices(formatOptions);

    return applyCustomFormat(formatOptions, info);
}

var standardFormatRegExp = /^(n|c|p|e|a)(\d*)$/i;

function standardFormatOptions(format) {
    var formatAndPrecision = standardFormatRegExp.exec(format);

    if (formatAndPrecision) {
        var options = {
            style: DECIMAL
        };

        var style = formatAndPrecision[1].toLowerCase();

        if (style === "c") {
            options.style = CURRENCY;
        } else if (style === "a") {
            options.style = ACCOUNTING;
        } else if (style === "p") {
            options.style = PERCENT;
        } else if (style === "e") {
            options.style = SCIENTIFIC;
        }

        if (formatAndPrecision[2]) {
            options.minimumFractionDigits = options.maximumFractionDigits = parseInt(formatAndPrecision[2], 10);
        }

        return options;
    }
}

function formatOptions(format) {
    var options;
    if (isString(format)) {
        options = standardFormatOptions(format);
    } else {
        options = format;
    }

    return options;
}

function formatNumber(number, format, locale) {
    if ( format === void 0 ) format = NUMBER_PLACEHOLDER;
    if ( locale === void 0 ) locale = DEFAULT_LOCALE;

    if (number === undefined || number === null) {
        return EMPTY;
    }

    if (!isFinite(number)) {
        return String(number);
    }

    var info = localeInfo(locale);
    var options = formatOptions(format);

    var result;
    if (options) {
        var style = options.style || DECIMAL;
        result = standardNumberFormat(number, Object.assign({}, info.numbers[style], options), info);
    } else {
        result = customNumberFormat(number, format, info);
    }

    return result;
}

function isNumber(value) {
    return typeof value === "number";
}

var exponentRegExp = /[eE][-+]?[0-9]+/;
var nonBreakingSpaceRegExp = /\u00A0/g;

function cleanNegativePattern(number, patterns) {
    if (patterns.length > 1) {
        var parts = (patterns[1] || EMPTY).replace(CURRENCY_PLACEHOLDER, EMPTY).split(NUMBER_PLACEHOLDER);
        if (number.indexOf(parts[0]) > -1 && number.indexOf(parts[1]) > -1) {
            return number.replace(parts[0], EMPTY).replace(parts[1], EMPTY);
        }
    }
}

function cleanCurrencyNumber(value, info, format) {
    var options = formatOptions(format) || {};
    var isCurrency = isCurrencyStyle(options.style);
    var number = value;
    var negative;

    var currency = options.currency || localeCurrency(info, isCurrency);

    if (currency) {
        var displays = currencyDisplays(info, currency, isCurrency);
        if (displays) {
            for (var idx = 0; idx < displays.length; idx++) {
                var display = displays[idx];
                if (number.includes(display)) {
                    number = number.replace(display, EMPTY);
                    isCurrency = true;
                    break;
                }
            }
        }

        if (isCurrency) {
            var cleanNumber = cleanNegativePattern(number, info.numbers.currency.patterns) ||
                cleanNegativePattern(number, info.numbers.accounting.patterns);

            if (cleanNumber) {
                negative = true;
                number = cleanNumber;
            }

        }
    }

    return {
        number: number,
        negative: negative
    };
}

function cleanLiterals(number, formatOptions) {
    var literals = formatOptions.literals;
    var result = number;

    if (literals) {
        for (var idx = 0; idx < literals.length; idx++) {
            result = result.replace(literals[idx], EMPTY);
        }
    }

    return result;
}

function divideBy100(number) {
    var strNumber = String(number);
    var pointIndex = strNumber.indexOf(POINT);
    var zeroesCount = 2;
    var result = number / Math.pow(10, zeroesCount);

    if (pointIndex === -1 || String(result).length <= strNumber.length + zeroesCount) {
        return result;
    }

    var fractionDigits = strNumber.length - pointIndex + 1 + zeroesCount;
    return parseFloat(result.toFixed(fractionDigits));
}

function parseNumber(value, locale, format) {
    if ( locale === void 0 ) locale = DEFAULT_LOCALE;
    if ( format === void 0 ) format = {};

    if (!value && value !== 0) {
        return null;
    }

    if (isNumber(value)) {
        return value;
    }

    var info = localeInfo(locale);
    var symbols = info.numbers.symbols;

    var number = value.toString();
    var formatOptions = format || {};
    var isPercent;

    if (isString(format)) {
        formatOptions = { format: format };
        setFormatLiterals(formatOptions);
        number = cleanLiterals(number, formatOptions);

        setStyleOptions(formatOptions, info);
    }

    if (formatOptions.style === PERCENT || number.indexOf(symbols.percentSign) > -1) {
        number = number.replace(symbols.percentSign, EMPTY);
        isPercent = true;
    }

    if (exponentRegExp.test(number)) {
        number = parseFloat(number.replace(symbols.decimal, POINT));
        return isNaN(number) ? null : number;
    }

    var ref = cleanCurrencyNumber(number, info, formatOptions);
    var negativeCurrency = ref.negative;
    var currencyNumber = ref.number;
    number = String(currencyNumber).trim();

    var negativeSignIndex = number.indexOf("-");
    if (negativeSignIndex > 0) {
        return null;
    }

    var isNegative = negativeSignIndex > -1;

    isNegative = negativeCurrency !== undefined ? negativeCurrency : isNegative;

    number = number.replace("-", EMPTY)
          .replace(nonBreakingSpaceRegExp, " ")
          .split(symbols.group.replace(nonBreakingSpaceRegExp, " ")).join(EMPTY)
          .replace(symbols.decimal, POINT);

    number = parseFloat(number);

    if (isNaN(number)) {
        number = null;
    } else if (isNegative) {
        number *= -1;
    }

    if (number && isPercent) {
        number = divideBy100(number);
    }

    return number;
}

var formatRegExp$1 = /\{(\d+)}/g;

function formatString(format) {
    var values = arguments;

    return format.replace(formatRegExp$1, function (match, index) {
        var value = values[parseInt(index, 10) + 1];

        return value;
    });
}

var REMOVAL_PENALTY = 120;
var ADDITION_PENALTY = 20;
var LENGHT_DELTA = [ 2, 1, 5, 3, 4 ];
var LONG_LESS_PENALTY_DELTA = -2;
var SHORT_LESS_PENALTY_DELTA = -1;
var SHORT_MORE_PENALTY_DELTA = 1;
var LONG_MORE_PENALTY_DELTA = 2;

var PENALTIES = {};
PENALTIES[LONG_LESS_PENALTY_DELTA.toString()] = 8;
PENALTIES[SHORT_LESS_PENALTY_DELTA.toString()] = 6;
PENALTIES[LONG_MORE_PENALTY_DELTA.toString()] = 6;
PENALTIES[SHORT_MORE_PENALTY_DELTA.toString()] = 3;

var VALUE_FORMAT_LENGTH = {
    numeric: 1,
    "2-digit": 2,
    short: 3,
    long: 4,
    narrow: 5
};

var TIME_SPECIFIERS_REGEX = /[hHmsSzZoOvVxX]/;

function getHourSpecifier(options) {
    return options.hour12 ? "h" : "H";
}

var DATE_OPTIONS_MAP = [ {
    key: "era",
    specifier: "G"
}, {
    key: "year",
    specifier: "y"
}, {
    key: "month",
    specifier: "M"
}, {
    key: "day",
    specifier: "d"
}, {
    key: "weekday",
    specifier: "E"
}, {
    key: "hour",
    getSpecifier: getHourSpecifier
}, {
    key: "minute",
    specifier: "m"
}, {
    key: "second",
    specifier: "s"
}, {
    key: "timeZoneName",
    specifier: "z"
} ];

var STAND_ALONE_SPECIFIERS = {
    e: 'c',
    E: 'c',
    M: 'L',
    Q: 'q'
};

var specifiersRegex = {};
var resolvedFormats = {};

function getSpecifierRegex(specifier) {
    if (!specifiersRegex[specifier]) {
        specifiersRegex[specifier] = new RegExp(specifier + "+");
    }
    return specifiersRegex[specifier];
}

function skeletonSpecifiers(skeleton) {
    var result = [];
    var current = skeleton.charAt(0);
    var specifier = current;
    for (var idx = 1; idx < skeleton.length; idx++) {
        var character = skeleton.charAt(idx);
        if (character === specifier) {
            current += character;
        } else {
            result.push(current);
            current = specifier = character;
        }
    }

    result.push(current);

    return result;
}

function findBestMatch(specifiers, availableFormats) {
    var specifiersLength = specifiers.length;
    var maxScore = -Number.MAX_VALUE;
    var bestMatches, result;
    for (var format in availableFormats) {
        var matches = [];
        var currentFormat = format.replace("v", "z");
        var score = 0;
        for (var idx = 0; idx < specifiersLength; idx++) {
            var specifier = specifiers[idx];
            var specifierRegex = getSpecifierRegex(specifier[0]);
            var match = (specifierRegex.exec(currentFormat) || [])[0];

            if (!match) {
                score -= REMOVAL_PENALTY;
            } else {
                currentFormat = currentFormat.replace(match, EMPTY);
                if (match.length !== specifier.length) {
                    var delta = Math.max(Math.min(LENGHT_DELTA[match.length] - LENGHT_DELTA[specifier.length], 2), -2);
                    score -= PENALTIES[delta];
                }
            }

            matches.push(match);

            if (score < maxScore) {
                break;
            }
        }

        if (currentFormat.length) {
            score -= skeletonSpecifiers(currentFormat).length * ADDITION_PENALTY;
        }

        if (score > maxScore) {
            maxScore = score;
            bestMatches = matches;
            result = availableFormats[format];
        }
    }

    result = result.replace("v", "z");

    for (var idx$1 = 0; idx$1 < specifiersLength; idx$1++) {
        var bestMatch = bestMatches[idx$1];
        if (bestMatch && bestMatch !== specifiers[idx$1]) {
            var matchSpecifier = bestMatches[idx$1][0];
            result = result.replace(getSpecifierRegex(matchSpecifier), specifiers[idx$1]);
            if (STAND_ALONE_SPECIFIERS[matchSpecifier]) {
                result = result.replace(getSpecifierRegex(STAND_ALONE_SPECIFIERS[matchSpecifier]), specifiers[idx$1]);
            }
        }
    }

    return result;
}

function cacheFormat(skeleton, format, locale) {
    if (!resolvedFormats[locale]) {
        resolvedFormats[locale] = {};
    }
    resolvedFormats[locale][skeleton] = format;
}


function skeletonFormat(skeleton, info) {
    var availableFormats = info.calendar.dateTimeFormats.availableFormats;
    if (availableFormats[skeleton]) {
        return availableFormats[skeleton];
    }
    if (resolvedFormats[info.name] && resolvedFormats[info.name][skeleton]) {
        return resolvedFormats[info.name][skeleton];
    }
    var timeStartIndex = skeleton.search(TIME_SPECIFIERS_REGEX);
    var result;
    if (timeStartIndex > 0) {
        var dateSkeleton = skeleton.substr(0, timeStartIndex);
        var timeSkeleton = skeleton.substr(timeStartIndex);

        result = formatString(info.calendar.dateTimeFormats.short, //should be deterimed based on specifiers
            availableFormats[timeSkeleton] || findBestMatch(skeletonSpecifiers(timeSkeleton), availableFormats),
            availableFormats[dateSkeleton] || findBestMatch(skeletonSpecifiers(dateSkeleton), availableFormats));
    } else {
        result = findBestMatch(skeletonSpecifiers(skeleton), availableFormats);
    }

    cacheFormat(skeleton, result, info.name);
    return result;
}

function skeletonFromOptions(options) {
    var result = [];
    for (var idx = 0; idx < DATE_OPTIONS_MAP.length; idx++) {
        var option = DATE_OPTIONS_MAP[idx];
        var field = option.key;
        var value = options[field];
        if (value) {
            var spcifier = option.specifier || option.getSpecifier(options);
            result.push(spcifier.repeat(VALUE_FORMAT_LENGTH[value]));
        }
    }

    return result.join(EMPTY);
}

function datePattern(format, info) {
    var calendar = info.calendar;
    var result;
    if (isString(format)) {
        if (calendar.patterns[format]) {
            result = calendar.patterns[format];
        } else {
            result = format;
        }
    } else if (format) {
        if (format.pattern) {
            return format.pattern;
        }

        var skeleton = format.skeleton;
        if (!skeleton) {
            if (format.datetime) {
                result = formatString(calendar.dateTimeFormats[format.datetime], calendar.timeFormats[format.datetime], calendar.dateFormats[format.datetime]);
            } else if (format.date) {
                result = calendar.dateFormats[format.date];
            } else if (format.time) {
                result = calendar.timeFormats[format.time];
            } else {
                skeleton = skeletonFromOptions(format);
            }
        }

        if (skeleton) {
            result = skeletonFormat(skeleton, info);
        }
    }

    if (!result) {
        result = calendar.patterns.d;
    }

    return result;
}

function dateNameType(formatLength) {
    var nameType;
    if (formatLength <= 3) {
        nameType = "abbreviated";
    } else if (formatLength === 4) {
        nameType = "wide";
    } else if (formatLength === 5) {
        nameType = "narrow";
    } else if (formatLength === 6) {
        nameType = "short";
    }

    return nameType;
}

function formatNames(locale, type, formatLength, standAlone, lower) {
    return dateFormatNames(locale, {
        type: type,
        nameType: dateNameType(formatLength),
        standAlone: standAlone,
        lower: lower
    });
}

function isFunction(fun) {
    return typeof(fun) === 'function';
}

function isDate(value) {
    return Boolean(value) && isFunction(value.getTime) && isFunction(value.getMonth);
}

var MONTH = 'month';
var HOUR = 'hour';
var ZONE = 'zone';
var WEEKDAY = 'weekday';
var QUARTER = 'quarter';

var DATE_FIELD_MAP = {
    'G': 'era',
    'y': 'year',
    'q': QUARTER,
    'Q': QUARTER,
    'M': MONTH,
    'L': MONTH,
    'd': 'day',
    'E': WEEKDAY,
    'c': WEEKDAY,
    'e': WEEKDAY,
    'h': HOUR,
    'H': HOUR,
    'k': HOUR,
    'K': HOUR,
    'm': 'minute',
    's': 'second',
    'S': 'millisecond',
    'a': 'dayperiod',
    'x': ZONE,
    'X': ZONE,
    'z': ZONE,
    'Z': ZONE
};

var dateFormatRegExp = /d{1,2}|E{1,6}|e{1,6}|c{3,6}|c{1}|M{1,5}|L{1,5}|y{1,4}|H{1,2}|h{1,2}|k{1,2}|K{1,2}|m{1,2}|a{1,5}|s{1,2}|S{1,3}|z{1,4}|Z{1,5}|x{1,5}|X{1,5}|G{1,5}|q{1,5}|Q{1,5}|"[^"]*"|'[^']*'/g;

function formatDayOfWeekIndex(day, formatLength, localeInfo) {
    var firstDayIndex = firstDay(localeInfo);
    var dayIndex;
    if (day < firstDayIndex) {
        dayIndex = 7 - firstDayIndex + day;
    } else {
        dayIndex = day - firstDayIndex;
    }

    return dayIndex + 1;
}

function formatMonth(month, formatLength, info, standAlone) {
    if (formatLength <= 2) {
        return pad(month + 1, formatLength);
    }
    return formatNames(info, "months", formatLength, standAlone)[month];
}

function formatQuarter(date, formatLength, info, standAlone) {
    var quarter = Math.floor(date.getMonth() / 3);
    if (formatLength < 3) {
        return quarter + 1;
    }

    return formatNames(info, "quarters", formatLength, standAlone)[quarter];
}


function formatTimeZone(date, info, options) {
    var shortHours = options.shortHours;
    var optionalMinutes = options.optionalMinutes;
    var separator = options.separator;
    var localizedName = options.localizedName;
    var zZeroOffset = options.zZeroOffset;
    var offset = date.getTimezoneOffset() / 60;
    if (offset === 0 && zZeroOffset) {
        return "Z";
    }
    var sign = offset <= 0 ? "+" : "-";
    var hoursMinutes = Math.abs(offset).toString().split(".");
    var minutes = hoursMinutes[1] || 0;
    var result = sign + (shortHours ? hoursMinutes[0] : pad(hoursMinutes[0], 2));
    if (minutes || !optionalMinutes) {
        result += (separator ? ":" : EMPTY) + pad(minutes, 2);
    }

    if (localizedName) {
        var localizedFormat = offset === 0 ? info.calendar.gmtZeroFormat : info.calendar.gmtFormat;
        result = formatString(localizedFormat, result);
    }

    return result;
}

function formatDayOfWeek(date, formatLength, info, standAlone) {
    var result;
    if (formatLength < 3) {
        result = formatDayOfWeekIndex(date.getDay(), formatLength, info);
    } else {
        result = formatNames(info, "days", formatLength, standAlone)[date.getDay()];
    }
    return result;
}

var formatters = {};

formatters.d = function(date, formatLength) {
    return pad(date.getDate(), formatLength);
};

formatters.E = function(date, formatLength, info) {
    return formatNames(info, "days", formatLength)[date.getDay()];
};

formatters.M = function(date, formatLength, info) {
    return formatMonth(date.getMonth(), formatLength, info, false);
};

formatters.L = function(date, formatLength, info) {
    return formatMonth(date.getMonth(), formatLength, info, true);
};

formatters.y = function(date, formatLength) {
    var year = date.getFullYear();
    if (formatLength === 2) {
        year = year % 100;
    }
    return pad(year, formatLength);
};

formatters.h = function(date, formatLength) {
    var hours = date.getHours() % 12 || 12;
    return pad(hours, formatLength);
};

formatters.H = function(date, formatLength) {
    return pad(date.getHours(), formatLength);
};

formatters.k = function(date, formatLength) {
    return pad(date.getHours() || 24, formatLength);
};

formatters.K = function(date, formatLength) {
    return pad(date.getHours() % 12, formatLength);
};

formatters.m = function(date, formatLength) {
    return pad(date.getMinutes(), formatLength);
};

formatters.s = function(date, formatLength) {
    return pad(date.getSeconds(), formatLength);
};

formatters.S = function(date, formatLength) {
    var milliseconds = date.getMilliseconds();
    var result;
    if (milliseconds !== 0) {
        result = pad(String(milliseconds / 1000).split(".")[1].substr(0, formatLength), formatLength, true);
    } else {
        result = pad(EMPTY, formatLength);
    }
    return result;
};

formatters.a = function(date, formatLength, info) {
    return formatNames(info, "dayPeriods", formatLength)[date.getHours() < 12 ? "am" : "pm"];
};

formatters.z = function(date, formatLength, info) {
    return formatTimeZone(date, info, {
        shortHours: formatLength < 4,
        optionalMinutes: formatLength < 4,
        separator: true,
        localizedName: true
    });
};

formatters.Z = function(date, formatLength, info) {
    return formatTimeZone(date, info, {
        separator: formatLength > 3,
        localizedName: formatLength === 4,
        zZeroOffset: formatLength === 5
    });
};

formatters.x = function(date, formatLength, info) {
    return formatTimeZone(date, info, {
        optionalMinutes: formatLength === 1,
        separator: formatLength === 3 || formatLength === 5
    });
};

formatters.X = function(date, formatLength, info) {
    return formatTimeZone(date, info, {
        optionalMinutes: formatLength === 1,
        separator: formatLength === 3 || formatLength === 5,
        zZeroOffset: true
    });
};

formatters.G = function(date, formatLength, info) {
    var era = date.getFullYear() >= 0 ? 1 : 0;
    return formatNames(info, "eras", formatLength)[era];
};

formatters.e = formatDayOfWeek;

formatters.c = function(date, formatLength, info) {
    return formatDayOfWeek(date, formatLength, info, true);
};

formatters.q = function(date, formatLength, info) {
    return formatQuarter(date, formatLength, info, true);
};

formatters.Q = formatQuarter;

function formatDate(date, format, locale) {
    if ( locale === void 0 ) locale = DEFAULT_LOCALE;

    if (!isDate(date)) {
        if (date === undefined || date === null) {
            return EMPTY;
        }
        return date;
    }

    var info = localeInfo(locale);
    var pattern = datePattern(format, info);

    return pattern.replace(dateFormatRegExp, function(match) {
        var formatLength = match.length;
        var result;

        if (match.includes("'") || match.includes("\"")) {
            result = match.slice(1, formatLength - 1);
        } else {
            result = formatters[match[0]](date, formatLength, info);
        }

        return result;
    });
}

function convertTimeZone(date, fromOffset, toOffset) {
    var fromLocalOffset = date.getTimezoneOffset();

    var offsetDate = new Date(date.getTime() + (fromOffset - toOffset) * 60000);

    var toLocalOffset = offsetDate.getTimezoneOffset();

    return new Date(offsetDate.getTime() + (toLocalOffset - fromLocalOffset) * 60000);
}

function adjustDST(date, hours) {
    if (!hours && date.getHours() === 23) {
        date.setHours(date.getHours() + 2);
    }
}

var timeZoneOffsetRegExp = /([+|-]\d{1,2})(:?)(\d{2})?/;
var dateRegExp = /^\/Date\((.*?)\)\/$/;
var offsetRegExp = /[+-]\d*/;
var numberRegExp = {
    2: /^\d{1,2}/,
    3: /^\d{1,3}/,
    4: /^\d{4}/
};
var numberRegex = /\d+/;
var PLACEHOLDER = "{0}";

var leadingSpacesRegex = /^ */;
var trailingSpacesRegex = / *$/;

var standardDateFormats = [
    "yyyy/MM/dd HH:mm:ss",
    "yyyy/MM/dd HH:mm",
    "yyyy/MM/dd",
    "E MMM dd yyyy HH:mm:ss",
    "yyyy-MM-ddTHH:mm:ss.SSSSSSSXXX",
    "yyyy-MM-ddTHH:mm:ss.SSSXXX",
    "yyyy-MM-ddTHH:mm:ss.SSXXX",
    "yyyy-MM-ddTHH:mm:ssXXX",
    "yyyy-MM-ddTHH:mm:ss.SSSSSSS",
    "yyyy-MM-ddTHH:mm:ss.SSS",
    "yyyy-MM-ddTHH:mmXXX",
    "yyyy-MM-ddTHH:mmX",
    "yyyy-MM-ddTHH:mm:ss",
    "yyyy-MM-ddTHH:mm",
    "yyyy-MM-dd HH:mm:ss",
    "yyyy-MM-dd HH:mm",
    "yyyy-MM-dd",
    "HH:mm:ss",
    "HH:mm"
];
var FORMATS_SEQUENCE = [ "G", "g", "F", "Y", "y", "M", "m", "D", "d", "y", "T", "t" ];
var TWO_DIGIT_YEAR_MAX = 2029;

function outOfRange(value, start, end) {
    return !(value >= start && value <= end);
}

function lookAhead(match, state) {
    var format = state.format;
    var idx = state.idx;
    var i = 0;
    while (format[idx] === match) {
        i++;
        idx++;
    }
    if (i > 0) {
        idx -= 1;
    }
    state.idx = idx;
    return i;
}

function getNumber(size, state) {
    var regex = size ? (numberRegExp[size] || new RegExp('^\\d{1,' + size + '}')) : numberRegex,
        match = state.value.substr(state.valueIdx, size).match(regex);

    if (match) {
        match = match[0];
        state.valueIdx += match.length;
        return parseInt(match, 10);
    }
    return null;
}

function getIndexByName(names, state, lower) {
    var i = 0,
        length = names.length,
        name, nameLength,
        matchLength = 0,
        matchIdx = 0,
        subValue;

    for (; i < length; i++) {
        name = names[i];
        nameLength = name.length;
        subValue = state.value.substr(state.valueIdx, nameLength);

        {
            subValue = subValue.toLowerCase();
        }

        if (subValue === name && nameLength > matchLength) {
            matchLength = nameLength;
            matchIdx = i;
        }
    }

    if (matchLength) {
        state.valueIdx += matchLength;
        return matchIdx + 1;
    }

    return null;
}

function checkLiteral(state) {
    var result = false;
    var valueChar = state.value.charAt(state.valueIdx);
    var formatChar = state.format[state.idx];
    var exactMatch = valueChar === formatChar;
    var whitespaceMatch = /\s/.test(formatChar) && /\s/.test(valueChar);
    if (exactMatch || whitespaceMatch) {
        state.valueIdx++;
        result = true;
    }
    return result;
}

function calendarGmtFormats(calendar) {
    var gmtFormat = calendar.gmtFormat;
    var gmtZeroFormat = calendar.gmtZeroFormat;
    if (!gmtFormat) {
        throw errors.NoGMTInfo.error();
    }

    return [ gmtFormat.replace(PLACEHOLDER, EMPTY).toLowerCase(), gmtZeroFormat.replace(PLACEHOLDER, EMPTY).toLowerCase() ];
}

function parseTimeZoneOffset(state, info, options) {
    var shortHours = options.shortHours;
    var noSeparator = options.noSeparator;
    var optionalMinutes = options.optionalMinutes;
    var localizedName = options.localizedName;
    var zLiteral = options.zLiteral;
    state.UTC = true;

    if (zLiteral && state.value.charAt(state.valueIdx) === "Z") {
        state.valueIdx++;
        return false;
    }

    if (localizedName && !getIndexByName(calendarGmtFormats(info.calendar), state)) {
        return true;
    }

    var matches = timeZoneOffsetRegExp.exec(state.value.substr(state.valueIdx, 6));
    if (!matches) {
        return !localizedName;
    }

    var hoursMatch = matches[1];
    var minutesMatch = matches[3];
    var hoursOffset = parseInt(hoursMatch, 10);
    var separator = matches[2];
    var minutesOffset = parseInt(minutesMatch, 10);

    if (isNaN(hoursOffset) || (!shortHours && hoursMatch.length !== 3) || (!optionalMinutes && isNaN(minutesOffset)) || (noSeparator && separator)) {
        return true;
    }

    if (isNaN(minutesOffset)) {
        minutesOffset = null;
    }

    if (outOfRange(hoursOffset, -12, 13) || (minutesOffset && outOfRange(minutesOffset, 0, 59))) {
        return true;
    }

    state.valueIdx += matches[0].length;
    state.hoursOffset = hoursOffset;
    state.minutesOffset = minutesOffset;
}

function parseMonth(ch, state, info) {
    var count = lookAhead(ch, state);
    var names = formatNames(info, "months", count, ch === "L", true);

    var month = count < 3 ? getNumber(2, state) : getIndexByName(names, state);

    if (month === null || outOfRange(month, 1, 12)) {
        return true;
    }
    state.month = month - 1;
}

function parseDayOfWeek(ch, state, info) {
    var count = lookAhead(ch, state);
    var names = formatNames(info, "days", count, ch === "c", true);
    var dayOfWeek = count < 3 ? getNumber(1, state) : getIndexByName(names, state);
    if ((!dayOfWeek && dayOfWeek !== 0) || outOfRange(dayOfWeek, 1, 7)) {
        return true;
    }
}

var parsers = {};

parsers.d = function(state) {
    lookAhead("d", state);
    var day = getNumber(2, state);

    if (day === null || outOfRange(day, 1, 31)) {
        return true;
    }

    if (state.day === null) {
        state.day = day;
    }
};

parsers.E = function(state, info) {
    var count = lookAhead("E", state);
    //validate if it matches the day?
    var dayOfWeek = getIndexByName(formatNames(info, "days", count, false, true), state);
    if (dayOfWeek === null) {
        return true;
    }
};

parsers.M = function(state, info) {
    return parseMonth("M", state, info);
};

parsers.L = function(state, info) {
    return parseMonth("L", state, info);
};

parsers.y = function(state) {
    var count = lookAhead("y", state);
    var year = getNumber(count === 1 ? undefined : count, state);

    if (year === null) {
        return true;
    }

    if (count === 2) {
        var currentYear = new Date().getFullYear();
        year = (currentYear - currentYear % 100) + year;
        if (year > TWO_DIGIT_YEAR_MAX) {
            year -= 100;
        }
    }

    state.year = year;
};

parsers.h = function(state) {
    lookAhead("h", state);

    var hours = getNumber(2, state);
    if (hours === 12) {
        hours = 0;
    }

    if (hours === null || outOfRange(hours, 0, 11)) {
        return true;
    }

    state.hours = hours;
};

parsers.K = function(state) {
    lookAhead("K", state);

    var hours = getNumber(2, state);

    if (hours === null || outOfRange(hours, 0, 11)) {
        return true;
    }

    state.hours = hours;
};

parsers.a = function(state, info) {
    var count = lookAhead("a", state);
    var periodFormats = formatNames(info, "dayPeriods", count, false, true);

    var pmHour = getIndexByName([ periodFormats.pm ], state);
    if (!pmHour && !getIndexByName([ periodFormats.am ], state)) {
        return true;
    }

    state.pmHour = pmHour;
};

parsers.H = function(state) {
    lookAhead("H", state);
    var hours = getNumber(2, state);
    if (hours === null || outOfRange(hours, 0, 23)) {
        return true;
    }
    state.hours = hours;
};

parsers.k = function(state) {
    lookAhead("k", state);

    var hours = getNumber(2, state);

    if (hours === null || outOfRange(hours, 1, 24)) {
        return true;
    }

    state.hours = hours === 24 ? 0 : hours;
};

parsers.m = function(state) {
    lookAhead("m", state);
    var minutes = getNumber(2, state);

    if (minutes === null || outOfRange(minutes, 0, 59)) {
        return true;
    }

    state.minutes = minutes;
};

parsers.s = function(state) {
    lookAhead("s", state);
    var seconds = getNumber(2, state);
    if (seconds === null || outOfRange(seconds, 0, 59)) {
        return true;
    }
    state.seconds = seconds;
};

parsers.S = function(state) {
    var count = lookAhead("S", state);
    var match = state.value.substr(state.valueIdx, count);
    var milliseconds = null;

    if (!isNaN(parseInt(match, 10))) {
        milliseconds = parseFloat("0." + match, 10);
        milliseconds = round(milliseconds, 3);
        milliseconds *= 1000;
        state.valueIdx += count;
    }

    if (milliseconds === null || outOfRange(milliseconds, 0, 999)) {
        return true;
    }

    state.milliseconds = milliseconds;
};

parsers.z = function(state, info) {
    var count = lookAhead("z", state);

    var shortFormat = count < 4;

    var invalid = parseTimeZoneOffset(state, info, {
        shortHours: shortFormat,
        optionalMinutes: shortFormat,
        localizedName: true
    });

    if (invalid) {
        return invalid;
    }
};

parsers.Z = function(state, info) {
    var count = lookAhead("Z", state);

    var invalid = parseTimeZoneOffset(state, info, {
        noSeparator: count < 4,
        zLiteral: count === 5,
        localizedName: count === 4
    });

    if (invalid) {
        return invalid;
    }
};

parsers.x = function(state, info) {
    var count = lookAhead("x", state);

    var invalid = parseTimeZoneOffset(state, info, {
        noSeparator: count !== 3 && count !== 5,
        optionalMinutes: count === 1
    });
    if (invalid) {
        return invalid;
    }
};

parsers.X = function(state, info) {
    var count = lookAhead("X", state);

    var invalid = parseTimeZoneOffset(state, info, {
        noSeparator: count !== 3 && count !== 5,
        optionalMinutes: count === 1,
        zLiteral: true
    });
    if (invalid) {
        return invalid;
    }
};

parsers.G = function(state, info) {
    var count = lookAhead("G", state);
    var eras = formatNames(info, "eras", count, false, true);
    var era = getIndexByName([ eras[0], eras[1] ], state);

    if (era === null) {
        return true;
    }
};

parsers.e = function(state, info) {
    return parseDayOfWeek("e", state, info);
};

parsers.c = function(state, info) {
    return parseDayOfWeek("c", state, info);
};

function createDate(state) {
    var year = state.year;
    var month = state.month;
    var day = state.day;
    var hours = state.hours;
    var minutes = state.minutes;
    var seconds = state.seconds;
    var milliseconds = state.milliseconds;
    var pmHour = state.pmHour;
    var UTC = state.UTC;
    var hoursOffset = state.hoursOffset;
    var minutesOffset = state.minutesOffset;
    var hasTime = hours !== null || minutes !== null || seconds || null;
    var date = new Date();
    var result;

    if (year === null && month === null && day === null && hasTime) {
        year = date.getFullYear();
        month = date.getMonth();
        day = date.getDate();
    } else {
        if (year === null) {
            year = date.getFullYear();
        }

        if (day === null) {
            day = 1;
        }
    }

    if (pmHour && hours < 12) {
        hours += 12;
    }

    if (UTC) {
        if (hoursOffset) {
            hours += -hoursOffset;
        }

        if (minutesOffset) {
            minutes += -minutesOffset * (hoursOffset < 0 ? -1 : 1);
        }

        result = new Date(Date.UTC(year, month, day, hours, minutes, seconds, milliseconds));
    } else {
        result = new Date(year, month, day, hours, minutes, seconds, milliseconds);
        adjustDST(result, hours);
    }

    if (year < 100) {
        result.setFullYear(year);
    }

    if (result.getDate() !== day && UTC === undefined) {
        return null;
    }

    return result;
}

function addFormatSpaces(value, format) {
    var leadingSpaces = leadingSpacesRegex.exec(format)[0];
    var trailingSpaces = trailingSpacesRegex.exec(format)[0];

    return ("" + leadingSpaces + value + trailingSpaces);
}

function parseExact(value, format, info) {
    var pattern = datePattern(format, info).split(EMPTY);

    var state = {
        format: pattern,
        idx: 0,
        value: addFormatSpaces(value, format),
        valueIdx: 0,
        year: null,
        month: null,
        day: null,
        hours: null,
        minutes: null,
        seconds: null,
        milliseconds: null
    };

    var length = pattern.length;
    var literal = false;

    for (; state.idx < length; state.idx++) {
        var ch = pattern[state.idx];

        if (literal) {
            if (ch === "'") {
                literal = false;
            }

            checkLiteral(state);
        } else {
            if (parsers[ch]) {
                var invalid = parsers[ch](state, info);
                if (invalid) {
                    return null;
                }
            } else if (ch === "'") {
                literal = true;
                checkLiteral(state);
            } else if (!checkLiteral(state)) {
                return null;
            }
        }
    }

    if (state.valueIdx < value.length) {
        return null;
    }

    return createDate(state) || null;
}

function parseMicrosoftDateOffset(offset) {
    var sign = offset.substr(0, 1) === "-" ? -1 : 1;

    var result = offset.substring(1);
    result = (parseInt(result.substr(0, 2), 10) * 60) + parseInt(result.substring(2), 10);

    return sign * result;
}

function parseMicrosoftDateFormat(value) {
    if (value && value.indexOf("/D") === 0) {
        var date = dateRegExp.exec(value);
        if (date) {
            date = date[1];
            var tzoffset = offsetRegExp.exec(date.substring(1));

            date = new Date(parseInt(date, 10));

            if (tzoffset) {
                tzoffset = parseMicrosoftDateOffset(tzoffset[0]);
                date = convertTimeZone(date, date.getTimezoneOffset(), 0);
                date = convertTimeZone(date, 0, -1 * tzoffset);
            }

            return date;
        }
    }
}

function defaultFormats(calendar) {
    var formats = [];
    var patterns = calendar.patterns;
    var length = FORMATS_SEQUENCE.length;

    for (var idx = 0; idx < length; idx++) {
        formats.push(patterns[FORMATS_SEQUENCE[idx]]);
    }

    return formats.concat(standardDateFormats);
}

function parseDate(value, formats, locale) {
    if ( locale === void 0 ) locale = DEFAULT_LOCALE;

    if (!value) {
        return null;
    }

    if (isDate(value)) {
        return value;
    }

    var parseValue = String(value).trim();
    var date = parseMicrosoftDateFormat(parseValue);
    if (date) {
        return date;
    }

    var info = localeInfo(locale);
    var parseFormats = formats || defaultFormats(info.calendar);
    parseFormats = Array.isArray(parseFormats) ? parseFormats : [ parseFormats ];

    var length = parseFormats.length;

    for (var idx = 0; idx < length; idx++) {
        date = parseExact(parseValue, parseFormats[idx], info);
        if (date) {
            return date;
        }
    }

    return date;
}

var NAME_TYPES = {
    month: {
        type: 'months',
        minLength: 3,
        standAlone: 'L'
    },

    quarter: {
        type: 'quarters',
        minLength: 3,
        standAlone: 'q'
    },

    weekday: {
        type: 'days',
        minLength: {
            E: 0,
            c: 3,
            e: 3
        },
        standAlone: 'c'
    },

    dayperiod: {
        type: 'dayPeriods',
        minLength: 0
    },

    era: {
        type: 'eras',
        minLength: 0
    }
};

var LITERAL = 'literal';

function addLiteral(parts, value) {
    var lastPart = parts[parts.length - 1];
    if (lastPart && lastPart.type === LITERAL) {
        lastPart.pattern += value;
    } else {
        parts.push({
            type: LITERAL,
            pattern: value
        });
    }
}

function isHour12(pattern) {
    return pattern === 'h' || pattern === 'K';
}

function splitDateFormat(format, locale) {
    if ( locale === void 0 ) locale = DEFAULT_LOCALE;

    var info = localeInfo(locale);
    var pattern = datePattern(format, info);
    var parts = [];
    var lastIndex = dateFormatRegExp.lastIndex = 0;
    var match = dateFormatRegExp.exec(pattern);

    while (match) {
        var value = match[0];

        if (lastIndex < match.index) {
            addLiteral(parts, pattern.substring(lastIndex, match.index));
        }

        if (value.startsWith('"') || value.startsWith("'")) {
            addLiteral(parts, value);
        } else {
            var specifier = value[0];
            var type = DATE_FIELD_MAP[specifier];
            var part = {
                type: type,
                pattern: value
            };

            if (type === 'hour') {
                part.hour12 = isHour12(value);
            }

            var names = NAME_TYPES[type];

            if (names) {
                var minLength = isNumber(names.minLength) ? names.minLength : names.minLength[specifier];
                var patternLength = value.length;

                if (patternLength >= minLength) {
                    part.names = {
                        type: names.type,
                        nameType: dateNameType(patternLength),
                        standAlone: names.standAlone === specifier
                    };
                }
            }

            parts.push(part);
        }

        lastIndex = dateFormatRegExp.lastIndex;
        match = dateFormatRegExp.exec(pattern);
    }

    if (lastIndex < pattern.length) {
        addLiteral(parts, pattern.substring(lastIndex));
    }

    return parts;
}

var formatRegExp = /\{(\d+)(:[^}]+)?\}/g;

function toString(value, format, locale) {
    if (format) {
        if (isDate(value)) {
            return formatDate(value, format, locale);
        } else if (isNumber(value)) {
            return formatNumber(value, format, locale);
        }
    }

    return value !== undefined && value !== null ? value : EMPTY;
}

function format(format, values, locale) {
    return format.replace(formatRegExp, function(match, index, placeholderFormat) {
        var value = values[parseInt(index, 10)];

        return toString(value, placeholderFormat ? placeholderFormat.substring(1) : EMPTY, locale);
    });
}

exports.IntlError = IntlError;
exports.cldr = cldr;
exports.currencyDisplay = currencyDisplay;
exports.currencyDisplays = currencyDisplays;
exports.currencyFractionOptions = currencyFractionOptions;
exports.dateFieldName = dateFieldName;
exports.dateFormatNames = dateFormatNames;
exports.errors = errors;
exports.firstDay = firstDay;
exports.format = format;
exports.formatDate = formatDate;
exports.formatNumber = formatNumber;
exports.load = load;
exports.localeCurrency = localeCurrency;
exports.localeInfo = localeInfo;
exports.numberSymbols = numberSymbols;
exports.parseDate = parseDate;
exports.parseNumber = parseNumber;
exports.setData = setData;
exports.splitDateFormat = splitDateFormat;
exports.territoryCurrencyCode = territoryCurrencyCode;
exports.toIntlErrors = toIntlErrors;
exports.toString = toString;
exports.weekendRange = weekendRange;
//# sourceMappingURL=main.js.map

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZXMiOlsic3JjL2NsZHIvZGVmYXVsdC1kYXRhLmpzIiwic3JjL2NvbW1vbi9pcy1zdHJpbmcuanMiLCJzcmMvZXJyb3ItZGV0YWlscy5qcyIsInNyYy9lcnJvcnMuanMiLCJzcmMvY2xkci9pbmZvLmpzIiwic3JjL2NvbW1vbi9jb25zdGFudHMuanMiLCJzcmMvY2xkci9sb2FkLW51bWJlcnMuanMiLCJzcmMvY2xkci9sb2FkLWRhdGVzLmpzIiwic3JjL2NsZHIvdGVycml0b3J5LmpzIiwic3JjL2NsZHIvbG9hZC11bml0cy5qcyIsInNyYy9jbGRyL2xvYWQuanMiLCJzcmMvY2xkci9zZXQtZGF0YS5qcyIsInNyYy9jbGRyL2RhdGUtZmllbGQtbmFtZS5qcyIsInNyYy9jbGRyL2RhdGUtZm9ybWF0LW5hbWVzLmpzIiwic3JjL2NsZHIvcGFyc2UtcmFuZ2UtZGF0ZS5qcyIsInNyYy9jbGRyL2N1cnJlbmN5LmpzIiwic3JjL2NsZHIvY29uc3RhbnRzLmpzIiwic3JjL2NsZHIvZmlyc3QtZGF5LmpzIiwic3JjL2NsZHIvd2Vla2VuZC1yYW5nZS5qcyIsInNyYy9jbGRyL251bWJlci1zeW1ib2xzLmpzIiwic3JjL2NvbW1vbi9pcy1uZWdhdGl2ZS16ZXJvLmpzIiwic3JjL251bWJlcnMvZm9ybWF0LWN1cnJlbmN5LXN5bWJvbC5qcyIsInNyYy9udW1iZXJzL2dyb3VwLWludGVnZXIuanMiLCJzcmMvbnVtYmVycy9pcy1jdXJyZW5jeS1zdHlsZS5qcyIsInNyYy9jb21tb24vcGFkLmpzIiwic3JjL2NvbW1vbi9yb3VuZC5qcyIsInNyYy9udW1iZXJzL3N0YW5kYXJkLW51bWJlci1mb3JtYXQuanMiLCJzcmMvbnVtYmVycy91dGlscy5qcyIsInNyYy9udW1iZXJzL2N1c3RvbS1udW1iZXItZm9ybWF0LmpzIiwic3JjL251bWJlcnMvZm9ybWF0LW9wdGlvbnMuanMiLCJzcmMvbnVtYmVycy9mb3JtYXQtbnVtYmVyLmpzIiwic3JjL2NvbW1vbi9pcy1udW1iZXIuanMiLCJzcmMvbnVtYmVycy9wYXJzZS1udW1iZXIuanMiLCJzcmMvY29tbW9uL2Zvcm1hdC1zdHJpbmcuanMiLCJzcmMvZGF0ZXMvZGF0ZS1wYXR0ZXJuLmpzIiwic3JjL2RhdGVzL2RhdGUtbmFtZS10eXBlLmpzIiwic3JjL2RhdGVzL2Zvcm1hdC1uYW1lcy5qcyIsInNyYy9jb21tb24vaXMtZGF0ZS5qcyIsInNyYy9kYXRlcy9jb25zdGFudHMuanMiLCJzcmMvZGF0ZXMvZm9ybWF0LWRhdGUuanMiLCJzcmMvZGF0ZXMvdGltZS11dGlscy5qcyIsInNyYy9kYXRlcy9wYXJzZS1kYXRlLmpzIiwic3JjL2RhdGVzL3NwbGl0LWRhdGUtZm9ybWF0LmpzIiwic3JjL2Zvcm1hdC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJjb25zdCBkZWZhdWx0RGF0YSA9IHtcbiAgICBlbjoge1xuICAgICAgICBuYW1lOiBcImVuXCIsXG4gICAgICAgIGlkZW50aXR5OiB7XG4gICAgICAgICAgICB2ZXJzaW9uOiB7XG4gICAgICAgICAgICAgICAgX3VuaWNvZGVWZXJzaW9uOiBcIjE0LjAuMFwiLFxuICAgICAgICAgICAgICAgIF9jbGRyVmVyc2lvbjogXCI0MVwiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbGFuZ3VhZ2U6IFwiZW5cIlxuICAgICAgICB9LFxuICAgICAgICB0ZXJyaXRvcnk6IFwiVVNcIixcbiAgICAgICAgbnVtYmVyczoge1xuICAgICAgICAgICAgc3ltYm9sczoge1xuICAgICAgICAgICAgICAgIGRlY2ltYWw6IFwiLlwiLFxuICAgICAgICAgICAgICAgIGdyb3VwOiBcIixcIixcbiAgICAgICAgICAgICAgICBsaXN0OiBcIjtcIixcbiAgICAgICAgICAgICAgICBwZXJjZW50U2lnbjogXCIlXCIsXG4gICAgICAgICAgICAgICAgcGx1c1NpZ246IFwiK1wiLFxuICAgICAgICAgICAgICAgIG1pbnVzU2lnbjogXCItXCIsXG4gICAgICAgICAgICAgICAgZXhwb25lbnRpYWw6IFwiRVwiLFxuICAgICAgICAgICAgICAgIHN1cGVyc2NyaXB0aW5nRXhwb25lbnQ6IFwiw5dcIixcbiAgICAgICAgICAgICAgICBwZXJNaWxsZTogXCLigLBcIixcbiAgICAgICAgICAgICAgICBpbmZpbml0eTogXCLiiJ5cIixcbiAgICAgICAgICAgICAgICBuYW46IFwiTmFOXCIsXG4gICAgICAgICAgICAgICAgdGltZVNlcGFyYXRvcjogXCI6XCIsXG4gICAgICAgICAgICAgICAgYXBwcm94aW1hdGVseVNpZ246IFwiflwiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZGVjaW1hbDoge1xuICAgICAgICAgICAgICAgIHBhdHRlcm5zOiBbXG4gICAgICAgICAgICAgICAgICAgIFwiblwiXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgICBncm91cFNpemU6IFtcbiAgICAgICAgICAgICAgICAgICAgM1xuICAgICAgICAgICAgICAgIF1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzY2llbnRpZmljOiB7XG4gICAgICAgICAgICAgICAgcGF0dGVybnM6IFtcbiAgICAgICAgICAgICAgICAgICAgXCJuRW5cIlxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgZ3JvdXBTaXplOiBbXVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHBlcmNlbnQ6IHtcbiAgICAgICAgICAgICAgICBwYXR0ZXJuczogW1xuICAgICAgICAgICAgICAgICAgICBcIm4lXCJcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgIGdyb3VwU2l6ZTogW1xuICAgICAgICAgICAgICAgICAgICAzXG4gICAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGN1cnJlbmN5OiB7XG4gICAgICAgICAgICAgICAgcGF0dGVybnM6IFtcbiAgICAgICAgICAgICAgICAgICAgXCIkblwiXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgICBncm91cFNpemU6IFtcbiAgICAgICAgICAgICAgICAgICAgM1xuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgXCJ1bml0UGF0dGVybi1jb3VudC1vbmVcIjogXCJuICRcIixcbiAgICAgICAgICAgICAgICBcInVuaXRQYXR0ZXJuLWNvdW50LW90aGVyXCI6IFwibiAkXCJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjdXJyZW5jaWVzOiB7XG4gICAgICAgICAgICAgICAgQkdOOiB7XG4gICAgICAgICAgICAgICAgICAgIGRpc3BsYXlOYW1lOiBcIkJ1bGdhcmlhbiBMZXZcIixcbiAgICAgICAgICAgICAgICAgICAgXCJkaXNwbGF5TmFtZS1jb3VudC1vbmVcIjogXCJCdWxnYXJpYW4gbGV2XCIsXG4gICAgICAgICAgICAgICAgICAgIFwiZGlzcGxheU5hbWUtY291bnQtb3RoZXJcIjogXCJCdWxnYXJpYW4gbGV2YVwiLFxuICAgICAgICAgICAgICAgICAgICBzeW1ib2w6IFwiQkdOXCJcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIEVVUjoge1xuICAgICAgICAgICAgICAgICAgICBkaXNwbGF5TmFtZTogXCJFdXJvXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiZGlzcGxheU5hbWUtY291bnQtb25lXCI6IFwiZXVyb1wiLFxuICAgICAgICAgICAgICAgICAgICBcImRpc3BsYXlOYW1lLWNvdW50LW90aGVyXCI6IFwiZXVyb3NcIixcbiAgICAgICAgICAgICAgICAgICAgc3ltYm9sOiBcIuKCrFwiLFxuICAgICAgICAgICAgICAgICAgICBcInN5bWJvbC1hbHQtbmFycm93XCI6IFwi4oKsXCJcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIFVTRDoge1xuICAgICAgICAgICAgICAgICAgICBkaXNwbGF5TmFtZTogXCJVUyBEb2xsYXJcIixcbiAgICAgICAgICAgICAgICAgICAgXCJkaXNwbGF5TmFtZS1jb3VudC1vbmVcIjogXCJVUyBkb2xsYXJcIixcbiAgICAgICAgICAgICAgICAgICAgXCJkaXNwbGF5TmFtZS1jb3VudC1vdGhlclwiOiBcIlVTIGRvbGxhcnNcIixcbiAgICAgICAgICAgICAgICAgICAgc3ltYm9sOiBcIiRcIixcbiAgICAgICAgICAgICAgICAgICAgXCJzeW1ib2wtYWx0LW5hcnJvd1wiOiBcIiRcIlxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBsb2NhbGVDdXJyZW5jeTogXCJVU0RcIixcbiAgICAgICAgICAgIGFjY291bnRpbmc6IHtcbiAgICAgICAgICAgICAgICBwYXR0ZXJuczogW1xuICAgICAgICAgICAgICAgICAgICBcIiRuXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiKCRuKVwiXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgICBncm91cFNpemU6IFtcbiAgICAgICAgICAgICAgICAgICAgM1xuICAgICAgICAgICAgICAgIF1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgY2FsZW5kYXI6IHtcbiAgICAgICAgICAgIGdtdEZvcm1hdDogXCJHTVR7MH1cIixcbiAgICAgICAgICAgIGdtdFplcm9Gb3JtYXQ6IFwiR01UXCIsXG4gICAgICAgICAgICBwYXR0ZXJuczoge1xuICAgICAgICAgICAgICAgIGQ6IFwiTS9kL3lcIixcbiAgICAgICAgICAgICAgICBEOiBcIkVFRUUsIE1NTU0gZCwgeVwiLFxuICAgICAgICAgICAgICAgIG06IFwiTU1NIGRcIixcbiAgICAgICAgICAgICAgICBNOiBcIk1NTU0gZFwiLFxuICAgICAgICAgICAgICAgIHk6IFwiTU1NIHlcIixcbiAgICAgICAgICAgICAgICBZOiBcIk1NTU0geVwiLFxuICAgICAgICAgICAgICAgIEY6IFwiRUVFRSwgTU1NTSBkLCB5IGg6bW06c3MgYVwiLFxuICAgICAgICAgICAgICAgIGc6IFwiTS9kL3kgaDptbSBhXCIsXG4gICAgICAgICAgICAgICAgRzogXCJNL2QveSBoOm1tOnNzIGFcIixcbiAgICAgICAgICAgICAgICB0OiBcImg6bW0gYVwiLFxuICAgICAgICAgICAgICAgIFQ6IFwiaDptbTpzcyBhXCIsXG4gICAgICAgICAgICAgICAgczogXCJ5eXl5Jy0nTU0nLSdkZCdUJ0hIJzonbW0nOidzc1wiLFxuICAgICAgICAgICAgICAgIHU6IFwieXl5eSctJ01NJy0nZGQgSEgnOidtbSc6J3NzJ1onXCJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBkYXRlVGltZUZvcm1hdHM6IHtcbiAgICAgICAgICAgICAgICBmdWxsOiBcInsxfSwgezB9XCIsXG4gICAgICAgICAgICAgICAgbG9uZzogXCJ7MX0sIHswfVwiLFxuICAgICAgICAgICAgICAgIG1lZGl1bTogXCJ7MX0sIHswfVwiLFxuICAgICAgICAgICAgICAgIHNob3J0OiBcInsxfSwgezB9XCIsXG4gICAgICAgICAgICAgICAgYXZhaWxhYmxlRm9ybWF0czoge1xuICAgICAgICAgICAgICAgICAgICBCaDogXCJoIEJcIixcbiAgICAgICAgICAgICAgICAgICAgQmhtOiBcImg6bW0gQlwiLFxuICAgICAgICAgICAgICAgICAgICBCaG1zOiBcImg6bW06c3MgQlwiLFxuICAgICAgICAgICAgICAgICAgICBkOiBcImRcIixcbiAgICAgICAgICAgICAgICAgICAgRTogXCJjY2NcIixcbiAgICAgICAgICAgICAgICAgICAgRUJoOiBcIkUgaCBCXCIsXG4gICAgICAgICAgICAgICAgICAgIEVCaG06IFwiRSBoOm1tIEJcIixcbiAgICAgICAgICAgICAgICAgICAgRUJobXM6IFwiRSBoOm1tOnNzIEJcIixcbiAgICAgICAgICAgICAgICAgICAgRWQ6IFwiZCBFXCIsXG4gICAgICAgICAgICAgICAgICAgIEVoOiBcIkUgaCBhXCIsXG4gICAgICAgICAgICAgICAgICAgIEVobTogXCJFIGg6bW0gYVwiLFxuICAgICAgICAgICAgICAgICAgICBFSG06IFwiRSBISDptbVwiLFxuICAgICAgICAgICAgICAgICAgICBFaG1zOiBcIkUgaDptbTpzcyBhXCIsXG4gICAgICAgICAgICAgICAgICAgIEVIbXM6IFwiRSBISDptbTpzc1wiLFxuICAgICAgICAgICAgICAgICAgICBHeTogXCJ5IEdcIixcbiAgICAgICAgICAgICAgICAgICAgR3lNOiBcIk0veSBHXCIsXG4gICAgICAgICAgICAgICAgICAgIEd5TWQ6IFwiTS9kL3kgR1wiLFxuICAgICAgICAgICAgICAgICAgICBHeU1FZDogXCJFLCBNL2QveSBHXCIsXG4gICAgICAgICAgICAgICAgICAgIEd5TU1NOiBcIk1NTSB5IEdcIixcbiAgICAgICAgICAgICAgICAgICAgR3lNTU1kOiBcIk1NTSBkLCB5IEdcIixcbiAgICAgICAgICAgICAgICAgICAgR3lNTU1FZDogXCJFLCBNTU0gZCwgeSBHXCIsXG4gICAgICAgICAgICAgICAgICAgIGg6IFwiaCBhXCIsXG4gICAgICAgICAgICAgICAgICAgIEg6IFwiSEhcIixcbiAgICAgICAgICAgICAgICAgICAgaG06IFwiaDptbSBhXCIsXG4gICAgICAgICAgICAgICAgICAgIEhtOiBcIkhIOm1tXCIsXG4gICAgICAgICAgICAgICAgICAgIGhtczogXCJoOm1tOnNzIGFcIixcbiAgICAgICAgICAgICAgICAgICAgSG1zOiBcIkhIOm1tOnNzXCIsXG4gICAgICAgICAgICAgICAgICAgIGhtc3Y6IFwiaDptbTpzcyBhIHZcIixcbiAgICAgICAgICAgICAgICAgICAgSG1zdjogXCJISDptbTpzcyB2XCIsXG4gICAgICAgICAgICAgICAgICAgIGhtdjogXCJoOm1tIGEgdlwiLFxuICAgICAgICAgICAgICAgICAgICBIbXY6IFwiSEg6bW0gdlwiLFxuICAgICAgICAgICAgICAgICAgICBodjogXCJoIGEgdlwiLFxuICAgICAgICAgICAgICAgICAgICBIdjogXCJISCdoJyB2XCIsXG4gICAgICAgICAgICAgICAgICAgIE06IFwiTFwiLFxuICAgICAgICAgICAgICAgICAgICBNZDogXCJNL2RcIixcbiAgICAgICAgICAgICAgICAgICAgTUVkOiBcIkUsIE0vZFwiLFxuICAgICAgICAgICAgICAgICAgICBNTU06IFwiTExMXCIsXG4gICAgICAgICAgICAgICAgICAgIE1NTWQ6IFwiTU1NIGRcIixcbiAgICAgICAgICAgICAgICAgICAgTU1NRWQ6IFwiRSwgTU1NIGRcIixcbiAgICAgICAgICAgICAgICAgICAgTU1NTWQ6IFwiTU1NTSBkXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiTU1NTVctY291bnQtb25lXCI6IFwiJ3dlZWsnIFcgJ29mJyBNTU1NXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiTU1NTVctY291bnQtb3RoZXJcIjogXCInd2VlaycgVyAnb2YnIE1NTU1cIixcbiAgICAgICAgICAgICAgICAgICAgbXM6IFwibW06c3NcIixcbiAgICAgICAgICAgICAgICAgICAgeTogXCJ5XCIsXG4gICAgICAgICAgICAgICAgICAgIHlNOiBcIk0veVwiLFxuICAgICAgICAgICAgICAgICAgICB5TWQ6IFwiTS9kL3lcIixcbiAgICAgICAgICAgICAgICAgICAgeU1FZDogXCJFLCBNL2QveVwiLFxuICAgICAgICAgICAgICAgICAgICB5TU1NOiBcIk1NTSB5XCIsXG4gICAgICAgICAgICAgICAgICAgIHlNTU1kOiBcIk1NTSBkLCB5XCIsXG4gICAgICAgICAgICAgICAgICAgIHlNTU1FZDogXCJFLCBNTU0gZCwgeVwiLFxuICAgICAgICAgICAgICAgICAgICB5TU1NTTogXCJNTU1NIHlcIixcbiAgICAgICAgICAgICAgICAgICAgeVFRUTogXCJRUVEgeVwiLFxuICAgICAgICAgICAgICAgICAgICB5UVFRUTogXCJRUVFRIHlcIixcbiAgICAgICAgICAgICAgICAgICAgXCJ5dy1jb3VudC1vbmVcIjogXCInd2VlaycgdyAnb2YnIFlcIixcbiAgICAgICAgICAgICAgICAgICAgXCJ5dy1jb3VudC1vdGhlclwiOiBcIid3ZWVrJyB3ICdvZicgWVwiXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRpbWVGb3JtYXRzOiB7XG4gICAgICAgICAgICAgICAgZnVsbDogXCJoOm1tOnNzIGEgenp6elwiLFxuICAgICAgICAgICAgICAgIGxvbmc6IFwiaDptbTpzcyBhIHpcIixcbiAgICAgICAgICAgICAgICBtZWRpdW06IFwiaDptbTpzcyBhXCIsXG4gICAgICAgICAgICAgICAgc2hvcnQ6IFwiaDptbSBhXCJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBkYXRlRm9ybWF0czoge1xuICAgICAgICAgICAgICAgIGZ1bGw6IFwiRUVFRSwgTU1NTSBkLCB5XCIsXG4gICAgICAgICAgICAgICAgbG9uZzogXCJNTU1NIGQsIHlcIixcbiAgICAgICAgICAgICAgICBtZWRpdW06IFwiTU1NIGQsIHlcIixcbiAgICAgICAgICAgICAgICBzaG9ydDogXCJNL2QveXlcIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGRheXM6IHtcbiAgICAgICAgICAgICAgICBmb3JtYXQ6IHtcbiAgICAgICAgICAgICAgICAgICAgYWJicmV2aWF0ZWQ6IFtcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiU3VuXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBcIk1vblwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJUdWVcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiV2VkXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBcIlRodVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJGcmlcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiU2F0XCJcbiAgICAgICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgICAgICAgbmFycm93OiBbXG4gICAgICAgICAgICAgICAgICAgICAgICBcIlNcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiTVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJUXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBcIldcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiVFwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJGXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBcIlNcIlxuICAgICAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgICAgICBzaG9ydDogW1xuICAgICAgICAgICAgICAgICAgICAgICAgXCJTdVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJNb1wiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJUdVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJXZVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJUaFwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJGclwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJTYVwiXG4gICAgICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgICAgIHdpZGU6IFtcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiU3VuZGF5XCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBcIk1vbmRheVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJUdWVzZGF5XCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBcIldlZG5lc2RheVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJUaHVyc2RheVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJGcmlkYXlcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiU2F0dXJkYXlcIlxuICAgICAgICAgICAgICAgICAgICBdXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBcInN0YW5kLWFsb25lXCI6IHtcbiAgICAgICAgICAgICAgICAgICAgYWJicmV2aWF0ZWQ6IFtcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiU3VuXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBcIk1vblwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJUdWVcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiV2VkXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBcIlRodVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJGcmlcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiU2F0XCJcbiAgICAgICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgICAgICAgbmFycm93OiBbXG4gICAgICAgICAgICAgICAgICAgICAgICBcIlNcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiTVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJUXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBcIldcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiVFwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJGXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBcIlNcIlxuICAgICAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgICAgICBzaG9ydDogW1xuICAgICAgICAgICAgICAgICAgICAgICAgXCJTdVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJNb1wiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJUdVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJXZVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJUaFwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJGclwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJTYVwiXG4gICAgICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgICAgIHdpZGU6IFtcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiU3VuZGF5XCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBcIk1vbmRheVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJUdWVzZGF5XCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBcIldlZG5lc2RheVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJUaHVyc2RheVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJGcmlkYXlcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiU2F0dXJkYXlcIlxuICAgICAgICAgICAgICAgICAgICBdXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG1vbnRoczoge1xuICAgICAgICAgICAgICAgIGZvcm1hdDoge1xuICAgICAgICAgICAgICAgICAgICBhYmJyZXZpYXRlZDogW1xuICAgICAgICAgICAgICAgICAgICAgICAgXCJKYW5cIixcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiRmViXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBcIk1hclwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJBcHJcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiTWF5XCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBcIkp1blwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJKdWxcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiQXVnXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBcIlNlcFwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJPY3RcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiTm92XCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBcIkRlY1wiXG4gICAgICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgICAgIG5hcnJvdzogW1xuICAgICAgICAgICAgICAgICAgICAgICAgXCJKXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBcIkZcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiTVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJBXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBcIk1cIixcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiSlwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJKXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBcIkFcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiU1wiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJPXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBcIk5cIixcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiRFwiXG4gICAgICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgICAgIHdpZGU6IFtcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiSmFudWFyeVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJGZWJydWFyeVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJNYXJjaFwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJBcHJpbFwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJNYXlcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiSnVuZVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJKdWx5XCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBcIkF1Z3VzdFwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJTZXB0ZW1iZXJcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiT2N0b2JlclwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJOb3ZlbWJlclwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJEZWNlbWJlclwiXG4gICAgICAgICAgICAgICAgICAgIF1cbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIFwic3RhbmQtYWxvbmVcIjoge1xuICAgICAgICAgICAgICAgICAgICBhYmJyZXZpYXRlZDogW1xuICAgICAgICAgICAgICAgICAgICAgICAgXCJKYW5cIixcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiRmViXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBcIk1hclwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJBcHJcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiTWF5XCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBcIkp1blwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJKdWxcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiQXVnXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBcIlNlcFwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJPY3RcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiTm92XCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBcIkRlY1wiXG4gICAgICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgICAgIG5hcnJvdzogW1xuICAgICAgICAgICAgICAgICAgICAgICAgXCJKXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBcIkZcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiTVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJBXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBcIk1cIixcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiSlwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJKXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBcIkFcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiU1wiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJPXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBcIk5cIixcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiRFwiXG4gICAgICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgICAgIHdpZGU6IFtcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiSmFudWFyeVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJGZWJydWFyeVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJNYXJjaFwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJBcHJpbFwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJNYXlcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiSnVuZVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJKdWx5XCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBcIkF1Z3VzdFwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJTZXB0ZW1iZXJcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiT2N0b2JlclwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJOb3ZlbWJlclwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJEZWNlbWJlclwiXG4gICAgICAgICAgICAgICAgICAgIF1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcXVhcnRlcnM6IHtcbiAgICAgICAgICAgICAgICBmb3JtYXQ6IHtcbiAgICAgICAgICAgICAgICAgICAgYWJicmV2aWF0ZWQ6IFtcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiUTFcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiUTJcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiUTNcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiUTRcIlxuICAgICAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgICAgICBuYXJyb3c6IFtcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiMVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCIyXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBcIjNcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiNFwiXG4gICAgICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgICAgIHdpZGU6IFtcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiMXN0IHF1YXJ0ZXJcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiMm5kIHF1YXJ0ZXJcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiM3JkIHF1YXJ0ZXJcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiNHRoIHF1YXJ0ZXJcIlxuICAgICAgICAgICAgICAgICAgICBdXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBcInN0YW5kLWFsb25lXCI6IHtcbiAgICAgICAgICAgICAgICAgICAgYWJicmV2aWF0ZWQ6IFtcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiUTFcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiUTJcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiUTNcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiUTRcIlxuICAgICAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgICAgICBuYXJyb3c6IFtcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiMVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCIyXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBcIjNcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiNFwiXG4gICAgICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgICAgIHdpZGU6IFtcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiMXN0IHF1YXJ0ZXJcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiMm5kIHF1YXJ0ZXJcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiM3JkIHF1YXJ0ZXJcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiNHRoIHF1YXJ0ZXJcIlxuICAgICAgICAgICAgICAgICAgICBdXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGRheVBlcmlvZHM6IHtcbiAgICAgICAgICAgICAgICBmb3JtYXQ6IHtcbiAgICAgICAgICAgICAgICAgICAgYWJicmV2aWF0ZWQ6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1pZG5pZ2h0OiBcIm1pZG5pZ2h0XCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBhbTogXCJBTVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJhbS1hbHQtdmFyaWFudFwiOiBcImFtXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBub29uOiBcIm5vb25cIixcbiAgICAgICAgICAgICAgICAgICAgICAgIHBtOiBcIlBNXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBcInBtLWFsdC12YXJpYW50XCI6IFwicG1cIixcbiAgICAgICAgICAgICAgICAgICAgICAgIG1vcm5pbmcxOiBcImluIHRoZSBtb3JuaW5nXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBhZnRlcm5vb24xOiBcImluIHRoZSBhZnRlcm5vb25cIixcbiAgICAgICAgICAgICAgICAgICAgICAgIGV2ZW5pbmcxOiBcImluIHRoZSBldmVuaW5nXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBuaWdodDE6IFwiYXQgbmlnaHRcIlxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICBuYXJyb3c6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1pZG5pZ2h0OiBcIm1pXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBhbTogXCJhXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBcImFtLWFsdC12YXJpYW50XCI6IFwiYW1cIixcbiAgICAgICAgICAgICAgICAgICAgICAgIG5vb246IFwiblwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgcG06IFwicFwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJwbS1hbHQtdmFyaWFudFwiOiBcInBtXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBtb3JuaW5nMTogXCJpbiB0aGUgbW9ybmluZ1wiLFxuICAgICAgICAgICAgICAgICAgICAgICAgYWZ0ZXJub29uMTogXCJpbiB0aGUgYWZ0ZXJub29uXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBldmVuaW5nMTogXCJpbiB0aGUgZXZlbmluZ1wiLFxuICAgICAgICAgICAgICAgICAgICAgICAgbmlnaHQxOiBcImF0IG5pZ2h0XCJcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgd2lkZToge1xuICAgICAgICAgICAgICAgICAgICAgICAgbWlkbmlnaHQ6IFwibWlkbmlnaHRcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIGFtOiBcIkFNXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBcImFtLWFsdC12YXJpYW50XCI6IFwiYW1cIixcbiAgICAgICAgICAgICAgICAgICAgICAgIG5vb246IFwibm9vblwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgcG06IFwiUE1cIixcbiAgICAgICAgICAgICAgICAgICAgICAgIFwicG0tYWx0LXZhcmlhbnRcIjogXCJwbVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgbW9ybmluZzE6IFwiaW4gdGhlIG1vcm5pbmdcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIGFmdGVybm9vbjE6IFwiaW4gdGhlIGFmdGVybm9vblwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgZXZlbmluZzE6IFwiaW4gdGhlIGV2ZW5pbmdcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIG5pZ2h0MTogXCJhdCBuaWdodFwiXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIFwic3RhbmQtYWxvbmVcIjoge1xuICAgICAgICAgICAgICAgICAgICBhYmJyZXZpYXRlZDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgbWlkbmlnaHQ6IFwibWlkbmlnaHRcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIGFtOiBcIkFNXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBcImFtLWFsdC12YXJpYW50XCI6IFwiYW1cIixcbiAgICAgICAgICAgICAgICAgICAgICAgIG5vb246IFwibm9vblwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgcG06IFwiUE1cIixcbiAgICAgICAgICAgICAgICAgICAgICAgIFwicG0tYWx0LXZhcmlhbnRcIjogXCJwbVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgbW9ybmluZzE6IFwibW9ybmluZ1wiLFxuICAgICAgICAgICAgICAgICAgICAgICAgYWZ0ZXJub29uMTogXCJhZnRlcm5vb25cIixcbiAgICAgICAgICAgICAgICAgICAgICAgIGV2ZW5pbmcxOiBcImV2ZW5pbmdcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIG5pZ2h0MTogXCJuaWdodFwiXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIG5hcnJvdzoge1xuICAgICAgICAgICAgICAgICAgICAgICAgbWlkbmlnaHQ6IFwibWlkbmlnaHRcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIGFtOiBcIkFNXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBcImFtLWFsdC12YXJpYW50XCI6IFwiYW1cIixcbiAgICAgICAgICAgICAgICAgICAgICAgIG5vb246IFwibm9vblwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgcG06IFwiUE1cIixcbiAgICAgICAgICAgICAgICAgICAgICAgIFwicG0tYWx0LXZhcmlhbnRcIjogXCJwbVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgbW9ybmluZzE6IFwibW9ybmluZ1wiLFxuICAgICAgICAgICAgICAgICAgICAgICAgYWZ0ZXJub29uMTogXCJhZnRlcm5vb25cIixcbiAgICAgICAgICAgICAgICAgICAgICAgIGV2ZW5pbmcxOiBcImV2ZW5pbmdcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIG5pZ2h0MTogXCJuaWdodFwiXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIHdpZGU6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1pZG5pZ2h0OiBcIm1pZG5pZ2h0XCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBhbTogXCJBTVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJhbS1hbHQtdmFyaWFudFwiOiBcImFtXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBub29uOiBcIm5vb25cIixcbiAgICAgICAgICAgICAgICAgICAgICAgIHBtOiBcIlBNXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBcInBtLWFsdC12YXJpYW50XCI6IFwicG1cIixcbiAgICAgICAgICAgICAgICAgICAgICAgIG1vcm5pbmcxOiBcIm1vcm5pbmdcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIGFmdGVybm9vbjE6IFwiYWZ0ZXJub29uXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBldmVuaW5nMTogXCJldmVuaW5nXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBuaWdodDE6IFwibmlnaHRcIlxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGVyYXM6IHtcbiAgICAgICAgICAgICAgICBmb3JtYXQ6IHtcbiAgICAgICAgICAgICAgICAgICAgd2lkZToge1xuICAgICAgICAgICAgICAgICAgICAgICAgXCIwXCI6IFwiQmVmb3JlIENocmlzdFwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCIxXCI6IFwiQW5ubyBEb21pbmlcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiMC1hbHQtdmFyaWFudFwiOiBcIkJlZm9yZSBDb21tb24gRXJhXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBcIjEtYWx0LXZhcmlhbnRcIjogXCJDb21tb24gRXJhXCJcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgYWJicmV2aWF0ZWQ6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiMFwiOiBcIkJDXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBcIjFcIjogXCJBRFwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCIwLWFsdC12YXJpYW50XCI6IFwiQkNFXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBcIjEtYWx0LXZhcmlhbnRcIjogXCJDRVwiXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIG5hcnJvdzoge1xuICAgICAgICAgICAgICAgICAgICAgICAgXCIwXCI6IFwiQlwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCIxXCI6IFwiQVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCIwLWFsdC12YXJpYW50XCI6IFwiQkNFXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBcIjEtYWx0LXZhcmlhbnRcIjogXCJDRVwiXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZGF0ZUZpZWxkczoge1xuICAgICAgICAgICAgICAgIGVyYToge1xuICAgICAgICAgICAgICAgICAgICB3aWRlOiBcImVyYVwiLFxuICAgICAgICAgICAgICAgICAgICBzaG9ydDogXCJlcmFcIixcbiAgICAgICAgICAgICAgICAgICAgbmFycm93OiBcImVyYVwiXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB5ZWFyOiB7XG4gICAgICAgICAgICAgICAgICAgIHdpZGU6IFwieWVhclwiLFxuICAgICAgICAgICAgICAgICAgICBzaG9ydDogXCJ5ci5cIixcbiAgICAgICAgICAgICAgICAgICAgbmFycm93OiBcInlyLlwiXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBxdWFydGVyOiB7XG4gICAgICAgICAgICAgICAgICAgIHdpZGU6IFwicXVhcnRlclwiLFxuICAgICAgICAgICAgICAgICAgICBzaG9ydDogXCJxdHIuXCIsXG4gICAgICAgICAgICAgICAgICAgIG5hcnJvdzogXCJxdHIuXCJcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIG1vbnRoOiB7XG4gICAgICAgICAgICAgICAgICAgIHdpZGU6IFwibW9udGhcIixcbiAgICAgICAgICAgICAgICAgICAgc2hvcnQ6IFwibW8uXCIsXG4gICAgICAgICAgICAgICAgICAgIG5hcnJvdzogXCJtby5cIlxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgd2Vlazoge1xuICAgICAgICAgICAgICAgICAgICB3aWRlOiBcIndlZWtcIixcbiAgICAgICAgICAgICAgICAgICAgc2hvcnQ6IFwid2suXCIsXG4gICAgICAgICAgICAgICAgICAgIG5hcnJvdzogXCJ3ay5cIlxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgd2Vla09mTW9udGg6IHtcbiAgICAgICAgICAgICAgICAgICAgd2lkZTogXCJ3ZWVrIG9mIG1vbnRoXCIsXG4gICAgICAgICAgICAgICAgICAgIHNob3J0OiBcIndrLiBvZiBtby5cIixcbiAgICAgICAgICAgICAgICAgICAgbmFycm93OiBcIndrLiBvZiBtby5cIlxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgZGF5OiB7XG4gICAgICAgICAgICAgICAgICAgIHdpZGU6IFwiZGF5XCIsXG4gICAgICAgICAgICAgICAgICAgIHNob3J0OiBcImRheVwiLFxuICAgICAgICAgICAgICAgICAgICBuYXJyb3c6IFwiZGF5XCJcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGRheU9mWWVhcjoge1xuICAgICAgICAgICAgICAgICAgICB3aWRlOiBcImRheSBvZiB5ZWFyXCIsXG4gICAgICAgICAgICAgICAgICAgIHNob3J0OiBcImRheSBvZiB5ci5cIixcbiAgICAgICAgICAgICAgICAgICAgbmFycm93OiBcImRheSBvZiB5ci5cIlxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgd2Vla2RheToge1xuICAgICAgICAgICAgICAgICAgICB3aWRlOiBcImRheSBvZiB0aGUgd2Vla1wiLFxuICAgICAgICAgICAgICAgICAgICBzaG9ydDogXCJkYXkgb2Ygd2suXCIsXG4gICAgICAgICAgICAgICAgICAgIG5hcnJvdzogXCJkYXkgb2Ygd2suXCJcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHdlZWtkYXlPZk1vbnRoOiB7XG4gICAgICAgICAgICAgICAgICAgIHdpZGU6IFwid2Vla2RheSBvZiB0aGUgbW9udGhcIixcbiAgICAgICAgICAgICAgICAgICAgc2hvcnQ6IFwid2tkYXkuIG9mIG1vLlwiLFxuICAgICAgICAgICAgICAgICAgICBuYXJyb3c6IFwid2tkYXkuIG9mIG1vLlwiXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBkYXlwZXJpb2Q6IHtcbiAgICAgICAgICAgICAgICAgICAgc2hvcnQ6IFwiQU0vUE1cIixcbiAgICAgICAgICAgICAgICAgICAgd2lkZTogXCJBTS9QTVwiLFxuICAgICAgICAgICAgICAgICAgICBuYXJyb3c6IFwiQU0vUE1cIlxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgaG91cjoge1xuICAgICAgICAgICAgICAgICAgICB3aWRlOiBcImhvdXJcIixcbiAgICAgICAgICAgICAgICAgICAgc2hvcnQ6IFwiaHIuXCIsXG4gICAgICAgICAgICAgICAgICAgIG5hcnJvdzogXCJoci5cIlxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgbWludXRlOiB7XG4gICAgICAgICAgICAgICAgICAgIHdpZGU6IFwibWludXRlXCIsXG4gICAgICAgICAgICAgICAgICAgIHNob3J0OiBcIm1pbi5cIixcbiAgICAgICAgICAgICAgICAgICAgbmFycm93OiBcIm1pbi5cIlxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgc2Vjb25kOiB7XG4gICAgICAgICAgICAgICAgICAgIHdpZGU6IFwic2Vjb25kXCIsXG4gICAgICAgICAgICAgICAgICAgIHNob3J0OiBcInNlYy5cIixcbiAgICAgICAgICAgICAgICAgICAgbmFycm93OiBcInNlYy5cIlxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgem9uZToge1xuICAgICAgICAgICAgICAgICAgICB3aWRlOiBcInRpbWUgem9uZVwiLFxuICAgICAgICAgICAgICAgICAgICBzaG9ydDogXCJ6b25lXCIsXG4gICAgICAgICAgICAgICAgICAgIG5hcnJvdzogXCJ6b25lXCJcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIG1pbGxpc2Vjb25kOiB7XG4gICAgICAgICAgICAgICAgICAgIG5hcnJvdzogXCJtc1wiLFxuICAgICAgICAgICAgICAgICAgICBzaG9ydDogXCJtc1wiLFxuICAgICAgICAgICAgICAgICAgICB3aWRlOiBcIm1pbGxpc2Vjb25kXCJcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LFxuICAgIHN1cHBsZW1lbnRhbDoge1xuICAgICAgICBsaWtlbHlTdWJ0YWdzOiB7XG4gICAgICAgICAgICBlbjogXCJlbi1MYXRuLVVTXCJcbiAgICAgICAgfSxcbiAgICAgICAgY3VycmVuY3lEYXRhOiB7XG4gICAgICAgICAgICByZWdpb246IHtcbiAgICAgICAgICAgICAgICBVUzogW1xuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICBVU0Q6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBfZnJvbTogXCIxNzkyLTAxLTAxXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIF1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgd2Vla0RhdGE6IHtcbiAgICAgICAgICAgIGZpcnN0RGF5OiB7XG4gICAgICAgICAgICAgICAgVVM6IFwic3VuXCJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB3ZWVrZW5kU3RhcnQ6IHtcbiAgICAgICAgICAgICAgICBcIjAwMVwiOiBcInNhdFwiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgd2Vla2VuZEVuZDoge1xuICAgICAgICAgICAgICAgIFwiMDAxXCI6IFwic3VuXCJcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn07XG5leHBvcnQgZGVmYXVsdCBkZWZhdWx0RGF0YTsiLCJleHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBpc1N0cmluZyh2YWx1ZSkge1xuICAgIHJldHVybiB0eXBlb2YgdmFsdWUgPT09IFwic3RyaW5nXCI7XG59IiwiLy9UaGUgZXJyb3IgaXMgcmVwcmVzZW50ZWQgYnkgdW5pcXVlIG5hbWUgYW5kIGNvcnJlc3BvbmRpbmcgbWVzc2FnZVxuLy9UaGUgbWVzc2FnZSBjYW4gY29udGFpbiBwbGFjZWhvbGRlcnMgd2l0aCBpbmRleCwgZS5nLiB7MH0sIHsxfVxuXG5leHBvcnQgZGVmYXVsdCB7XG4gICAgXCJOb0xvY2FsZVwiOiBcIk1pc3NpbmcgbG9jYWxlIGluZm8gZm9yICd7MH0nXCIsXG4gICAgXCJOb0N1cnJlbmN5XCI6IFwiQ2Fubm90IGRldGVybWluZSBjdXJyZW5jeSBpbmZvcm1hdGlvbi4gUGxlYXNlIGxvYWQgdGhlIGxvY2FsZSBjdXJyZW5jaWVzIGRhdGEuXCIsXG4gICAgXCJOb1N1cHBsZW1lbnRhbEN1cnJlbmN5XCI6IFwiQ2Fubm90IGRldGVybWluZSBjdXJyZW5jeS4gUGxlYXNlIGxvYWQgdGhlIHN1cHBsZW1lbnRhbCBjdXJyZW5jeURhdGEuXCIsXG4gICAgXCJOb0N1cnJlbmN5UmVnaW9uXCI6IFwiTm8gY3VycmVuY3kgZGF0YSBmb3IgcmVnaW9uICd7MH0nXCIsXG4gICAgXCJOb0N1cnJlbmN5RGlzcGxheVwiOiBcIkNhbm5vdCBkZXRlcm1pbmUgY3VycmVuY3kgZGlzcGxheSBpbmZvcm1hdGlvbi4gUGxlYXNlIGxvYWQgdGhlIGxvY2FsZSBjdXJyZW5jaWVzIGRhdGEuIFRoZSBkZWZhdWx0IGN1bHR1cmUgZG9lcyBub3QgaW5jbHVkZSB0aGUgYWxsIGN1cnJlbmNpZXMgZGF0YS5cIixcbiAgICBcIk5vR01USW5mb1wiOiBcIkNhbm5vdCBkZXRlcm1pbmUgbG9jYWxlIEdNVCBmb3JtYXQuIFBsZWFzZSBsb2FkIHRoZSBsb2NhbGUgdGltZVpvbmVOYW1lcyBkYXRhLlwiLFxuICAgIFwiTm9XZWVrRGF0YVwiOiBcIkNhbm5vdCBkZXRlcm1pbmUgbG9jYWxlIGZpcnN0IGRheSBvZiB3ZWVrLiBQbGVhc2UgbG9hZCB0aGUgc3VwcGxlbWVudGFsIHdlZWtEYXRhLlwiLFxuICAgIFwiTm9GaXJzdERheVwiOiBcIkNhbm5vdCBkZXRlcm1pbmUgbG9jYWxlIGZpcnN0IGRheSBvZiB3ZWVrLiBQbGVhc2UgbG9hZCB0aGUgc3VwcGxlbWVudGFsIHdlZWtEYXRhLiBUaGUgZGVmYXVsdCBjdWx0dXJlIGluY2x1ZGVzIG9ubHkgdGhlICdlbi1VUycgZmlyc3QgZGF5IGluZm8uXCIsXG4gICAgXCJOb1ZhbGlkQ3VycmVuY3lcIjogXCJDYW5ub3QgZGV0ZXJtaW5lIGEgZGVmYXVsdCBjdXJyZW5jeSBmb3IgdGhlIHswfSBsb2NhbGUuIFBsZWFzZSBzcGVjaWZ5IGV4cGxpY2l0bHkgdGhlIGN1cnJlbmN5IHdpdGggdGhlIGZvcm1hdCBvcHRpb25zLlwiLFxuICAgIFwiTm9EYXRlRmllbGROYW1lc1wiOiBcIkNhbm5vdCBkZXRlcm1pbmUgdGhlIGxvY2FsZSBkYXRlIGZpZWxkIG5hbWVzLiBQbGVhc2UgbG9hZCB0aGUgbG9jYWxlIGRhdGVGaWVsZHMgZGF0YS5cIlxufTtcbiIsImltcG9ydCBlcnJvckRldGFpbHMgZnJvbSAnLi9lcnJvci1kZXRhaWxzJztcblxuY29uc3QgZm9ybWF0UmVnRXhwID0gL1xceyhcXGQrKX0/XFx9L2c7XG5cbmNsYXNzIEludGxFcnJvciB7XG4gICAgY29uc3RydWN0b3IoeyBuYW1lLCBtZXNzYWdlIH0pIHtcbiAgICAgICAgaWYgKCFuYW1lIHx8ICFtZXNzYWdlKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJ7IG5hbWU6IHN0cmluZywgbWVzc2FnZTogc3RyaW5nIH0gb2JqZWN0IGlzIHJlcXVpcmVkIVwiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMubmFtZSA9IG5hbWU7XG4gICAgICAgIHRoaXMubWVzc2FnZSA9IG1lc3NhZ2U7XG4gICAgfVxuXG4gICAgZm9ybWF0TWVzc2FnZSguLi52YWx1ZXMpIHtcbiAgICAgICAgY29uc3QgZmxhdHRlblZhbHVlcyA9IGZsYXR0ZW4odmFsdWVzKTtcblxuICAgICAgICBjb25zdCBmb3JtYXR0ZWRNZXNzYWdlID0gdGhpcy5tZXNzYWdlLnJlcGxhY2UoZm9ybWF0UmVnRXhwLCBmdW5jdGlvbihtYXRjaCwgaW5kZXgpIHtcbiAgICAgICAgICAgIHJldHVybiBmbGF0dGVuVmFsdWVzW3BhcnNlSW50KGluZGV4LCAxMCldO1xuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gYCR7dGhpcy5uYW1lfTogJHtmb3JtYXR0ZWRNZXNzYWdlfWA7XG4gICAgfVxuXG4gICAgZXJyb3IoLi4udmFsdWVzKSB7XG4gICAgICAgIHJldHVybiBuZXcgRXJyb3IodGhpcy5mb3JtYXRNZXNzYWdlKHZhbHVlcykpO1xuICAgIH1cbn1cblxuY29uc3QgZmxhdHRlbiA9IGZ1bmN0aW9uKGFycikge1xuICAgIHJldHVybiBhcnIucmVkdWNlKChhLCBiKSA9PiBhLmNvbmNhdChiKSwgW10pO1xufTtcblxuY29uc3QgdG9JbnRsRXJyb3JzID0gZnVuY3Rpb24oZXJyb3JzKSB7XG4gICAgY29uc3QgcHJlZGljYXRlID0gZnVuY3Rpb24ocHJldiwgbmFtZSkge1xuICAgICAgICBwcmV2W25hbWVdID0gbmV3IEludGxFcnJvcih7IG5hbWUsIG1lc3NhZ2U6IGVycm9yc1tuYW1lXSB9KTtcbiAgICAgICAgcmV0dXJuIHByZXY7XG4gICAgfTtcblxuICAgIHJldHVybiBPYmplY3Qua2V5cyhlcnJvcnMpLnJlZHVjZShwcmVkaWNhdGUsIHt9KTtcbn07XG5cbmNvbnN0IGVycm9ycyA9IHRvSW50bEVycm9ycyhlcnJvckRldGFpbHMpO1xuXG5leHBvcnQge1xuICAgIGVycm9ycyxcbiAgICBJbnRsRXJyb3IsXG4gICAgdG9JbnRsRXJyb3JzXG59O1xuIiwiaW1wb3J0IGRlZmF1bHREYXRhIGZyb20gJy4vZGVmYXVsdC1kYXRhJztcbmltcG9ydCBpc1N0cmluZyBmcm9tICcuLi9jb21tb24vaXMtc3RyaW5nJztcbmltcG9ydCB7IGVycm9ycyB9IGZyb20gJy4uL2Vycm9ycyc7XG5cbmZ1bmN0aW9uIGF2YWlsYWJsZUxvY2FsZUluZm8oZnVsbE5hbWUsIHN1ZmZpeGVzKSB7XG4gICAgY29uc3QgcGFydHMgPSBmdWxsTmFtZS5zcGxpdChcIi1cIik7XG4gICAgY29uc3QgbGFuZ3VhZ2UgPSBwYXJ0c1swXTtcbiAgICBjb25zdCBzY3JpcHQgPSBwYXJ0c1sxXTtcbiAgICBjb25zdCB0ZXJyaXRvcnkgPSBwYXJ0c1syXTtcblxuICAgIHJldHVybiBjbGRyW2Z1bGxOYW1lXSB8fCAoc3VmZml4ZXMuaW5kZXhPZih0ZXJyaXRvcnkpICE9PSAtMSAmJiBjbGRyW2xhbmd1YWdlICsgXCItXCIgKyB0ZXJyaXRvcnldKSB8fCAoc3VmZml4ZXMuaW5kZXhPZihzY3JpcHQpICE9PSAtMSAmJiBjbGRyW2xhbmd1YWdlICsgXCItXCIgKyBzY3JpcHRdKSB8fCBjbGRyW2xhbmd1YWdlXTtcbn1cblxuZnVuY3Rpb24gbG9jYWxlRnVsbE5hbWUobGFuZ3VhZ2UsIHN1ZmZpeGVzKSB7XG4gICAgY29uc3QgbGlrZWx5U3VidGFncyA9IGNsZHIuc3VwcGxlbWVudGFsLmxpa2VseVN1YnRhZ3M7XG5cbiAgICBmb3IgKGxldCBpZHggPSAwOyBpZHggPCBzdWZmaXhlcy5sZW5ndGg7IGlkeCsrKSB7XG4gICAgICAgIGxldCBuYW1lID0gbGlrZWx5U3VidGFnc1tsYW5ndWFnZSArIFwiLVwiICsgc3VmZml4ZXNbaWR4IF1dO1xuICAgICAgICBpZiAobmFtZSkge1xuICAgICAgICAgICAgcmV0dXJuIG5hbWU7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAobGlrZWx5U3VidGFnc1tsYW5ndWFnZV0pIHtcbiAgICAgICAgcmV0dXJuIGxpa2VseVN1YnRhZ3NbbGFuZ3VhZ2VdO1xuICAgIH1cbn1cblxuZXhwb3J0IGNvbnN0IGNsZHIgPSBkZWZhdWx0RGF0YTtcblxuZXhwb3J0IGZ1bmN0aW9uIGdldExvY2FsZUluZm8obG9jYWxlKSB7XG4gICAgbGV0IGluZm87XG4gICAgaWYgKGlzU3RyaW5nKGxvY2FsZSkpIHtcbiAgICAgICAgaW5mbyA9IGxvY2FsZUluZm8obG9jYWxlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBpbmZvID0gbG9jYWxlO1xuICAgIH1cbiAgICByZXR1cm4gaW5mbztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGxvY2FsZUluZm8obG9jYWxlKSB7XG4gICAgaWYgKGNsZHJbbG9jYWxlXSkge1xuICAgICAgICByZXR1cm4gY2xkcltsb2NhbGVdO1xuICAgIH1cblxuICAgIGNvbnN0IGxpa2VseVN1YnRhZ3MgPSBjbGRyLnN1cHBsZW1lbnRhbC5saWtlbHlTdWJ0YWdzO1xuICAgIGlmIChsaWtlbHlTdWJ0YWdzKSB7XG4gICAgICAgIGNvbnN0IHBhcnRzID0gbG9jYWxlLnNwbGl0KFwiLVwiKTtcbiAgICAgICAgY29uc3QgbGFuZ3VhZ2UgPSBwYXJ0c1swXTtcbiAgICAgICAgY29uc3Qgc3VmZml4ZXMgPSBwYXJ0cy5zbGljZSgxKTtcbiAgICAgICAgY29uc3QgZnVsbE5hbWUgPSBsb2NhbGVGdWxsTmFtZShsYW5ndWFnZSwgc3VmZml4ZXMpO1xuICAgICAgICBjb25zdCBpbmZvID0gZnVsbE5hbWUgPyBhdmFpbGFibGVMb2NhbGVJbmZvKGZ1bGxOYW1lLCBzdWZmaXhlcykgOiBudWxsO1xuICAgICAgICBpZiAoaW5mbykge1xuICAgICAgICAgICAgcmV0dXJuIGluZm87XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB0aHJvdyBlcnJvcnMuTm9Mb2NhbGUuZXJyb3IobG9jYWxlKTtcbn1cbiIsImV4cG9ydCBjb25zdCBERUNJTUFMID0gXCJkZWNpbWFsXCI7XG5leHBvcnQgY29uc3QgQ1VSUkVOQ1kgPSBcImN1cnJlbmN5XCI7XG5leHBvcnQgY29uc3QgQUNDT1VOVElORyA9IFwiYWNjb3VudGluZ1wiO1xuZXhwb3J0IGNvbnN0IFBFUkNFTlQgPSBcInBlcmNlbnRcIjtcbmV4cG9ydCBjb25zdCBTQ0lFTlRJRklDID0gXCJzY2llbnRpZmljXCI7XG5cbmV4cG9ydCBjb25zdCBDVVJSRU5DWV9QTEFDRUhPTERFUiA9IFwiJFwiO1xuZXhwb3J0IGNvbnN0IFBFUkNFTlRfUExBQ0VIT0xERVIgPSBcIiVcIjtcbmV4cG9ydCBjb25zdCBOVU1CRVJfUExBQ0VIT0xERVIgPSBcIm5cIjtcblxuZXhwb3J0IGNvbnN0IExJU1RfU0VQQVJBVE9SID0gXCI7XCI7XG5leHBvcnQgY29uc3QgR1JPVVBfU0VQQVJBVE9SID0gXCIsXCI7XG5cbmV4cG9ydCBjb25zdCBQT0lOVCA9IFwiLlwiO1xuZXhwb3J0IGNvbnN0IEVNUFRZID0gXCJcIjtcblxuZXhwb3J0IGNvbnN0IERFRkFVTFRfTE9DQUxFID0gXCJlblwiO1xuXG4iLCJpbXBvcnQgeyBjbGRyIH0gZnJvbSAnLi9pbmZvJztcbmltcG9ydCB7IENVUlJFTkNZLCBBQ0NPVU5USU5HLCBERUNJTUFMLCBDVVJSRU5DWV9QTEFDRUhPTERFUiwgTlVNQkVSX1BMQUNFSE9MREVSLCBMSVNUX1NFUEFSQVRPUiwgR1JPVVBfU0VQQVJBVE9SLCBQT0lOVCB9IGZyb20gJy4uL2NvbW1vbi9jb25zdGFudHMnO1xuXG5jb25zdCBMQVRJTl9OVU1CRVJfRk9STUFUUyA9IFwiRm9ybWF0cy1udW1iZXJTeXN0ZW0tbGF0blwiO1xuY29uc3QgTEFUSU5fTlVNQkVSX1NZTUJPTFMgPSBcInN5bWJvbHMtbnVtYmVyU3lzdGVtLWxhdG5cIjtcblxuY29uc3QgcGF0dGVyblJlZ0V4cCA9IC8oWyMsMC5dKykvZztcbmNvbnN0IGNsZHJDdXJyZW5jeVJlZ0V4cCA9IC/CpC9nO1xuXG5mdW5jdGlvbiBnZXRQYXR0ZXJucyhwYXR0ZXJuKSB7XG4gICAgcGF0dGVyblJlZ0V4cC5sYXN0SW5kZXggPSAwO1xuXG4gICAgcmV0dXJuIHBhdHRlcm4ucmVwbGFjZShjbGRyQ3VycmVuY3lSZWdFeHAsIENVUlJFTkNZX1BMQUNFSE9MREVSKS5yZXBsYWNlKHBhdHRlcm5SZWdFeHAsIE5VTUJFUl9QTEFDRUhPTERFUikuc3BsaXQoTElTVF9TRVBBUkFUT1IpO1xufVxuXG5mdW5jdGlvbiBnZXRHcm91cFNpemUocGF0dGVybikge1xuICAgIHBhdHRlcm5SZWdFeHAubGFzdEluZGV4ID0gMDtcblxuICAgIGNvbnN0IG51bWJlclBhdHRlcm5zID0gcGF0dGVyblJlZ0V4cC5leGVjKHBhdHRlcm4uc3BsaXQoTElTVF9TRVBBUkFUT1IpWzBdKVswXS5zcGxpdChQT0lOVCk7XG4gICAgY29uc3QgaW50ZWdlciA9IG51bWJlclBhdHRlcm5zWzBdO1xuXG4gICAgY29uc3QgZ3JvdXBTaXplID0gaW50ZWdlci5zcGxpdChHUk9VUF9TRVBBUkFUT1IpLnNsaWNlKDEpLm1hcChmdW5jdGlvbihncm91cCkge1xuICAgICAgICByZXR1cm4gZ3JvdXAubGVuZ3RoO1xuICAgIH0pLnJldmVyc2UoKTtcblxuICAgIHJldHVybiBncm91cFNpemU7XG59XG5cbmZ1bmN0aW9uIGxvYWRDdXJyZW5jeVVuaXRQYXR0ZXJucyhjdXJyZW5jeUluZm8sIGN1cnJlbmN5Rm9ybWF0cykge1xuICAgIGZvciAobGV0IGZpZWxkIGluIGN1cnJlbmN5Rm9ybWF0cykge1xuICAgICAgICBpZiAoZmllbGQuc3RhcnRzV2l0aChcInVuaXRQYXR0ZXJuXCIpKSB7XG4gICAgICAgICAgICBjdXJyZW5jeUluZm9bZmllbGRdID0gY3VycmVuY3lGb3JtYXRzW2ZpZWxkXS5yZXBsYWNlKFwiezB9XCIsIE5VTUJFUl9QTEFDRUhPTERFUikucmVwbGFjZShcInsxfVwiLCBDVVJSRU5DWV9QTEFDRUhPTERFUik7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGxvYWROdW1iZXJzSW5mbyhsb2NhbGUsIGluZm8pIHtcbiAgICBjb25zdCBsb2NhbGVJbmZvID0gY2xkcltsb2NhbGVdO1xuICAgIGNvbnN0IG51bWJlcnMgPSBsb2NhbGVJbmZvLm51bWJlcnMgPSBsb2NhbGVJbmZvLm51bWJlcnMgfHwge307XG4gICAgbnVtYmVycy5zeW1ib2xzID0gbnVtYmVycy5zeW1ib2xzIHx8IHt9O1xuICAgIGZvciAobGV0IGZpZWxkIGluIGluZm8pIHtcbiAgICAgICAgaWYgKGZpZWxkID09PSBMQVRJTl9OVU1CRVJfU1lNQk9MUykge1xuICAgICAgICAgICAgT2JqZWN0LmFzc2lnbihudW1iZXJzLnN5bWJvbHMsIGluZm9bZmllbGRdKTtcbiAgICAgICAgfSBlbHNlIGlmIChmaWVsZC5pbmNsdWRlcyhMQVRJTl9OVU1CRVJfRk9STUFUUykpIHtcbiAgICAgICAgICAgIGNvbnN0IHN0eWxlID0gZmllbGQuc3Vic3RyaW5nKDAsIGZpZWxkLmluZGV4T2YoTEFUSU5fTlVNQkVSX0ZPUk1BVFMpKTtcbiAgICAgICAgICAgIGNvbnN0IHBhdHRlcm4gPSBpbmZvW2ZpZWxkXS5zdGFuZGFyZDtcbiAgICAgICAgICAgIGlmIChwYXR0ZXJuKSB7XG4gICAgICAgICAgICAgICAgbnVtYmVyc1tzdHlsZV0gPSB7XG4gICAgICAgICAgICAgICAgICAgIHBhdHRlcm5zOiBnZXRQYXR0ZXJucyhwYXR0ZXJuKVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChzdHlsZSA9PT0gQ1VSUkVOQ1kpIHtcbiAgICAgICAgICAgICAgICBudW1iZXJzW3N0eWxlXSA9IG51bWJlcnNbc3R5bGVdIHx8IHt9O1xuICAgICAgICAgICAgICAgIG51bWJlcnNbc3R5bGVdLmdyb3VwU2l6ZSA9IGdldEdyb3VwU2l6ZSgoaW5mb1tERUNJTUFMICsgTEFUSU5fTlVNQkVSX0ZPUk1BVFNdIHx8IGluZm9bZmllbGRdKS5zdGFuZGFyZCk7XG4gICAgICAgICAgICAgICAgbG9hZEN1cnJlbmN5VW5pdFBhdHRlcm5zKG51bWJlcnNbc3R5bGVdLCBpbmZvW2ZpZWxkXSk7XG4gICAgICAgICAgICAgICAgbnVtYmVyc1tBQ0NPVU5USU5HXSA9IHtcbiAgICAgICAgICAgICAgICAgICAgcGF0dGVybnM6IGdldFBhdHRlcm5zKGluZm9bZmllbGRdW0FDQ09VTlRJTkddKSxcbiAgICAgICAgICAgICAgICAgICAgZ3JvdXBTaXplOiBudW1iZXJzW3N0eWxlXS5ncm91cFNpemVcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfSBlbHNlIGlmIChwYXR0ZXJuKSB7XG4gICAgICAgICAgICAgICAgbnVtYmVyc1tzdHlsZV0uZ3JvdXBTaXplID0gZ2V0R3JvdXBTaXplKHBhdHRlcm4pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKGZpZWxkID09PSBcImN1cnJlbmNpZXNcIikge1xuICAgICAgICAgICAgbnVtYmVycy5jdXJyZW5jaWVzID0gaW5mb1tmaWVsZF07XG4gICAgICAgIH1cbiAgICB9XG59IiwiaW1wb3J0IHsgY2xkciB9IGZyb20gJy4vaW5mbyc7XG5cbmNvbnN0IHByZWRlZmluZWREYXRlUGF0dGVybnMgPSB7XG4gICAgczogXCJ5eXl5Jy0nTU0nLSdkZCdUJ0hIJzonbW0nOidzc1wiLFxuICAgIHU6IFwieXl5eSctJ01NJy0nZGQgSEgnOidtbSc6J3NzJ1onXCJcbn07XG5cbmNvbnN0IFlFQVJfUkVHRVggPSAveSsvZztcbmNvbnN0IFNIT1JUX0RBVEUgPSBbIFsgXCJkYXRlRm9ybWF0c1wiLCBcInNob3J0XCIgXSBdO1xuY29uc3QgQUxUX0FTQ0lJX1JFR0VYID0gLy1hbHQtYXNjaWkkLztcblxuY29uc3QgZGF0ZVBhdHRlcm5zID0ge1xuICAgIEQ6IFsgWyBcImRhdGVGb3JtYXRzXCIsIFwiZnVsbFwiIF0gXSxcbiAgICBtOiBbIFsgXCJkYXRlVGltZUZvcm1hdHNcIiwgXCJhdmFpbGFibGVGb3JtYXRzXCIsIFwiTU1NZFwiIF0gXSxcbiAgICBNOiBbIFsgXCJkYXRlVGltZUZvcm1hdHNcIiwgXCJhdmFpbGFibGVGb3JtYXRzXCIsIFwiTU1NTWRcIiBdIF0sXG4gICAgeTogWyBbIFwiZGF0ZVRpbWVGb3JtYXRzXCIsIFwiYXZhaWxhYmxlRm9ybWF0c1wiLCBcInlNTU1cIiBdIF0sXG4gICAgWTogWyBbIFwiZGF0ZVRpbWVGb3JtYXRzXCIsIFwiYXZhaWxhYmxlRm9ybWF0c1wiLCBcInlNTU1NXCIgXSBdLFxuICAgIEY6IFsgWyBcImRhdGVGb3JtYXRzXCIsIFwiZnVsbFwiIF0sIFsgXCJ0aW1lRm9ybWF0c1wiLCBcIm1lZGl1bVwiIF0gXSxcbiAgICBnOiBbIFsgXCJkYXRlVGltZUZvcm1hdHNcIiwgXCJhdmFpbGFibGVGb3JtYXRzXCIsIFwieU1kXCIgXSwgWyBcInRpbWVGb3JtYXRzXCIsIFwic2hvcnRcIiBdIF0sXG4gICAgRzogWyBbIFwiZGF0ZVRpbWVGb3JtYXRzXCIsIFwiYXZhaWxhYmxlRm9ybWF0c1wiLCBcInlNZFwiIF0sIFsgXCJ0aW1lRm9ybWF0c1wiLCBcIm1lZGl1bVwiIF0gXSxcbiAgICB0OiBbIFsgXCJ0aW1lRm9ybWF0c1wiLCBcInNob3J0XCIgXSBdLFxuICAgIFQ6IFsgWyBcInRpbWVGb3JtYXRzXCIsIFwibWVkaXVtXCIgXSBdXG59O1xuXG5mdW5jdGlvbiB0b0FycmF5KG9iaikge1xuICAgIGxldCByZXN1bHQgPSBbXTtcbiAgICBsZXQgbmFtZXMgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyhvYmopO1xuICAgIGZvciAobGV0IGlkeCA9IDA7IGlkeCA8IG5hbWVzLmxlbmd0aDsgaWR4KyspIHtcbiAgICAgICAgbGV0IHZhbHVlID0gb2JqW25hbWVzW2lkeF1dO1xuICAgICAgICByZXN1bHQucHVzaCh2YWx1ZSk7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG59XG5cbmZ1bmN0aW9uIGdldENhbGVuZGFyTmFtZXMoaW5mbywgaXNPYmopIHtcbiAgICBjb25zdCByZXN1bHQgPSB7fTtcbiAgICBmb3IgKGxldCBmb3JtYXRUeXBlIGluIGluZm8pIHtcbiAgICAgICAgbGV0IG5hbWVzID0gcmVzdWx0W2Zvcm1hdFR5cGVdID0ge307XG4gICAgICAgIGZvciAobGV0IGZvcm1hdCBpbiBpbmZvW2Zvcm1hdFR5cGVdKSB7XG4gICAgICAgICAgICBsZXQgZm9ybWF0cyA9IGluZm9bZm9ybWF0VHlwZV1bZm9ybWF0XTtcbiAgICAgICAgICAgIG5hbWVzW2Zvcm1hdF0gPSBpc09iaiA/IGZvcm1hdHMgOiB0b0FycmF5KGZvcm1hdHMpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG59XG5cbmZ1bmN0aW9uIGdldEVyYU5hbWVzKGVyYXMpIHtcbiAgICBjb25zdCByZXN1bHQgPSB7fTtcbiAgICBjb25zdCBmb3JtYXQgPSByZXN1bHQuZm9ybWF0ID0ge307XG4gICAgY29uc3QgZXJhTmFtZU1hcCA9IHtcbiAgICAgICAgZXJhQWJicjogXCJhYmJyZXZpYXRlZFwiLFxuICAgICAgICBlcmFOYW1lczogXCJ3aWRlXCIsXG4gICAgICAgIGVyYU5hcnJvdzogXCJuYXJyb3dcIlxuICAgIH07XG5cbiAgICBmb3IgKGxldCBlcmFGb3JtYXROYW1lIGluIGVyYXMpIHtcbiAgICAgICAgbGV0IGZvcm1hdE5hbWUgPSBlcmFOYW1lTWFwW2VyYUZvcm1hdE5hbWVdO1xuICAgICAgICBmb3JtYXRbZm9ybWF0TmFtZV0gPSBlcmFzW2VyYUZvcm1hdE5hbWVdO1xuICAgIH1cblxuICAgIHJldHVybiByZXN1bHQ7XG59XG5cbmZ1bmN0aW9uIGxvYWRDYWxlbmRhck5hbWVzKGxvY2FsZSwgY2FsZW5kYXIpIHtcbiAgICBjb25zdCBsb2NhbGVDYWxlbmRhciA9IGNsZHJbbG9jYWxlXS5jYWxlbmRhcjtcbiAgICBsb2NhbGVDYWxlbmRhci5kYXlzID0gZ2V0Q2FsZW5kYXJOYW1lcyhjYWxlbmRhci5kYXlzKTtcbiAgICBsb2NhbGVDYWxlbmRhci5tb250aHMgPSBnZXRDYWxlbmRhck5hbWVzKGNhbGVuZGFyLm1vbnRocyk7XG4gICAgbG9jYWxlQ2FsZW5kYXIucXVhcnRlcnMgPSBnZXRDYWxlbmRhck5hbWVzKGNhbGVuZGFyLnF1YXJ0ZXJzKTtcbiAgICBsb2NhbGVDYWxlbmRhci5kYXlQZXJpb2RzID0gZ2V0Q2FsZW5kYXJOYW1lcyhjYWxlbmRhci5kYXlQZXJpb2RzLCB0cnVlKTtcblxuICAgIGxvY2FsZUNhbGVuZGFyLmVyYXMgPSBnZXRFcmFOYW1lcyhjYWxlbmRhci5lcmFzKTtcbn1cblxuZnVuY3Rpb24gbG9hZENhbGVuZGFyRGF0ZUZpZWxkcyhsb2NhbGUsIGZpZWxkcykge1xuICAgIGNvbnN0IGxvY2FsZUNhbGVuZGFyID0gY2xkcltsb2NhbGVdLmNhbGVuZGFyO1xuICAgIGNvbnN0IGRhdGVGaWVsZHMgPSB7fTtcblxuICAgIGZvciAobGV0IGZpZWxkIGluIGZpZWxkcykge1xuICAgICAgICBjb25zdCBbIGZpZWxkTmFtZSwgZm9ybWF0VHlwZSA9ICd3aWRlJyBdID0gZmllbGQuc3BsaXQoJy0nKTtcbiAgICAgICAgY29uc3QgZmllbGRJbmZvID0gZGF0ZUZpZWxkc1tmaWVsZE5hbWVdIHx8IHt9O1xuICAgICAgICBjb25zdCBkaXNwbGF5TmFtZSA9IGZpZWxkc1tmaWVsZF0uZGlzcGxheU5hbWU7XG5cbiAgICAgICAgaWYgKCFkaXNwbGF5TmFtZSkgeyBjb250aW51ZTsgfVxuXG4gICAgICAgIGZpZWxkSW5mb1tmb3JtYXRUeXBlXSA9IGRpc3BsYXlOYW1lO1xuICAgICAgICBkYXRlRmllbGRzW2ZpZWxkTmFtZV0gPSBmaWVsZEluZm87XG4gICAgfVxuXG4gICAgbG9jYWxlQ2FsZW5kYXIuZGF0ZUZpZWxkcyA9IGRhdGVGaWVsZHM7XG59XG5cbmZ1bmN0aW9uIGdldFByZWRlZmluZWRGb3JtYXQocGF0aHMsIGNhbGVuZGFyKSB7XG4gICAgY29uc3QgcmVzdWx0ID0gW107XG5cbiAgICBmb3IgKGxldCBwYXRoSWR4ID0gMDsgcGF0aElkeCA8IHBhdGhzLmxlbmd0aDsgcGF0aElkeCsrKSB7XG4gICAgICAgIGxldCBmaWVsZHMgPSBwYXRoc1sgcGF0aElkeCBdO1xuICAgICAgICBsZXQgcGF0dGVybiA9IGNhbGVuZGFyO1xuICAgICAgICBmb3IgKGxldCBpZHggPSAwOyBpZHggPCBmaWVsZHMubGVuZ3RoOyBpZHgrKykge1xuICAgICAgICAgICAgcGF0dGVybiA9IHBhdHRlcm5bZmllbGRzW2lkeF1dO1xuICAgICAgICB9XG4gICAgICAgIHJlc3VsdC5wdXNoKHBhdHRlcm4pO1xuICAgIH1cblxuICAgIHJldHVybiByZXN1bHQuam9pbihcIiBcIik7XG59XG5cbmZ1bmN0aW9uIGZpbHRlckZvcm1hdHMoZm9ybWF0cykge1xuICAgIGNvbnN0IHJlc3VsdCA9IHt9O1xuICAgIGZvciAobGV0IGZvcm1hdCBpbiBmb3JtYXRzKSB7XG4gICAgICAgIC8vIFJlbW92ZXMgLWFsdC1hc2NpaSBmb3JtYXRzIGluIGZhdm9yIG9mIHRoZSByZWd1bGFyLCBVbmljb2RlIGZvcm1hdHNcbiAgICAgICAgaWYgKCFBTFRfQVNDSUlfUkVHRVgudGVzdChmb3JtYXQpKSB7XG4gICAgICAgICAgICByZXN1bHRbZm9ybWF0XSA9IGZvcm1hdHNbZm9ybWF0XTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiByZXN1bHQ7XG59XG5cblxuZnVuY3Rpb24gbG9hZENhbGVuZGFyUGF0dGVybnMobG9jYWxlLCBjYWxlbmRhcikge1xuICAgIGNvbnN0IGNsZHJDYWxlbmRhciA9IGNsZHJbbG9jYWxlXS5jYWxlbmRhcjtcbiAgICBjb25zdCBwYXR0ZXJucyA9IGNsZHJDYWxlbmRhci5wYXR0ZXJucyA9IHt9O1xuXG4gICAgcGF0dGVybnMuZCA9IGdldFByZWRlZmluZWRGb3JtYXQoU0hPUlRfREFURSwgY2FsZW5kYXIpLnJlcGxhY2UoWUVBUl9SRUdFWCwgJ3knKTtcblxuICAgIGZvciAobGV0IHBhdHRlcm4gaW4gZGF0ZVBhdHRlcm5zKSB7XG4gICAgICAgIHBhdHRlcm5zW3BhdHRlcm5dID0gZ2V0UHJlZGVmaW5lZEZvcm1hdChkYXRlUGF0dGVybnNbcGF0dGVybl0sIGNhbGVuZGFyKTtcbiAgICB9XG5cbiAgICBmb3IgKGxldCBwYXR0ZXJuIGluIHByZWRlZmluZWREYXRlUGF0dGVybnMpIHtcbiAgICAgICAgcGF0dGVybnNbcGF0dGVybl0gPSBwcmVkZWZpbmVkRGF0ZVBhdHRlcm5zW3BhdHRlcm5dO1xuICAgIH1cblxuICAgIGNvbnN0IGRhdGVUaW1lRm9ybWF0cyA9IGNhbGVuZGFyLmRhdGVUaW1lRm9ybWF0cztcbiAgICBjbGRyQ2FsZW5kYXIuZGF0ZVRpbWVGb3JtYXRzID0ge1xuICAgICAgICBmdWxsOiBkYXRlVGltZUZvcm1hdHMuZnVsbCxcbiAgICAgICAgbG9uZzogZGF0ZVRpbWVGb3JtYXRzLmxvbmcsXG4gICAgICAgIG1lZGl1bTogZGF0ZVRpbWVGb3JtYXRzLm1lZGl1bSxcbiAgICAgICAgc2hvcnQ6IGRhdGVUaW1lRm9ybWF0cy5zaG9ydCxcbiAgICAgICAgYXZhaWxhYmxlRm9ybWF0czogZmlsdGVyRm9ybWF0cyhkYXRlVGltZUZvcm1hdHMuYXZhaWxhYmxlRm9ybWF0cylcbiAgICB9O1xuICAgIGNsZHJDYWxlbmRhci50aW1lRm9ybWF0cyA9IGZpbHRlckZvcm1hdHMoY2FsZW5kYXIudGltZUZvcm1hdHMpO1xuICAgIGNsZHJDYWxlbmRhci5kYXRlRm9ybWF0cyA9IGZpbHRlckZvcm1hdHMoY2FsZW5kYXIuZGF0ZUZvcm1hdHMpO1xufVxuXG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGxvYWRDYWxlbmRhckluZm8obG9jYWxlLCBpbmZvKSB7XG4gICAgY29uc3QgY2FsZW5kYXIgPSBjbGRyW2xvY2FsZV0uY2FsZW5kYXIgPSBjbGRyW2xvY2FsZV0uY2FsZW5kYXIgfHwge307XG4gICAgZm9yIChsZXQgZmllbGQgaW4gaW5mbykge1xuICAgICAgICBpZiAoZmllbGQgPT09IFwidGltZVpvbmVOYW1lc1wiKSB7XG4gICAgICAgICAgICBjYWxlbmRhci5nbXRGb3JtYXQgPSBpbmZvW2ZpZWxkXS5nbXRGb3JtYXQ7XG4gICAgICAgICAgICBjYWxlbmRhci5nbXRaZXJvRm9ybWF0ID0gaW5mb1tmaWVsZF0uZ210WmVyb0Zvcm1hdDtcbiAgICAgICAgfSBlbHNlIGlmIChmaWVsZCA9PT0gXCJjYWxlbmRhcnNcIiAmJiBpbmZvW2ZpZWxkXS5ncmVnb3JpYW4pIHtcbiAgICAgICAgICAgIGxvYWRDYWxlbmRhclBhdHRlcm5zKGxvY2FsZSwgaW5mb1tmaWVsZF0uZ3JlZ29yaWFuKTtcbiAgICAgICAgICAgIGxvYWRDYWxlbmRhck5hbWVzKGxvY2FsZSwgaW5mb1tmaWVsZF0uZ3JlZ29yaWFuKTtcbiAgICAgICAgfSBlbHNlIGlmIChmaWVsZCA9PT0gXCJmaWVsZHNcIikge1xuICAgICAgICAgICAgbG9hZENhbGVuZGFyRGF0ZUZpZWxkcyhsb2NhbGUsIGluZm8uZmllbGRzKTtcbiAgICAgICAgfVxuICAgIH1cbn1cbiIsImltcG9ydCB7IGNsZHIgfSBmcm9tICcuL2luZm8nO1xuXG5mdW5jdGlvbiB0ZXJyaXRvcnlGcm9tTmFtZShuYW1lLCBpZGVudGl0eSkge1xuICAgIGNvbnN0IGxpa2VseVN1YnRhZ3MgPSBjbGRyLnN1cHBsZW1lbnRhbC5saWtlbHlTdWJ0YWdzO1xuICAgIGxldCBwYXJ0cyA9IG5hbWUuc3BsaXQoXCItXCIpO1xuICAgIGlmIChsaWtlbHlTdWJ0YWdzKSB7XG4gICAgICAgIGNvbnN0IGxpa2VseU5hbWUgPSBsaWtlbHlTdWJ0YWdzW25hbWVdIHx8IGxpa2VseVN1YnRhZ3NbcGFydHNbMF1dO1xuICAgICAgICBpZiAobGlrZWx5TmFtZSkge1xuICAgICAgICAgICAgcGFydHMgPSBsaWtlbHlOYW1lLnNwbGl0KFwiLVwiKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGlmIChpZGVudGl0eSkge1xuICAgICAgICBmb3IgKGxldCBpZHggPSBwYXJ0cy5sZW5ndGggLSAxOyBpZHggPj0gMTsgaWR4LS0pIHtcbiAgICAgICAgICAgIGNvbnN0IHBhcnQgPSBwYXJ0c1tpZHhdO1xuICAgICAgICAgICAgaWYgKHBhcnQgPT09IGlkZW50aXR5LnZhcmlhbnQgfHwgcGFydCA9PT0gaWRlbnRpdHkuc2NyaXB0KSB7XG4gICAgICAgICAgICAgICAgcGFydHMuc3BsaWNlKGlkeCwgMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdCBsZW5ndGggPSBwYXJ0cy5sZW5ndGg7XG5cbiAgICBpZiAobGVuZ3RoID4gMSkge1xuICAgICAgICBjb25zdCB0ZXJyaXRvcnkgPSBwYXJ0c1tsZW5ndGggLSAxXTtcbiAgICAgICAgcmV0dXJuIHRlcnJpdG9yeS50b1VwcGVyQ2FzZSgpO1xuICAgIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gbG9jYWxlVGVycml0b3J5KGluZm8pIHtcbiAgICBpZiAoaW5mby50ZXJyaXRvcnkpIHtcbiAgICAgICAgcmV0dXJuIGluZm8udGVycml0b3J5O1xuICAgIH1cblxuICAgIGNvbnN0IG5hbWUgPSBpbmZvLm5hbWU7XG4gICAgY29uc3QgaWRlbnRpdHkgPSBpbmZvLmlkZW50aXR5O1xuICAgIGxldCB0ZXJyaXRvcnk7XG5cbiAgICBpZiAoaWRlbnRpdHkgJiYgaWRlbnRpdHkudGVycml0b3J5KSB7XG4gICAgICAgIHRlcnJpdG9yeSA9IGlkZW50aXR5LnRlcnJpdG9yeTtcbiAgICB9IGVsc2Uge1xuICAgICAgICB0ZXJyaXRvcnkgPSB0ZXJyaXRvcnlGcm9tTmFtZShuYW1lLCBpZGVudGl0eSk7XG4gICAgfVxuXG4gICAgaW5mby50ZXJyaXRvcnkgPSB0ZXJyaXRvcnk7XG5cbiAgICByZXR1cm4gdGVycml0b3J5O1xufVxuIiwiY29uc3QgTUlMTElTRUNPTkQgPSAnZHVyYXRpb24tbWlsbGlzZWNvbmQnO1xuY29uc3QgVU5JVF9QQVRURVJOX09ORSA9ICd1bml0UGF0dGVybi1jb3VudC1vbmUnO1xuY29uc3QgVU5JVF9QQVRURVJOX09USEVSID0gJ3VuaXRQYXR0ZXJuLWNvdW50LW90aGVyJztcbmNvbnN0IHBsYWNlaG9sZGVyUGF0dGVybiA9IC9cXHswXFx9XFxzPy87XG5cbmZ1bmN0aW9uIGV4dHJhY3RVbml0KHVuaXQpIHtcbiAgICBjb25zdCB2YWx1ZSA9IHVuaXRbVU5JVF9QQVRURVJOX09ORV0gfHwgdW5pdFtVTklUX1BBVFRFUk5fT1RIRVJdO1xuICAgIHJldHVybiB2YWx1ZS5yZXBsYWNlKHBsYWNlaG9sZGVyUGF0dGVybiwgJycpO1xufVxuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBsb2FkVW5pdHMobG9jYWxlSW5mbywgdW5pdHMpIHtcbiAgICBsb2NhbGVJbmZvLmNhbGVuZGFyLmRhdGVGaWVsZHMubWlsbGlzZWNvbmQgPSB7XG4gICAgICAgIG5hcnJvdzogZXh0cmFjdFVuaXQodW5pdHMubmFycm93W01JTExJU0VDT05EXSksXG4gICAgICAgIHNob3J0OiBleHRyYWN0VW5pdCh1bml0cy5zaG9ydFtNSUxMSVNFQ09ORF0pLFxuICAgICAgICB3aWRlOiBleHRyYWN0VW5pdCh1bml0cy5sb25nW01JTExJU0VDT05EXSlcbiAgICB9O1xufVxuIiwiaW1wb3J0IHsgY2xkciB9IGZyb20gJy4vaW5mbyc7XG5pbXBvcnQgbG9hZE51bWJlcnNJbmZvIGZyb20gJy4vbG9hZC1udW1iZXJzJztcbmltcG9ydCBsb2FkQ2FsZW5kYXJJbmZvIGZyb20gJy4vbG9hZC1kYXRlcyc7XG5pbXBvcnQgbG9jYWxlVGVycml0b3J5IGZyb20gJy4vdGVycml0b3J5JztcbmltcG9ydCBsb2FkVW5pdHMgZnJvbSAnLi9sb2FkLXVuaXRzJztcblxuZnVuY3Rpb24gbG9hZExvY2FsZShsb2NhbGUsIGluZm8pIHtcbiAgICBmb3IgKGxldCBmaWVsZCBpbiBpbmZvKSB7XG4gICAgICAgIGlmIChmaWVsZCA9PT0gXCJudW1iZXJzXCIpIHtcbiAgICAgICAgICAgIGxvYWROdW1iZXJzSW5mbyhsb2NhbGUsIGluZm9bZmllbGRdKTtcbiAgICAgICAgfSBlbHNlIGlmIChmaWVsZCA9PT0gXCJkYXRlc1wiKSB7XG4gICAgICAgICAgICBsb2FkQ2FsZW5kYXJJbmZvKGxvY2FsZSwgaW5mb1tmaWVsZF0pO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBsb2FkKCkge1xuICAgIGNvbnN0IGxlbmd0aCA9IGFyZ3VtZW50cy5sZW5ndGg7XG4gICAgZm9yIChsZXQgaWR4ID0gMDsgaWR4IDwgbGVuZ3RoOyBpZHgrKykge1xuICAgICAgICBsZXQgZW50cnkgPSBhcmd1bWVudHNbaWR4XTtcbiAgICAgICAgaWYgKGVudHJ5Lm1haW4pIHtcbiAgICAgICAgICAgIGxldCBsb2NhbGUgPSBPYmplY3Qua2V5cyhlbnRyeS5tYWluKVswXTtcbiAgICAgICAgICAgIGxldCBpbmZvID0gZW50cnkubWFpbltsb2NhbGVdO1xuICAgICAgICAgICAgbGV0IGxvY2FsZUluZm8gPSBjbGRyW2xvY2FsZV0gPSBjbGRyW2xvY2FsZV0gfHwge307XG5cbiAgICAgICAgICAgIGlmIChpbmZvLnVuaXRzKSB7XG4gICAgICAgICAgICAgICAgbG9hZFVuaXRzKGxvY2FsZUluZm8sIGluZm8udW5pdHMpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBsb2NhbGVJbmZvLm5hbWUgPSBsb2NhbGVJbmZvLm5hbWUgfHwgbG9jYWxlO1xuICAgICAgICAgICAgICAgIGxvY2FsZUluZm8uaWRlbnRpdHkgPSBsb2NhbGVJbmZvLmlkZW50aXR5IHx8IGluZm8uaWRlbnRpdHk7XG5cbiAgICAgICAgICAgICAgICBsb2NhbGVUZXJyaXRvcnkobG9jYWxlSW5mbyk7XG4gICAgICAgICAgICAgICAgbG9hZExvY2FsZShsb2NhbGUsIGluZm8pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKGVudHJ5LnN1cHBsZW1lbnRhbCkge1xuICAgICAgICAgICAgaWYgKGVudHJ5LnN1cHBsZW1lbnRhbC53ZWVrRGF0YSkge1xuICAgICAgICAgICAgICAgIGNsZHIuc3VwcGxlbWVudGFsLndlZWtEYXRhID0ge1xuICAgICAgICAgICAgICAgICAgICBmaXJzdERheTogZW50cnkuc3VwcGxlbWVudGFsLndlZWtEYXRhLmZpcnN0RGF5LFxuICAgICAgICAgICAgICAgICAgICB3ZWVrZW5kU3RhcnQ6IGVudHJ5LnN1cHBsZW1lbnRhbC53ZWVrRGF0YS53ZWVrZW5kU3RhcnQsXG4gICAgICAgICAgICAgICAgICAgIHdlZWtlbmRFbmQ6IGVudHJ5LnN1cHBsZW1lbnRhbC53ZWVrRGF0YS53ZWVrZW5kRW5kXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZW50cnkuc3VwcGxlbWVudGFsLmxpa2VseVN1YnRhZ3MpIHtcbiAgICAgICAgICAgICAgICBjbGRyLnN1cHBsZW1lbnRhbC5saWtlbHlTdWJ0YWdzID0gT2JqZWN0LmFzc2lnbihjbGRyLnN1cHBsZW1lbnRhbC5saWtlbHlTdWJ0YWdzLCBlbnRyeS5zdXBwbGVtZW50YWwubGlrZWx5U3VidGFncyk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGVudHJ5LnN1cHBsZW1lbnRhbC5jdXJyZW5jeURhdGEpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBjdXJyZW5jeURhdGEgPSBjbGRyLnN1cHBsZW1lbnRhbC5jdXJyZW5jeURhdGE7XG4gICAgICAgICAgICAgICAgY3VycmVuY3lEYXRhLnJlZ2lvbiA9IE9iamVjdC5hc3NpZ24oY3VycmVuY3lEYXRhLnJlZ2lvbiB8fCB7fSwgZW50cnkuc3VwcGxlbWVudGFsLmN1cnJlbmN5RGF0YS5yZWdpb24pO1xuICAgICAgICAgICAgICAgIGN1cnJlbmN5RGF0YS5mcmFjdGlvbnMgPSBPYmplY3QuYXNzaWduKGN1cnJlbmN5RGF0YS5mcmFjdGlvbnMgfHwge30sIGVudHJ5LnN1cHBsZW1lbnRhbC5jdXJyZW5jeURhdGEuZnJhY3Rpb25zKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn1cbiIsImltcG9ydCB7IGNsZHIgfSBmcm9tICcuL2luZm8nO1xuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBzZXREYXRhKGRhdGEpIHtcbiAgICBjb25zdCBsb2NhbGUgPSBkYXRhLm5hbWU7XG4gICAgY29uc3QgaW5mbyA9IGNsZHJbbG9jYWxlXSA9IGNsZHJbbG9jYWxlXSB8fCB7fTtcbiAgICBjb25zdCBzdXBwbGVtZW50YWwgPSBjbGRyLnN1cHBsZW1lbnRhbCA9IGNsZHIuc3VwcGxlbWVudGFsIHx8IHt9O1xuXG4gICAgaWYgKGRhdGEubGlrZWx5U3VidGFncykge1xuICAgICAgICBzdXBwbGVtZW50YWwubGlrZWx5U3VidGFncyA9IE9iamVjdC5hc3NpZ24oc3VwcGxlbWVudGFsLmxpa2VseVN1YnRhZ3MgfHwge30sIGRhdGEubGlrZWx5U3VidGFncyk7XG4gICAgfVxuXG4gICAgaWYgKGRhdGEuY3VycmVuY3lEYXRhKSB7XG4gICAgICAgIHN1cHBsZW1lbnRhbC5jdXJyZW5jeURhdGEgPSBzdXBwbGVtZW50YWwuY3VycmVuY3lEYXRhIHx8IHt9O1xuICAgICAgICBzdXBwbGVtZW50YWwuY3VycmVuY3lEYXRhLmZyYWN0aW9ucyA9IE9iamVjdC5hc3NpZ24oc3VwcGxlbWVudGFsLmN1cnJlbmN5RGF0YS5mcmFjdGlvbnMgfHwge30sIGRhdGEuY3VycmVuY3lEYXRhKTtcbiAgICB9XG5cbiAgICBjb25zdCBudW1iZXJzID0gaW5mby5udW1iZXJzO1xuXG4gICAgT2JqZWN0LmFzc2lnbihpbmZvLCBkYXRhKTtcblxuICAgIGlmIChudW1iZXJzICYmIGRhdGEubnVtYmVycykge1xuICAgICAgICBpbmZvLm51bWJlcnMgPSBPYmplY3QuYXNzaWduKHt9LCBudW1iZXJzLCBkYXRhLm51bWJlcnMpO1xuICAgIH1cbn0iLCJpbXBvcnQgeyBsb2NhbGVJbmZvIH0gZnJvbSAnLi9pbmZvJztcbmltcG9ydCB7IGVycm9ycyB9IGZyb20gJy4uL2Vycm9ycyc7XG5pbXBvcnQgeyBERUZBVUxUX0xPQ0FMRSB9IGZyb20gJy4uL2NvbW1vbi9jb25zdGFudHMnO1xuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBkYXRlRmllbGROYW1lKG9wdGlvbnMsIGxvY2FsZSA9IERFRkFVTFRfTE9DQUxFKSB7XG4gICAgY29uc3QgaW5mbyA9IGxvY2FsZUluZm8obG9jYWxlKTtcbiAgICBjb25zdCBkYXRlRmllbGRzID0gaW5mby5jYWxlbmRhci5kYXRlRmllbGRzO1xuICAgIGlmICghZGF0ZUZpZWxkcykge1xuICAgICAgICB0aHJvdyBlcnJvcnMuTm9EYXRlRmllbGROYW1lcy5lcnJvcigpO1xuICAgIH1cblxuICAgIGNvbnN0IGZpZWxkTmFtZUluZm8gPSBkYXRlRmllbGRzW29wdGlvbnMudHlwZV0gfHwge307XG5cbiAgICByZXR1cm4gZmllbGROYW1lSW5mb1tvcHRpb25zLm5hbWVUeXBlXSB8fCBmaWVsZE5hbWVJbmZvWyd3aWRlJ107XG59XG4iLCJpbXBvcnQgeyBnZXRMb2NhbGVJbmZvIH0gZnJvbSAnLi9pbmZvJztcbmltcG9ydCB7IEVNUFRZIH0gZnJvbSAnLi4vY29tbW9uL2NvbnN0YW50cyc7XG5cbmZ1bmN0aW9uIGxvd2VyQXJyYXkoYXJyKSB7XG4gICAgY29uc3QgcmVzdWx0ID0gW107XG4gICAgZm9yIChsZXQgaWR4ID0gMDsgaWR4IDwgYXJyLmxlbmd0aDsgaWR4KyspIHtcbiAgICAgICAgcmVzdWx0LnB1c2goYXJyW2lkeF0udG9Mb3dlckNhc2UoKSk7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG59XG5cbmZ1bmN0aW9uIGxvd2VyT2JqZWN0KG9iaikge1xuICAgIGNvbnN0IHJlc3VsdCA9IHt9O1xuICAgIGZvciAobGV0IGZpZWxkIGluIG9iaikge1xuICAgICAgICByZXN1bHRbZmllbGRdID0gb2JqW2ZpZWxkXS50b0xvd2VyQ2FzZSgpO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xufVxuXG5mdW5jdGlvbiBjbG9uZUxvd2VyKG9iaikge1xuICAgIGxldCByZXN1bHQgPSBBcnJheS5pc0FycmF5KG9iaikgPyBsb3dlckFycmF5KG9iaikgOiBsb3dlck9iamVjdChvYmopO1xuICAgIHJldHVybiByZXN1bHQ7XG59XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGRhdGVGb3JtYXROYW1lcyhsb2NhbGUsIG9wdGlvbnMpIHtcbiAgICBjb25zdCB7IHR5cGUsIG5hbWVUeXBlLCBzdGFuZEFsb25lLCBsb3dlciB9ID0gb3B0aW9ucztcbiAgICBjb25zdCBpbmZvID0gZ2V0TG9jYWxlSW5mbyhsb2NhbGUpO1xuICAgIGNvbnN0IGZvcm1hdFR5cGUgPSBzdGFuZEFsb25lID8gXCJzdGFuZC1hbG9uZVwiIDogXCJmb3JtYXRcIjtcbiAgICBjb25zdCBsb3dlck5hbWVUeXBlID0gKGxvd2VyID8gXCJsb3dlci1cIiA6IEVNUFRZKSArIG5hbWVUeXBlO1xuICAgIGNvbnN0IGZvcm1hdE5hbWVzID0gaW5mby5jYWxlbmRhclt0eXBlXVtmb3JtYXRUeXBlXTtcbiAgICBsZXQgcmVzdWx0ID0gZm9ybWF0TmFtZXNbbG93ZXJOYW1lVHlwZV07XG4gICAgaWYgKCFyZXN1bHQgJiYgbG93ZXIpIHtcbiAgICAgICAgcmVzdWx0ID0gZm9ybWF0TmFtZXNbbG93ZXJOYW1lVHlwZV0gPSBjbG9uZUxvd2VyKGZvcm1hdE5hbWVzW25hbWVUeXBlXSk7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG59IiwiZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gcGFyc2VSYW5nZURhdGUodmFsdWUpIHtcbiAgICBjb25zdCBwYXJ0cyA9IHZhbHVlLnNwbGl0KCctJyk7XG4gICAgY29uc3QgeWVhciA9IHBhcnNlSW50KHBhcnRzWzBdLCAxMCk7XG4gICAgY29uc3QgbW9udGggPSBwYXJzZUludChwYXJ0c1sxXSwgMTApIC0gMTtcbiAgICBjb25zdCBkYXkgPSBwYXJzZUludChwYXJ0c1syXSwgMTApO1xuXG4gICAgcmV0dXJuIG5ldyBEYXRlKHllYXIsIG1vbnRoLCBkYXkpO1xufVxuIiwiaW1wb3J0IHsgY2xkciwgZ2V0TG9jYWxlSW5mbyB9IGZyb20gJy4vaW5mbyc7XG5pbXBvcnQgeyBlcnJvcnMgfSBmcm9tICcuLi9lcnJvcnMnO1xuaW1wb3J0IGxvY2FsZVRlcnJpdG9yeSBmcm9tICcuL3RlcnJpdG9yeSc7XG5pbXBvcnQgcGFyc2VSYW5nZURhdGUgZnJvbSAnLi9wYXJzZS1yYW5nZS1kYXRlJztcblxuIFxuXG5jb25zdCB7XG4gICAgTm9DdXJyZW5jeSxcbiAgICBOb0N1cnJlbmN5RGlzcGxheSxcbiAgICBOb1N1cHBsZW1lbnRhbEN1cnJlbmN5LFxuICAgIE5vQ3VycmVuY3lSZWdpb24sXG4gICAgTm9WYWxpZEN1cnJlbmN5XG59ID0gZXJyb3JzO1xuXG5jb25zdCBERUZBVUxUX0NVUlJFTkNZX0ZSQUNUSU9OUyA9IDI7XG5jb25zdCBTWU1CT0wgPSBcInN5bWJvbFwiO1xuY29uc3QgSU5WQUxJRF9DVVJSRU5DWV9DT0RFID0gJ1hYWCc7XG5cbmNvbnN0IEdMT0JBTF9DVVJSRU5DSUVTID0ge1xuICAgICcwMDEnOiAnVVNEJywgLy8gMDAxIHJlZmVycyB0byB3b3JsZC4gbm90IHN1cmUgaWYgaXQgaXMgY29ycmVjdCB0byBhc3N1bWUgVVNEIGJ1dCBzZWVtcyBiZXR0ZXIgdGhhbiB0aHJvdyBhbiBlcnJvclxuICAgICcxNTAnOiAnRVVSJyAvLyAxNTAgdGVycml0b3J5IGZvciBFdXJvcGVcblxufTtcblxuZnVuY3Rpb24gZ2V0Q3VycmVuY3lJbmZvKGxvY2FsZSwgY3VycmVuY3ksIHRocm93SWZOb1ZhbGlkKSB7XG4gICAgY29uc3QgaW5mbyA9IGdldExvY2FsZUluZm8obG9jYWxlKTtcbiAgICBjb25zdCBjdXJyZW5jaWVzID0gaW5mby5udW1iZXJzLmN1cnJlbmNpZXM7XG4gICAgaWYgKCFjdXJyZW5jaWVzKSB7XG4gICAgICAgIGlmICh0aHJvd0lmTm9WYWxpZCkge1xuICAgICAgICAgICAgdGhyb3cgTm9DdXJyZW5jeS5lcnJvcigpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGN1cnJlbmN5RGlzcGxheUluZm8gPSBjdXJyZW5jaWVzW2N1cnJlbmN5XTtcblxuICAgIGlmICghY3VycmVuY3lEaXNwbGF5SW5mbykge1xuICAgICAgICBpZiAodGhyb3dJZk5vVmFsaWQpIHtcbiAgICAgICAgICAgIHRocm93IE5vQ3VycmVuY3lEaXNwbGF5LmVycm9yKCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgcmV0dXJuIGN1cnJlbmN5RGlzcGxheUluZm87XG59XG5cbmZ1bmN0aW9uIGxlbmd0aENvbXBhcmVyKGEsIGIpIHtcbiAgICByZXR1cm4gYi5sZW5ndGggLSBhLmxlbmd0aDtcbn1cblxuZnVuY3Rpb24gcmVnaW9uQ3VycmVuY3kocmVnaW9uQ3VycmVuY2llcykge1xuICAgIGxldCBsYXRlc3RWYWxpZFVudGlsLCBsYXRlc3RWYWxpZFVudGlsUmFuZ2U7XG4gICAgbGV0IGxhdGVzdFN0aWxsVmFsaWQsIGxhdGVzdFN0aWxsVmFsaWREYXRlO1xuXG4gICAgZm9yIChsZXQgaWR4ID0gMDsgaWR4IDwgcmVnaW9uQ3VycmVuY2llcy5sZW5ndGg7IGlkeCsrKSB7XG4gICAgICAgIGNvbnN0IGN1cnJlbmN5ID0gcmVnaW9uQ3VycmVuY2llc1tpZHhdO1xuICAgICAgICBjb25zdCBjb2RlID0gT2JqZWN0LmtleXMoY3VycmVuY3kpWzBdO1xuICAgICAgICBjb25zdCBpbmZvID0gY3VycmVuY3lbY29kZV07XG4gICAgICAgIGlmIChjb2RlICE9PSBJTlZBTElEX0NVUlJFTkNZX0NPREUgJiYgaW5mby5fdGVuZGVyICE9PSAnZmFsc2UnICYmIGluZm8uX2Zyb20pIHtcbiAgICAgICAgICAgIGlmICghaW5mby5fdG8pIHtcbiAgICAgICAgICAgICAgICBjb25zdCBzdGlsbFZhbGlkRGF0ZSA9IHBhcnNlUmFuZ2VEYXRlKGluZm8uX2Zyb20pO1xuICAgICAgICAgICAgICAgIGlmICghbGF0ZXN0U3RpbGxWYWxpZERhdGUgfHwgbGF0ZXN0U3RpbGxWYWxpZERhdGUgPCBzdGlsbFZhbGlkRGF0ZSkge1xuICAgICAgICAgICAgICAgICAgICBsYXRlc3RTdGlsbFZhbGlkID0gY29kZTtcbiAgICAgICAgICAgICAgICAgICAgbGF0ZXN0U3RpbGxWYWxpZERhdGUgPSBzdGlsbFZhbGlkRGF0ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2UgaWYgKCFsYXRlc3RTdGlsbFZhbGlkKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgdmFsaWRGcm9tID0gcGFyc2VSYW5nZURhdGUoaW5mby5fZnJvbSk7XG4gICAgICAgICAgICAgICAgY29uc3QgdmFsaWRUbyA9IHBhcnNlUmFuZ2VEYXRlKGluZm8uX3RvKTtcbiAgICAgICAgICAgICAgICBpZiAoIWxhdGVzdFZhbGlkVW50aWxSYW5nZSB8fCBsYXRlc3RWYWxpZFVudGlsUmFuZ2UudG8gPCB2YWxpZFRvIHx8IGxhdGVzdFZhbGlkVW50aWxSYW5nZS5mcm9tIDwgdmFsaWRGcm9tKSB7XG4gICAgICAgICAgICAgICAgICAgIGxhdGVzdFZhbGlkVW50aWwgPSBjb2RlO1xuICAgICAgICAgICAgICAgICAgICBsYXRlc3RWYWxpZFVudGlsUmFuZ2UgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmcm9tOiB2YWxpZEZyb20sXG4gICAgICAgICAgICAgICAgICAgICAgICB0bzogdmFsaWRUb1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBsYXRlc3RTdGlsbFZhbGlkIHx8IGxhdGVzdFZhbGlkVW50aWw7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjdXJyZW5jeURpc3BsYXlzKGxvY2FsZSwgY3VycmVuY3ksIHRocm93SWZOb1ZhbGlkID0gdHJ1ZSkge1xuICAgIGNvbnN0IGN1cnJlbmN5SW5mbyA9IGdldEN1cnJlbmN5SW5mbyhsb2NhbGUsIGN1cnJlbmN5LCB0aHJvd0lmTm9WYWxpZCk7XG4gICAgaWYgKCFjdXJyZW5jeUluZm8pIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmICghY3VycmVuY3lJbmZvLmRpc3BsYXlzKSB7XG4gICAgICAgIGNvbnN0IGRpc3BsYXlzID0gWyBjdXJyZW5jeSBdO1xuICAgICAgICBmb3IgKGxldCBmaWVsZCBpbiBjdXJyZW5jeUluZm8pIHtcbiAgICAgICAgICAgIGRpc3BsYXlzLnB1c2goY3VycmVuY3lJbmZvW2ZpZWxkXSk7XG4gICAgICAgIH1cbiAgICAgICAgZGlzcGxheXMuc29ydChsZW5ndGhDb21wYXJlcik7XG4gICAgICAgIGN1cnJlbmN5SW5mby5kaXNwbGF5cyA9IGRpc3BsYXlzO1xuICAgIH1cblxuICAgIHJldHVybiBjdXJyZW5jeUluZm8uZGlzcGxheXM7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjdXJyZW5jeURpc3BsYXkobG9jYWxlLCBvcHRpb25zKSB7XG4gICAgY29uc3QgeyB2YWx1ZSwgY3VycmVuY3ksIGN1cnJlbmN5RGlzcGxheSA9IFNZTUJPTCB9ID0gb3B0aW9ucztcblxuICAgIGlmIChjdXJyZW5jeURpc3BsYXkgPT09IFwiY29kZVwiKSB7XG4gICAgICAgIHJldHVybiBjdXJyZW5jeTtcbiAgICB9XG5cbiAgICBjb25zdCBjdXJyZW5jeUluZm8gPSBnZXRDdXJyZW5jeUluZm8obG9jYWxlLCBjdXJyZW5jeSwgdHJ1ZSk7XG4gICAgbGV0IHJlc3VsdDtcblxuICAgIGlmIChjdXJyZW5jeURpc3BsYXkgPT09IFNZTUJPTCkge1xuICAgICAgICByZXN1bHQgPSBjdXJyZW5jeUluZm9bXCJzeW1ib2wtYWx0LW5hcnJvd1wiXSB8fCBjdXJyZW5jeUluZm9bU1lNQk9MXSB8fCBjdXJyZW5jeTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBpZiAodHlwZW9mIHZhbHVlID09PSBcInVuZGVmaW5lZFwiIHx8IHZhbHVlICE9PSAxKSB7XG4gICAgICAgICAgICByZXN1bHQgPSBjdXJyZW5jeUluZm9bXCJkaXNwbGF5TmFtZS1jb3VudC1vdGhlclwiXTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJlc3VsdCA9IGN1cnJlbmN5SW5mb1tcImRpc3BsYXlOYW1lLWNvdW50LW9uZVwiXTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiByZXN1bHQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjdXJyZW5jeUZyYWN0aW9uT3B0aW9ucyhjb2RlKSB7XG4gICAgbGV0IG1pbmltdW1GcmFjdGlvbkRpZ2l0cyA9IERFRkFVTFRfQ1VSUkVOQ1lfRlJBQ1RJT05TO1xuICAgIGxldCBtYXhpbXVtRnJhY3Rpb25EaWdpdHMgPSBERUZBVUxUX0NVUlJFTkNZX0ZSQUNUSU9OUztcblxuICAgIGNvbnN0IGZyYWN0aW9ucyA9ICgoY2xkci5zdXBwbGVtZW50YWwuY3VycmVuY3lEYXRhIHx8IHt9KS5mcmFjdGlvbnMgfHwge30pW2NvZGVdO1xuXG4gICAgaWYgKGZyYWN0aW9ucyAmJiBmcmFjdGlvbnMuX2RpZ2l0cykge1xuICAgICAgICBtYXhpbXVtRnJhY3Rpb25EaWdpdHMgPSBtaW5pbXVtRnJhY3Rpb25EaWdpdHMgPSBwYXJzZUludChmcmFjdGlvbnMuX2RpZ2l0cywgMTApO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICAgIG1pbmltdW1GcmFjdGlvbkRpZ2l0czogbWluaW11bUZyYWN0aW9uRGlnaXRzLFxuICAgICAgICBtYXhpbXVtRnJhY3Rpb25EaWdpdHM6IG1heGltdW1GcmFjdGlvbkRpZ2l0c1xuICAgIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB0ZXJyaXRvcnlDdXJyZW5jeUNvZGUodGVycml0b3J5LCB0aHJvd0lmTm9WYWxpZCA9IHRydWUpIHtcbiAgICBpZiAoR0xPQkFMX0NVUlJFTkNJRVNbdGVycml0b3J5XSkge1xuICAgICAgICByZXR1cm4gR0xPQkFMX0NVUlJFTkNJRVNbdGVycml0b3J5XTtcbiAgICB9XG5cbiAgICBjb25zdCBjdXJyZW5jeURhdGEgPSBjbGRyLnN1cHBsZW1lbnRhbC5jdXJyZW5jeURhdGE7XG4gICAgaWYgKCFjdXJyZW5jeURhdGEpIHtcbiAgICAgICAgaWYgKHRocm93SWZOb1ZhbGlkKSB7XG4gICAgICAgICAgICB0aHJvdyBOb1N1cHBsZW1lbnRhbEN1cnJlbmN5LmVycm9yKCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgcmVnaW9uQ3VycmVuY2llcyA9IGN1cnJlbmN5RGF0YS5yZWdpb25bdGVycml0b3J5XTtcblxuICAgIGlmICghcmVnaW9uQ3VycmVuY2llcykge1xuICAgICAgICBpZiAodGhyb3dJZk5vVmFsaWQpIHtcbiAgICAgICAgICAgIHRocm93IE5vQ3VycmVuY3lSZWdpb24uZXJyb3IodGVycml0b3J5KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBjdXJyZW5jeUNvZGUgPSByZWdpb25DdXJyZW5jeShyZWdpb25DdXJyZW5jaWVzKTtcblxuICAgIHJldHVybiBjdXJyZW5jeUNvZGU7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBsb2NhbGVDdXJyZW5jeShsb2NhbGUsIHRocm93SWZOb1ZhbGlkKSB7XG4gICAgY29uc3QgaW5mbyA9IGdldExvY2FsZUluZm8obG9jYWxlKTtcbiAgICBjb25zdCBudW1iZXJzID0gaW5mby5udW1iZXJzO1xuXG4gICAgaWYgKCFudW1iZXJzLmxvY2FsZUN1cnJlbmN5KSB7XG4gICAgICAgIGNvbnN0IGN1cnJlbmN5ID0gdGVycml0b3J5Q3VycmVuY3lDb2RlKGxvY2FsZVRlcnJpdG9yeShpbmZvKSwgdGhyb3dJZk5vVmFsaWQpO1xuXG4gICAgICAgIGlmICghY3VycmVuY3kgJiYgdGhyb3dJZk5vVmFsaWQpIHtcbiAgICAgICAgICAgIHRocm93IE5vVmFsaWRDdXJyZW5jeS5lcnJvcihpbmZvLm5hbWUpO1xuICAgICAgICB9XG5cbiAgICAgICAgbnVtYmVycy5sb2NhbGVDdXJyZW5jeSA9IGN1cnJlbmN5O1xuICAgIH1cblxuICAgIHJldHVybiBudW1iZXJzLmxvY2FsZUN1cnJlbmN5O1xufVxuIiwiXG5leHBvcnQgY29uc3QgREFZU19PRl9XRUVLID0gWyBcInN1blwiLCBcIm1vblwiLCBcInR1ZVwiLCBcIndlZFwiLCBcInRodVwiLCBcImZyaVwiLCBcInNhdFwiIF07XG5cbmV4cG9ydCBjb25zdCBERUZBVUxUX1RFUlJJVE9SWSA9ICcwMDEnO1xuIiwiaW1wb3J0IHsgY2xkciwgZ2V0TG9jYWxlSW5mbyB9IGZyb20gJy4vaW5mbyc7XG5pbXBvcnQgbG9jYWxlVGVycml0b3J5IGZyb20gJy4vdGVycml0b3J5JztcblxuaW1wb3J0IHsgREFZU19PRl9XRUVLLCBERUZBVUxUX1RFUlJJVE9SWSB9IGZyb20gJy4vY29uc3RhbnRzJztcbmltcG9ydCB7IGVycm9ycyB9IGZyb20gJy4uL2Vycm9ycyc7XG5cbmNvbnN0IHsgTm9XZWVrRGF0YSwgTm9GaXJzdERheSB9ID0gZXJyb3JzO1xuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBmaXJzdERheShsb2NhbGUpIHtcbiAgICBjb25zdCBpbmZvID0gZ2V0TG9jYWxlSW5mbyhsb2NhbGUpO1xuXG4gICAgaWYgKCFpc05hTihpbmZvLmZpcnN0RGF5KSkge1xuICAgICAgICByZXR1cm4gaW5mby5maXJzdERheTtcbiAgICB9XG5cbiAgICBjb25zdCB3ZWVrRGF0YSA9IGNsZHIuc3VwcGxlbWVudGFsLndlZWtEYXRhO1xuICAgIGlmICghd2Vla0RhdGEpIHtcbiAgICAgICAgdGhyb3cgTm9XZWVrRGF0YS5lcnJvcigpO1xuICAgIH1cblxuICAgIGNvbnN0IGZpcnN0RGF5ID0gd2Vla0RhdGEuZmlyc3REYXlbbG9jYWxlVGVycml0b3J5KGluZm8pXSB8fCB3ZWVrRGF0YS5maXJzdERheVtERUZBVUxUX1RFUlJJVE9SWV07XG5cbiAgICBpZiAoIWZpcnN0RGF5KSB7XG4gICAgICAgIHRocm93IE5vRmlyc3REYXkuZXJyb3IoKTtcbiAgICB9XG5cbiAgICBpbmZvLmZpcnN0RGF5ID0gREFZU19PRl9XRUVLLmluZGV4T2YoZmlyc3REYXkpO1xuXG4gICAgcmV0dXJuIGluZm8uZmlyc3REYXk7XG59XG4iLCJpbXBvcnQgeyBjbGRyLCBnZXRMb2NhbGVJbmZvIH0gZnJvbSAnLi9pbmZvJztcbmltcG9ydCBsb2NhbGVUZXJyaXRvcnkgZnJvbSAnLi90ZXJyaXRvcnknO1xuXG5pbXBvcnQgeyBEQVlTX09GX1dFRUssIERFRkFVTFRfVEVSUklUT1JZIH0gZnJvbSAnLi9jb25zdGFudHMnO1xuaW1wb3J0IHsgZXJyb3JzIH0gZnJvbSAnLi4vZXJyb3JzJztcblxuY29uc3QgeyBOb1dlZWtEYXRhIH0gPSBlcnJvcnM7XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIHdlZWtlbmRSYW5nZShsb2NhbGUpIHtcbiAgICBjb25zdCBpbmZvID0gZ2V0TG9jYWxlSW5mbyhsb2NhbGUpO1xuXG4gICAgaWYgKGluZm8ud2Vla2VuZFJhbmdlKSB7XG4gICAgICAgIHJldHVybiBpbmZvLndlZWtlbmRSYW5nZTtcbiAgICB9XG5cbiAgICBjb25zdCB3ZWVrRGF0YSA9IGNsZHIuc3VwcGxlbWVudGFsLndlZWtEYXRhO1xuICAgIGlmICghd2Vla0RhdGEpIHtcbiAgICAgICAgdGhyb3cgTm9XZWVrRGF0YS5lcnJvcigpO1xuICAgIH1cblxuICAgIGNvbnN0IHRlcnJpdG9yeSA9IGxvY2FsZVRlcnJpdG9yeShpbmZvKTtcbiAgICBjb25zdCBzdGFydCA9IHdlZWtEYXRhLndlZWtlbmRTdGFydFt0ZXJyaXRvcnldIHx8IHdlZWtEYXRhLndlZWtlbmRTdGFydFtERUZBVUxUX1RFUlJJVE9SWV07XG4gICAgY29uc3QgZW5kID0gd2Vla0RhdGEud2Vla2VuZEVuZFt0ZXJyaXRvcnldIHx8IHdlZWtEYXRhLndlZWtlbmRFbmRbREVGQVVMVF9URVJSSVRPUlldO1xuXG4gICAgaW5mby53ZWVrZW5kUmFuZ2UgPSB7XG4gICAgICAgIHN0YXJ0OiBEQVlTX09GX1dFRUsuaW5kZXhPZihzdGFydCksXG4gICAgICAgIGVuZDogREFZU19PRl9XRUVLLmluZGV4T2YoZW5kKVxuICAgIH07XG5cbiAgICByZXR1cm4gaW5mby53ZWVrZW5kUmFuZ2U7XG59XG4iLCJpbXBvcnQgeyBnZXRMb2NhbGVJbmZvIH0gZnJvbSAnLi9pbmZvJztcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gbnVtYmVyU3ltYm9scyhsb2NhbGUpIHtcbiAgICBjb25zdCBpbmZvID0gZ2V0TG9jYWxlSW5mbyhsb2NhbGUpO1xuXG4gICAgcmV0dXJuIGluZm8ubnVtYmVycy5zeW1ib2xzO1xufSIsImV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGlzTmVnYXRpdmVaZXJvKHZhbHVlKSB7XG4gICAgcmV0dXJuICgxIC8gdmFsdWUgPT09IC1JbmZpbml0eSk7XG59XG4iLCJpbXBvcnQgeyBjdXJyZW5jeURpc3BsYXksIGxvY2FsZUN1cnJlbmN5IH0gZnJvbSAnLi4vY2xkcic7XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGZvcm1hdEN1cnJlbmN5U3ltYm9sKGluZm8sIG9wdGlvbnMgPSB7fSkge1xuICAgIGlmICghb3B0aW9ucy5jdXJyZW5jeSkge1xuICAgICAgICBvcHRpb25zLmN1cnJlbmN5ID0gbG9jYWxlQ3VycmVuY3koaW5mbywgdHJ1ZSk7XG4gICAgfVxuXG4gICAgY29uc3QgZGlzcGxheSA9IGN1cnJlbmN5RGlzcGxheShpbmZvLCBvcHRpb25zKTtcblxuICAgIHJldHVybiBkaXNwbGF5O1xufVxuIiwiZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gZ3JvdXBJbnRlZ2VyKG51bWJlciwgc3RhcnQsIGVuZCwgb3B0aW9ucywgaW5mbykge1xuICAgIGNvbnN0IHN5bWJvbHMgPSBpbmZvLm51bWJlcnMuc3ltYm9scztcbiAgICBjb25zdCBkZWNpbWFsSW5kZXggPSBudW1iZXIuaW5kZXhPZihzeW1ib2xzLmRlY2ltYWwpO1xuICAgIGNvbnN0IGdyb3VwU2l6ZXMgPSBvcHRpb25zLmdyb3VwU2l6ZS5zbGljZSgpO1xuICAgIGxldCBncm91cFNpemUgPSBncm91cFNpemVzLnNoaWZ0KCk7XG5cbiAgICBsZXQgaW50ZWdlckVuZCA9IGRlY2ltYWxJbmRleCAhPT0gLTEgPyBkZWNpbWFsSW5kZXggOiBlbmQgKyAxO1xuXG4gICAgbGV0IGludGVnZXIgPSBudW1iZXIuc3Vic3RyaW5nKHN0YXJ0LCBpbnRlZ2VyRW5kKTtcbiAgICBsZXQgcmVzdWx0ID0gbnVtYmVyO1xuICAgIGNvbnN0IGludGVnZXJMZW5ndGggPSBpbnRlZ2VyLmxlbmd0aDtcblxuICAgIGlmIChpbnRlZ2VyTGVuZ3RoID49IGdyb3VwU2l6ZSkge1xuICAgICAgICBsZXQgaWR4ID0gaW50ZWdlckxlbmd0aDtcbiAgICAgICAgbGV0IHBhcnRzID0gW107XG5cbiAgICAgICAgd2hpbGUgKGlkeCA+IC0xKSB7XG4gICAgICAgICAgICBsZXQgdmFsdWUgPSBpbnRlZ2VyLnN1YnN0cmluZyhpZHggLSBncm91cFNpemUsIGlkeCk7XG4gICAgICAgICAgICBpZiAodmFsdWUpIHtcbiAgICAgICAgICAgICAgICBwYXJ0cy5wdXNoKHZhbHVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlkeCAtPSBncm91cFNpemU7XG4gICAgICAgICAgICBsZXQgbmV3R3JvdXBTaXplID0gZ3JvdXBTaXplcy5zaGlmdCgpO1xuICAgICAgICAgICAgZ3JvdXBTaXplID0gbmV3R3JvdXBTaXplICE9PSB1bmRlZmluZWQgPyBuZXdHcm91cFNpemUgOiBncm91cFNpemU7XG5cbiAgICAgICAgICAgIGlmIChncm91cFNpemUgPT09IDApIHtcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IGludGVnZXIuc3Vic3RyaW5nKDAsIGlkeCk7XG4gICAgICAgICAgICAgICAgaWYgKHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgIHBhcnRzLnB1c2godmFsdWUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGludGVnZXIgPSBwYXJ0cy5yZXZlcnNlKCkuam9pbihzeW1ib2xzLmdyb3VwKTtcbiAgICAgICAgcmVzdWx0ID0gbnVtYmVyLnN1YnN0cmluZygwLCBzdGFydCkgKyBpbnRlZ2VyICsgbnVtYmVyLnN1YnN0cmluZyhpbnRlZ2VyRW5kKTtcbiAgICB9XG5cbiAgICByZXR1cm4gcmVzdWx0O1xufSIsImltcG9ydCB7IENVUlJFTkNZLCBBQ0NPVU5USU5HIH0gZnJvbSAnLi4vY29tbW9uL2NvbnN0YW50cyc7XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGlzQ3VycmVuY3lTdHlsZShzdHlsZSkge1xuICAgIHJldHVybiBzdHlsZSA9PT0gQ1VSUkVOQ1kgfHwgc3R5bGUgPT09IEFDQ09VTlRJTkc7XG59IiwiZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gcGFkKG51bWJlciwgZGlnaXRzID0gMiwgcmlnaHQgPSBmYWxzZSkge1xuICAgIGNvbnN0IGNvdW50ID0gZGlnaXRzIC0gU3RyaW5nKG51bWJlcikubGVuZ3RoO1xuICAgIGxldCByZXN1bHQgPSBudW1iZXI7XG5cbiAgICBpZiAoY291bnQgPiAwKSB7XG4gICAgICAgIGNvbnN0IHBhZFN0cmluZyA9IG5ldyBBcnJheShjb3VudCArIDEpLmpvaW4oXCIwXCIpO1xuICAgICAgICByZXN1bHQgPSByaWdodCA/IG51bWJlciArIHBhZFN0cmluZyA6IHBhZFN0cmluZyArIG51bWJlcjtcbiAgICB9XG5cbiAgICByZXR1cm4gcmVzdWx0O1xufSIsImNvbnN0IE1BWF9QUkVDSVNJT04gPSAyMDtcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gcm91bmQodmFsdWUsIHByZWNpc2lvbikge1xuICAgIGxldCByZXN1bHQgPSB2YWx1ZTtcbiAgICBsZXQgZGVjaW1hbHMgPSBwcmVjaXNpb24gfHwgMDtcblxuICAgIHJlc3VsdCA9IHJlc3VsdC50b1N0cmluZygpLnNwbGl0KCdlJyk7XG4gICAgcmVzdWx0ID0gTWF0aC5yb3VuZChOdW1iZXIocmVzdWx0WzBdICsgJ2UnICsgKHJlc3VsdFsxXSA/IChOdW1iZXIocmVzdWx0WzFdKSArIGRlY2ltYWxzKSA6IGRlY2ltYWxzKSkpO1xuXG4gICAgcmVzdWx0ID0gcmVzdWx0LnRvU3RyaW5nKCkuc3BsaXQoJ2UnKTtcbiAgICByZXN1bHQgPSBOdW1iZXIocmVzdWx0WzBdICsgJ2UnICsgKHJlc3VsdFsxXSA/IChOdW1iZXIocmVzdWx0WzFdKSAtIGRlY2ltYWxzKSA6IC1kZWNpbWFscykpO1xuXG4gICAgcmV0dXJuIHJlc3VsdC50b0ZpeGVkKE1hdGgubWluKGRlY2ltYWxzLCBNQVhfUFJFQ0lTSU9OKSk7XG59IiwiaW1wb3J0IHsgUEVSQ0VOVCwgU0NJRU5USUZJQywgTlVNQkVSX1BMQUNFSE9MREVSLCBDVVJSRU5DWV9QTEFDRUhPTERFUiwgUEVSQ0VOVF9QTEFDRUhPTERFUiwgRU1QVFksIFBPSU5UIH0gZnJvbSAnLi4vY29tbW9uL2NvbnN0YW50cyc7XG5pbXBvcnQgaXNOZWdhdGl2ZVplcm8gZnJvbSAnLi4vY29tbW9uL2lzLW5lZ2F0aXZlLXplcm8nO1xuaW1wb3J0IGZvcm1hdEN1cnJlbmN5U3ltYm9sIGZyb20gJy4vZm9ybWF0LWN1cnJlbmN5LXN5bWJvbCc7XG5pbXBvcnQgZ3JvdXBJbnRlZ2VyIGZyb20gJy4vZ3JvdXAtaW50ZWdlcic7XG5pbXBvcnQgaXNDdXJyZW5jeVN0eWxlIGZyb20gJy4vaXMtY3VycmVuY3ktc3R5bGUnO1xuaW1wb3J0IHBhZCBmcm9tICcuLi9jb21tb24vcGFkJztcbmltcG9ydCByb3VuZCBmcm9tICcuLi9jb21tb24vcm91bmQnO1xuaW1wb3J0IHsgY3VycmVuY3lGcmFjdGlvbk9wdGlvbnMgfSBmcm9tICcuLi9jbGRyJztcblxuY29uc3QgREVGQVVMVF9ERUNJTUFMX1JPVU5ESU5HID0gMztcbmNvbnN0IERFRkFVTFRfUEVSQ0VOVF9ST1VORElORyA9IDA7XG5cbmNvbnN0IHRyYWlsaW5nWmVyb1JlZ2V4ID0gLzArJC87XG5cbmZ1bmN0aW9uIGZyYWN0aW9uT3B0aW9ucyhvcHRpb25zKSB7XG4gICAgbGV0IHsgbWluaW11bUZyYWN0aW9uRGlnaXRzLCBtYXhpbXVtRnJhY3Rpb25EaWdpdHMsIHN0eWxlIH0gPSBvcHRpb25zO1xuICAgIGNvbnN0IGlzQ3VycmVuY3kgPSBpc0N1cnJlbmN5U3R5bGUoc3R5bGUpO1xuICAgIGxldCBjdXJyZW5jeUZyYWN0aW9ucztcbiAgICBpZiAoaXNDdXJyZW5jeSkge1xuICAgICAgICBjdXJyZW5jeUZyYWN0aW9ucyA9IGN1cnJlbmN5RnJhY3Rpb25PcHRpb25zKG9wdGlvbnMuY3VycmVuY3kpO1xuICAgIH1cblxuICAgIGlmIChtaW5pbXVtRnJhY3Rpb25EaWdpdHMgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICBtaW5pbXVtRnJhY3Rpb25EaWdpdHMgPSBpc0N1cnJlbmN5ID8gY3VycmVuY3lGcmFjdGlvbnMubWluaW11bUZyYWN0aW9uRGlnaXRzIDogMDtcbiAgICB9XG5cbiAgICBpZiAobWF4aW11bUZyYWN0aW9uRGlnaXRzID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgaWYgKHN0eWxlID09PSBQRVJDRU5UKSB7XG4gICAgICAgICAgICBtYXhpbXVtRnJhY3Rpb25EaWdpdHMgPSBNYXRoLm1heChtaW5pbXVtRnJhY3Rpb25EaWdpdHMsIERFRkFVTFRfUEVSQ0VOVF9ST1VORElORyk7XG4gICAgICAgIH0gZWxzZSBpZiAoaXNDdXJyZW5jeSkge1xuICAgICAgICAgICAgbWF4aW11bUZyYWN0aW9uRGlnaXRzID0gTWF0aC5tYXgobWluaW11bUZyYWN0aW9uRGlnaXRzLCBjdXJyZW5jeUZyYWN0aW9ucy5tYXhpbXVtRnJhY3Rpb25EaWdpdHMpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbWF4aW11bUZyYWN0aW9uRGlnaXRzID0gTWF0aC5tYXgobWluaW11bUZyYWN0aW9uRGlnaXRzLCBERUZBVUxUX0RFQ0lNQUxfUk9VTkRJTkcpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgbWluaW11bUZyYWN0aW9uRGlnaXRzOiBtaW5pbXVtRnJhY3Rpb25EaWdpdHMsXG4gICAgICAgIG1heGltdW1GcmFjdGlvbkRpZ2l0czogbWF4aW11bUZyYWN0aW9uRGlnaXRzXG4gICAgfTtcbn1cblxuZnVuY3Rpb24gYXBwbHlQYXR0ZXJuKHZhbHVlLCBwYXR0ZXJuLCBzeW1ib2wpIHtcbiAgICBsZXQgcmVzdWx0ID0gRU1QVFk7XG4gICAgZm9yIChsZXQgaWR4ID0gMCwgbGVuZ3RoID0gcGF0dGVybi5sZW5ndGg7IGlkeCA8IGxlbmd0aDsgaWR4KyspIHtcbiAgICAgICAgbGV0IGNoID0gcGF0dGVybi5jaGFyQXQoaWR4KTtcblxuICAgICAgICBpZiAoY2ggPT09IE5VTUJFUl9QTEFDRUhPTERFUikge1xuICAgICAgICAgICAgcmVzdWx0ICs9IHZhbHVlO1xuICAgICAgICB9IGVsc2UgaWYgKGNoID09PSBDVVJSRU5DWV9QTEFDRUhPTERFUiB8fCBjaCA9PT0gUEVSQ0VOVF9QTEFDRUhPTERFUikge1xuICAgICAgICAgICAgcmVzdWx0ICs9IHN5bWJvbDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJlc3VsdCArPSBjaDtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xufVxuXG5mdW5jdGlvbiBjdXJyZW5jeVVuaXRQYXR0ZXJuKGluZm8sIHZhbHVlKSB7XG4gICAgY29uc3QgY3VycmVuY3lJbmZvID0gaW5mby5udW1iZXJzLmN1cnJlbmN5O1xuICAgIGxldCBwYXR0ZXJuID0gdmFsdWUgIT09IDEgPyBjdXJyZW5jeUluZm9bXCJ1bml0UGF0dGVybi1jb3VudC1vdGhlclwiXSA6IGN1cnJlbmN5SW5mb1tcInVuaXRQYXR0ZXJuLWNvdW50LW9uZVwiXTtcbiAgICBpZiAodmFsdWUgPCAwKSB7XG4gICAgICAgIHBhdHRlcm4gPSBwYXR0ZXJuLnJlcGxhY2UoTlVNQkVSX1BMQUNFSE9MREVSLCBgLSR7IE5VTUJFUl9QTEFDRUhPTERFUiB9YCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHBhdHRlcm47XG59XG5cblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gc3RhbmRhcmROdW1iZXJGb3JtYXQobnVtYmVyLCBvcHRpb25zLCBpbmZvKSB7XG4gICAgY29uc3Qgc3ltYm9scyA9IGluZm8ubnVtYmVycy5zeW1ib2xzO1xuICAgIGNvbnN0IHsgc3R5bGUgfSA9IG9wdGlvbnM7XG4gICAgY29uc3QgaXNDdXJyZW5jeSA9IGlzQ3VycmVuY3lTdHlsZShzdHlsZSk7XG5cbiAgICAvL3JldHVybiBudW1iZXIgaW4gZXhwb25lbnRpYWwgZm9ybWF0XG4gICAgaWYgKHN0eWxlID09PSBTQ0lFTlRJRklDKSB7XG4gICAgICAgIGxldCBleHBvbmVudGlhbCA9IG9wdGlvbnMubWluaW11bUZyYWN0aW9uRGlnaXRzICE9PSB1bmRlZmluZWQgPyBudW1iZXIudG9FeHBvbmVudGlhbChvcHRpb25zLm1pbmltdW1GcmFjdGlvbkRpZ2l0cykgOiBudW1iZXIudG9FeHBvbmVudGlhbCgpO1xuICAgICAgICByZXR1cm4gZXhwb25lbnRpYWwucmVwbGFjZShQT0lOVCwgc3ltYm9scy5kZWNpbWFsKTtcbiAgICB9XG5cbiAgICBsZXQgdmFsdWUgPSBudW1iZXI7XG4gICAgbGV0IHN5bWJvbDtcblxuICAgIGlmIChpc0N1cnJlbmN5KSB7XG4gICAgICAgIG9wdGlvbnMudmFsdWUgPSB2YWx1ZTtcbiAgICAgICAgc3ltYm9sID0gZm9ybWF0Q3VycmVuY3lTeW1ib2woaW5mbywgb3B0aW9ucyk7XG4gICAgfVxuXG4gICAgaWYgKHN0eWxlID09PSBQRVJDRU5UKSB7XG4gICAgICAgIHZhbHVlICo9IDEwMDtcbiAgICAgICAgc3ltYm9sID0gc3ltYm9scy5wZXJjZW50U2lnbjtcbiAgICB9XG5cbiAgICBjb25zdCB7IG1pbmltdW1GcmFjdGlvbkRpZ2l0cywgbWF4aW11bUZyYWN0aW9uRGlnaXRzIH0gPSBmcmFjdGlvbk9wdGlvbnMob3B0aW9ucyk7XG5cbiAgICB2YWx1ZSA9IHJvdW5kKHZhbHVlLCBtYXhpbXVtRnJhY3Rpb25EaWdpdHMpO1xuXG4gICAgY29uc3QgbmVnYXRpdmUgPSB2YWx1ZSA8IDA7XG4gICAgY29uc3QgbmVnYXRpdmVaZXJvID0gaXNOZWdhdGl2ZVplcm8obnVtYmVyKTtcblxuICAgIGNvbnN0IHBhcnRzID0gdmFsdWUuc3BsaXQoUE9JTlQpO1xuXG4gICAgbGV0IGludGVnZXIgPSBwYXJ0c1swXTtcbiAgICBsZXQgZnJhY3Rpb24gPSBwYWQocGFydHNbMV0gPyBwYXJ0c1sxXS5yZXBsYWNlKHRyYWlsaW5nWmVyb1JlZ2V4LCBFTVBUWSkgOiBFTVBUWSwgbWluaW11bUZyYWN0aW9uRGlnaXRzLCB0cnVlKTtcblxuICAgIC8vZXhjbHVkZSBcIi1cIiBpZiBudW1iZXIgaXMgbmVnYXRpdmUuXG4gICAgaWYgKG5lZ2F0aXZlKSB7XG4gICAgICAgIGludGVnZXIgPSBpbnRlZ2VyLnN1YnN0cmluZygxKTtcbiAgICB9XG5cbiAgICBpZiAob3B0aW9ucy5taW5pbXVtSW50ZWdlckRpZ2l0cykge1xuICAgICAgICBpbnRlZ2VyID0gcGFkKGludGVnZXIsIG9wdGlvbnMubWluaW11bUludGVnZXJEaWdpdHMpO1xuICAgIH1cblxuICAgIGxldCBmb3JtYXR0ZWRWYWx1ZSA9IG9wdGlvbnMudXNlR3JvdXBpbmcgIT09IGZhbHNlID8gZ3JvdXBJbnRlZ2VyKGludGVnZXIsIDAsIGludGVnZXIubGVuZ3RoLCBvcHRpb25zLCBpbmZvKSA6IGludGVnZXI7XG5cbiAgICBpZiAoZnJhY3Rpb24pIHtcbiAgICAgICAgZm9ybWF0dGVkVmFsdWUgKz0gc3ltYm9scy5kZWNpbWFsICsgZnJhY3Rpb247XG4gICAgfVxuXG4gICAgbGV0IHBhdHRlcm47XG5cbiAgICBpZiAoaXNDdXJyZW5jeSAmJiBvcHRpb25zLmN1cnJlbmN5RGlzcGxheSA9PT0gXCJuYW1lXCIpIHtcbiAgICAgICAgcGF0dGVybiA9IGN1cnJlbmN5VW5pdFBhdHRlcm4oaW5mbywgbnVtYmVyKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCBwYXR0ZXJucyA9IG9wdGlvbnMucGF0dGVybnM7XG4gICAgICAgIHBhdHRlcm4gPSAobmVnYXRpdmUgfHwgbmVnYXRpdmVaZXJvKSA/IHBhdHRlcm5zWzFdIHx8IChcIi1cIiArIHBhdHRlcm5zWzBdKSA6IHBhdHRlcm5zWzBdO1xuICAgIH1cblxuICAgIGlmIChwYXR0ZXJuID09PSBOVU1CRVJfUExBQ0VIT0xERVIgJiYgIW5lZ2F0aXZlKSB7XG4gICAgICAgIHJldHVybiBmb3JtYXR0ZWRWYWx1ZTtcbiAgICB9XG5cbiAgICBjb25zdCByZXN1bHQgPSBhcHBseVBhdHRlcm4oZm9ybWF0dGVkVmFsdWUsIHBhdHRlcm4sIHN5bWJvbCk7XG5cbiAgICByZXR1cm4gcmVzdWx0O1xufSIsImltcG9ydCB7IFBFUkNFTlRfUExBQ0VIT0xERVIsIENVUlJFTkNZX1BMQUNFSE9MREVSLCBDVVJSRU5DWSwgUEVSQ0VOVCwgRU1QVFkgfSBmcm9tICcuLi9jb21tb24vY29uc3RhbnRzJztcbmltcG9ydCBmb3JtYXRDdXJyZW5jeVN5bWJvbCBmcm9tICcuL2Zvcm1hdC1jdXJyZW5jeS1zeW1ib2wnO1xuXG5jb25zdCBsaXRlcmFsUmVnRXhwID0gLyhcXFxcLil8KFsnXVteJ10qWyddPyl8KFtcIl1bXlwiXSpbXCJdPykvZztcbmNvbnN0IFBMQUNFSE9MREVSID0gXCJfXz8/X19cIjtcblxuZXhwb3J0IGZ1bmN0aW9uIHNldFN0eWxlT3B0aW9ucyhmb3JtYXRPcHRpb25zLCBpbmZvKSB7XG4gICAgY29uc3QgZm9ybWF0ID0gZm9ybWF0T3B0aW9ucy5mb3JtYXQ7XG5cbiAgICAvL211bHRpcGx5IG51bWJlciBpZiB0aGUgZm9ybWF0IGhhcyBwZXJjZW50XG4gICAgaWYgKGZvcm1hdC5pbmRleE9mKFBFUkNFTlRfUExBQ0VIT0xERVIpICE9PSAtMSkge1xuICAgICAgICBmb3JtYXRPcHRpb25zLnN0eWxlID0gUEVSQ0VOVDtcbiAgICAgICAgZm9ybWF0T3B0aW9ucy5zeW1ib2wgPSBpbmZvLm51bWJlcnMuc3ltYm9scy5wZXJjZW50U2lnbjtcbiAgICAgICAgZm9ybWF0T3B0aW9ucy5udW1iZXIgKj0gMTAwO1xuICAgIH1cblxuICAgIGlmIChmb3JtYXQuaW5kZXhPZihDVVJSRU5DWV9QTEFDRUhPTERFUikgIT09IC0xKSB7XG4gICAgICAgIGZvcm1hdE9wdGlvbnMuc3R5bGUgPSBDVVJSRU5DWTtcbiAgICAgICAgZm9ybWF0T3B0aW9ucy5zeW1ib2wgPSBmb3JtYXRDdXJyZW5jeVN5bWJvbChpbmZvKTtcbiAgICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXRGb3JtYXRMaXRlcmFscyhmb3JtYXRPcHRpb25zKSB7XG4gICAgbGV0IGZvcm1hdCA9IGZvcm1hdE9wdGlvbnMuZm9ybWF0O1xuICAgIGlmIChmb3JtYXQuaW5kZXhPZihcIidcIikgPiAtMSB8fCBmb3JtYXQuaW5kZXhPZihcIlxcXCJcIikgPiAtMSB8fCBmb3JtYXQuaW5kZXhPZihcIlxcXFxcIikgPiAtMSkge1xuICAgICAgICBjb25zdCBsaXRlcmFscyA9IGZvcm1hdE9wdGlvbnMubGl0ZXJhbHMgPSBbXTtcbiAgICAgICAgZm9ybWF0T3B0aW9ucy5mb3JtYXQgPSBmb3JtYXQucmVwbGFjZShsaXRlcmFsUmVnRXhwLCBmdW5jdGlvbihtYXRjaCkge1xuICAgICAgICAgICAgY29uc3QgcXVvdGVDaGFyID0gbWF0Y2guY2hhckF0KDApLnJlcGxhY2UoXCJcXFxcXCIsIEVNUFRZKTtcbiAgICAgICAgICAgIGNvbnN0IGxpdGVyYWwgPSBtYXRjaC5zbGljZSgxKS5yZXBsYWNlKHF1b3RlQ2hhciwgRU1QVFkpO1xuXG4gICAgICAgICAgICBsaXRlcmFscy5wdXNoKGxpdGVyYWwpO1xuXG4gICAgICAgICAgICByZXR1cm4gUExBQ0VIT0xERVI7XG4gICAgICAgIH0pO1xuICAgIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlcGxhY2VMaXRlcmFscyhudW1iZXIsIGxpdGVyYWxzKSB7XG4gICAgbGV0IHJlc3VsdCA9IG51bWJlcjtcbiAgICBpZiAobGl0ZXJhbHMpIHtcbiAgICAgICAgY29uc3QgbGVuZ3RoID0gbGl0ZXJhbHMubGVuZ3RoO1xuICAgICAgICBmb3IgKGxldCBpZHggPSAwOyBpZHggPCBsZW5ndGg7IGlkeCsrKSB7XG4gICAgICAgICAgICByZXN1bHQgPSByZXN1bHQucmVwbGFjZShQTEFDRUhPTERFUiwgbGl0ZXJhbHNbaWR4XSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbn0iLCJpbXBvcnQgeyBDVVJSRU5DWSwgUEVSQ0VOVCwgTElTVF9TRVBBUkFUT1IsIEdST1VQX1NFUEFSQVRPUiwgQ1VSUkVOQ1lfUExBQ0VIT0xERVIsIFBFUkNFTlRfUExBQ0VIT0xERVIsIFBPSU5ULCBFTVBUWSB9IGZyb20gJy4uL2NvbW1vbi9jb25zdGFudHMnO1xuaW1wb3J0IGlzTmVnYXRpdmVaZXJvIGZyb20gJy4uL2NvbW1vbi9pcy1uZWdhdGl2ZS16ZXJvJztcbmltcG9ydCBncm91cEludGVnZXIgZnJvbSAnLi9ncm91cC1pbnRlZ2VyJztcbmltcG9ydCByb3VuZCBmcm9tICcuLi9jb21tb24vcm91bmQnO1xuaW1wb3J0IHsgc2V0U3R5bGVPcHRpb25zLCBzZXRGb3JtYXRMaXRlcmFscywgcmVwbGFjZUxpdGVyYWxzIH0gZnJvbSAnLi91dGlscyc7XG5cbmNvbnN0IFNIQVJQID0gXCIjXCI7XG5jb25zdCBaRVJPID0gXCIwXCI7XG5cbmNvbnN0IHRyYWlsaW5nWmVyb3NSZWdFeHAgPSAvKFxcLig/OlswLTldKlsxLTldKT8pMCskL2c7XG5jb25zdCB0cmFpbGluZ1BvaW50UmVnRXhwID0gL1xcLiQvO1xuY29uc3QgY29tbWFSZWdFeHAgPSAvLC9nO1xuXG5mdW5jdGlvbiB0cmltVHJhaWxpbmdaZXJvcyh2YWx1ZSwgbGFzdFplcm8pIHtcbiAgICBsZXQgdHJpbVJlZ2V4O1xuXG4gICAgaWYgKGxhc3RaZXJvID09PSAwKSB7XG4gICAgICAgIHRyaW1SZWdleCA9IHRyYWlsaW5nWmVyb3NSZWdFeHA7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdHJpbVJlZ2V4ID0gbmV3IFJlZ0V4cChgKFxcXFwuWzAtOV17JHsgbGFzdFplcm8gfX1bMS05XSopMCskYCwgJ2cnKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdmFsdWUucmVwbGFjZSh0cmltUmVnZXgsICckMScpLnJlcGxhY2UodHJhaWxpbmdQb2ludFJlZ0V4cCwgRU1QVFkpO1xufVxuXG5mdW5jdGlvbiByb3VuZE51bWJlcihmb3JtYXRPcHRpb25zKSB7XG4gICAgbGV0IHsgbnVtYmVyLCBmb3JtYXQgfSA9IGZvcm1hdE9wdGlvbnM7XG4gICAgbGV0IGRlY2ltYWxJbmRleCA9IGZvcm1hdC5pbmRleE9mKFBPSU5UKTtcblxuICAgIGlmIChkZWNpbWFsSW5kZXggIT09IC0xKSB7XG4gICAgICAgIGNvbnN0IHplcm9JbmRleCA9IGZvcm1hdC5sYXN0SW5kZXhPZihaRVJPKSAtIGRlY2ltYWxJbmRleDtcbiAgICAgICAgY29uc3Qgc2hhcnBJbmRleCA9IGZvcm1hdC5sYXN0SW5kZXhPZihTSEFSUCkgLSBkZWNpbWFsSW5kZXg7XG4gICAgICAgIGNvbnN0IGhhc1plcm8gPSB6ZXJvSW5kZXggPiAtMTtcbiAgICAgICAgY29uc3QgaGFzU2hhcnAgPSBzaGFycEluZGV4ID4gLTE7XG4gICAgICAgIGxldCBmcmFjdGlvbiA9IG51bWJlci50b1N0cmluZygpLnNwbGl0KFwiZVwiKTtcblxuICAgICAgICBpZiAoZnJhY3Rpb25bMV0pIHtcbiAgICAgICAgICAgIGZyYWN0aW9uID0gcm91bmQobnVtYmVyLCBNYXRoLmFicyhmcmFjdGlvblsxXSkpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZnJhY3Rpb24gPSBmcmFjdGlvblswXTtcbiAgICAgICAgfVxuICAgICAgICBmcmFjdGlvbiA9IGZyYWN0aW9uLnNwbGl0KFBPSU5UKVsxXSB8fCBFTVBUWTtcblxuICAgICAgICBsZXQgcHJlY2lzaW9uID0gZnJhY3Rpb24ubGVuZ3RoO1xuICAgICAgICBsZXQgdHJhaWxpbmdaZXJvcyA9IC0xO1xuXG4gICAgICAgIGlmICghaGFzWmVybyAmJiAhaGFzU2hhcnApIHtcbiAgICAgICAgICAgIGZvcm1hdE9wdGlvbnMuZm9ybWF0ID0gZm9ybWF0LnN1YnN0cmluZygwLCBkZWNpbWFsSW5kZXgpICsgZm9ybWF0LnN1YnN0cmluZyhkZWNpbWFsSW5kZXggKyAxKTtcbiAgICAgICAgICAgIGRlY2ltYWxJbmRleCA9IC0xO1xuICAgICAgICAgICAgcHJlY2lzaW9uID0gMDtcbiAgICAgICAgfSBlbHNlIGlmIChoYXNaZXJvICYmIHplcm9JbmRleCA+IHNoYXJwSW5kZXgpIHtcbiAgICAgICAgICAgIHByZWNpc2lvbiA9IHplcm9JbmRleDtcbiAgICAgICAgfSBlbHNlIGlmIChzaGFycEluZGV4ID4gemVyb0luZGV4KSB7XG4gICAgICAgICAgICBpZiAoaGFzU2hhcnAgJiYgcHJlY2lzaW9uID4gc2hhcnBJbmRleCkge1xuICAgICAgICAgICAgICAgIHByZWNpc2lvbiA9IHNoYXJwSW5kZXg7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGhhc1plcm8gJiYgcHJlY2lzaW9uIDwgemVyb0luZGV4KSB7XG4gICAgICAgICAgICAgICAgcHJlY2lzaW9uID0gemVyb0luZGV4O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0cmFpbGluZ1plcm9zID0gaGFzWmVybyA/IHplcm9JbmRleCA6IDA7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAocHJlY2lzaW9uID4gLTEpIHtcbiAgICAgICAgICAgIG51bWJlciA9IHJvdW5kKG51bWJlciwgcHJlY2lzaW9uKTtcbiAgICAgICAgICAgIGlmICh0cmFpbGluZ1plcm9zID4gLTEpIHtcbiAgICAgICAgICAgICAgICBudW1iZXIgPSB0cmltVHJhaWxpbmdaZXJvcyhudW1iZXIsIHRyYWlsaW5nWmVyb3MpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgICAgbnVtYmVyID0gcm91bmQobnVtYmVyKTtcbiAgICB9XG5cbiAgICBpZiAoZm9ybWF0T3B0aW9ucy5uZWdhdGl2ZSAmJiAobnVtYmVyICogLTEpID49IDAgJiYgIWZvcm1hdE9wdGlvbnMubmVnYXRpdmVaZXJvKSB7XG4gICAgICAgIGZvcm1hdE9wdGlvbnMubmVnYXRpdmUgPSBmYWxzZTtcbiAgICB9XG5cbiAgICBmb3JtYXRPcHRpb25zLm51bWJlciA9IG51bWJlcjtcbiAgICBmb3JtYXRPcHRpb25zLmRlY2ltYWxJbmRleCA9IGRlY2ltYWxJbmRleDtcbn1cblxuZnVuY3Rpb24gaXNDb25zdGFudEZvcm1hdChmb3JtYXQpIHtcbiAgICByZXR1cm4gZm9ybWF0LmluZGV4T2YoU0hBUlApID09PSAtMSAmJiBmb3JtYXQuaW5kZXhPZihaRVJPKSA9PT0gLTE7XG59XG5cbmZ1bmN0aW9uIHNldFZhbHVlU3BlY2lmaWNGb3JtYXQoZm9ybWF0T3B0aW9ucykge1xuICAgIGxldCB7IG51bWJlciwgZm9ybWF0IH0gPSBmb3JtYXRPcHRpb25zO1xuICAgIGZvcm1hdCA9IGZvcm1hdC5zcGxpdChMSVNUX1NFUEFSQVRPUik7XG4gICAgaWYgKChmb3JtYXRPcHRpb25zLm5lZ2F0aXZlIHx8IGZvcm1hdE9wdGlvbnMubmVnYXRpdmVaZXJvKSAmJiBmb3JtYXRbMV0pIHtcbiAgICAgICAgZm9ybWF0ID0gZm9ybWF0WzFdO1xuICAgICAgICBmb3JtYXRPcHRpb25zLmhhc05lZ2F0aXZlRm9ybWF0ID0gdHJ1ZTtcbiAgICB9IGVsc2UgaWYgKG51bWJlciA9PT0gMCkge1xuICAgICAgICBjb25zdCB6ZXJvRm9ybWF0ID0gZm9ybWF0WzJdO1xuICAgICAgICBmb3JtYXQgPSB6ZXJvRm9ybWF0IHx8IGZvcm1hdFswXTtcbiAgICAgICAgaWYgKHplcm9Gb3JtYXQgJiYgaXNDb25zdGFudEZvcm1hdCh6ZXJvRm9ybWF0KSkge1xuICAgICAgICAgICAgZm9ybWF0T3B0aW9ucy5jb25zdGFudCA9IHplcm9Gb3JtYXQ7XG4gICAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgICBmb3JtYXQgPSBmb3JtYXRbMF07XG4gICAgfVxuXG4gICAgZm9ybWF0T3B0aW9ucy5mb3JtYXQgPSBmb3JtYXQ7XG59XG5cbmZ1bmN0aW9uIHNldEdyb3VwT3B0aW9ucyhmb3JtYXRPcHRpb25zKSB7XG4gICAgZm9ybWF0T3B0aW9ucy5oYXNHcm91cCA9IGZvcm1hdE9wdGlvbnMuZm9ybWF0LmluZGV4T2YoR1JPVVBfU0VQQVJBVE9SKSA+IC0xO1xuICAgIGlmIChmb3JtYXRPcHRpb25zLmhhc0dyb3VwKSB7XG4gICAgICAgIGZvcm1hdE9wdGlvbnMuZm9ybWF0ID0gZm9ybWF0T3B0aW9ucy5mb3JtYXQucmVwbGFjZShjb21tYVJlZ0V4cCwgRU1QVFkpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gcGxhY2Vob2xkZXJJbmRleChpbmRleDEsIGluZGV4Miwgc3RhcnQpIHtcbiAgICBsZXQgaW5kZXg7XG4gICAgaWYgKGluZGV4MSA9PT0gLTEgJiYgaW5kZXgyICE9PSAtMSkge1xuICAgICAgICBpbmRleCA9IGluZGV4MjtcbiAgICB9IGVsc2UgaWYgKGluZGV4MSAhPT0gLTEgJiYgaW5kZXgyID09PSAtMSkge1xuICAgICAgICBpbmRleCA9IGluZGV4MTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBpbmRleCA9IHN0YXJ0ID8gTWF0aC5taW4oaW5kZXgxLCBpbmRleDIpIDogTWF0aC5tYXgoaW5kZXgxLCBpbmRleDIpO1xuICAgIH1cbiAgICByZXR1cm4gaW5kZXg7XG59XG5cbmZ1bmN0aW9uIHNldFBsYWNlaG9sZGVySW5kaWNlcyhmb3JtYXRPcHRpb25zKSB7XG4gICAgY29uc3QgZm9ybWF0ID0gZm9ybWF0T3B0aW9ucy5mb3JtYXQ7XG4gICAgbGV0IHNoYXJwSW5kZXggPSBmb3JtYXQuaW5kZXhPZihTSEFSUCk7XG4gICAgbGV0IHplcm9JbmRleCA9IGZvcm1hdC5pbmRleE9mKFpFUk8pO1xuXG4gICAgbGV0IHN0YXJ0ID0gcGxhY2Vob2xkZXJJbmRleChzaGFycEluZGV4LCB6ZXJvSW5kZXgsIHRydWUpO1xuXG4gICAgc2hhcnBJbmRleCA9IGZvcm1hdC5sYXN0SW5kZXhPZihTSEFSUCk7XG4gICAgemVyb0luZGV4ID0gZm9ybWF0Lmxhc3RJbmRleE9mKFpFUk8pO1xuXG4gICAgbGV0IGVuZCA9IHBsYWNlaG9sZGVySW5kZXgoc2hhcnBJbmRleCwgemVyb0luZGV4KTtcblxuICAgIGlmIChzdGFydCA9PT0gZm9ybWF0Lmxlbmd0aCkge1xuICAgICAgICBlbmQgPSBzdGFydDtcbiAgICB9XG5cbiAgICBmb3JtYXRPcHRpb25zLnN0YXJ0ID0gc3RhcnQ7XG4gICAgZm9ybWF0T3B0aW9ucy5lbmQgPSBlbmQ7XG4gICAgZm9ybWF0T3B0aW9ucy5sYXN0WmVyb0luZGV4ID0gemVyb0luZGV4O1xufVxuXG5mdW5jdGlvbiByZXBsYWNlU3R5bGVTeW1ib2xzKG51bWJlciwgc3R5bGUsIHN5bWJvbCkge1xuICAgIGxldCByZXN1bHQgPSBudW1iZXI7XG4gICAgaWYgKHN0eWxlID09PSBDVVJSRU5DWSB8fCBzdHlsZSA9PT0gUEVSQ0VOVCkge1xuICAgICAgICByZXN1bHQgPSBFTVBUWTtcbiAgICAgICAgZm9yIChsZXQgaWR4ID0gMCwgbGVuZ3RoID0gbnVtYmVyLmxlbmd0aDsgaWR4IDwgbGVuZ3RoOyBpZHgrKykge1xuICAgICAgICAgICAgbGV0IGNoID0gbnVtYmVyLmNoYXJBdChpZHgpO1xuICAgICAgICAgICAgcmVzdWx0ICs9IChjaCA9PT0gQ1VSUkVOQ1lfUExBQ0VIT0xERVIgfHwgY2ggPT09IFBFUkNFTlRfUExBQ0VIT0xERVIpID8gc3ltYm9sIDogY2g7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbn1cblxuZnVuY3Rpb24gcmVwbGFjZVBsYWNlSG9sZGVycyhmb3JtYXRPcHRpb25zLCBpbmZvKSB7XG4gICAgY29uc3QgeyBzdGFydCwgZW5kLCBuZWdhdGl2ZSwgbmVnYXRpdmVaZXJvLCBmb3JtYXQsIGRlY2ltYWxJbmRleCwgbGFzdFplcm9JbmRleCwgaGFzTmVnYXRpdmVGb3JtYXQsIGhhc0dyb3VwIH0gPSBmb3JtYXRPcHRpb25zO1xuICAgIGxldCBudW1iZXIgPSBmb3JtYXRPcHRpb25zLm51bWJlcjtcbiAgICBjb25zdCB2YWx1ZSA9IG51bWJlci50b1N0cmluZygpLnNwbGl0KFBPSU5UKTtcbiAgICBjb25zdCBsZW5ndGggPSBmb3JtYXQubGVuZ3RoO1xuICAgIGNvbnN0IGludGVnZXIgPSB2YWx1ZVswXTtcbiAgICBjb25zdCBmcmFjdGlvbiA9IHZhbHVlWzFdIHx8IEVNUFRZO1xuICAgIGNvbnN0IGludGVnZXJMZW5ndGggPSBpbnRlZ2VyLmxlbmd0aDtcbiAgICBsZXQgcmVwbGFjZW1lbnQgPSBFTVBUWTtcblxuICAgIG51bWJlciA9IGZvcm1hdC5zdWJzdHJpbmcoMCwgc3RhcnQpO1xuXG4gICAgaWYgKChuZWdhdGl2ZSB8fCBuZWdhdGl2ZVplcm8pICYmICFoYXNOZWdhdGl2ZUZvcm1hdCkge1xuICAgICAgICBudW1iZXIgKz0gXCItXCI7XG4gICAgfVxuXG4gICAgZm9yIChsZXQgaWR4ID0gc3RhcnQ7IGlkeCA8IGxlbmd0aDsgaWR4KyspIHtcbiAgICAgICAgbGV0IGNoID0gZm9ybWF0LmNoYXJBdChpZHgpO1xuXG4gICAgICAgIGlmIChkZWNpbWFsSW5kZXggPT09IC0xKSB7XG4gICAgICAgICAgICBpZiAoZW5kIC0gaWR4IDwgaW50ZWdlckxlbmd0aCkge1xuXG4gICAgICAgICAgICAgICAgbnVtYmVyICs9IGludGVnZXI7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpZiAobGFzdFplcm9JbmRleCAhPT0gLTEgJiYgbGFzdFplcm9JbmRleCA8IGlkeCkge1xuICAgICAgICAgICAgICAgIHJlcGxhY2VtZW50ID0gRU1QVFk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICgoZGVjaW1hbEluZGV4IC0gaWR4KSA8PSBpbnRlZ2VyTGVuZ3RoICYmIGRlY2ltYWxJbmRleCAtIGlkeCA+IC0xKSB7XG4gICAgICAgICAgICAgICAgbnVtYmVyICs9IGludGVnZXI7XG4gICAgICAgICAgICAgICAgaWR4ID0gZGVjaW1hbEluZGV4O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoZGVjaW1hbEluZGV4ID09PSBpZHgpIHtcbiAgICAgICAgICAgICAgICBudW1iZXIgKz0gKGZyYWN0aW9uID8gaW5mby5udW1iZXJzLnN5bWJvbHMuZGVjaW1hbCA6IEVNUFRZKSArIGZyYWN0aW9uO1xuICAgICAgICAgICAgICAgIGlkeCArPSBlbmQgLSBkZWNpbWFsSW5kZXggKyAxO1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGNoID09PSBaRVJPKSB7XG4gICAgICAgICAgICBudW1iZXIgKz0gY2g7XG4gICAgICAgICAgICByZXBsYWNlbWVudCA9IGNoO1xuICAgICAgICB9IGVsc2UgaWYgKGNoID09PSBTSEFSUCkge1xuICAgICAgICAgICAgbnVtYmVyICs9IHJlcGxhY2VtZW50O1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGhhc0dyb3VwKSB7XG4gICAgICAgIG51bWJlciA9IGdyb3VwSW50ZWdlcihudW1iZXIsIHN0YXJ0ICsgKG5lZ2F0aXZlICYmICFoYXNOZWdhdGl2ZUZvcm1hdCA/IDEgOiAwKSwgTWF0aC5tYXgoZW5kLCAoaW50ZWdlckxlbmd0aCArIHN0YXJ0KSksIGluZm8ubnVtYmVycy5kZWNpbWFsLCBpbmZvKTtcbiAgICB9XG5cbiAgICBpZiAoZW5kID49IHN0YXJ0KSB7XG4gICAgICAgIG51bWJlciArPSBmb3JtYXQuc3Vic3RyaW5nKGVuZCArIDEpO1xuICAgIH1cblxuICAgIHJldHVybiBudW1iZXI7XG59XG5cbmZ1bmN0aW9uIGFwcGx5Q3VzdG9tRm9ybWF0KGZvcm1hdE9wdGlvbnMsIGluZm8pIHtcbiAgICBsZXQgbnVtYmVyID0gZm9ybWF0T3B0aW9ucy5udW1iZXI7XG4gICAgaWYgKGZvcm1hdE9wdGlvbnMuc3RhcnQgIT09IC0xKSB7XG4gICAgICAgIG51bWJlciA9IHJlcGxhY2VQbGFjZUhvbGRlcnMoZm9ybWF0T3B0aW9ucywgaW5mbyk7XG4gICAgICAgIG51bWJlciA9IHJlcGxhY2VTdHlsZVN5bWJvbHMobnVtYmVyLCBmb3JtYXRPcHRpb25zLnN0eWxlLCBmb3JtYXRPcHRpb25zLnN5bWJvbCk7XG4gICAgICAgIG51bWJlciA9IHJlcGxhY2VMaXRlcmFscyhudW1iZXIsIGZvcm1hdE9wdGlvbnMubGl0ZXJhbHMpO1xuICAgIH1cblxuICAgIHJldHVybiBudW1iZXI7XG59XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGN1c3RvbU51bWJlckZvcm1hdChudW1iZXIsIGZvcm1hdCwgaW5mbykge1xuICAgIGNvbnN0IGZvcm1hdE9wdGlvbnMgPSB7XG4gICAgICAgIG5lZ2F0aXZlOiBudW1iZXIgPCAwLFxuICAgICAgICBudW1iZXI6IE1hdGguYWJzKG51bWJlciksXG4gICAgICAgIG5lZ2F0aXZlWmVybzogaXNOZWdhdGl2ZVplcm8obnVtYmVyKSxcbiAgICAgICAgZm9ybWF0OiBmb3JtYXRcbiAgICB9O1xuXG4gICAgc2V0VmFsdWVTcGVjaWZpY0Zvcm1hdChmb3JtYXRPcHRpb25zKTtcblxuICAgIGlmIChmb3JtYXRPcHRpb25zLmNvbnN0YW50KSB7XG4gICAgICAgIHJldHVybiBmb3JtYXRPcHRpb25zLmNvbnN0YW50O1xuICAgIH1cblxuICAgIHNldEZvcm1hdExpdGVyYWxzKGZvcm1hdE9wdGlvbnMpO1xuICAgIHNldFN0eWxlT3B0aW9ucyhmb3JtYXRPcHRpb25zLCBpbmZvKTtcbiAgICBzZXRHcm91cE9wdGlvbnMoZm9ybWF0T3B0aW9ucyk7XG4gICAgcm91bmROdW1iZXIoZm9ybWF0T3B0aW9ucyk7XG4gICAgc2V0UGxhY2Vob2xkZXJJbmRpY2VzKGZvcm1hdE9wdGlvbnMpO1xuXG4gICAgcmV0dXJuIGFwcGx5Q3VzdG9tRm9ybWF0KGZvcm1hdE9wdGlvbnMsIGluZm8pO1xufSIsImltcG9ydCB7IENVUlJFTkNZLCBBQ0NPVU5USU5HLCBERUNJTUFMLCBQRVJDRU5ULCBTQ0lFTlRJRklDIH0gZnJvbSAnLi4vY29tbW9uL2NvbnN0YW50cyc7XG5pbXBvcnQgaXNTdHJpbmcgZnJvbSAnLi4vY29tbW9uL2lzLXN0cmluZyc7XG5cbmNvbnN0IHN0YW5kYXJkRm9ybWF0UmVnRXhwID0gL14obnxjfHB8ZXxhKShcXGQqKSQvaTtcblxuZnVuY3Rpb24gc3RhbmRhcmRGb3JtYXRPcHRpb25zKGZvcm1hdCkge1xuICAgIGNvbnN0IGZvcm1hdEFuZFByZWNpc2lvbiA9IHN0YW5kYXJkRm9ybWF0UmVnRXhwLmV4ZWMoZm9ybWF0KTtcblxuICAgIGlmIChmb3JtYXRBbmRQcmVjaXNpb24pIHtcbiAgICAgICAgY29uc3Qgb3B0aW9ucyA9IHtcbiAgICAgICAgICAgIHN0eWxlOiBERUNJTUFMXG4gICAgICAgIH07XG5cbiAgICAgICAgbGV0IHN0eWxlID0gZm9ybWF0QW5kUHJlY2lzaW9uWzFdLnRvTG93ZXJDYXNlKCk7XG5cbiAgICAgICAgaWYgKHN0eWxlID09PSBcImNcIikge1xuICAgICAgICAgICAgb3B0aW9ucy5zdHlsZSA9IENVUlJFTkNZO1xuICAgICAgICB9IGVsc2UgaWYgKHN0eWxlID09PSBcImFcIikge1xuICAgICAgICAgICAgb3B0aW9ucy5zdHlsZSA9IEFDQ09VTlRJTkc7XG4gICAgICAgIH0gZWxzZSBpZiAoc3R5bGUgPT09IFwicFwiKSB7XG4gICAgICAgICAgICBvcHRpb25zLnN0eWxlID0gUEVSQ0VOVDtcbiAgICAgICAgfSBlbHNlIGlmIChzdHlsZSA9PT0gXCJlXCIpIHtcbiAgICAgICAgICAgIG9wdGlvbnMuc3R5bGUgPSBTQ0lFTlRJRklDO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGZvcm1hdEFuZFByZWNpc2lvblsyXSkge1xuICAgICAgICAgICAgb3B0aW9ucy5taW5pbXVtRnJhY3Rpb25EaWdpdHMgPSBvcHRpb25zLm1heGltdW1GcmFjdGlvbkRpZ2l0cyA9IHBhcnNlSW50KGZvcm1hdEFuZFByZWNpc2lvblsyXSwgMTApO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG9wdGlvbnM7XG4gICAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBmb3JtYXRPcHRpb25zKGZvcm1hdCkge1xuICAgIGxldCBvcHRpb25zO1xuICAgIGlmIChpc1N0cmluZyhmb3JtYXQpKSB7XG4gICAgICAgIG9wdGlvbnMgPSBzdGFuZGFyZEZvcm1hdE9wdGlvbnMoZm9ybWF0KTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBvcHRpb25zID0gZm9ybWF0O1xuICAgIH1cblxuICAgIHJldHVybiBvcHRpb25zO1xufSIsImltcG9ydCB7IGxvY2FsZUluZm8gfSBmcm9tICcuLi9jbGRyJztcbmltcG9ydCB7IERFQ0lNQUwsIERFRkFVTFRfTE9DQUxFLCBOVU1CRVJfUExBQ0VIT0xERVIsIEVNUFRZIH0gZnJvbSAnLi4vY29tbW9uL2NvbnN0YW50cyc7XG5pbXBvcnQgc3RhbmRhcmROdW1iZXJGb3JtYXQgZnJvbSAnLi9zdGFuZGFyZC1udW1iZXItZm9ybWF0JztcbmltcG9ydCBjdXN0b21OdW1iZXJGb3JtYXQgZnJvbSAnLi9jdXN0b20tbnVtYmVyLWZvcm1hdCc7XG5pbXBvcnQgZm9ybWF0T3B0aW9ucyBmcm9tICcuL2Zvcm1hdC1vcHRpb25zJztcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gZm9ybWF0TnVtYmVyKG51bWJlciwgZm9ybWF0ID0gTlVNQkVSX1BMQUNFSE9MREVSLCBsb2NhbGUgPSBERUZBVUxUX0xPQ0FMRSkge1xuICAgIGlmIChudW1iZXIgPT09IHVuZGVmaW5lZCB8fCBudW1iZXIgPT09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuIEVNUFRZO1xuICAgIH1cblxuICAgIGlmICghaXNGaW5pdGUobnVtYmVyKSkge1xuICAgICAgICByZXR1cm4gU3RyaW5nKG51bWJlcik7XG4gICAgfVxuXG4gICAgY29uc3QgaW5mbyA9IGxvY2FsZUluZm8obG9jYWxlKTtcbiAgICBjb25zdCBvcHRpb25zID0gZm9ybWF0T3B0aW9ucyhmb3JtYXQpO1xuXG4gICAgbGV0IHJlc3VsdDtcbiAgICBpZiAob3B0aW9ucykge1xuICAgICAgICBjb25zdCBzdHlsZSA9IG9wdGlvbnMuc3R5bGUgfHwgREVDSU1BTDtcbiAgICAgICAgcmVzdWx0ID0gc3RhbmRhcmROdW1iZXJGb3JtYXQobnVtYmVyLCBPYmplY3QuYXNzaWduKHt9LCBpbmZvLm51bWJlcnNbc3R5bGVdLCBvcHRpb25zKSwgaW5mbyk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmVzdWx0ID0gY3VzdG9tTnVtYmVyRm9ybWF0KG51bWJlciwgZm9ybWF0LCBpbmZvKTtcbiAgICB9XG5cbiAgICByZXR1cm4gcmVzdWx0O1xufVxuIiwiZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gaXNOdW1iZXIodmFsdWUpIHtcbiAgICByZXR1cm4gdHlwZW9mIHZhbHVlID09PSBcIm51bWJlclwiO1xufSIsImltcG9ydCB7IGxvY2FsZUluZm8sIGxvY2FsZUN1cnJlbmN5LCBjdXJyZW5jeURpc3BsYXlzIH0gZnJvbSAnLi4vY2xkcic7XG5pbXBvcnQgeyBQRVJDRU5ULCBOVU1CRVJfUExBQ0VIT0xERVIsIENVUlJFTkNZX1BMQUNFSE9MREVSLCBERUZBVUxUX0xPQ0FMRSwgRU1QVFksIFBPSU5UIH0gZnJvbSAnLi4vY29tbW9uL2NvbnN0YW50cyc7XG5pbXBvcnQgeyBzZXRTdHlsZU9wdGlvbnMsIHNldEZvcm1hdExpdGVyYWxzIH0gZnJvbSAnLi91dGlscyc7XG5pbXBvcnQgaXNOdW1iZXIgZnJvbSAnLi4vY29tbW9uL2lzLW51bWJlcic7XG5pbXBvcnQgaXNDdXJyZW5jeVN0eWxlIGZyb20gJy4vaXMtY3VycmVuY3ktc3R5bGUnO1xuaW1wb3J0IGZvcm1hdE9wdGlvbnMgZnJvbSAnLi9mb3JtYXQtb3B0aW9ucyc7XG5pbXBvcnQgaXNTdHJpbmcgZnJvbSAnLi4vY29tbW9uL2lzLXN0cmluZyc7XG5cbmNvbnN0IGV4cG9uZW50UmVnRXhwID0gL1tlRV1bLStdP1swLTldKy87XG5jb25zdCBub25CcmVha2luZ1NwYWNlUmVnRXhwID0gL1xcdTAwQTAvZztcblxuZnVuY3Rpb24gY2xlYW5OZWdhdGl2ZVBhdHRlcm4obnVtYmVyLCBwYXR0ZXJucykge1xuICAgIGlmIChwYXR0ZXJucy5sZW5ndGggPiAxKSB7XG4gICAgICAgIGNvbnN0IHBhcnRzID0gKHBhdHRlcm5zWzFdIHx8IEVNUFRZKS5yZXBsYWNlKENVUlJFTkNZX1BMQUNFSE9MREVSLCBFTVBUWSkuc3BsaXQoTlVNQkVSX1BMQUNFSE9MREVSKTtcbiAgICAgICAgaWYgKG51bWJlci5pbmRleE9mKHBhcnRzWzBdKSA+IC0xICYmIG51bWJlci5pbmRleE9mKHBhcnRzWzFdKSA+IC0xKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVtYmVyLnJlcGxhY2UocGFydHNbMF0sIEVNUFRZKS5yZXBsYWNlKHBhcnRzWzFdLCBFTVBUWSk7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIGNsZWFuQ3VycmVuY3lOdW1iZXIodmFsdWUsIGluZm8sIGZvcm1hdCkge1xuICAgIGNvbnN0IG9wdGlvbnMgPSBmb3JtYXRPcHRpb25zKGZvcm1hdCkgfHwge307XG4gICAgbGV0IGlzQ3VycmVuY3kgPSBpc0N1cnJlbmN5U3R5bGUob3B0aW9ucy5zdHlsZSk7XG4gICAgbGV0IG51bWJlciA9IHZhbHVlO1xuICAgIGxldCBuZWdhdGl2ZTtcblxuICAgIGNvbnN0IGN1cnJlbmN5ID0gb3B0aW9ucy5jdXJyZW5jeSB8fCBsb2NhbGVDdXJyZW5jeShpbmZvLCBpc0N1cnJlbmN5KTtcblxuICAgIGlmIChjdXJyZW5jeSkge1xuICAgICAgICBjb25zdCBkaXNwbGF5cyA9IGN1cnJlbmN5RGlzcGxheXMoaW5mbywgY3VycmVuY3ksIGlzQ3VycmVuY3kpO1xuICAgICAgICBpZiAoZGlzcGxheXMpIHtcbiAgICAgICAgICAgIGZvciAobGV0IGlkeCA9IDA7IGlkeCA8IGRpc3BsYXlzLmxlbmd0aDsgaWR4KyspIHtcbiAgICAgICAgICAgICAgICBsZXQgZGlzcGxheSA9IGRpc3BsYXlzW2lkeF07XG4gICAgICAgICAgICAgICAgaWYgKG51bWJlci5pbmNsdWRlcyhkaXNwbGF5KSkge1xuICAgICAgICAgICAgICAgICAgICBudW1iZXIgPSBudW1iZXIucmVwbGFjZShkaXNwbGF5LCBFTVBUWSk7XG4gICAgICAgICAgICAgICAgICAgIGlzQ3VycmVuY3kgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoaXNDdXJyZW5jeSkge1xuICAgICAgICAgICAgY29uc3QgY2xlYW5OdW1iZXIgPSBjbGVhbk5lZ2F0aXZlUGF0dGVybihudW1iZXIsIGluZm8ubnVtYmVycy5jdXJyZW5jeS5wYXR0ZXJucykgfHxcbiAgICAgICAgICAgICAgICBjbGVhbk5lZ2F0aXZlUGF0dGVybihudW1iZXIsIGluZm8ubnVtYmVycy5hY2NvdW50aW5nLnBhdHRlcm5zKTtcblxuICAgICAgICAgICAgaWYgKGNsZWFuTnVtYmVyKSB7XG4gICAgICAgICAgICAgICAgbmVnYXRpdmUgPSB0cnVlO1xuICAgICAgICAgICAgICAgIG51bWJlciA9IGNsZWFuTnVtYmVyO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBudW1iZXI6IG51bWJlcixcbiAgICAgICAgbmVnYXRpdmU6IG5lZ2F0aXZlXG4gICAgfTtcbn1cblxuZnVuY3Rpb24gY2xlYW5MaXRlcmFscyhudW1iZXIsIGZvcm1hdE9wdGlvbnMpIHtcbiAgICBjb25zdCBsaXRlcmFscyA9IGZvcm1hdE9wdGlvbnMubGl0ZXJhbHM7XG4gICAgbGV0IHJlc3VsdCA9IG51bWJlcjtcblxuICAgIGlmIChsaXRlcmFscykge1xuICAgICAgICBmb3IgKGxldCBpZHggPSAwOyBpZHggPCBsaXRlcmFscy5sZW5ndGg7IGlkeCsrKSB7XG4gICAgICAgICAgICByZXN1bHQgPSByZXN1bHQucmVwbGFjZShsaXRlcmFsc1tpZHhdLCBFTVBUWSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gcmVzdWx0O1xufVxuXG5mdW5jdGlvbiBkaXZpZGVCeTEwMChudW1iZXIpIHtcbiAgICBjb25zdCBzdHJOdW1iZXIgPSBTdHJpbmcobnVtYmVyKTtcbiAgICBjb25zdCBwb2ludEluZGV4ID0gc3RyTnVtYmVyLmluZGV4T2YoUE9JTlQpO1xuICAgIGNvbnN0IHplcm9lc0NvdW50ID0gMjtcbiAgICBsZXQgcmVzdWx0ID0gbnVtYmVyIC8gTWF0aC5wb3coMTAsIHplcm9lc0NvdW50KTtcblxuICAgIGlmIChwb2ludEluZGV4ID09PSAtMSB8fCBTdHJpbmcocmVzdWx0KS5sZW5ndGggPD0gc3RyTnVtYmVyLmxlbmd0aCArIHplcm9lc0NvdW50KSB7XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuXG4gICAgY29uc3QgZnJhY3Rpb25EaWdpdHMgPSBzdHJOdW1iZXIubGVuZ3RoIC0gcG9pbnRJbmRleCArIDEgKyB6ZXJvZXNDb3VudDtcbiAgICByZXR1cm4gcGFyc2VGbG9hdChyZXN1bHQudG9GaXhlZChmcmFjdGlvbkRpZ2l0cykpO1xufVxuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBwYXJzZU51bWJlcih2YWx1ZSwgbG9jYWxlID0gREVGQVVMVF9MT0NBTEUsIGZvcm1hdCA9IHt9KSB7XG4gICAgaWYgKCF2YWx1ZSAmJiB2YWx1ZSAhPT0gMCkge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICBpZiAoaXNOdW1iZXIodmFsdWUpKSB7XG4gICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICB9XG5cbiAgICBjb25zdCBpbmZvID0gbG9jYWxlSW5mbyhsb2NhbGUpO1xuICAgIGNvbnN0IHN5bWJvbHMgPSBpbmZvLm51bWJlcnMuc3ltYm9scztcblxuICAgIGxldCBudW1iZXIgPSB2YWx1ZS50b1N0cmluZygpO1xuICAgIGxldCBmb3JtYXRPcHRpb25zID0gZm9ybWF0IHx8IHt9O1xuICAgIGxldCBpc1BlcmNlbnQ7XG5cbiAgICBpZiAoaXNTdHJpbmcoZm9ybWF0KSkge1xuICAgICAgICBmb3JtYXRPcHRpb25zID0geyBmb3JtYXQ6IGZvcm1hdCB9O1xuICAgICAgICBzZXRGb3JtYXRMaXRlcmFscyhmb3JtYXRPcHRpb25zKTtcbiAgICAgICAgbnVtYmVyID0gY2xlYW5MaXRlcmFscyhudW1iZXIsIGZvcm1hdE9wdGlvbnMpO1xuXG4gICAgICAgIHNldFN0eWxlT3B0aW9ucyhmb3JtYXRPcHRpb25zLCBpbmZvKTtcbiAgICB9XG5cbiAgICBpZiAoZm9ybWF0T3B0aW9ucy5zdHlsZSA9PT0gUEVSQ0VOVCB8fCBudW1iZXIuaW5kZXhPZihzeW1ib2xzLnBlcmNlbnRTaWduKSA+IC0xKSB7XG4gICAgICAgIG51bWJlciA9IG51bWJlci5yZXBsYWNlKHN5bWJvbHMucGVyY2VudFNpZ24sIEVNUFRZKTtcbiAgICAgICAgaXNQZXJjZW50ID0gdHJ1ZTtcbiAgICB9XG5cbiAgICBpZiAoZXhwb25lbnRSZWdFeHAudGVzdChudW1iZXIpKSB7XG4gICAgICAgIG51bWJlciA9IHBhcnNlRmxvYXQobnVtYmVyLnJlcGxhY2Uoc3ltYm9scy5kZWNpbWFsLCBQT0lOVCkpO1xuICAgICAgICByZXR1cm4gaXNOYU4obnVtYmVyKSA/IG51bGwgOiBudW1iZXI7XG4gICAgfVxuXG4gICAgY29uc3QgeyBuZWdhdGl2ZTogbmVnYXRpdmVDdXJyZW5jeSwgbnVtYmVyOiBjdXJyZW5jeU51bWJlciB9ID0gY2xlYW5DdXJyZW5jeU51bWJlcihudW1iZXIsIGluZm8sIGZvcm1hdE9wdGlvbnMpO1xuICAgIG51bWJlciA9IFN0cmluZyhjdXJyZW5jeU51bWJlcikudHJpbSgpO1xuXG4gICAgY29uc3QgbmVnYXRpdmVTaWduSW5kZXggPSBudW1iZXIuaW5kZXhPZihcIi1cIik7XG4gICAgaWYgKG5lZ2F0aXZlU2lnbkluZGV4ID4gMCkge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICBsZXQgaXNOZWdhdGl2ZSA9IG5lZ2F0aXZlU2lnbkluZGV4ID4gLTE7XG5cbiAgICBpc05lZ2F0aXZlID0gbmVnYXRpdmVDdXJyZW5jeSAhPT0gdW5kZWZpbmVkID8gbmVnYXRpdmVDdXJyZW5jeSA6IGlzTmVnYXRpdmU7XG5cbiAgICBudW1iZXIgPSBudW1iZXIucmVwbGFjZShcIi1cIiwgRU1QVFkpXG4gICAgICAgICAgLnJlcGxhY2Uobm9uQnJlYWtpbmdTcGFjZVJlZ0V4cCwgXCIgXCIpXG4gICAgICAgICAgLnNwbGl0KHN5bWJvbHMuZ3JvdXAucmVwbGFjZShub25CcmVha2luZ1NwYWNlUmVnRXhwLCBcIiBcIikpLmpvaW4oRU1QVFkpXG4gICAgICAgICAgLnJlcGxhY2Uoc3ltYm9scy5kZWNpbWFsLCBQT0lOVCk7XG5cbiAgICBudW1iZXIgPSBwYXJzZUZsb2F0KG51bWJlcik7XG5cbiAgICBpZiAoaXNOYU4obnVtYmVyKSkge1xuICAgICAgICBudW1iZXIgPSBudWxsO1xuICAgIH0gZWxzZSBpZiAoaXNOZWdhdGl2ZSkge1xuICAgICAgICBudW1iZXIgKj0gLTE7XG4gICAgfVxuXG4gICAgaWYgKG51bWJlciAmJiBpc1BlcmNlbnQpIHtcbiAgICAgICAgbnVtYmVyID0gZGl2aWRlQnkxMDAobnVtYmVyKTtcbiAgICB9XG5cbiAgICByZXR1cm4gbnVtYmVyO1xufVxuIiwiY29uc3QgZm9ybWF0UmVnRXhwID0gL1xceyhcXGQrKX0vZztcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gZm9ybWF0U3RyaW5nKGZvcm1hdCkge1xuICAgIGNvbnN0IHZhbHVlcyA9IGFyZ3VtZW50cztcblxuICAgIHJldHVybiBmb3JtYXQucmVwbGFjZShmb3JtYXRSZWdFeHAsIChtYXRjaCwgaW5kZXgpID0+IHtcbiAgICAgICAgY29uc3QgdmFsdWUgPSB2YWx1ZXNbcGFyc2VJbnQoaW5kZXgsIDEwKSArIDFdO1xuXG4gICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICB9KTtcbn0iLCJpbXBvcnQgZm9ybWF0U3RyaW5nIGZyb20gJy4uL2NvbW1vbi9mb3JtYXQtc3RyaW5nJztcbmltcG9ydCBpc1N0cmluZyBmcm9tICcuLi9jb21tb24vaXMtc3RyaW5nJztcbmltcG9ydCB7IEVNUFRZIH0gZnJvbSAnLi4vY29tbW9uL2NvbnN0YW50cyc7XG5cbmNvbnN0IFJFTU9WQUxfUEVOQUxUWSA9IDEyMDtcbmNvbnN0IEFERElUSU9OX1BFTkFMVFkgPSAyMDtcbmNvbnN0IExFTkdIVF9ERUxUQSA9IFsgMiwgMSwgNSwgMywgNCBdO1xuY29uc3QgTE9OR19MRVNTX1BFTkFMVFlfREVMVEEgPSAtMjtcbmNvbnN0IFNIT1JUX0xFU1NfUEVOQUxUWV9ERUxUQSA9IC0xO1xuY29uc3QgU0hPUlRfTU9SRV9QRU5BTFRZX0RFTFRBID0gMTtcbmNvbnN0IExPTkdfTU9SRV9QRU5BTFRZX0RFTFRBID0gMjtcblxuY29uc3QgUEVOQUxUSUVTID0ge1xuICAgIFtMT05HX0xFU1NfUEVOQUxUWV9ERUxUQS50b1N0cmluZygpXTogOCxcbiAgICBbU0hPUlRfTEVTU19QRU5BTFRZX0RFTFRBLnRvU3RyaW5nKCldOiA2LFxuICAgIFtMT05HX01PUkVfUEVOQUxUWV9ERUxUQS50b1N0cmluZygpXTogNixcbiAgICBbU0hPUlRfTU9SRV9QRU5BTFRZX0RFTFRBLnRvU3RyaW5nKCldOiAzXG59O1xuXG5jb25zdCBWQUxVRV9GT1JNQVRfTEVOR1RIID0ge1xuICAgIG51bWVyaWM6IDEsXG4gICAgXCIyLWRpZ2l0XCI6IDIsXG4gICAgc2hvcnQ6IDMsXG4gICAgbG9uZzogNCxcbiAgICBuYXJyb3c6IDVcbn07XG5cbmNvbnN0IFRJTUVfU1BFQ0lGSUVSU19SRUdFWCA9IC9baEhtc1N6Wm9PdlZ4WF0vO1xuXG5mdW5jdGlvbiBnZXRIb3VyU3BlY2lmaWVyKG9wdGlvbnMpIHtcbiAgICByZXR1cm4gb3B0aW9ucy5ob3VyMTIgPyBcImhcIiA6IFwiSFwiO1xufVxuXG5jb25zdCBEQVRFX09QVElPTlNfTUFQID0gWyB7XG4gICAga2V5OiBcImVyYVwiLFxuICAgIHNwZWNpZmllcjogXCJHXCJcbn0sIHtcbiAgICBrZXk6IFwieWVhclwiLFxuICAgIHNwZWNpZmllcjogXCJ5XCJcbn0sIHtcbiAgICBrZXk6IFwibW9udGhcIixcbiAgICBzcGVjaWZpZXI6IFwiTVwiXG59LCB7XG4gICAga2V5OiBcImRheVwiLFxuICAgIHNwZWNpZmllcjogXCJkXCJcbn0sIHtcbiAgICBrZXk6IFwid2Vla2RheVwiLFxuICAgIHNwZWNpZmllcjogXCJFXCJcbn0sIHtcbiAgICBrZXk6IFwiaG91clwiLFxuICAgIGdldFNwZWNpZmllcjogZ2V0SG91clNwZWNpZmllclxufSwge1xuICAgIGtleTogXCJtaW51dGVcIixcbiAgICBzcGVjaWZpZXI6IFwibVwiXG59LCB7XG4gICAga2V5OiBcInNlY29uZFwiLFxuICAgIHNwZWNpZmllcjogXCJzXCJcbn0sIHtcbiAgICBrZXk6IFwidGltZVpvbmVOYW1lXCIsXG4gICAgc3BlY2lmaWVyOiBcInpcIlxufSBdO1xuXG5jb25zdCBTVEFORF9BTE9ORV9TUEVDSUZJRVJTID0ge1xuICAgIGU6ICdjJyxcbiAgICBFOiAnYycsXG4gICAgTTogJ0wnLFxuICAgIFE6ICdxJ1xufTtcblxuY29uc3Qgc3BlY2lmaWVyc1JlZ2V4ID0ge307XG5jb25zdCByZXNvbHZlZEZvcm1hdHMgPSB7fTtcblxuZnVuY3Rpb24gZ2V0U3BlY2lmaWVyUmVnZXgoc3BlY2lmaWVyKSB7XG4gICAgaWYgKCFzcGVjaWZpZXJzUmVnZXhbc3BlY2lmaWVyXSkge1xuICAgICAgICBzcGVjaWZpZXJzUmVnZXhbc3BlY2lmaWVyXSA9IG5ldyBSZWdFeHAoc3BlY2lmaWVyICsgXCIrXCIpO1xuICAgIH1cbiAgICByZXR1cm4gc3BlY2lmaWVyc1JlZ2V4W3NwZWNpZmllcl07XG59XG5cbmZ1bmN0aW9uIHNrZWxldG9uU3BlY2lmaWVycyhza2VsZXRvbikge1xuICAgIGNvbnN0IHJlc3VsdCA9IFtdO1xuICAgIGxldCBjdXJyZW50ID0gc2tlbGV0b24uY2hhckF0KDApO1xuICAgIGxldCBzcGVjaWZpZXIgPSBjdXJyZW50O1xuICAgIGZvciAobGV0IGlkeCA9IDE7IGlkeCA8IHNrZWxldG9uLmxlbmd0aDsgaWR4KyspIHtcbiAgICAgICAgbGV0IGNoYXJhY3RlciA9IHNrZWxldG9uLmNoYXJBdChpZHgpO1xuICAgICAgICBpZiAoY2hhcmFjdGVyID09PSBzcGVjaWZpZXIpIHtcbiAgICAgICAgICAgIGN1cnJlbnQgKz0gY2hhcmFjdGVyO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmVzdWx0LnB1c2goY3VycmVudCk7XG4gICAgICAgICAgICBjdXJyZW50ID0gc3BlY2lmaWVyID0gY2hhcmFjdGVyO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmVzdWx0LnB1c2goY3VycmVudCk7XG5cbiAgICByZXR1cm4gcmVzdWx0O1xufVxuXG5mdW5jdGlvbiBmaW5kQmVzdE1hdGNoKHNwZWNpZmllcnMsIGF2YWlsYWJsZUZvcm1hdHMpIHtcbiAgICBjb25zdCBzcGVjaWZpZXJzTGVuZ3RoID0gc3BlY2lmaWVycy5sZW5ndGg7XG4gICAgbGV0IG1heFNjb3JlID0gLU51bWJlci5NQVhfVkFMVUU7XG4gICAgbGV0IGJlc3RNYXRjaGVzLCByZXN1bHQ7XG4gICAgZm9yIChsZXQgZm9ybWF0IGluIGF2YWlsYWJsZUZvcm1hdHMpIHtcbiAgICAgICAgY29uc3QgbWF0Y2hlcyA9IFtdO1xuICAgICAgICBsZXQgY3VycmVudEZvcm1hdCA9IGZvcm1hdC5yZXBsYWNlKFwidlwiLCBcInpcIik7XG4gICAgICAgIGxldCBzY29yZSA9IDA7XG4gICAgICAgIGZvciAobGV0IGlkeCA9IDA7IGlkeCA8IHNwZWNpZmllcnNMZW5ndGg7IGlkeCsrKSB7XG4gICAgICAgICAgICBjb25zdCBzcGVjaWZpZXIgPSBzcGVjaWZpZXJzW2lkeF07XG4gICAgICAgICAgICBsZXQgc3BlY2lmaWVyUmVnZXggPSBnZXRTcGVjaWZpZXJSZWdleChzcGVjaWZpZXJbMF0pO1xuICAgICAgICAgICAgbGV0IG1hdGNoID0gKHNwZWNpZmllclJlZ2V4LmV4ZWMoY3VycmVudEZvcm1hdCkgfHwgW10pWzBdO1xuXG4gICAgICAgICAgICBpZiAoIW1hdGNoKSB7XG4gICAgICAgICAgICAgICAgc2NvcmUgLT0gUkVNT1ZBTF9QRU5BTFRZO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjdXJyZW50Rm9ybWF0ID0gY3VycmVudEZvcm1hdC5yZXBsYWNlKG1hdGNoLCBFTVBUWSk7XG4gICAgICAgICAgICAgICAgaWYgKG1hdGNoLmxlbmd0aCAhPT0gc3BlY2lmaWVyLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICBsZXQgZGVsdGEgPSBNYXRoLm1heChNYXRoLm1pbihMRU5HSFRfREVMVEFbbWF0Y2gubGVuZ3RoXSAtIExFTkdIVF9ERUxUQVtzcGVjaWZpZXIubGVuZ3RoXSwgMiksIC0yKTtcbiAgICAgICAgICAgICAgICAgICAgc2NvcmUgLT0gUEVOQUxUSUVTW2RlbHRhXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIG1hdGNoZXMucHVzaChtYXRjaCk7XG5cbiAgICAgICAgICAgIGlmIChzY29yZSA8IG1heFNjb3JlKSB7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoY3VycmVudEZvcm1hdC5sZW5ndGgpIHtcbiAgICAgICAgICAgIHNjb3JlIC09IHNrZWxldG9uU3BlY2lmaWVycyhjdXJyZW50Rm9ybWF0KS5sZW5ndGggKiBBRERJVElPTl9QRU5BTFRZO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHNjb3JlID4gbWF4U2NvcmUpIHtcbiAgICAgICAgICAgIG1heFNjb3JlID0gc2NvcmU7XG4gICAgICAgICAgICBiZXN0TWF0Y2hlcyA9IG1hdGNoZXM7XG4gICAgICAgICAgICByZXN1bHQgPSBhdmFpbGFibGVGb3JtYXRzW2Zvcm1hdF07XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXN1bHQgPSByZXN1bHQucmVwbGFjZShcInZcIiwgXCJ6XCIpO1xuXG4gICAgZm9yIChsZXQgaWR4ID0gMDsgaWR4IDwgc3BlY2lmaWVyc0xlbmd0aDsgaWR4KyspIHtcbiAgICAgICAgY29uc3QgYmVzdE1hdGNoID0gYmVzdE1hdGNoZXNbaWR4XTtcbiAgICAgICAgaWYgKGJlc3RNYXRjaCAmJiBiZXN0TWF0Y2ggIT09IHNwZWNpZmllcnNbaWR4XSkge1xuICAgICAgICAgICAgY29uc3QgbWF0Y2hTcGVjaWZpZXIgPSBiZXN0TWF0Y2hlc1tpZHhdWzBdO1xuICAgICAgICAgICAgcmVzdWx0ID0gcmVzdWx0LnJlcGxhY2UoZ2V0U3BlY2lmaWVyUmVnZXgobWF0Y2hTcGVjaWZpZXIpLCBzcGVjaWZpZXJzW2lkeF0pO1xuICAgICAgICAgICAgaWYgKFNUQU5EX0FMT05FX1NQRUNJRklFUlNbbWF0Y2hTcGVjaWZpZXJdKSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gcmVzdWx0LnJlcGxhY2UoZ2V0U3BlY2lmaWVyUmVnZXgoU1RBTkRfQUxPTkVfU1BFQ0lGSUVSU1ttYXRjaFNwZWNpZmllcl0pLCBzcGVjaWZpZXJzW2lkeF0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlc3VsdDtcbn1cblxuZnVuY3Rpb24gY2FjaGVGb3JtYXQoc2tlbGV0b24sIGZvcm1hdCwgbG9jYWxlKSB7XG4gICAgaWYgKCFyZXNvbHZlZEZvcm1hdHNbbG9jYWxlXSkge1xuICAgICAgICByZXNvbHZlZEZvcm1hdHNbbG9jYWxlXSA9IHt9O1xuICAgIH1cbiAgICByZXNvbHZlZEZvcm1hdHNbbG9jYWxlXVtza2VsZXRvbl0gPSBmb3JtYXQ7XG59XG5cblxuZnVuY3Rpb24gc2tlbGV0b25Gb3JtYXQoc2tlbGV0b24sIGluZm8pIHtcbiAgICBjb25zdCBhdmFpbGFibGVGb3JtYXRzID0gaW5mby5jYWxlbmRhci5kYXRlVGltZUZvcm1hdHMuYXZhaWxhYmxlRm9ybWF0cztcbiAgICBpZiAoYXZhaWxhYmxlRm9ybWF0c1tza2VsZXRvbl0pIHtcbiAgICAgICAgcmV0dXJuIGF2YWlsYWJsZUZvcm1hdHNbc2tlbGV0b25dO1xuICAgIH1cbiAgICBpZiAocmVzb2x2ZWRGb3JtYXRzW2luZm8ubmFtZV0gJiYgcmVzb2x2ZWRGb3JtYXRzW2luZm8ubmFtZV1bc2tlbGV0b25dKSB7XG4gICAgICAgIHJldHVybiByZXNvbHZlZEZvcm1hdHNbaW5mby5uYW1lXVtza2VsZXRvbl07XG4gICAgfVxuICAgIGNvbnN0IHRpbWVTdGFydEluZGV4ID0gc2tlbGV0b24uc2VhcmNoKFRJTUVfU1BFQ0lGSUVSU19SRUdFWCk7XG4gICAgbGV0IHJlc3VsdDtcbiAgICBpZiAodGltZVN0YXJ0SW5kZXggPiAwKSB7XG4gICAgICAgIGNvbnN0IGRhdGVTa2VsZXRvbiA9IHNrZWxldG9uLnN1YnN0cigwLCB0aW1lU3RhcnRJbmRleCk7XG4gICAgICAgIGNvbnN0IHRpbWVTa2VsZXRvbiA9IHNrZWxldG9uLnN1YnN0cih0aW1lU3RhcnRJbmRleCk7XG5cbiAgICAgICAgcmVzdWx0ID0gZm9ybWF0U3RyaW5nKGluZm8uY2FsZW5kYXIuZGF0ZVRpbWVGb3JtYXRzLnNob3J0LCAvL3Nob3VsZCBiZSBkZXRlcmltZWQgYmFzZWQgb24gc3BlY2lmaWVyc1xuICAgICAgICAgICAgYXZhaWxhYmxlRm9ybWF0c1t0aW1lU2tlbGV0b25dIHx8IGZpbmRCZXN0TWF0Y2goc2tlbGV0b25TcGVjaWZpZXJzKHRpbWVTa2VsZXRvbiksIGF2YWlsYWJsZUZvcm1hdHMpLFxuICAgICAgICAgICAgYXZhaWxhYmxlRm9ybWF0c1tkYXRlU2tlbGV0b25dIHx8IGZpbmRCZXN0TWF0Y2goc2tlbGV0b25TcGVjaWZpZXJzKGRhdGVTa2VsZXRvbiksIGF2YWlsYWJsZUZvcm1hdHMpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXN1bHQgPSBmaW5kQmVzdE1hdGNoKHNrZWxldG9uU3BlY2lmaWVycyhza2VsZXRvbiksIGF2YWlsYWJsZUZvcm1hdHMpO1xuICAgIH1cblxuICAgIGNhY2hlRm9ybWF0KHNrZWxldG9uLCByZXN1bHQsIGluZm8ubmFtZSk7XG4gICAgcmV0dXJuIHJlc3VsdDtcbn1cblxuZnVuY3Rpb24gc2tlbGV0b25Gcm9tT3B0aW9ucyhvcHRpb25zKSB7XG4gICAgbGV0IHJlc3VsdCA9IFtdO1xuICAgIGZvciAobGV0IGlkeCA9IDA7IGlkeCA8IERBVEVfT1BUSU9OU19NQVAubGVuZ3RoOyBpZHgrKykge1xuICAgICAgICBsZXQgb3B0aW9uID0gREFURV9PUFRJT05TX01BUFtpZHhdO1xuICAgICAgICBsZXQgZmllbGQgPSBvcHRpb24ua2V5O1xuICAgICAgICBsZXQgdmFsdWUgPSBvcHRpb25zW2ZpZWxkXTtcbiAgICAgICAgaWYgKHZhbHVlKSB7XG4gICAgICAgICAgICBsZXQgc3BjaWZpZXIgPSBvcHRpb24uc3BlY2lmaWVyIHx8IG9wdGlvbi5nZXRTcGVjaWZpZXIob3B0aW9ucyk7XG4gICAgICAgICAgICByZXN1bHQucHVzaChzcGNpZmllci5yZXBlYXQoVkFMVUVfRk9STUFUX0xFTkdUSFt2YWx1ZV0pKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiByZXN1bHQuam9pbihFTVBUWSk7XG59XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGRhdGVQYXR0ZXJuKGZvcm1hdCwgaW5mbykge1xuICAgIGNvbnN0IGNhbGVuZGFyID0gaW5mby5jYWxlbmRhcjtcbiAgICBsZXQgcmVzdWx0O1xuICAgIGlmIChpc1N0cmluZyhmb3JtYXQpKSB7XG4gICAgICAgIGlmIChjYWxlbmRhci5wYXR0ZXJuc1tmb3JtYXRdKSB7XG4gICAgICAgICAgICByZXN1bHQgPSBjYWxlbmRhci5wYXR0ZXJuc1tmb3JtYXRdO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmVzdWx0ID0gZm9ybWF0O1xuICAgICAgICB9XG4gICAgfSBlbHNlIGlmIChmb3JtYXQpIHtcbiAgICAgICAgaWYgKGZvcm1hdC5wYXR0ZXJuKSB7XG4gICAgICAgICAgICByZXR1cm4gZm9ybWF0LnBhdHRlcm47XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgc2tlbGV0b24gPSBmb3JtYXQuc2tlbGV0b247XG4gICAgICAgIGlmICghc2tlbGV0b24pIHtcbiAgICAgICAgICAgIGlmIChmb3JtYXQuZGF0ZXRpbWUpIHtcbiAgICAgICAgICAgICAgICByZXN1bHQgPSBmb3JtYXRTdHJpbmcoY2FsZW5kYXIuZGF0ZVRpbWVGb3JtYXRzW2Zvcm1hdC5kYXRldGltZV0sIGNhbGVuZGFyLnRpbWVGb3JtYXRzW2Zvcm1hdC5kYXRldGltZV0sIGNhbGVuZGFyLmRhdGVGb3JtYXRzW2Zvcm1hdC5kYXRldGltZV0pO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChmb3JtYXQuZGF0ZSkge1xuICAgICAgICAgICAgICAgIHJlc3VsdCA9IGNhbGVuZGFyLmRhdGVGb3JtYXRzW2Zvcm1hdC5kYXRlXTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZm9ybWF0LnRpbWUpIHtcbiAgICAgICAgICAgICAgICByZXN1bHQgPSBjYWxlbmRhci50aW1lRm9ybWF0c1tmb3JtYXQudGltZV07XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHNrZWxldG9uID0gc2tlbGV0b25Gcm9tT3B0aW9ucyhmb3JtYXQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHNrZWxldG9uKSB7XG4gICAgICAgICAgICByZXN1bHQgPSBza2VsZXRvbkZvcm1hdChza2VsZXRvbiwgaW5mbyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoIXJlc3VsdCkge1xuICAgICAgICByZXN1bHQgPSBjYWxlbmRhci5wYXR0ZXJucy5kO1xuICAgIH1cblxuICAgIHJldHVybiByZXN1bHQ7XG59XG4iLCJleHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBkYXRlTmFtZVR5cGUoZm9ybWF0TGVuZ3RoKSB7XG4gICAgbGV0IG5hbWVUeXBlO1xuICAgIGlmIChmb3JtYXRMZW5ndGggPD0gMykge1xuICAgICAgICBuYW1lVHlwZSA9IFwiYWJicmV2aWF0ZWRcIjtcbiAgICB9IGVsc2UgaWYgKGZvcm1hdExlbmd0aCA9PT0gNCkge1xuICAgICAgICBuYW1lVHlwZSA9IFwid2lkZVwiO1xuICAgIH0gZWxzZSBpZiAoZm9ybWF0TGVuZ3RoID09PSA1KSB7XG4gICAgICAgIG5hbWVUeXBlID0gXCJuYXJyb3dcIjtcbiAgICB9IGVsc2UgaWYgKGZvcm1hdExlbmd0aCA9PT0gNikge1xuICAgICAgICBuYW1lVHlwZSA9IFwic2hvcnRcIjtcbiAgICB9XG5cbiAgICByZXR1cm4gbmFtZVR5cGU7XG59IiwiaW1wb3J0IGRhdGVGb3JtYXROYW1lcyBmcm9tICcuLi9jbGRyL2RhdGUtZm9ybWF0LW5hbWVzJztcbmltcG9ydCBkYXRlTmFtZVR5cGUgZnJvbSAnLi9kYXRlLW5hbWUtdHlwZSc7XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGZvcm1hdE5hbWVzKGxvY2FsZSwgdHlwZSwgZm9ybWF0TGVuZ3RoLCBzdGFuZEFsb25lLCBsb3dlcikge1xuICAgIHJldHVybiBkYXRlRm9ybWF0TmFtZXMobG9jYWxlLCB7XG4gICAgICAgIHR5cGU6IHR5cGUsXG4gICAgICAgIG5hbWVUeXBlOiBkYXRlTmFtZVR5cGUoZm9ybWF0TGVuZ3RoKSxcbiAgICAgICAgc3RhbmRBbG9uZTogc3RhbmRBbG9uZSxcbiAgICAgICAgbG93ZXI6IGxvd2VyXG4gICAgfSk7XG59IiwiZnVuY3Rpb24gaXNGdW5jdGlvbihmdW4pIHtcbiAgICByZXR1cm4gdHlwZW9mKGZ1bikgPT09ICdmdW5jdGlvbic7XG59XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGlzRGF0ZSh2YWx1ZSkge1xuICAgIHJldHVybiBCb29sZWFuKHZhbHVlKSAmJiBpc0Z1bmN0aW9uKHZhbHVlLmdldFRpbWUpICYmIGlzRnVuY3Rpb24odmFsdWUuZ2V0TW9udGgpO1xufVxuIiwiY29uc3QgTU9OVEggPSAnbW9udGgnO1xuY29uc3QgSE9VUiA9ICdob3VyJztcbmNvbnN0IFpPTkUgPSAnem9uZSc7XG5jb25zdCBXRUVLREFZID0gJ3dlZWtkYXknO1xuY29uc3QgUVVBUlRFUiA9ICdxdWFydGVyJztcblxuY29uc3QgREFURV9GSUVMRF9NQVAgPSB7XG4gICAgJ0cnOiAnZXJhJyxcbiAgICAneSc6ICd5ZWFyJyxcbiAgICAncSc6IFFVQVJURVIsXG4gICAgJ1EnOiBRVUFSVEVSLFxuICAgICdNJzogTU9OVEgsXG4gICAgJ0wnOiBNT05USCxcbiAgICAnZCc6ICdkYXknLFxuICAgICdFJzogV0VFS0RBWSxcbiAgICAnYyc6IFdFRUtEQVksXG4gICAgJ2UnOiBXRUVLREFZLFxuICAgICdoJzogSE9VUixcbiAgICAnSCc6IEhPVVIsXG4gICAgJ2snOiBIT1VSLFxuICAgICdLJzogSE9VUixcbiAgICAnbSc6ICdtaW51dGUnLFxuICAgICdzJzogJ3NlY29uZCcsXG4gICAgJ1MnOiAnbWlsbGlzZWNvbmQnLFxuICAgICdhJzogJ2RheXBlcmlvZCcsXG4gICAgJ3gnOiBaT05FLFxuICAgICdYJzogWk9ORSxcbiAgICAneic6IFpPTkUsXG4gICAgJ1onOiBaT05FXG59O1xuXG5jb25zdCBkYXRlRm9ybWF0UmVnRXhwID0gL2R7MSwyfXxFezEsNn18ZXsxLDZ9fGN7Myw2fXxjezF9fE17MSw1fXxMezEsNX18eXsxLDR9fEh7MSwyfXxoezEsMn18a3sxLDJ9fEt7MSwyfXxtezEsMn18YXsxLDV9fHN7MSwyfXxTezEsM318ensxLDR9fFp7MSw1fXx4ezEsNX18WHsxLDV9fEd7MSw1fXxxezEsNX18UXsxLDV9fFwiW15cIl0qXCJ8J1teJ10qJy9nO1xuXG5leHBvcnQgeyBkYXRlRm9ybWF0UmVnRXhwLCBEQVRFX0ZJRUxEX01BUCB9OyIsImltcG9ydCB7IGxvY2FsZUluZm8sIGZpcnN0RGF5IH0gZnJvbSAnLi4vY2xkcic7XG5pbXBvcnQgeyBERUZBVUxUX0xPQ0FMRSwgRU1QVFkgfSBmcm9tICcuLi9jb21tb24vY29uc3RhbnRzJztcbmltcG9ydCBmb3JtYXRTdHJpbmcgZnJvbSAnLi4vY29tbW9uL2Zvcm1hdC1zdHJpbmcnO1xuaW1wb3J0IGRhdGVQYXR0ZXJuIGZyb20gJy4vZGF0ZS1wYXR0ZXJuJztcbmltcG9ydCBmb3JtYXROYW1lcyBmcm9tICcuL2Zvcm1hdC1uYW1lcyc7XG5pbXBvcnQgcGFkIGZyb20gJy4uL2NvbW1vbi9wYWQnO1xuaW1wb3J0IGlzRGF0ZSBmcm9tICcuLi9jb21tb24vaXMtZGF0ZSc7XG5pbXBvcnQgeyBkYXRlRm9ybWF0UmVnRXhwIH0gZnJvbSAnLi9jb25zdGFudHMnO1xuXG5mdW5jdGlvbiBmb3JtYXREYXlPZldlZWtJbmRleChkYXksIGZvcm1hdExlbmd0aCwgbG9jYWxlSW5mbykge1xuICAgIGNvbnN0IGZpcnN0RGF5SW5kZXggPSBmaXJzdERheShsb2NhbGVJbmZvKTtcbiAgICBsZXQgZGF5SW5kZXg7XG4gICAgaWYgKGRheSA8IGZpcnN0RGF5SW5kZXgpIHtcbiAgICAgICAgZGF5SW5kZXggPSA3IC0gZmlyc3REYXlJbmRleCArIGRheTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBkYXlJbmRleCA9IGRheSAtIGZpcnN0RGF5SW5kZXg7XG4gICAgfVxuXG4gICAgcmV0dXJuIGRheUluZGV4ICsgMTtcbn1cblxuZnVuY3Rpb24gZm9ybWF0TW9udGgobW9udGgsIGZvcm1hdExlbmd0aCwgaW5mbywgc3RhbmRBbG9uZSkge1xuICAgIGlmIChmb3JtYXRMZW5ndGggPD0gMikge1xuICAgICAgICByZXR1cm4gcGFkKG1vbnRoICsgMSwgZm9ybWF0TGVuZ3RoKTtcbiAgICB9XG4gICAgcmV0dXJuIGZvcm1hdE5hbWVzKGluZm8sIFwibW9udGhzXCIsIGZvcm1hdExlbmd0aCwgc3RhbmRBbG9uZSlbbW9udGhdO1xufVxuXG5mdW5jdGlvbiBmb3JtYXRRdWFydGVyKGRhdGUsIGZvcm1hdExlbmd0aCwgaW5mbywgc3RhbmRBbG9uZSkge1xuICAgIGNvbnN0IHF1YXJ0ZXIgPSBNYXRoLmZsb29yKGRhdGUuZ2V0TW9udGgoKSAvIDMpO1xuICAgIGlmIChmb3JtYXRMZW5ndGggPCAzKSB7XG4gICAgICAgIHJldHVybiBxdWFydGVyICsgMTtcbiAgICB9XG5cbiAgICByZXR1cm4gZm9ybWF0TmFtZXMoaW5mbywgXCJxdWFydGVyc1wiLCBmb3JtYXRMZW5ndGgsIHN0YW5kQWxvbmUpW3F1YXJ0ZXJdO1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdFRpbWVab25lKGRhdGUsIGluZm8sIG9wdGlvbnMpIHtcbiAgICBjb25zdCB7IHNob3J0SG91cnMsIG9wdGlvbmFsTWludXRlcywgc2VwYXJhdG9yLCBsb2NhbGl6ZWROYW1lLCB6WmVyb09mZnNldCB9ID0gb3B0aW9ucztcbiAgICBjb25zdCBvZmZzZXQgPSBkYXRlLmdldFRpbWV6b25lT2Zmc2V0KCkgLyA2MDtcbiAgICBpZiAob2Zmc2V0ID09PSAwICYmIHpaZXJvT2Zmc2V0KSB7XG4gICAgICAgIHJldHVybiBcIlpcIjtcbiAgICB9XG4gICAgY29uc3Qgc2lnbiA9IG9mZnNldCA8PSAwID8gXCIrXCIgOiBcIi1cIjtcbiAgICBjb25zdCBob3Vyc01pbnV0ZXMgPSBNYXRoLmFicyhvZmZzZXQpLnRvU3RyaW5nKCkuc3BsaXQoXCIuXCIpO1xuICAgIGNvbnN0IG1pbnV0ZXMgPSBob3Vyc01pbnV0ZXNbMV0gfHwgMDtcbiAgICBsZXQgcmVzdWx0ID0gc2lnbiArIChzaG9ydEhvdXJzID8gaG91cnNNaW51dGVzWzBdIDogcGFkKGhvdXJzTWludXRlc1swXSwgMikpO1xuICAgIGlmIChtaW51dGVzIHx8ICFvcHRpb25hbE1pbnV0ZXMpIHtcbiAgICAgICAgcmVzdWx0ICs9IChzZXBhcmF0b3IgPyBcIjpcIiA6IEVNUFRZKSArIHBhZChtaW51dGVzLCAyKTtcbiAgICB9XG5cbiAgICBpZiAobG9jYWxpemVkTmFtZSkge1xuICAgICAgICBjb25zdCBsb2NhbGl6ZWRGb3JtYXQgPSBvZmZzZXQgPT09IDAgPyBpbmZvLmNhbGVuZGFyLmdtdFplcm9Gb3JtYXQgOiBpbmZvLmNhbGVuZGFyLmdtdEZvcm1hdDtcbiAgICAgICAgcmVzdWx0ID0gZm9ybWF0U3RyaW5nKGxvY2FsaXplZEZvcm1hdCwgcmVzdWx0KTtcbiAgICB9XG5cbiAgICByZXR1cm4gcmVzdWx0O1xufVxuXG5mdW5jdGlvbiBmb3JtYXREYXlPZldlZWsoZGF0ZSwgZm9ybWF0TGVuZ3RoLCBpbmZvLCBzdGFuZEFsb25lKSB7XG4gICAgbGV0IHJlc3VsdDtcbiAgICBpZiAoZm9ybWF0TGVuZ3RoIDwgMykge1xuICAgICAgICByZXN1bHQgPSBmb3JtYXREYXlPZldlZWtJbmRleChkYXRlLmdldERheSgpLCBmb3JtYXRMZW5ndGgsIGluZm8pO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHJlc3VsdCA9IGZvcm1hdE5hbWVzKGluZm8sIFwiZGF5c1wiLCBmb3JtYXRMZW5ndGgsIHN0YW5kQWxvbmUpW2RhdGUuZ2V0RGF5KCldO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xufVxuXG5jb25zdCBmb3JtYXR0ZXJzID0ge307XG5cbmZvcm1hdHRlcnMuZCA9IGZ1bmN0aW9uKGRhdGUsIGZvcm1hdExlbmd0aCkge1xuICAgIHJldHVybiBwYWQoZGF0ZS5nZXREYXRlKCksIGZvcm1hdExlbmd0aCk7XG59O1xuXG5mb3JtYXR0ZXJzLkUgPSBmdW5jdGlvbihkYXRlLCBmb3JtYXRMZW5ndGgsIGluZm8pIHtcbiAgICByZXR1cm4gZm9ybWF0TmFtZXMoaW5mbywgXCJkYXlzXCIsIGZvcm1hdExlbmd0aClbZGF0ZS5nZXREYXkoKV07XG59O1xuXG5mb3JtYXR0ZXJzLk0gPSBmdW5jdGlvbihkYXRlLCBmb3JtYXRMZW5ndGgsIGluZm8pIHtcbiAgICByZXR1cm4gZm9ybWF0TW9udGgoZGF0ZS5nZXRNb250aCgpLCBmb3JtYXRMZW5ndGgsIGluZm8sIGZhbHNlKTtcbn07XG5cbmZvcm1hdHRlcnMuTCA9IGZ1bmN0aW9uKGRhdGUsIGZvcm1hdExlbmd0aCwgaW5mbykge1xuICAgIHJldHVybiBmb3JtYXRNb250aChkYXRlLmdldE1vbnRoKCksIGZvcm1hdExlbmd0aCwgaW5mbywgdHJ1ZSk7XG59O1xuXG5mb3JtYXR0ZXJzLnkgPSBmdW5jdGlvbihkYXRlLCBmb3JtYXRMZW5ndGgpIHtcbiAgICBsZXQgeWVhciA9IGRhdGUuZ2V0RnVsbFllYXIoKTtcbiAgICBpZiAoZm9ybWF0TGVuZ3RoID09PSAyKSB7XG4gICAgICAgIHllYXIgPSB5ZWFyICUgMTAwO1xuICAgIH1cbiAgICByZXR1cm4gcGFkKHllYXIsIGZvcm1hdExlbmd0aCk7XG59O1xuXG5mb3JtYXR0ZXJzLmggPSBmdW5jdGlvbihkYXRlLCBmb3JtYXRMZW5ndGgpIHtcbiAgICBjb25zdCBob3VycyA9IGRhdGUuZ2V0SG91cnMoKSAlIDEyIHx8IDEyO1xuICAgIHJldHVybiBwYWQoaG91cnMsIGZvcm1hdExlbmd0aCk7XG59O1xuXG5mb3JtYXR0ZXJzLkggPSBmdW5jdGlvbihkYXRlLCBmb3JtYXRMZW5ndGgpIHtcbiAgICByZXR1cm4gcGFkKGRhdGUuZ2V0SG91cnMoKSwgZm9ybWF0TGVuZ3RoKTtcbn07XG5cbmZvcm1hdHRlcnMuayA9IGZ1bmN0aW9uKGRhdGUsIGZvcm1hdExlbmd0aCkge1xuICAgIHJldHVybiBwYWQoZGF0ZS5nZXRIb3VycygpIHx8IDI0LCBmb3JtYXRMZW5ndGgpO1xufTtcblxuZm9ybWF0dGVycy5LID0gZnVuY3Rpb24oZGF0ZSwgZm9ybWF0TGVuZ3RoKSB7XG4gICAgcmV0dXJuIHBhZChkYXRlLmdldEhvdXJzKCkgJSAxMiwgZm9ybWF0TGVuZ3RoKTtcbn07XG5cbmZvcm1hdHRlcnMubSA9IGZ1bmN0aW9uKGRhdGUsIGZvcm1hdExlbmd0aCkge1xuICAgIHJldHVybiBwYWQoZGF0ZS5nZXRNaW51dGVzKCksIGZvcm1hdExlbmd0aCk7XG59O1xuXG5mb3JtYXR0ZXJzLnMgPSBmdW5jdGlvbihkYXRlLCBmb3JtYXRMZW5ndGgpIHtcbiAgICByZXR1cm4gcGFkKGRhdGUuZ2V0U2Vjb25kcygpLCBmb3JtYXRMZW5ndGgpO1xufTtcblxuZm9ybWF0dGVycy5TID0gZnVuY3Rpb24oZGF0ZSwgZm9ybWF0TGVuZ3RoKSB7XG4gICAgY29uc3QgbWlsbGlzZWNvbmRzID0gZGF0ZS5nZXRNaWxsaXNlY29uZHMoKTtcbiAgICBsZXQgcmVzdWx0O1xuICAgIGlmIChtaWxsaXNlY29uZHMgIT09IDApIHtcbiAgICAgICAgcmVzdWx0ID0gcGFkKFN0cmluZyhtaWxsaXNlY29uZHMgLyAxMDAwKS5zcGxpdChcIi5cIilbMV0uc3Vic3RyKDAsIGZvcm1hdExlbmd0aCksIGZvcm1hdExlbmd0aCwgdHJ1ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmVzdWx0ID0gcGFkKEVNUFRZLCBmb3JtYXRMZW5ndGgpO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xufTtcblxuZm9ybWF0dGVycy5hID0gZnVuY3Rpb24oZGF0ZSwgZm9ybWF0TGVuZ3RoLCBpbmZvKSB7XG4gICAgcmV0dXJuIGZvcm1hdE5hbWVzKGluZm8sIFwiZGF5UGVyaW9kc1wiLCBmb3JtYXRMZW5ndGgpW2RhdGUuZ2V0SG91cnMoKSA8IDEyID8gXCJhbVwiIDogXCJwbVwiXTtcbn07XG5cbmZvcm1hdHRlcnMueiA9IGZ1bmN0aW9uKGRhdGUsIGZvcm1hdExlbmd0aCwgaW5mbykge1xuICAgIHJldHVybiBmb3JtYXRUaW1lWm9uZShkYXRlLCBpbmZvLCB7XG4gICAgICAgIHNob3J0SG91cnM6IGZvcm1hdExlbmd0aCA8IDQsXG4gICAgICAgIG9wdGlvbmFsTWludXRlczogZm9ybWF0TGVuZ3RoIDwgNCxcbiAgICAgICAgc2VwYXJhdG9yOiB0cnVlLFxuICAgICAgICBsb2NhbGl6ZWROYW1lOiB0cnVlXG4gICAgfSk7XG59O1xuXG5mb3JtYXR0ZXJzLlogPSBmdW5jdGlvbihkYXRlLCBmb3JtYXRMZW5ndGgsIGluZm8pIHtcbiAgICByZXR1cm4gZm9ybWF0VGltZVpvbmUoZGF0ZSwgaW5mbywge1xuICAgICAgICBzZXBhcmF0b3I6IGZvcm1hdExlbmd0aCA+IDMsXG4gICAgICAgIGxvY2FsaXplZE5hbWU6IGZvcm1hdExlbmd0aCA9PT0gNCxcbiAgICAgICAgelplcm9PZmZzZXQ6IGZvcm1hdExlbmd0aCA9PT0gNVxuICAgIH0pO1xufTtcblxuZm9ybWF0dGVycy54ID0gZnVuY3Rpb24oZGF0ZSwgZm9ybWF0TGVuZ3RoLCBpbmZvKSB7XG4gICAgcmV0dXJuIGZvcm1hdFRpbWVab25lKGRhdGUsIGluZm8sIHtcbiAgICAgICAgb3B0aW9uYWxNaW51dGVzOiBmb3JtYXRMZW5ndGggPT09IDEsXG4gICAgICAgIHNlcGFyYXRvcjogZm9ybWF0TGVuZ3RoID09PSAzIHx8IGZvcm1hdExlbmd0aCA9PT0gNVxuICAgIH0pO1xufTtcblxuZm9ybWF0dGVycy5YID0gZnVuY3Rpb24oZGF0ZSwgZm9ybWF0TGVuZ3RoLCBpbmZvKSB7XG4gICAgcmV0dXJuIGZvcm1hdFRpbWVab25lKGRhdGUsIGluZm8sIHtcbiAgICAgICAgb3B0aW9uYWxNaW51dGVzOiBmb3JtYXRMZW5ndGggPT09IDEsXG4gICAgICAgIHNlcGFyYXRvcjogZm9ybWF0TGVuZ3RoID09PSAzIHx8IGZvcm1hdExlbmd0aCA9PT0gNSxcbiAgICAgICAgelplcm9PZmZzZXQ6IHRydWVcbiAgICB9KTtcbn07XG5cbmZvcm1hdHRlcnMuRyA9IGZ1bmN0aW9uKGRhdGUsIGZvcm1hdExlbmd0aCwgaW5mbykge1xuICAgIGxldCBlcmEgPSBkYXRlLmdldEZ1bGxZZWFyKCkgPj0gMCA/IDEgOiAwO1xuICAgIHJldHVybiBmb3JtYXROYW1lcyhpbmZvLCBcImVyYXNcIiwgZm9ybWF0TGVuZ3RoKVtlcmFdO1xufTtcblxuZm9ybWF0dGVycy5lID0gZm9ybWF0RGF5T2ZXZWVrO1xuXG5mb3JtYXR0ZXJzLmMgPSBmdW5jdGlvbihkYXRlLCBmb3JtYXRMZW5ndGgsIGluZm8pIHtcbiAgICByZXR1cm4gZm9ybWF0RGF5T2ZXZWVrKGRhdGUsIGZvcm1hdExlbmd0aCwgaW5mbywgdHJ1ZSk7XG59O1xuXG5mb3JtYXR0ZXJzLnEgPSBmdW5jdGlvbihkYXRlLCBmb3JtYXRMZW5ndGgsIGluZm8pIHtcbiAgICByZXR1cm4gZm9ybWF0UXVhcnRlcihkYXRlLCBmb3JtYXRMZW5ndGgsIGluZm8sIHRydWUpO1xufTtcblxuZm9ybWF0dGVycy5RID0gZm9ybWF0UXVhcnRlcjtcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gZm9ybWF0RGF0ZShkYXRlLCBmb3JtYXQsIGxvY2FsZSA9IERFRkFVTFRfTE9DQUxFKSB7XG4gICAgaWYgKCFpc0RhdGUoZGF0ZSkpIHtcbiAgICAgICAgaWYgKGRhdGUgPT09IHVuZGVmaW5lZCB8fCBkYXRlID09PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm4gRU1QVFk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGRhdGU7XG4gICAgfVxuXG4gICAgY29uc3QgaW5mbyA9IGxvY2FsZUluZm8obG9jYWxlKTtcbiAgICBjb25zdCBwYXR0ZXJuID0gZGF0ZVBhdHRlcm4oZm9ybWF0LCBpbmZvKTtcblxuICAgIHJldHVybiBwYXR0ZXJuLnJlcGxhY2UoZGF0ZUZvcm1hdFJlZ0V4cCwgZnVuY3Rpb24obWF0Y2gpIHtcbiAgICAgICAgbGV0IGZvcm1hdExlbmd0aCA9IG1hdGNoLmxlbmd0aDtcbiAgICAgICAgbGV0IHJlc3VsdDtcblxuICAgICAgICBpZiAobWF0Y2guaW5jbHVkZXMoXCInXCIpIHx8IG1hdGNoLmluY2x1ZGVzKFwiXFxcIlwiKSkge1xuICAgICAgICAgICAgcmVzdWx0ID0gbWF0Y2guc2xpY2UoMSwgZm9ybWF0TGVuZ3RoIC0gMSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXN1bHQgPSBmb3JtYXR0ZXJzW21hdGNoWzBdXShkYXRlLCBmb3JtYXRMZW5ndGgsIGluZm8pO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9KTtcbn1cbiIsImV4cG9ydCBmdW5jdGlvbiBjb252ZXJ0VGltZVpvbmUoZGF0ZSwgZnJvbU9mZnNldCwgdG9PZmZzZXQpIHtcbiAgICBjb25zdCBmcm9tTG9jYWxPZmZzZXQgPSBkYXRlLmdldFRpbWV6b25lT2Zmc2V0KCk7XG5cbiAgICBjb25zdCBvZmZzZXREYXRlID0gbmV3IERhdGUoZGF0ZS5nZXRUaW1lKCkgKyAoZnJvbU9mZnNldCAtIHRvT2Zmc2V0KSAqIDYwMDAwKTtcblxuICAgIGNvbnN0IHRvTG9jYWxPZmZzZXQgPSBvZmZzZXREYXRlLmdldFRpbWV6b25lT2Zmc2V0KCk7XG5cbiAgICByZXR1cm4gbmV3IERhdGUob2Zmc2V0RGF0ZS5nZXRUaW1lKCkgKyAodG9Mb2NhbE9mZnNldCAtIGZyb21Mb2NhbE9mZnNldCkgKiA2MDAwMCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhZGp1c3REU1QoZGF0ZSwgaG91cnMpIHtcbiAgICBpZiAoIWhvdXJzICYmIGRhdGUuZ2V0SG91cnMoKSA9PT0gMjMpIHtcbiAgICAgICAgZGF0ZS5zZXRIb3VycyhkYXRlLmdldEhvdXJzKCkgKyAyKTtcbiAgICB9XG59IiwiaW1wb3J0IHsgYWRqdXN0RFNULCBjb252ZXJ0VGltZVpvbmUgfSBmcm9tICcuL3RpbWUtdXRpbHMnO1xuaW1wb3J0IHsgbG9jYWxlSW5mbyB9IGZyb20gJy4uL2NsZHInO1xuaW1wb3J0IHsgREVGQVVMVF9MT0NBTEUsIEVNUFRZIH0gZnJvbSAnLi4vY29tbW9uL2NvbnN0YW50cyc7XG5pbXBvcnQgeyBlcnJvcnMgfSBmcm9tICcuLi9lcnJvcnMnO1xuaW1wb3J0IGZvcm1hdE5hbWVzIGZyb20gJy4vZm9ybWF0LW5hbWVzJztcbmltcG9ydCBkYXRlUGF0dGVybiBmcm9tICcuL2RhdGUtcGF0dGVybic7XG5pbXBvcnQgcm91bmQgZnJvbSAnLi4vY29tbW9uL3JvdW5kJztcbmltcG9ydCBpc0RhdGUgZnJvbSAnLi4vY29tbW9uL2lzLWRhdGUnO1xuXG5jb25zdCB0aW1lWm9uZU9mZnNldFJlZ0V4cCA9IC8oWyt8LV1cXGR7MSwyfSkoOj8pKFxcZHsyfSk/LztcbmNvbnN0IGRhdGVSZWdFeHAgPSAvXlxcL0RhdGVcXCgoLio/KVxcKVxcLyQvO1xuY29uc3Qgb2Zmc2V0UmVnRXhwID0gL1srLV1cXGQqLztcbmNvbnN0IG51bWJlclJlZ0V4cCA9IHtcbiAgICAyOiAvXlxcZHsxLDJ9LyxcbiAgICAzOiAvXlxcZHsxLDN9LyxcbiAgICA0OiAvXlxcZHs0fS9cbn07XG5jb25zdCBudW1iZXJSZWdleCA9IC9cXGQrLztcbmNvbnN0IFBMQUNFSE9MREVSID0gXCJ7MH1cIjtcblxuY29uc3QgbGVhZGluZ1NwYWNlc1JlZ2V4ID0gL14gKi87XG5jb25zdCB0cmFpbGluZ1NwYWNlc1JlZ2V4ID0gLyAqJC87XG5cbmNvbnN0IHN0YW5kYXJkRGF0ZUZvcm1hdHMgPSBbXG4gICAgXCJ5eXl5L01NL2RkIEhIOm1tOnNzXCIsXG4gICAgXCJ5eXl5L01NL2RkIEhIOm1tXCIsXG4gICAgXCJ5eXl5L01NL2RkXCIsXG4gICAgXCJFIE1NTSBkZCB5eXl5IEhIOm1tOnNzXCIsXG4gICAgXCJ5eXl5LU1NLWRkVEhIOm1tOnNzLlNTU1NTU1NYWFhcIixcbiAgICBcInl5eXktTU0tZGRUSEg6bW06c3MuU1NTWFhYXCIsXG4gICAgXCJ5eXl5LU1NLWRkVEhIOm1tOnNzLlNTWFhYXCIsXG4gICAgXCJ5eXl5LU1NLWRkVEhIOm1tOnNzWFhYXCIsXG4gICAgXCJ5eXl5LU1NLWRkVEhIOm1tOnNzLlNTU1NTU1NcIixcbiAgICBcInl5eXktTU0tZGRUSEg6bW06c3MuU1NTXCIsXG4gICAgXCJ5eXl5LU1NLWRkVEhIOm1tWFhYXCIsXG4gICAgXCJ5eXl5LU1NLWRkVEhIOm1tWFwiLFxuICAgIFwieXl5eS1NTS1kZFRISDptbTpzc1wiLFxuICAgIFwieXl5eS1NTS1kZFRISDptbVwiLFxuICAgIFwieXl5eS1NTS1kZCBISDptbTpzc1wiLFxuICAgIFwieXl5eS1NTS1kZCBISDptbVwiLFxuICAgIFwieXl5eS1NTS1kZFwiLFxuICAgIFwiSEg6bW06c3NcIixcbiAgICBcIkhIOm1tXCJcbl07XG5jb25zdCBGT1JNQVRTX1NFUVVFTkNFID0gWyBcIkdcIiwgXCJnXCIsIFwiRlwiLCBcIllcIiwgXCJ5XCIsIFwiTVwiLCBcIm1cIiwgXCJEXCIsIFwiZFwiLCBcInlcIiwgXCJUXCIsIFwidFwiIF07XG5jb25zdCBUV09fRElHSVRfWUVBUl9NQVggPSAyMDI5O1xuXG5mdW5jdGlvbiBvdXRPZlJhbmdlKHZhbHVlLCBzdGFydCwgZW5kKSB7XG4gICAgcmV0dXJuICEodmFsdWUgPj0gc3RhcnQgJiYgdmFsdWUgPD0gZW5kKTtcbn1cblxuZnVuY3Rpb24gbG9va0FoZWFkKG1hdGNoLCBzdGF0ZSkge1xuICAgIGxldCB7IGZvcm1hdCwgaWR4IH0gPSBzdGF0ZTtcbiAgICBsZXQgaSA9IDA7XG4gICAgd2hpbGUgKGZvcm1hdFtpZHhdID09PSBtYXRjaCkge1xuICAgICAgICBpKys7XG4gICAgICAgIGlkeCsrO1xuICAgIH1cbiAgICBpZiAoaSA+IDApIHtcbiAgICAgICAgaWR4IC09IDE7XG4gICAgfVxuICAgIHN0YXRlLmlkeCA9IGlkeDtcbiAgICByZXR1cm4gaTtcbn1cblxuZnVuY3Rpb24gZ2V0TnVtYmVyKHNpemUsIHN0YXRlKSB7XG4gICAgbGV0IHJlZ2V4ID0gc2l6ZSA/IChudW1iZXJSZWdFeHBbc2l6ZV0gfHwgbmV3IFJlZ0V4cCgnXlxcXFxkezEsJyArIHNpemUgKyAnfScpKSA6IG51bWJlclJlZ2V4LFxuICAgICAgICBtYXRjaCA9IHN0YXRlLnZhbHVlLnN1YnN0cihzdGF0ZS52YWx1ZUlkeCwgc2l6ZSkubWF0Y2gocmVnZXgpO1xuXG4gICAgaWYgKG1hdGNoKSB7XG4gICAgICAgIG1hdGNoID0gbWF0Y2hbMF07XG4gICAgICAgIHN0YXRlLnZhbHVlSWR4ICs9IG1hdGNoLmxlbmd0aDtcbiAgICAgICAgcmV0dXJuIHBhcnNlSW50KG1hdGNoLCAxMCk7XG4gICAgfVxuICAgIHJldHVybiBudWxsO1xufVxuXG5mdW5jdGlvbiBnZXRJbmRleEJ5TmFtZShuYW1lcywgc3RhdGUsIGxvd2VyKSB7XG4gICAgbGV0IGkgPSAwLFxuICAgICAgICBsZW5ndGggPSBuYW1lcy5sZW5ndGgsXG4gICAgICAgIG5hbWUsIG5hbWVMZW5ndGgsXG4gICAgICAgIG1hdGNoTGVuZ3RoID0gMCxcbiAgICAgICAgbWF0Y2hJZHggPSAwLFxuICAgICAgICBzdWJWYWx1ZTtcblxuICAgIGZvciAoOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgICAgbmFtZSA9IG5hbWVzW2ldO1xuICAgICAgICBuYW1lTGVuZ3RoID0gbmFtZS5sZW5ndGg7XG4gICAgICAgIHN1YlZhbHVlID0gc3RhdGUudmFsdWUuc3Vic3RyKHN0YXRlLnZhbHVlSWR4LCBuYW1lTGVuZ3RoKTtcblxuICAgICAgICBpZiAobG93ZXIpIHtcbiAgICAgICAgICAgIHN1YlZhbHVlID0gc3ViVmFsdWUudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChzdWJWYWx1ZSA9PT0gbmFtZSAmJiBuYW1lTGVuZ3RoID4gbWF0Y2hMZW5ndGgpIHtcbiAgICAgICAgICAgIG1hdGNoTGVuZ3RoID0gbmFtZUxlbmd0aDtcbiAgICAgICAgICAgIG1hdGNoSWR4ID0gaTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGlmIChtYXRjaExlbmd0aCkge1xuICAgICAgICBzdGF0ZS52YWx1ZUlkeCArPSBtYXRjaExlbmd0aDtcbiAgICAgICAgcmV0dXJuIG1hdGNoSWR4ICsgMTtcbiAgICB9XG5cbiAgICByZXR1cm4gbnVsbDtcbn1cblxuZnVuY3Rpb24gY2hlY2tMaXRlcmFsKHN0YXRlKSB7XG4gICAgbGV0IHJlc3VsdCA9IGZhbHNlO1xuICAgIGNvbnN0IHZhbHVlQ2hhciA9IHN0YXRlLnZhbHVlLmNoYXJBdChzdGF0ZS52YWx1ZUlkeCk7XG4gICAgY29uc3QgZm9ybWF0Q2hhciA9IHN0YXRlLmZvcm1hdFtzdGF0ZS5pZHhdO1xuICAgIGNvbnN0IGV4YWN0TWF0Y2ggPSB2YWx1ZUNoYXIgPT09IGZvcm1hdENoYXI7XG4gICAgY29uc3Qgd2hpdGVzcGFjZU1hdGNoID0gL1xccy8udGVzdChmb3JtYXRDaGFyKSAmJiAvXFxzLy50ZXN0KHZhbHVlQ2hhcik7XG4gICAgaWYgKGV4YWN0TWF0Y2ggfHwgd2hpdGVzcGFjZU1hdGNoKSB7XG4gICAgICAgIHN0YXRlLnZhbHVlSWR4Kys7XG4gICAgICAgIHJlc3VsdCA9IHRydWU7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG59XG5cbmZ1bmN0aW9uIGNhbGVuZGFyR210Rm9ybWF0cyhjYWxlbmRhcikge1xuICAgIGNvbnN0IHsgZ210Rm9ybWF0LCBnbXRaZXJvRm9ybWF0IH0gPSBjYWxlbmRhcjtcbiAgICBpZiAoIWdtdEZvcm1hdCkge1xuICAgICAgICB0aHJvdyBlcnJvcnMuTm9HTVRJbmZvLmVycm9yKCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIFsgZ210Rm9ybWF0LnJlcGxhY2UoUExBQ0VIT0xERVIsIEVNUFRZKS50b0xvd2VyQ2FzZSgpLCBnbXRaZXJvRm9ybWF0LnJlcGxhY2UoUExBQ0VIT0xERVIsIEVNUFRZKS50b0xvd2VyQ2FzZSgpIF07XG59XG5cbmZ1bmN0aW9uIHBhcnNlVGltZVpvbmVPZmZzZXQoc3RhdGUsIGluZm8sIG9wdGlvbnMpIHtcbiAgICBjb25zdCB7IHNob3J0SG91cnMsIG5vU2VwYXJhdG9yLCBvcHRpb25hbE1pbnV0ZXMsIGxvY2FsaXplZE5hbWUsIHpMaXRlcmFsIH0gPSBvcHRpb25zO1xuICAgIHN0YXRlLlVUQyA9IHRydWU7XG5cbiAgICBpZiAoekxpdGVyYWwgJiYgc3RhdGUudmFsdWUuY2hhckF0KHN0YXRlLnZhbHVlSWR4KSA9PT0gXCJaXCIpIHtcbiAgICAgICAgc3RhdGUudmFsdWVJZHgrKztcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGlmIChsb2NhbGl6ZWROYW1lICYmICFnZXRJbmRleEJ5TmFtZShjYWxlbmRhckdtdEZvcm1hdHMoaW5mby5jYWxlbmRhciksIHN0YXRlLCB0cnVlKSkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICBjb25zdCBtYXRjaGVzID0gdGltZVpvbmVPZmZzZXRSZWdFeHAuZXhlYyhzdGF0ZS52YWx1ZS5zdWJzdHIoc3RhdGUudmFsdWVJZHgsIDYpKTtcbiAgICBpZiAoIW1hdGNoZXMpIHtcbiAgICAgICAgcmV0dXJuICFsb2NhbGl6ZWROYW1lO1xuICAgIH1cblxuICAgIGNvbnN0IGhvdXJzTWF0Y2ggPSBtYXRjaGVzWzFdO1xuICAgIGNvbnN0IG1pbnV0ZXNNYXRjaCA9IG1hdGNoZXNbM107XG4gICAgY29uc3QgaG91cnNPZmZzZXQgPSBwYXJzZUludChob3Vyc01hdGNoLCAxMCk7XG4gICAgY29uc3Qgc2VwYXJhdG9yID0gbWF0Y2hlc1syXTtcbiAgICBsZXQgbWludXRlc09mZnNldCA9IHBhcnNlSW50KG1pbnV0ZXNNYXRjaCwgMTApO1xuXG4gICAgaWYgKGlzTmFOKGhvdXJzT2Zmc2V0KSB8fCAoIXNob3J0SG91cnMgJiYgaG91cnNNYXRjaC5sZW5ndGggIT09IDMpIHx8ICghb3B0aW9uYWxNaW51dGVzICYmIGlzTmFOKG1pbnV0ZXNPZmZzZXQpKSB8fCAobm9TZXBhcmF0b3IgJiYgc2VwYXJhdG9yKSkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICBpZiAoaXNOYU4obWludXRlc09mZnNldCkpIHtcbiAgICAgICAgbWludXRlc09mZnNldCA9IG51bGw7XG4gICAgfVxuXG4gICAgaWYgKG91dE9mUmFuZ2UoaG91cnNPZmZzZXQsIC0xMiwgMTMpIHx8IChtaW51dGVzT2Zmc2V0ICYmIG91dE9mUmFuZ2UobWludXRlc09mZnNldCwgMCwgNTkpKSkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICBzdGF0ZS52YWx1ZUlkeCArPSBtYXRjaGVzWzBdLmxlbmd0aDtcbiAgICBzdGF0ZS5ob3Vyc09mZnNldCA9IGhvdXJzT2Zmc2V0O1xuICAgIHN0YXRlLm1pbnV0ZXNPZmZzZXQgPSBtaW51dGVzT2Zmc2V0O1xufVxuXG5mdW5jdGlvbiBwYXJzZU1vbnRoKGNoLCBzdGF0ZSwgaW5mbykge1xuICAgIGNvbnN0IGNvdW50ID0gbG9va0FoZWFkKGNoLCBzdGF0ZSk7XG4gICAgY29uc3QgbmFtZXMgPSBmb3JtYXROYW1lcyhpbmZvLCBcIm1vbnRoc1wiLCBjb3VudCwgY2ggPT09IFwiTFwiLCB0cnVlKTtcblxuICAgIGNvbnN0IG1vbnRoID0gY291bnQgPCAzID8gZ2V0TnVtYmVyKDIsIHN0YXRlKSA6IGdldEluZGV4QnlOYW1lKG5hbWVzLCBzdGF0ZSwgdHJ1ZSk7XG5cbiAgICBpZiAobW9udGggPT09IG51bGwgfHwgb3V0T2ZSYW5nZShtb250aCwgMSwgMTIpKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICBzdGF0ZS5tb250aCA9IG1vbnRoIC0gMTtcbn1cblxuZnVuY3Rpb24gcGFyc2VEYXlPZldlZWsoY2gsIHN0YXRlLCBpbmZvKSB7XG4gICAgY29uc3QgY291bnQgPSBsb29rQWhlYWQoY2gsIHN0YXRlKTtcbiAgICBjb25zdCBuYW1lcyA9IGZvcm1hdE5hbWVzKGluZm8sIFwiZGF5c1wiLCBjb3VudCwgY2ggPT09IFwiY1wiLCB0cnVlKTtcbiAgICBsZXQgZGF5T2ZXZWVrID0gY291bnQgPCAzID8gZ2V0TnVtYmVyKDEsIHN0YXRlKSA6IGdldEluZGV4QnlOYW1lKG5hbWVzLCBzdGF0ZSwgdHJ1ZSk7XG4gICAgaWYgKCghZGF5T2ZXZWVrICYmIGRheU9mV2VlayAhPT0gMCkgfHwgb3V0T2ZSYW5nZShkYXlPZldlZWssIDEsIDcpKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbn1cblxuY29uc3QgcGFyc2VycyA9IHt9O1xuXG5wYXJzZXJzLmQgPSBmdW5jdGlvbihzdGF0ZSkge1xuICAgIGxvb2tBaGVhZChcImRcIiwgc3RhdGUpO1xuICAgIGNvbnN0IGRheSA9IGdldE51bWJlcigyLCBzdGF0ZSk7XG5cbiAgICBpZiAoZGF5ID09PSBudWxsIHx8IG91dE9mUmFuZ2UoZGF5LCAxLCAzMSkpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgaWYgKHN0YXRlLmRheSA9PT0gbnVsbCkge1xuICAgICAgICBzdGF0ZS5kYXkgPSBkYXk7XG4gICAgfVxufTtcblxucGFyc2Vycy5FID0gZnVuY3Rpb24oc3RhdGUsIGluZm8pIHtcbiAgICBjb25zdCBjb3VudCA9IGxvb2tBaGVhZChcIkVcIiwgc3RhdGUpO1xuICAgIC8vdmFsaWRhdGUgaWYgaXQgbWF0Y2hlcyB0aGUgZGF5P1xuICAgIGxldCBkYXlPZldlZWsgPSBnZXRJbmRleEJ5TmFtZShmb3JtYXROYW1lcyhpbmZvLCBcImRheXNcIiwgY291bnQsIGZhbHNlLCB0cnVlKSwgc3RhdGUsIHRydWUpO1xuICAgIGlmIChkYXlPZldlZWsgPT09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxufTtcblxucGFyc2Vycy5NID0gZnVuY3Rpb24oc3RhdGUsIGluZm8pIHtcbiAgICByZXR1cm4gcGFyc2VNb250aChcIk1cIiwgc3RhdGUsIGluZm8pO1xufTtcblxucGFyc2Vycy5MID0gZnVuY3Rpb24oc3RhdGUsIGluZm8pIHtcbiAgICByZXR1cm4gcGFyc2VNb250aChcIkxcIiwgc3RhdGUsIGluZm8pO1xufTtcblxucGFyc2Vycy55ID0gZnVuY3Rpb24oc3RhdGUpIHtcbiAgICBjb25zdCBjb3VudCA9IGxvb2tBaGVhZChcInlcIiwgc3RhdGUpO1xuICAgIGxldCB5ZWFyID0gZ2V0TnVtYmVyKGNvdW50ID09PSAxID8gdW5kZWZpbmVkIDogY291bnQsIHN0YXRlKTtcblxuICAgIGlmICh5ZWFyID09PSBudWxsKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIGlmIChjb3VudCA9PT0gMikge1xuICAgICAgICBjb25zdCBjdXJyZW50WWVhciA9IG5ldyBEYXRlKCkuZ2V0RnVsbFllYXIoKTtcbiAgICAgICAgeWVhciA9IChjdXJyZW50WWVhciAtIGN1cnJlbnRZZWFyICUgMTAwKSArIHllYXI7XG4gICAgICAgIGlmICh5ZWFyID4gVFdPX0RJR0lUX1lFQVJfTUFYKSB7XG4gICAgICAgICAgICB5ZWFyIC09IDEwMDtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHN0YXRlLnllYXIgPSB5ZWFyO1xufTtcblxucGFyc2Vycy5oID0gZnVuY3Rpb24oc3RhdGUpIHtcbiAgICBsb29rQWhlYWQoXCJoXCIsIHN0YXRlKTtcblxuICAgIGxldCBob3VycyA9IGdldE51bWJlcigyLCBzdGF0ZSk7XG4gICAgaWYgKGhvdXJzID09PSAxMikge1xuICAgICAgICBob3VycyA9IDA7XG4gICAgfVxuXG4gICAgaWYgKGhvdXJzID09PSBudWxsIHx8IG91dE9mUmFuZ2UoaG91cnMsIDAsIDExKSkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICBzdGF0ZS5ob3VycyA9IGhvdXJzO1xufTtcblxucGFyc2Vycy5LID0gZnVuY3Rpb24oc3RhdGUpIHtcbiAgICBsb29rQWhlYWQoXCJLXCIsIHN0YXRlKTtcblxuICAgIGxldCBob3VycyA9IGdldE51bWJlcigyLCBzdGF0ZSk7XG5cbiAgICBpZiAoaG91cnMgPT09IG51bGwgfHwgb3V0T2ZSYW5nZShob3VycywgMCwgMTEpKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIHN0YXRlLmhvdXJzID0gaG91cnM7XG59O1xuXG5wYXJzZXJzLmEgPSBmdW5jdGlvbihzdGF0ZSwgaW5mbykge1xuICAgIGNvbnN0IGNvdW50ID0gbG9va0FoZWFkKFwiYVwiLCBzdGF0ZSk7XG4gICAgbGV0IHBlcmlvZEZvcm1hdHMgPSBmb3JtYXROYW1lcyhpbmZvLCBcImRheVBlcmlvZHNcIiwgY291bnQsIGZhbHNlLCB0cnVlKTtcblxuICAgIGNvbnN0IHBtSG91ciA9IGdldEluZGV4QnlOYW1lKFsgcGVyaW9kRm9ybWF0cy5wbSBdLCBzdGF0ZSwgdHJ1ZSk7XG4gICAgaWYgKCFwbUhvdXIgJiYgIWdldEluZGV4QnlOYW1lKFsgcGVyaW9kRm9ybWF0cy5hbSBdLCBzdGF0ZSwgdHJ1ZSkpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgc3RhdGUucG1Ib3VyID0gcG1Ib3VyO1xufTtcblxucGFyc2Vycy5IID0gZnVuY3Rpb24oc3RhdGUpIHtcbiAgICBsb29rQWhlYWQoXCJIXCIsIHN0YXRlKTtcbiAgICBjb25zdCBob3VycyA9IGdldE51bWJlcigyLCBzdGF0ZSk7XG4gICAgaWYgKGhvdXJzID09PSBudWxsIHx8IG91dE9mUmFuZ2UoaG91cnMsIDAsIDIzKSkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgc3RhdGUuaG91cnMgPSBob3Vycztcbn07XG5cbnBhcnNlcnMuayA9IGZ1bmN0aW9uKHN0YXRlKSB7XG4gICAgbG9va0FoZWFkKFwia1wiLCBzdGF0ZSk7XG5cbiAgICBsZXQgaG91cnMgPSBnZXROdW1iZXIoMiwgc3RhdGUpO1xuXG4gICAgaWYgKGhvdXJzID09PSBudWxsIHx8IG91dE9mUmFuZ2UoaG91cnMsIDEsIDI0KSkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICBzdGF0ZS5ob3VycyA9IGhvdXJzID09PSAyNCA/IDAgOiBob3Vycztcbn07XG5cbnBhcnNlcnMubSA9IGZ1bmN0aW9uKHN0YXRlKSB7XG4gICAgbG9va0FoZWFkKFwibVwiLCBzdGF0ZSk7XG4gICAgY29uc3QgbWludXRlcyA9IGdldE51bWJlcigyLCBzdGF0ZSk7XG5cbiAgICBpZiAobWludXRlcyA9PT0gbnVsbCB8fCBvdXRPZlJhbmdlKG1pbnV0ZXMsIDAsIDU5KSkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICBzdGF0ZS5taW51dGVzID0gbWludXRlcztcbn07XG5cbnBhcnNlcnMucyA9IGZ1bmN0aW9uKHN0YXRlKSB7XG4gICAgbG9va0FoZWFkKFwic1wiLCBzdGF0ZSk7XG4gICAgY29uc3Qgc2Vjb25kcyA9IGdldE51bWJlcigyLCBzdGF0ZSk7XG4gICAgaWYgKHNlY29uZHMgPT09IG51bGwgfHwgb3V0T2ZSYW5nZShzZWNvbmRzLCAwLCA1OSkpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIHN0YXRlLnNlY29uZHMgPSBzZWNvbmRzO1xufTtcblxucGFyc2Vycy5TID0gZnVuY3Rpb24oc3RhdGUpIHtcbiAgICBjb25zdCBjb3VudCA9IGxvb2tBaGVhZChcIlNcIiwgc3RhdGUpO1xuICAgIGNvbnN0IG1hdGNoID0gc3RhdGUudmFsdWUuc3Vic3RyKHN0YXRlLnZhbHVlSWR4LCBjb3VudCk7XG4gICAgbGV0IG1pbGxpc2Vjb25kcyA9IG51bGw7XG5cbiAgICBpZiAoIWlzTmFOKHBhcnNlSW50KG1hdGNoLCAxMCkpKSB7XG4gICAgICAgIG1pbGxpc2Vjb25kcyA9IHBhcnNlRmxvYXQoXCIwLlwiICsgbWF0Y2gsIDEwKTtcbiAgICAgICAgbWlsbGlzZWNvbmRzID0gcm91bmQobWlsbGlzZWNvbmRzLCAzKTtcbiAgICAgICAgbWlsbGlzZWNvbmRzICo9IDEwMDA7XG4gICAgICAgIHN0YXRlLnZhbHVlSWR4ICs9IGNvdW50O1xuICAgIH1cblxuICAgIGlmIChtaWxsaXNlY29uZHMgPT09IG51bGwgfHwgb3V0T2ZSYW5nZShtaWxsaXNlY29uZHMsIDAsIDk5OSkpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgc3RhdGUubWlsbGlzZWNvbmRzID0gbWlsbGlzZWNvbmRzO1xufTtcblxucGFyc2Vycy56ID0gZnVuY3Rpb24oc3RhdGUsIGluZm8pIHtcbiAgICBjb25zdCBjb3VudCA9IGxvb2tBaGVhZChcInpcIiwgc3RhdGUpO1xuXG4gICAgY29uc3Qgc2hvcnRGb3JtYXQgPSBjb3VudCA8IDQ7XG5cbiAgICBjb25zdCBpbnZhbGlkID0gcGFyc2VUaW1lWm9uZU9mZnNldChzdGF0ZSwgaW5mbywge1xuICAgICAgICBzaG9ydEhvdXJzOiBzaG9ydEZvcm1hdCxcbiAgICAgICAgb3B0aW9uYWxNaW51dGVzOiBzaG9ydEZvcm1hdCxcbiAgICAgICAgbG9jYWxpemVkTmFtZTogdHJ1ZVxuICAgIH0pO1xuXG4gICAgaWYgKGludmFsaWQpIHtcbiAgICAgICAgcmV0dXJuIGludmFsaWQ7XG4gICAgfVxufTtcblxucGFyc2Vycy5aID0gZnVuY3Rpb24oc3RhdGUsIGluZm8pIHtcbiAgICBjb25zdCBjb3VudCA9IGxvb2tBaGVhZChcIlpcIiwgc3RhdGUpO1xuXG4gICAgY29uc3QgaW52YWxpZCA9IHBhcnNlVGltZVpvbmVPZmZzZXQoc3RhdGUsIGluZm8sIHtcbiAgICAgICAgbm9TZXBhcmF0b3I6IGNvdW50IDwgNCxcbiAgICAgICAgekxpdGVyYWw6IGNvdW50ID09PSA1LFxuICAgICAgICBsb2NhbGl6ZWROYW1lOiBjb3VudCA9PT0gNFxuICAgIH0pO1xuXG4gICAgaWYgKGludmFsaWQpIHtcbiAgICAgICAgcmV0dXJuIGludmFsaWQ7XG4gICAgfVxufTtcblxucGFyc2Vycy54ID0gZnVuY3Rpb24oc3RhdGUsIGluZm8pIHtcbiAgICBjb25zdCBjb3VudCA9IGxvb2tBaGVhZChcInhcIiwgc3RhdGUpO1xuXG4gICAgY29uc3QgaW52YWxpZCA9IHBhcnNlVGltZVpvbmVPZmZzZXQoc3RhdGUsIGluZm8sIHtcbiAgICAgICAgbm9TZXBhcmF0b3I6IGNvdW50ICE9PSAzICYmIGNvdW50ICE9PSA1LFxuICAgICAgICBvcHRpb25hbE1pbnV0ZXM6IGNvdW50ID09PSAxXG4gICAgfSk7XG4gICAgaWYgKGludmFsaWQpIHtcbiAgICAgICAgcmV0dXJuIGludmFsaWQ7XG4gICAgfVxufTtcblxucGFyc2Vycy5YID0gZnVuY3Rpb24oc3RhdGUsIGluZm8pIHtcbiAgICBjb25zdCBjb3VudCA9IGxvb2tBaGVhZChcIlhcIiwgc3RhdGUpO1xuXG4gICAgY29uc3QgaW52YWxpZCA9IHBhcnNlVGltZVpvbmVPZmZzZXQoc3RhdGUsIGluZm8sIHtcbiAgICAgICAgbm9TZXBhcmF0b3I6IGNvdW50ICE9PSAzICYmIGNvdW50ICE9PSA1LFxuICAgICAgICBvcHRpb25hbE1pbnV0ZXM6IGNvdW50ID09PSAxLFxuICAgICAgICB6TGl0ZXJhbDogdHJ1ZVxuICAgIH0pO1xuICAgIGlmIChpbnZhbGlkKSB7XG4gICAgICAgIHJldHVybiBpbnZhbGlkO1xuICAgIH1cbn07XG5cbnBhcnNlcnMuRyA9IGZ1bmN0aW9uKHN0YXRlLCBpbmZvKSB7XG4gICAgY29uc3QgY291bnQgPSBsb29rQWhlYWQoXCJHXCIsIHN0YXRlKTtcbiAgICBjb25zdCBlcmFzID0gZm9ybWF0TmFtZXMoaW5mbywgXCJlcmFzXCIsIGNvdW50LCBmYWxzZSwgdHJ1ZSk7XG4gICAgY29uc3QgZXJhID0gZ2V0SW5kZXhCeU5hbWUoWyBlcmFzWzBdLCBlcmFzWzFdIF0sIHN0YXRlLCB0cnVlKTtcblxuICAgIGlmIChlcmEgPT09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxufTtcblxucGFyc2Vycy5lID0gZnVuY3Rpb24oc3RhdGUsIGluZm8pIHtcbiAgICByZXR1cm4gcGFyc2VEYXlPZldlZWsoXCJlXCIsIHN0YXRlLCBpbmZvKTtcbn07XG5cbnBhcnNlcnMuYyA9IGZ1bmN0aW9uKHN0YXRlLCBpbmZvKSB7XG4gICAgcmV0dXJuIHBhcnNlRGF5T2ZXZWVrKFwiY1wiLCBzdGF0ZSwgaW5mbyk7XG59O1xuXG5mdW5jdGlvbiBjcmVhdGVEYXRlKHN0YXRlKSB7XG4gICAgbGV0IHsgeWVhciwgbW9udGgsIGRheSwgaG91cnMsIG1pbnV0ZXMsIHNlY29uZHMsIG1pbGxpc2Vjb25kcywgcG1Ib3VyLCBVVEMsIGhvdXJzT2Zmc2V0LCBtaW51dGVzT2Zmc2V0IH0gPSBzdGF0ZTtcbiAgICBjb25zdCBoYXNUaW1lID0gaG91cnMgIT09IG51bGwgfHwgbWludXRlcyAhPT0gbnVsbCB8fCBzZWNvbmRzIHx8IG51bGw7XG4gICAgY29uc3QgZGF0ZSA9IG5ldyBEYXRlKCk7XG4gICAgbGV0IHJlc3VsdDtcblxuICAgIGlmICh5ZWFyID09PSBudWxsICYmIG1vbnRoID09PSBudWxsICYmIGRheSA9PT0gbnVsbCAmJiBoYXNUaW1lKSB7XG4gICAgICAgIHllYXIgPSBkYXRlLmdldEZ1bGxZZWFyKCk7XG4gICAgICAgIG1vbnRoID0gZGF0ZS5nZXRNb250aCgpO1xuICAgICAgICBkYXkgPSBkYXRlLmdldERhdGUoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBpZiAoeWVhciA9PT0gbnVsbCkge1xuICAgICAgICAgICAgeWVhciA9IGRhdGUuZ2V0RnVsbFllYXIoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChkYXkgPT09IG51bGwpIHtcbiAgICAgICAgICAgIGRheSA9IDE7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAocG1Ib3VyICYmIGhvdXJzIDwgMTIpIHtcbiAgICAgICAgaG91cnMgKz0gMTI7XG4gICAgfVxuXG4gICAgaWYgKFVUQykge1xuICAgICAgICBpZiAoaG91cnNPZmZzZXQpIHtcbiAgICAgICAgICAgIGhvdXJzICs9IC1ob3Vyc09mZnNldDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChtaW51dGVzT2Zmc2V0KSB7XG4gICAgICAgICAgICBtaW51dGVzICs9IC1taW51dGVzT2Zmc2V0ICogKGhvdXJzT2Zmc2V0IDwgMCA/IC0xIDogMSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXN1bHQgPSBuZXcgRGF0ZShEYXRlLlVUQyh5ZWFyLCBtb250aCwgZGF5LCBob3VycywgbWludXRlcywgc2Vjb25kcywgbWlsbGlzZWNvbmRzKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmVzdWx0ID0gbmV3IERhdGUoeWVhciwgbW9udGgsIGRheSwgaG91cnMsIG1pbnV0ZXMsIHNlY29uZHMsIG1pbGxpc2Vjb25kcyk7XG4gICAgICAgIGFkanVzdERTVChyZXN1bHQsIGhvdXJzKTtcbiAgICB9XG5cbiAgICBpZiAoeWVhciA8IDEwMCkge1xuICAgICAgICByZXN1bHQuc2V0RnVsbFllYXIoeWVhcik7XG4gICAgfVxuXG4gICAgaWYgKHJlc3VsdC5nZXREYXRlKCkgIT09IGRheSAmJiBVVEMgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICByZXR1cm4gcmVzdWx0O1xufVxuXG5mdW5jdGlvbiBhZGRGb3JtYXRTcGFjZXModmFsdWUsIGZvcm1hdCkge1xuICAgIGNvbnN0IGxlYWRpbmdTcGFjZXMgPSBsZWFkaW5nU3BhY2VzUmVnZXguZXhlYyhmb3JtYXQpWzBdO1xuICAgIGNvbnN0IHRyYWlsaW5nU3BhY2VzID0gdHJhaWxpbmdTcGFjZXNSZWdleC5leGVjKGZvcm1hdClbMF07XG5cbiAgICByZXR1cm4gYCR7IGxlYWRpbmdTcGFjZXMgfSR7IHZhbHVlIH0keyB0cmFpbGluZ1NwYWNlcyB9YDtcbn1cblxuZnVuY3Rpb24gcGFyc2VFeGFjdCh2YWx1ZSwgZm9ybWF0LCBpbmZvKSB7XG4gICAgY29uc3QgcGF0dGVybiA9IGRhdGVQYXR0ZXJuKGZvcm1hdCwgaW5mbykuc3BsaXQoRU1QVFkpO1xuXG4gICAgY29uc3Qgc3RhdGUgPSB7XG4gICAgICAgIGZvcm1hdDogcGF0dGVybixcbiAgICAgICAgaWR4OiAwLFxuICAgICAgICB2YWx1ZTogYWRkRm9ybWF0U3BhY2VzKHZhbHVlLCBmb3JtYXQpLFxuICAgICAgICB2YWx1ZUlkeDogMCxcbiAgICAgICAgeWVhcjogbnVsbCxcbiAgICAgICAgbW9udGg6IG51bGwsXG4gICAgICAgIGRheTogbnVsbCxcbiAgICAgICAgaG91cnM6IG51bGwsXG4gICAgICAgIG1pbnV0ZXM6IG51bGwsXG4gICAgICAgIHNlY29uZHM6IG51bGwsXG4gICAgICAgIG1pbGxpc2Vjb25kczogbnVsbFxuICAgIH07XG5cbiAgICBjb25zdCBsZW5ndGggPSBwYXR0ZXJuLmxlbmd0aDtcbiAgICBsZXQgbGl0ZXJhbCA9IGZhbHNlO1xuXG4gICAgZm9yICg7IHN0YXRlLmlkeCA8IGxlbmd0aDsgc3RhdGUuaWR4KyspIHtcbiAgICAgICAgbGV0IGNoID0gcGF0dGVybltzdGF0ZS5pZHhdO1xuXG4gICAgICAgIGlmIChsaXRlcmFsKSB7XG4gICAgICAgICAgICBpZiAoY2ggPT09IFwiJ1wiKSB7XG4gICAgICAgICAgICAgICAgbGl0ZXJhbCA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjaGVja0xpdGVyYWwoc3RhdGUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKHBhcnNlcnNbY2hdKSB7XG4gICAgICAgICAgICAgICAgbGV0IGludmFsaWQgPSBwYXJzZXJzW2NoXShzdGF0ZSwgaW5mbyk7XG4gICAgICAgICAgICAgICAgaWYgKGludmFsaWQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIGlmIChjaCA9PT0gXCInXCIpIHtcbiAgICAgICAgICAgICAgICBsaXRlcmFsID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBjaGVja0xpdGVyYWwoc3RhdGUpO1xuICAgICAgICAgICAgfSBlbHNlIGlmICghY2hlY2tMaXRlcmFsKHN0YXRlKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHN0YXRlLnZhbHVlSWR4IDwgdmFsdWUubGVuZ3RoKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIHJldHVybiBjcmVhdGVEYXRlKHN0YXRlKSB8fCBudWxsO1xufVxuXG5mdW5jdGlvbiBwYXJzZU1pY3Jvc29mdERhdGVPZmZzZXQob2Zmc2V0KSB7XG4gICAgY29uc3Qgc2lnbiA9IG9mZnNldC5zdWJzdHIoMCwgMSkgPT09IFwiLVwiID8gLTEgOiAxO1xuXG4gICAgbGV0IHJlc3VsdCA9IG9mZnNldC5zdWJzdHJpbmcoMSk7XG4gICAgcmVzdWx0ID0gKHBhcnNlSW50KHJlc3VsdC5zdWJzdHIoMCwgMiksIDEwKSAqIDYwKSArIHBhcnNlSW50KHJlc3VsdC5zdWJzdHJpbmcoMiksIDEwKTtcblxuICAgIHJldHVybiBzaWduICogcmVzdWx0O1xufVxuXG5mdW5jdGlvbiBwYXJzZU1pY3Jvc29mdERhdGVGb3JtYXQodmFsdWUpIHtcbiAgICBpZiAodmFsdWUgJiYgdmFsdWUuaW5kZXhPZihcIi9EXCIpID09PSAwKSB7XG4gICAgICAgIGxldCBkYXRlID0gZGF0ZVJlZ0V4cC5leGVjKHZhbHVlKTtcbiAgICAgICAgaWYgKGRhdGUpIHtcbiAgICAgICAgICAgIGRhdGUgPSBkYXRlWzFdO1xuICAgICAgICAgICAgbGV0IHR6b2Zmc2V0ID0gb2Zmc2V0UmVnRXhwLmV4ZWMoZGF0ZS5zdWJzdHJpbmcoMSkpO1xuXG4gICAgICAgICAgICBkYXRlID0gbmV3IERhdGUocGFyc2VJbnQoZGF0ZSwgMTApKTtcblxuICAgICAgICAgICAgaWYgKHR6b2Zmc2V0KSB7XG4gICAgICAgICAgICAgICAgdHpvZmZzZXQgPSBwYXJzZU1pY3Jvc29mdERhdGVPZmZzZXQodHpvZmZzZXRbMF0pO1xuICAgICAgICAgICAgICAgIGRhdGUgPSBjb252ZXJ0VGltZVpvbmUoZGF0ZSwgZGF0ZS5nZXRUaW1lem9uZU9mZnNldCgpLCAwKTtcbiAgICAgICAgICAgICAgICBkYXRlID0gY29udmVydFRpbWVab25lKGRhdGUsIDAsIC0xICogdHpvZmZzZXQpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gZGF0ZTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZnVuY3Rpb24gZGVmYXVsdEZvcm1hdHMoY2FsZW5kYXIpIHtcbiAgICBjb25zdCBmb3JtYXRzID0gW107XG4gICAgY29uc3QgcGF0dGVybnMgPSBjYWxlbmRhci5wYXR0ZXJucztcbiAgICBjb25zdCBsZW5ndGggPSBGT1JNQVRTX1NFUVVFTkNFLmxlbmd0aDtcblxuICAgIGZvciAobGV0IGlkeCA9IDA7IGlkeCA8IGxlbmd0aDsgaWR4KyspIHtcbiAgICAgICAgZm9ybWF0cy5wdXNoKHBhdHRlcm5zW0ZPUk1BVFNfU0VRVUVOQ0VbaWR4XV0pO1xuICAgIH1cblxuICAgIHJldHVybiBmb3JtYXRzLmNvbmNhdChzdGFuZGFyZERhdGVGb3JtYXRzKTtcbn1cblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gcGFyc2VEYXRlKHZhbHVlLCBmb3JtYXRzLCBsb2NhbGUgPSBERUZBVUxUX0xPQ0FMRSkge1xuICAgIGlmICghdmFsdWUpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgaWYgKGlzRGF0ZSh2YWx1ZSkpIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgIH1cblxuICAgIGxldCBwYXJzZVZhbHVlID0gU3RyaW5nKHZhbHVlKS50cmltKCk7XG4gICAgbGV0IGRhdGUgPSBwYXJzZU1pY3Jvc29mdERhdGVGb3JtYXQocGFyc2VWYWx1ZSk7XG4gICAgaWYgKGRhdGUpIHtcbiAgICAgICAgcmV0dXJuIGRhdGU7XG4gICAgfVxuXG4gICAgY29uc3QgaW5mbyA9IGxvY2FsZUluZm8obG9jYWxlKTtcbiAgICBsZXQgcGFyc2VGb3JtYXRzID0gZm9ybWF0cyB8fCBkZWZhdWx0Rm9ybWF0cyhpbmZvLmNhbGVuZGFyKTtcbiAgICBwYXJzZUZvcm1hdHMgPSBBcnJheS5pc0FycmF5KHBhcnNlRm9ybWF0cykgPyBwYXJzZUZvcm1hdHMgOiBbIHBhcnNlRm9ybWF0cyBdO1xuXG4gICAgY29uc3QgbGVuZ3RoID0gcGFyc2VGb3JtYXRzLmxlbmd0aDtcblxuICAgIGZvciAobGV0IGlkeCA9IDA7IGlkeCA8IGxlbmd0aDsgaWR4KyspIHtcbiAgICAgICAgZGF0ZSA9IHBhcnNlRXhhY3QocGFyc2VWYWx1ZSwgcGFyc2VGb3JtYXRzW2lkeF0sIGluZm8pO1xuICAgICAgICBpZiAoZGF0ZSkge1xuICAgICAgICAgICAgcmV0dXJuIGRhdGU7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gZGF0ZTtcbn1cbiIsImltcG9ydCB7IERFRkFVTFRfTE9DQUxFIH0gZnJvbSAnLi4vY29tbW9uL2NvbnN0YW50cyc7XG5pbXBvcnQgaXNOdW1iZXIgZnJvbSAnLi4vY29tbW9uL2lzLW51bWJlcic7XG5pbXBvcnQgZGF0ZVBhdHRlcm4gZnJvbSAnLi9kYXRlLXBhdHRlcm4nO1xuaW1wb3J0IGRhdGVOYW1lVHlwZSBmcm9tICcuL2RhdGUtbmFtZS10eXBlJztcbmltcG9ydCB7IGRhdGVGb3JtYXRSZWdFeHAsIERBVEVfRklFTERfTUFQIH0gZnJvbSAnLi9jb25zdGFudHMnO1xuaW1wb3J0IHsgbG9jYWxlSW5mbyB9IGZyb20gJy4uL2NsZHInO1xuXG5jb25zdCBOQU1FX1RZUEVTID0ge1xuICAgIG1vbnRoOiB7XG4gICAgICAgIHR5cGU6ICdtb250aHMnLFxuICAgICAgICBtaW5MZW5ndGg6IDMsXG4gICAgICAgIHN0YW5kQWxvbmU6ICdMJ1xuICAgIH0sXG5cbiAgICBxdWFydGVyOiB7XG4gICAgICAgIHR5cGU6ICdxdWFydGVycycsXG4gICAgICAgIG1pbkxlbmd0aDogMyxcbiAgICAgICAgc3RhbmRBbG9uZTogJ3EnXG4gICAgfSxcblxuICAgIHdlZWtkYXk6IHtcbiAgICAgICAgdHlwZTogJ2RheXMnLFxuICAgICAgICBtaW5MZW5ndGg6IHtcbiAgICAgICAgICAgIEU6IDAsXG4gICAgICAgICAgICBjOiAzLFxuICAgICAgICAgICAgZTogM1xuICAgICAgICB9LFxuICAgICAgICBzdGFuZEFsb25lOiAnYydcbiAgICB9LFxuXG4gICAgZGF5cGVyaW9kOiB7XG4gICAgICAgIHR5cGU6ICdkYXlQZXJpb2RzJyxcbiAgICAgICAgbWluTGVuZ3RoOiAwXG4gICAgfSxcblxuICAgIGVyYToge1xuICAgICAgICB0eXBlOiAnZXJhcycsXG4gICAgICAgIG1pbkxlbmd0aDogMFxuICAgIH1cbn07XG5cbmNvbnN0IExJVEVSQUwgPSAnbGl0ZXJhbCc7XG5cbmZ1bmN0aW9uIGFkZExpdGVyYWwocGFydHMsIHZhbHVlKSB7XG4gICAgY29uc3QgbGFzdFBhcnQgPSBwYXJ0c1twYXJ0cy5sZW5ndGggLSAxXTtcbiAgICBpZiAobGFzdFBhcnQgJiYgbGFzdFBhcnQudHlwZSA9PT0gTElURVJBTCkge1xuICAgICAgICBsYXN0UGFydC5wYXR0ZXJuICs9IHZhbHVlO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHBhcnRzLnB1c2goe1xuICAgICAgICAgICAgdHlwZTogTElURVJBTCxcbiAgICAgICAgICAgIHBhdHRlcm46IHZhbHVlXG4gICAgICAgIH0pO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gaXNIb3VyMTIocGF0dGVybikge1xuICAgIHJldHVybiBwYXR0ZXJuID09PSAnaCcgfHwgcGF0dGVybiA9PT0gJ0snO1xufVxuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBzcGxpdERhdGVGb3JtYXQoZm9ybWF0LCBsb2NhbGUgPSBERUZBVUxUX0xPQ0FMRSkge1xuICAgIGNvbnN0IGluZm8gPSBsb2NhbGVJbmZvKGxvY2FsZSk7XG4gICAgY29uc3QgcGF0dGVybiA9IGRhdGVQYXR0ZXJuKGZvcm1hdCwgaW5mbyk7XG4gICAgY29uc3QgcGFydHMgPSBbXTtcbiAgICBsZXQgbGFzdEluZGV4ID0gZGF0ZUZvcm1hdFJlZ0V4cC5sYXN0SW5kZXggPSAwO1xuICAgIGxldCBtYXRjaCA9IGRhdGVGb3JtYXRSZWdFeHAuZXhlYyhwYXR0ZXJuKTtcblxuICAgIHdoaWxlIChtYXRjaCkge1xuICAgICAgICBsZXQgdmFsdWUgPSBtYXRjaFswXTtcblxuICAgICAgICBpZiAobGFzdEluZGV4IDwgbWF0Y2guaW5kZXgpIHtcbiAgICAgICAgICAgIGFkZExpdGVyYWwocGFydHMsIHBhdHRlcm4uc3Vic3RyaW5nKGxhc3RJbmRleCwgbWF0Y2guaW5kZXgpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh2YWx1ZS5zdGFydHNXaXRoKCdcIicpIHx8IHZhbHVlLnN0YXJ0c1dpdGgoXCInXCIpKSB7XG4gICAgICAgICAgICBhZGRMaXRlcmFsKHBhcnRzLCB2YWx1ZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zdCBzcGVjaWZpZXIgPSB2YWx1ZVswXTtcbiAgICAgICAgICAgIGNvbnN0IHR5cGUgPSBEQVRFX0ZJRUxEX01BUFtzcGVjaWZpZXJdO1xuICAgICAgICAgICAgY29uc3QgcGFydCA9IHtcbiAgICAgICAgICAgICAgICB0eXBlOiB0eXBlLFxuICAgICAgICAgICAgICAgIHBhdHRlcm46IHZhbHVlXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBpZiAodHlwZSA9PT0gJ2hvdXInKSB7XG4gICAgICAgICAgICAgICAgcGFydC5ob3VyMTIgPSBpc0hvdXIxMih2YWx1ZSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IG5hbWVzID0gTkFNRV9UWVBFU1t0eXBlXTtcblxuICAgICAgICAgICAgaWYgKG5hbWVzKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgbWluTGVuZ3RoID0gaXNOdW1iZXIobmFtZXMubWluTGVuZ3RoKSA/IG5hbWVzLm1pbkxlbmd0aCA6IG5hbWVzLm1pbkxlbmd0aFtzcGVjaWZpZXJdO1xuICAgICAgICAgICAgICAgIGNvbnN0IHBhdHRlcm5MZW5ndGggPSB2YWx1ZS5sZW5ndGg7XG5cbiAgICAgICAgICAgICAgICBpZiAocGF0dGVybkxlbmd0aCA+PSBtaW5MZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgcGFydC5uYW1lcyA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IG5hbWVzLnR5cGUsXG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lVHlwZTogZGF0ZU5hbWVUeXBlKHBhdHRlcm5MZW5ndGgpLFxuICAgICAgICAgICAgICAgICAgICAgICAgc3RhbmRBbG9uZTogbmFtZXMuc3RhbmRBbG9uZSA9PT0gc3BlY2lmaWVyXG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBwYXJ0cy5wdXNoKHBhcnQpO1xuICAgICAgICB9XG5cbiAgICAgICAgbGFzdEluZGV4ID0gZGF0ZUZvcm1hdFJlZ0V4cC5sYXN0SW5kZXg7XG4gICAgICAgIG1hdGNoID0gZGF0ZUZvcm1hdFJlZ0V4cC5leGVjKHBhdHRlcm4pO1xuICAgIH1cblxuICAgIGlmIChsYXN0SW5kZXggPCBwYXR0ZXJuLmxlbmd0aCkge1xuICAgICAgICBhZGRMaXRlcmFsKHBhcnRzLCBwYXR0ZXJuLnN1YnN0cmluZyhsYXN0SW5kZXgpKTtcbiAgICB9XG5cbiAgICByZXR1cm4gcGFydHM7XG59XG4iLCJpbXBvcnQgeyBmb3JtYXREYXRlIH0gZnJvbSAnLi9kYXRlcyc7XG5pbXBvcnQgeyBmb3JtYXROdW1iZXIgfSBmcm9tICcuL251bWJlcnMnO1xuaW1wb3J0IHsgRU1QVFkgfSBmcm9tICcuL2NvbW1vbi9jb25zdGFudHMnO1xuaW1wb3J0IGlzRGF0ZSBmcm9tICcuL2NvbW1vbi9pcy1kYXRlJztcbmltcG9ydCBpc051bWJlciBmcm9tICcuL2NvbW1vbi9pcy1udW1iZXInO1xuXG5jb25zdCBmb3JtYXRSZWdFeHAgPSAvXFx7KFxcZCspKDpbXn1dKyk/XFx9L2c7XG5cbmV4cG9ydCBmdW5jdGlvbiB0b1N0cmluZyh2YWx1ZSwgZm9ybWF0LCBsb2NhbGUpIHtcbiAgICBpZiAoZm9ybWF0KSB7XG4gICAgICAgIGlmIChpc0RhdGUodmFsdWUpKSB7XG4gICAgICAgICAgICByZXR1cm4gZm9ybWF0RGF0ZSh2YWx1ZSwgZm9ybWF0LCBsb2NhbGUpO1xuICAgICAgICB9IGVsc2UgaWYgKGlzTnVtYmVyKHZhbHVlKSkge1xuICAgICAgICAgICAgcmV0dXJuIGZvcm1hdE51bWJlcih2YWx1ZSwgZm9ybWF0LCBsb2NhbGUpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHZhbHVlICE9PSB1bmRlZmluZWQgJiYgdmFsdWUgIT09IG51bGwgPyB2YWx1ZSA6IEVNUFRZO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZm9ybWF0KGZvcm1hdCwgdmFsdWVzLCBsb2NhbGUpIHtcbiAgICByZXR1cm4gZm9ybWF0LnJlcGxhY2UoZm9ybWF0UmVnRXhwLCBmdW5jdGlvbihtYXRjaCwgaW5kZXgsIHBsYWNlaG9sZGVyRm9ybWF0KSB7XG4gICAgICAgIGxldCB2YWx1ZSA9IHZhbHVlc1twYXJzZUludChpbmRleCwgMTApXTtcblxuICAgICAgICByZXR1cm4gdG9TdHJpbmcodmFsdWUsIHBsYWNlaG9sZGVyRm9ybWF0ID8gcGxhY2Vob2xkZXJGb3JtYXQuc3Vic3RyaW5nKDEpIDogRU1QVFksIGxvY2FsZSk7XG4gICAgfSk7XG59XG4iXSwibmFtZXMiOlsiY29uc3QiLCJmb3JtYXRSZWdFeHAiLCJsZXQiLCJwYXR0ZXJuIiwiYXJndW1lbnRzIiwiTm9XZWVrRGF0YSIsIlBMQUNFSE9MREVSIiwiaWR4Il0sIm1hcHBpbmdzIjoiOztBQUFBQSxJQUFNLFdBQVcsR0FBRztBQUNwQixJQUFJLEVBQUUsRUFBRTtBQUNSLFFBQVEsSUFBSSxFQUFFLElBQUk7QUFDbEIsUUFBUSxRQUFRLEVBQUU7QUFDbEIsWUFBWSxPQUFPLEVBQUU7QUFDckIsZ0JBQWdCLGVBQWUsRUFBRSxRQUFRO0FBQ3pDLGdCQUFnQixZQUFZLEVBQUU7QUFDOUIsYUFBYTtBQUNiLFlBQVksUUFBUSxFQUFFO0FBQ3RCLFNBQVM7QUFDVCxRQUFRLFNBQVMsRUFBRSxJQUFJO0FBQ3ZCLFFBQVEsT0FBTyxFQUFFO0FBQ2pCLFlBQVksT0FBTyxFQUFFO0FBQ3JCLGdCQUFnQixPQUFPLEVBQUUsR0FBRztBQUM1QixnQkFBZ0IsS0FBSyxFQUFFLEdBQUc7QUFDMUIsZ0JBQWdCLElBQUksRUFBRSxHQUFHO0FBQ3pCLGdCQUFnQixXQUFXLEVBQUUsR0FBRztBQUNoQyxnQkFBZ0IsUUFBUSxFQUFFLEdBQUc7QUFDN0IsZ0JBQWdCLFNBQVMsRUFBRSxHQUFHO0FBQzlCLGdCQUFnQixXQUFXLEVBQUUsR0FBRztBQUNoQyxnQkFBZ0Isc0JBQXNCLEVBQUUsR0FBRztBQUMzQyxnQkFBZ0IsUUFBUSxFQUFFLEdBQUc7QUFDN0IsZ0JBQWdCLFFBQVEsRUFBRSxHQUFHO0FBQzdCLGdCQUFnQixHQUFHLEVB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{"version":3,"file":"main.js","sources":["src/cldr/default-data.js","src/common/is-string.js","src/error-details.js","src/errors.js","src/cldr/info.js","src/common/constants.js","src/cldr/load-numbers.js","src/cldr/load-dates.js","src/cldr/territory.js","src/cldr/load-units.js","src/cldr/load.js","src/cldr/set-data.js","src/cldr/date-field-name.js","src/cldr/date-format-names.js","src/cldr/parse-range-date.js","src/cldr/currency.js","src/cldr/constants.js","src/cldr/first-day.js","src/cldr/weekend-range.js","src/cldr/number-symbols.js","src/common/is-negative-zero.js","src/numbers/format-currency-symbol.js","src/numbers/group-integer.js","src/numbers/is-currency-style.js","src/common/pad.js","src/common/round.js","src/numbers/standard-number-format.js","src/numbers/utils.js","src/numbers/custom-number-format.js","src/numbers/format-options.js","src/numbers/format-number.js","src/common/is-number.js","src/numbers/parse-number.js","src/common/format-string.js","src/dates/date-pattern.js","src/dates/date-name-type.js","src/dates/format-names.js","src/common/is-date.js","src/dates/constants.js","src/dates/format-date.js","src/dates/time-utils.js","src/dates/parse-date.js","src/dates/split-date-format.js","src/format.js"],"sourcesContent":["const defaultData = {\n    en: {\n        name: \"en\",\n        identity: {\n            version: {\n                _unicodeVersion: \"14.0.0\",\n                _cldrVersion: \"41\"\n            },\n            language: \"en\"\n        },\n        territory: \"US\",\n        numbers: {\n            symbols: {\n                decimal: \".\",\n                group: \",\",\n                list: \";\",\n                percentSign: \"%\",\n                plusSign: \"+\",\n                minusSign: \"-\",\n                exponential: \"E\",\n                superscriptingExponent: \"×\",\n                perMille: \"‰\",\n                infinity: \"∞\",\n                nan: \"NaN\",\n                timeSeparator: \":\",\n                approximatelySign: \"~\"\n            },\n            decimal: {\n                patterns: [\n                    \"n\"\n                ],\n                groupSize: [\n                    3\n                ]\n            },\n            scientific: {\n                patterns: [\n                    \"nEn\"\n                ],\n                groupSize: []\n            },\n            percent: {\n                patterns: [\n                    \"n%\"\n                ],\n                groupSize: [\n                    3\n                ]\n            },\n            currency: {\n                patterns: [\n                    \"$n\"\n                ],\n                groupSize: [\n                    3\n                ],\n                \"unitPattern-count-one\": \"n $\",\n                \"unitPattern-count-other\": \"n $\"\n            },\n            currencies: {\n                BGN: {\n                    displayName: \"Bulgarian Lev\",\n                    \"displayName-count-one\": \"Bulgarian lev\",\n                    \"displayName-count-other\": \"Bulgarian leva\",\n                    symbol: \"BGN\"\n                },\n                EUR: {\n                    displayName: \"Euro\",\n                    \"displayName-count-one\": \"euro\",\n                    \"displayName-count-other\": \"euros\",\n                    symbol: \"€\",\n                    \"symbol-alt-narrow\": \"€\"\n                },\n                USD: {\n                    displayName: \"US Dollar\",\n                    \"displayName-count-one\": \"US dollar\",\n                    \"displayName-count-other\": \"US dollars\",\n                    symbol: \"$\",\n                    \"symbol-alt-narrow\": \"$\"\n                }\n            },\n            localeCurrency: \"USD\",\n            accounting: {\n                patterns: [\n                    \"$n\",\n                    \"($n)\"\n                ],\n                groupSize: [\n                    3\n                ]\n            }\n        },\n        calendar: {\n            gmtFormat: \"GMT{0}\",\n            gmtZeroFormat: \"GMT\",\n            patterns: {\n                d: \"M/d/y\",\n                D: \"EEEE, MMMM d, y\",\n                m: \"MMM d\",\n                M: \"MMMM d\",\n                y: \"MMM y\",\n                Y: \"MMMM y\",\n                F: \"EEEE, MMMM d, y h:mm:ss a\",\n                g: \"M/d/y h:mm a\",\n                G: \"M/d/y h:mm:ss a\",\n                t: \"h:mm a\",\n                T: \"h:mm:ss a\",\n                s: \"yyyy'-'MM'-'dd'T'HH':'mm':'ss\",\n                u: \"yyyy'-'MM'-'dd HH':'mm':'ss'Z'\"\n            },\n            dateTimeFormats: {\n                full: \"{1}, {0}\",\n                long: \"{1}, {0}\",\n                medium: \"{1}, {0}\",\n                short: \"{1}, {0}\",\n                availableFormats: {\n                    Bh: \"h B\",\n                    Bhm: \"h:mm B\",\n                    Bhms: \"h:mm:ss B\",\n                    d: \"d\",\n                    E: \"ccc\",\n                    EBh: \"E h B\",\n                    EBhm: \"E h:mm B\",\n                    EBhms: \"E h:mm:ss B\",\n                    Ed: \"d E\",\n                    Eh: \"E h a\",\n                    Ehm: \"E h:mm a\",\n                    EHm: \"E HH:mm\",\n                    Ehms: \"E h:mm:ss a\",\n                    EHms: \"E HH:mm:ss\",\n                    Gy: \"y G\",\n                    GyM: \"M/y G\",\n                    GyMd: \"M/d/y G\",\n                    GyMEd: \"E, M/d/y G\",\n                    GyMMM: \"MMM y G\",\n                    GyMMMd: \"MMM d, y G\",\n                    GyMMMEd: \"E, MMM d, y G\",\n                    h: \"h a\",\n                    H: \"HH\",\n                    hm: \"h:mm a\",\n                    Hm: \"HH:mm\",\n                    hms: \"h:mm:ss a\",\n                    Hms: \"HH:mm:ss\",\n                    hmsv: \"h:mm:ss a v\",\n                    Hmsv: \"HH:mm:ss v\",\n                    hmv: \"h:mm a v\",\n                    Hmv: \"HH:mm v\",\n                    hv: \"h a v\",\n                    Hv: \"HH'h' v\",\n                    M: \"L\",\n                    Md: \"M/d\",\n                    MEd: \"E, M/d\",\n                    MMM: \"LLL\",\n                    MMMd: \"MMM d\",\n                    MMMEd: \"E, MMM d\",\n                    MMMMd: \"MMMM d\",\n                    \"MMMMW-count-one\": \"'week' W 'of' MMMM\",\n                    \"MMMMW-count-other\": \"'week' W 'of' MMMM\",\n                    ms: \"mm:ss\",\n                    y: \"y\",\n                    yM: \"M/y\",\n                    yMd: \"M/d/y\",\n                    yMEd: \"E, M/d/y\",\n                    yMMM: \"MMM y\",\n                    yMMMd: \"MMM d, y\",\n                    yMMMEd: \"E, MMM d, y\",\n                    yMMMM: \"MMMM y\",\n                    yQQQ: \"QQQ y\",\n                    yQQQQ: \"QQQQ y\",\n                    \"yw-count-one\": \"'week' w 'of' Y\",\n                    \"yw-count-other\": \"'week' w 'of' Y\"\n                }\n            },\n            timeFormats: {\n                full: \"h:mm:ss a zzzz\",\n                long: \"h:mm:ss a z\",\n                medium: \"h:mm:ss a\",\n                short: \"h:mm a\"\n            },\n            dateFormats: {\n                full: \"EEEE, MMMM d, y\",\n                long: \"MMMM d, y\",\n                medium: \"MMM d, y\",\n                short: \"M/d/yy\"\n            },\n            days: {\n                format: {\n                    abbreviated: [\n                        \"Sun\",\n                        \"Mon\",\n                        \"Tue\",\n                        \"Wed\",\n                        \"Thu\",\n                        \"Fri\",\n                        \"Sat\"\n                    ],\n                    narrow: [\n                        \"S\",\n                        \"M\",\n                        \"T\",\n                        \"W\",\n                        \"T\",\n                        \"F\",\n                        \"S\"\n                    ],\n                    short: [\n                        \"Su\",\n                        \"Mo\",\n                        \"Tu\",\n                        \"We\",\n                        \"Th\",\n                        \"Fr\",\n                        \"Sa\"\n                    ],\n                    wide: [\n                        \"Sunday\",\n                        \"Monday\",\n                        \"Tuesday\",\n                        \"Wednesday\",\n                        \"Thursday\",\n                        \"Friday\",\n                        \"Saturday\"\n                    ]\n                },\n                \"stand-alone\": {\n                    abbreviated: [\n                        \"Sun\",\n                        \"Mon\",\n                        \"Tue\",\n                        \"Wed\",\n                        \"Thu\",\n                        \"Fri\",\n                        \"Sat\"\n                    ],\n                    narrow: [\n                        \"S\",\n                        \"M\",\n                        \"T\",\n                        \"W\",\n                        \"T\",\n                        \"F\",\n                        \"S\"\n                    ],\n                    short: [\n                        \"Su\",\n                        \"Mo\",\n                        \"Tu\",\n                        \"We\",\n                        \"Th\",\n                        \"Fr\",\n                        \"Sa\"\n                    ],\n                    wide: [\n                        \"Sunday\",\n                        \"Monday\",\n                        \"Tuesday\",\n                        \"Wednesday\",\n                        \"Thursday\",\n                        \"Friday\",\n                        \"Saturday\"\n                    ]\n                }\n            },\n            months: {\n                format: {\n                    abbreviated: [\n                        \"Jan\",\n                        \"Feb\",\n                        \"Mar\",\n                        \"Apr\",\n                        \"May\",\n                        \"Jun\",\n                        \"Jul\",\n                        \"Aug\",\n                        \"Sep\",\n                        \"Oct\",\n                        \"Nov\",\n                        \"Dec\"\n                    ],\n                    narrow: [\n                        \"J\",\n                        \"F\",\n                        \"M\",\n                        \"A\",\n                        \"M\",\n                        \"J\",\n                        \"J\",\n                        \"A\",\n                        \"S\",\n                        \"O\",\n                        \"N\",\n                        \"D\"\n                    ],\n                    wide: [\n                        \"January\",\n                        \"February\",\n                        \"March\",\n                        \"April\",\n                        \"May\",\n                        \"June\",\n                        \"July\",\n                        \"August\",\n                        \"September\",\n                        \"October\",\n                        \"November\",\n                        \"December\"\n                    ]\n                },\n                \"stand-alone\": {\n                    abbreviated: [\n                        \"Jan\",\n                        \"Feb\",\n                        \"Mar\",\n                        \"Apr\",\n                        \"May\",\n                        \"Jun\",\n                        \"Jul\",\n                        \"Aug\",\n                        \"Sep\",\n                        \"Oct\",\n                        \"Nov\",\n                        \"Dec\"\n                    ],\n                    narrow: [\n                        \"J\",\n                        \"F\",\n                        \"M\",\n                        \"A\",\n                        \"M\",\n                        \"J\",\n                        \"J\",\n                        \"A\",\n                        \"S\",\n                        \"O\",\n                        \"N\",\n                        \"D\"\n                    ],\n                    wide: [\n                        \"January\",\n                        \"February\",\n                        \"March\",\n                        \"April\",\n                        \"May\",\n                        \"June\",\n                        \"July\",\n                        \"August\",\n                        \"September\",\n                        \"October\",\n                        \"November\",\n                        \"December\"\n                    ]\n                }\n            },\n            quarters: {\n                format: {\n                    abbreviated: [\n                        \"Q1\",\n                        \"Q2\",\n                        \"Q3\",\n                        \"Q4\"\n                    ],\n                    narrow: [\n                        \"1\",\n                        \"2\",\n                        \"3\",\n                        \"4\"\n                    ],\n                    wide: [\n                        \"1st quarter\",\n                        \"2nd quarter\",\n                        \"3rd quarter\",\n                        \"4th quarter\"\n                    ]\n                },\n                \"stand-alone\": {\n                    abbreviated: [\n                        \"Q1\",\n                        \"Q2\",\n                        \"Q3\",\n                        \"Q4\"\n                    ],\n                    narrow: [\n                        \"1\",\n                        \"2\",\n                        \"3\",\n                        \"4\"\n                    ],\n                    wide: [\n                        \"1st quarter\",\n                        \"2nd quarter\",\n                        \"3rd quarter\",\n                        \"4th quarter\"\n                    ]\n                }\n            },\n            dayPeriods: {\n                format: {\n                    abbreviated: {\n                        midnight: \"midnight\",\n                        am: \"AM\",\n                        \"am-alt-variant\": \"am\",\n                        noon: \"noon\",\n                        pm: \"PM\",\n                        \"pm-alt-variant\": \"pm\",\n                        morning1: \"in the morning\",\n                        afternoon1: \"in the afternoon\",\n                        evening1: \"in the evening\",\n                        night1: \"at night\"\n                    },\n                    narrow: {\n                        midnight: \"mi\",\n                        am: \"a\",\n                        \"am-alt-variant\": \"am\",\n                        noon: \"n\",\n                        pm: \"p\",\n                        \"pm-alt-variant\": \"pm\",\n                        morning1: \"in the morning\",\n                        afternoon1: \"in the afternoon\",\n                        evening1: \"in the evening\",\n                        night1: \"at night\"\n                    },\n                    wide: {\n                        midnight: \"midnight\",\n                        am: \"AM\",\n                        \"am-alt-variant\": \"am\",\n                        noon: \"noon\",\n                        pm: \"PM\",\n                        \"pm-alt-variant\": \"pm\",\n                        morning1: \"in the morning\",\n                        afternoon1: \"in the afternoon\",\n                        evening1: \"in the evening\",\n                        night1: \"at night\"\n                    }\n                },\n                \"stand-alone\": {\n                    abbreviated: {\n                        midnight: \"midnight\",\n                        am: \"AM\",\n                        \"am-alt-variant\": \"am\",\n                        noon: \"noon\",\n                        pm: \"PM\",\n                        \"pm-alt-variant\": \"pm\",\n                        morning1: \"morning\",\n                        afternoon1: \"afternoon\",\n                        evening1: \"evening\",\n                        night1: \"night\"\n                    },\n                    narrow: {\n                        midnight: \"midnight\",\n                        am: \"AM\",\n                        \"am-alt-variant\": \"am\",\n                        noon: \"noon\",\n                        pm: \"PM\",\n                        \"pm-alt-variant\": \"pm\",\n                        morning1: \"morning\",\n                        afternoon1: \"afternoon\",\n                        evening1: \"evening\",\n                        night1: \"night\"\n                    },\n                    wide: {\n                        midnight: \"midnight\",\n                        am: \"AM\",\n                        \"am-alt-variant\": \"am\",\n                        noon: \"noon\",\n                        pm: \"PM\",\n                        \"pm-alt-variant\": \"pm\",\n                        morning1: \"morning\",\n                        afternoon1: \"afternoon\",\n                        evening1: \"evening\",\n                        night1: \"night\"\n                    }\n                }\n            },\n            eras: {\n                format: {\n                    wide: {\n                        \"0\": \"Before Christ\",\n                        \"1\": \"Anno Domini\",\n                        \"0-alt-variant\": \"Before Common Era\",\n                        \"1-alt-variant\": \"Common Era\"\n                    },\n                    abbreviated: {\n                        \"0\": \"BC\",\n                        \"1\": \"AD\",\n                        \"0-alt-variant\": \"BCE\",\n                        \"1-alt-variant\": \"CE\"\n                    },\n                    narrow: {\n                        \"0\": \"B\",\n                        \"1\": \"A\",\n                        \"0-alt-variant\": \"BCE\",\n                        \"1-alt-variant\": \"CE\"\n                    }\n                }\n            },\n            dateFields: {\n                era: {\n                    wide: \"era\",\n                    short: \"era\",\n                    narrow: \"era\"\n                },\n                year: {\n                    wide: \"year\",\n                    short: \"yr.\",\n                    narrow: \"yr.\"\n                },\n                quarter: {\n                    wide: \"quarter\",\n                    short: \"qtr.\",\n                    narrow: \"qtr.\"\n                },\n                month: {\n                    wide: \"month\",\n                    short: \"mo.\",\n                    narrow: \"mo.\"\n                },\n                week: {\n                    wide: \"week\",\n                    short: \"wk.\",\n                    narrow: \"wk.\"\n                },\n                weekOfMonth: {\n                    wide: \"week of month\",\n                    short: \"wk. of mo.\",\n                    narrow: \"wk. of mo.\"\n                },\n                day: {\n                    wide: \"day\",\n                    short: \"day\",\n                    narrow: \"day\"\n                },\n                dayOfYear: {\n                    wide: \"day of year\",\n                    short: \"day of yr.\",\n                    narrow: \"day of yr.\"\n                },\n                weekday: {\n                    wide: \"day of the week\",\n                    short: \"day of wk.\",\n                    narrow: \"day of wk.\"\n                },\n                weekdayOfMonth: {\n                    wide: \"weekday of the month\",\n                    short: \"wkday. of mo.\",\n                    narrow: \"wkday. of mo.\"\n                },\n                dayperiod: {\n                    short: \"AM/PM\",\n                    wide: \"AM/PM\",\n                    narrow: \"AM/PM\"\n                },\n                hour: {\n                    wide: \"hour\",\n                    short: \"hr.\",\n                    narrow: \"hr.\"\n                },\n                minute: {\n                    wide: \"minute\",\n                    short: \"min.\",\n                    narrow: \"min.\"\n                },\n                second: {\n                    wide: \"second\",\n                    short: \"sec.\",\n                    narrow: \"sec.\"\n                },\n                zone: {\n                    wide: \"time zone\",\n                    short: \"zone\",\n                    narrow: \"zone\"\n                },\n                millisecond: {\n                    narrow: \"ms\",\n                    short: \"ms\",\n                    wide: \"millisecond\"\n                }\n            }\n        }\n    },\n    supplemental: {\n        likelySubtags: {\n            en: \"en-Latn-US\"\n        },\n        currencyData: {\n            region: {\n                US: [\n                    {\n                        USD: {\n                            _from: \"1792-01-01\"\n                        }\n                    }\n                ]\n            }\n        },\n        weekData: {\n            firstDay: {\n                US: \"sun\"\n            },\n            weekendStart: {\n                \"001\": \"sat\"\n            },\n            weekendEnd: {\n                \"001\": \"sun\"\n            }\n        }\n    }\n};\nexport default defaultData;","export default function isString(value) {\n    return typeof value === \"string\";\n}","//The error is represented by unique name and corresponding message\n//The message can contain placeholders with index, e.g. {0}, {1}\n\nexport default {\n    \"NoLocale\": \"Missing locale info for '{0}'\",\n    \"NoCurrency\": \"Cannot determine currency information. Please load the locale currencies data.\",\n    \"NoSupplementalCurrency\": \"Cannot determine currency. Please load the supplemental currencyData.\",\n    \"NoCurrencyRegion\": \"No currency data for region '{0}'\",\n    \"NoCurrencyDisplay\": \"Cannot determine currency display information. Please load the locale currencies data. The default culture does not include the all currencies data.\",\n    \"NoGMTInfo\": \"Cannot determine locale GMT format. Please load the locale timeZoneNames data.\",\n    \"NoWeekData\": \"Cannot determine locale first day of week. Please load the supplemental weekData.\",\n    \"NoFirstDay\": \"Cannot determine locale first day of week. Please load the supplemental weekData. The default culture includes only the 'en-US' first day info.\",\n    \"NoValidCurrency\": \"Cannot determine a default currency for the {0} locale. Please specify explicitly the currency with the format options.\",\n    \"NoDateFieldNames\": \"Cannot determine the locale date field names. Please load the locale dateFields data.\"\n};\n","import errorDetails from './error-details';\n\nconst formatRegExp = /\\{(\\d+)}?\\}/g;\n\nclass IntlError {\n    constructor({ name, message }) {\n        if (!name || !message) {\n            throw new Error(\"{ name: string, message: string } object is required!\");\n        }\n\n        this.name = name;\n        this.message = message;\n    }\n\n    formatMessage(...values) {\n        const flattenValues = flatten(values);\n\n        const formattedMessage = this.message.replace(formatRegExp, function(match, index) {\n            return flattenValues[parseInt(index, 10)];\n        });\n\n        return `${this.name}: ${formattedMessage}`;\n    }\n\n    error(...values) {\n        return new Error(this.formatMessage(values));\n    }\n}\n\nconst flatten = function(arr) {\n    return arr.reduce((a, b) => a.concat(b), []);\n};\n\nconst toIntlErrors = function(errors) {\n    const predicate = function(prev, name) {\n        prev[name] = new IntlError({ name, message: errors[name] });\n        return prev;\n    };\n\n    return Object.keys(errors).reduce(predicate, {});\n};\n\nconst errors = toIntlErrors(errorDetails);\n\nexport {\n    errors,\n    IntlError,\n    toIntlErrors\n};\n","import defaultData from './default-data';\nimport isString from '../common/is-string';\nimport { errors } from '../errors';\n\nfunction availableLocaleInfo(fullName, suffixes) {\n    const parts = fullName.split(\"-\");\n    const language = parts[0];\n    const script = parts[1];\n    const territory = parts[2];\n\n    return cldr[fullName] || (suffixes.indexOf(territory) !== -1 && cldr[language + \"-\" + territory]) || (suffixes.indexOf(script) !== -1 && cldr[language + \"-\" + script]) || cldr[language];\n}\n\nfunction localeFullName(language, suffixes) {\n    const likelySubtags = cldr.supplemental.likelySubtags;\n\n    for (let idx = 0; idx < suffixes.length; idx++) {\n        let name = likelySubtags[language + \"-\" + suffixes[idx ]];\n        if (name) {\n            return name;\n        }\n    }\n\n    if (likelySubtags[language]) {\n        return likelySubtags[language];\n    }\n}\n\nexport const cldr = defaultData;\n\nexport function getLocaleInfo(locale) {\n    let info;\n    if (isString(locale)) {\n        info = localeInfo(locale);\n    } else {\n        info = locale;\n    }\n    return info;\n}\n\nexport function localeInfo(locale) {\n    if (cldr[locale]) {\n        return cldr[locale];\n    }\n\n    const likelySubtags = cldr.supplemental.likelySubtags;\n    if (likelySubtags) {\n        const parts = locale.split(\"-\");\n        const language = parts[0];\n        const suffixes = parts.slice(1);\n        const fullName = localeFullName(language, suffixes);\n        const info = fullName ? availableLocaleInfo(fullName, suffixes) : null;\n        if (info) {\n            return info;\n        }\n    }\n\n    throw errors.NoLocale.error(locale);\n}\n","export const DECIMAL = \"decimal\";\nexport const CURRENCY = \"currency\";\nexport const ACCOUNTING = \"accounting\";\nexport const PERCENT = \"percent\";\nexport const SCIENTIFIC = \"scientific\";\n\nexport const CURRENCY_PLACEHOLDER = \"$\";\nexport const PERCENT_PLACEHOLDER = \"%\";\nexport const NUMBER_PLACEHOLDER = \"n\";\n\nexport const LIST_SEPARATOR = \";\";\nexport const GROUP_SEPARATOR = \",\";\n\nexport const POINT = \".\";\nexport const EMPTY = \"\";\n\nexport const DEFAULT_LOCALE = \"en\";\n\n","import { cldr } from './info';\nimport { CURRENCY, ACCOUNTING, DECIMAL, CURRENCY_PLACEHOLDER, NUMBER_PLACEHOLDER, LIST_SEPARATOR, GROUP_SEPARATOR, POINT } from '../common/constants';\n\nconst LATIN_NUMBER_FORMATS = \"Formats-numberSystem-latn\";\nconst LATIN_NUMBER_SYMBOLS = \"symbols-numberSystem-latn\";\n\nconst patternRegExp = /([#,0.]+)/g;\nconst cldrCurrencyRegExp = /¤/g;\n\nfunction getPatterns(pattern) {\n    patternRegExp.lastIndex = 0;\n\n    return pattern.replace(cldrCurrencyRegExp, CURRENCY_PLACEHOLDER).replace(patternRegExp, NUMBER_PLACEHOLDER).split(LIST_SEPARATOR);\n}\n\nfunction getGroupSize(pattern) {\n    patternRegExp.lastIndex = 0;\n\n    const numberPatterns = patternRegExp.exec(pattern.split(LIST_SEPARATOR)[0])[0].split(POINT);\n    const integer = numberPatterns[0];\n\n    const groupSize = integer.split(GROUP_SEPARATOR).slice(1).map(function(group) {\n        return group.length;\n    }).reverse();\n\n    return groupSize;\n}\n\nfunction loadCurrencyUnitPatterns(currencyInfo, currencyFormats) {\n    for (let field in currencyFormats) {\n        if (field.startsWith(\"unitPattern\")) {\n            currencyInfo[field] = currencyFormats[field].replace(\"{0}\", NUMBER_PLACEHOLDER).replace(\"{1}\", CURRENCY_PLACEHOLDER);\n        }\n    }\n}\n\nexport default function loadNumbersInfo(locale, info) {\n    const localeInfo = cldr[locale];\n    const numbers = localeInfo.numbers = localeInfo.numbers || {};\n    numbers.symbols = numbers.symbols || {};\n    for (let field in info) {\n        if (field === LATIN_NUMBER_SYMBOLS) {\n            Object.assign(numbers.symbols, info[field]);\n        } else if (field.includes(LATIN_NUMBER_FORMATS)) {\n            const style = field.substring(0, field.indexOf(LATIN_NUMBER_FORMATS));\n            const pattern = info[field].standard;\n            if (pattern) {\n                numbers[style] = {\n                    patterns: getPatterns(pattern)\n                };\n            }\n\n            if (style === CURRENCY) {\n                numbers[style] = numbers[style] || {};\n                numbers[style].groupSize = getGroupSize((info[DECIMAL + LATIN_NUMBER_FORMATS] || info[field]).standard);\n                loadCurrencyUnitPatterns(numbers[style], info[field]);\n                numbers[ACCOUNTING] = {\n                    patterns: getPatterns(info[field][ACCOUNTING]),\n                    groupSize: numbers[style].groupSize\n                };\n            } else if (pattern) {\n                numbers[style].groupSize = getGroupSize(pattern);\n            }\n        } else if (field === \"currencies\") {\n            numbers.currencies = info[field];\n        }\n    }\n}","import { cldr } from './info';\n\nconst predefinedDatePatterns = {\n    s: \"yyyy'-'MM'-'dd'T'HH':'mm':'ss\",\n    u: \"yyyy'-'MM'-'dd HH':'mm':'ss'Z'\"\n};\n\nconst YEAR_REGEX = /y+/g;\nconst SHORT_DATE = [ [ \"dateFormats\", \"short\" ] ];\nconst ALT_ASCII_REGEX = /-alt-ascii$/;\n\nconst datePatterns = {\n    D: [ [ \"dateFormats\", \"full\" ] ],\n    m: [ [ \"dateTimeFormats\", \"availableFormats\", \"MMMd\" ] ],\n    M: [ [ \"dateTimeFormats\", \"availableFormats\", \"MMMMd\" ] ],\n    y: [ [ \"dateTimeFormats\", \"availableFormats\", \"yMMM\" ] ],\n    Y: [ [ \"dateTimeFormats\", \"availableFormats\", \"yMMMM\" ] ],\n    F: [ [ \"dateFormats\", \"full\" ], [ \"timeFormats\", \"medium\" ] ],\n    g: [ [ \"dateTimeFormats\", \"availableFormats\", \"yMd\" ], [ \"timeFormats\", \"short\" ] ],\n    G: [ [ \"dateTimeFormats\", \"availableFormats\", \"yMd\" ], [ \"timeFormats\", \"medium\" ] ],\n    t: [ [ \"timeFormats\", \"short\" ] ],\n    T: [ [ \"timeFormats\", \"medium\" ] ]\n};\n\nfunction toArray(obj) {\n    let result = [];\n    let names = Object.getOwnPropertyNames(obj);\n    for (let idx = 0; idx < names.length; idx++) {\n        let value = obj[names[idx]];\n        result.push(value);\n    }\n    return result;\n}\n\nfunction getCalendarNames(info, isObj) {\n    const result = {};\n    for (let formatType in info) {\n        let names = result[formatType] = {};\n        for (let format in info[formatType]) {\n            let formats = info[formatType][format];\n            names[format] = isObj ? formats : toArray(formats);\n        }\n    }\n    return result;\n}\n\nfunction getEraNames(eras) {\n    const result = {};\n    const format = result.format = {};\n    const eraNameMap = {\n        eraAbbr: \"abbreviated\",\n        eraNames: \"wide\",\n        eraNarrow: \"narrow\"\n    };\n\n    for (let eraFormatName in eras) {\n        let formatName = eraNameMap[eraFormatName];\n        format[formatName] = eras[eraFormatName];\n    }\n\n    return result;\n}\n\nfunction loadCalendarNames(locale, calendar) {\n    const localeCalendar = cldr[locale].calendar;\n    localeCalendar.days = getCalendarNames(calendar.days);\n    localeCalendar.months = getCalendarNames(calendar.months);\n    localeCalendar.quarters = getCalendarNames(calendar.quarters);\n    localeCalendar.dayPeriods = getCalendarNames(calendar.dayPeriods, true);\n\n    localeCalendar.eras = getEraNames(calendar.eras);\n}\n\nfunction loadCalendarDateFields(locale, fields) {\n    const localeCalendar = cldr[locale].calendar;\n    const dateFields = {};\n\n    for (let field in fields) {\n        const [ fieldName, formatType = 'wide' ] = field.split('-');\n        const fieldInfo = dateFields[fieldName] || {};\n        const displayName = fields[field].displayName;\n\n        if (!displayName) { continue; }\n\n        fieldInfo[formatType] = displayName;\n        dateFields[fieldName] = fieldInfo;\n    }\n\n    localeCalendar.dateFields = dateFields;\n}\n\nfunction getPredefinedFormat(paths, calendar) {\n    const result = [];\n\n    for (let pathIdx = 0; pathIdx < paths.length; pathIdx++) {\n        let fields = paths[ pathIdx ];\n        let pattern = calendar;\n        for (let idx = 0; idx < fields.length; idx++) {\n            pattern = pattern[fields[idx]];\n        }\n        result.push(pattern);\n    }\n\n    return result.join(\" \");\n}\n\nfunction filterFormats(formats) {\n    const result = {};\n    for (let format in formats) {\n        // Removes -alt-ascii formats in favor of the regular, Unicode formats\n        if (!ALT_ASCII_REGEX.test(format)) {\n            result[format] = formats[format];\n        }\n    }\n\n    return result;\n}\n\n\nfunction loadCalendarPatterns(locale, calendar) {\n    const cldrCalendar = cldr[locale].calendar;\n    const patterns = cldrCalendar.patterns = {};\n\n    patterns.d = getPredefinedFormat(SHORT_DATE, calendar).replace(YEAR_REGEX, 'y');\n\n    for (let pattern in datePatterns) {\n        patterns[pattern] = getPredefinedFormat(datePatterns[pattern], calendar);\n    }\n\n    for (let pattern in predefinedDatePatterns) {\n        patterns[pattern] = predefinedDatePatterns[pattern];\n    }\n\n    const dateTimeFormats = calendar.dateTimeFormats;\n    cldrCalendar.dateTimeFormats = {\n        full: dateTimeFormats.full,\n        long: dateTimeFormats.long,\n        medium: dateTimeFormats.medium,\n        short: dateTimeFormats.short,\n        availableFormats: filterFormats(dateTimeFormats.availableFormats)\n    };\n    cldrCalendar.timeFormats = filterFormats(calendar.timeFormats);\n    cldrCalendar.dateFormats = filterFormats(calendar.dateFormats);\n}\n\n\nexport default function loadCalendarInfo(locale, info) {\n    const calendar = cldr[locale].calendar = cldr[locale].calendar || {};\n    for (let field in info) {\n        if (field === \"timeZoneNames\") {\n            calendar.gmtFormat = info[field].gmtFormat;\n            calendar.gmtZeroFormat = info[field].gmtZeroFormat;\n        } else if (field === \"calendars\" && info[field].gregorian) {\n            loadCalendarPatterns(locale, info[field].gregorian);\n            loadCalendarNames(locale, info[field].gregorian);\n        } else if (field === \"fields\") {\n            loadCalendarDateFields(locale, info.fields);\n        }\n    }\n}\n","import { cldr } from './info';\n\nfunction territoryFromName(name, identity) {\n    const likelySubtags = cldr.supplemental.likelySubtags;\n    let parts = name.split(\"-\");\n    if (likelySubtags) {\n        const likelyName = likelySubtags[name] || likelySubtags[parts[0]];\n        if (likelyName) {\n            parts = likelyName.split(\"-\");\n        }\n    }\n\n    if (identity) {\n        for (let idx = parts.length - 1; idx >= 1; idx--) {\n            const part = parts[idx];\n            if (part === identity.variant || part === identity.script) {\n                parts.splice(idx, 1);\n            }\n        }\n    }\n\n    const length = parts.length;\n\n    if (length > 1) {\n        const territory = parts[length - 1];\n        return territory.toUpperCase();\n    }\n}\n\nexport default function localeTerritory(info) {\n    if (info.territory) {\n        return info.territory;\n    }\n\n    const name = info.name;\n    const identity = info.identity;\n    let territory;\n\n    if (identity && identity.territory) {\n        territory = identity.territory;\n    } else {\n        territory = territoryFromName(name, identity);\n    }\n\n    info.territory = territory;\n\n    return territory;\n}\n","const MILLISECOND = 'duration-millisecond';\nconst UNIT_PATTERN_ONE = 'unitPattern-count-one';\nconst UNIT_PATTERN_OTHER = 'unitPattern-count-other';\nconst placeholderPattern = /\\{0\\}\\s?/;\n\nfunction extractUnit(unit) {\n    const value = unit[UNIT_PATTERN_ONE] || unit[UNIT_PATTERN_OTHER];\n    return value.replace(placeholderPattern, '');\n}\n\nexport default function loadUnits(localeInfo, units) {\n    localeInfo.calendar.dateFields.millisecond = {\n        narrow: extractUnit(units.narrow[MILLISECOND]),\n        short: extractUnit(units.short[MILLISECOND]),\n        wide: extractUnit(units.long[MILLISECOND])\n    };\n}\n","import { cldr } from './info';\nimport loadNumbersInfo from './load-numbers';\nimport loadCalendarInfo from './load-dates';\nimport localeTerritory from './territory';\nimport loadUnits from './load-units';\n\nfunction loadLocale(locale, info) {\n    for (let field in info) {\n        if (field === \"numbers\") {\n            loadNumbersInfo(locale, info[field]);\n        } else if (field === \"dates\") {\n            loadCalendarInfo(locale, info[field]);\n        }\n    }\n}\n\nexport default function load() {\n    const length = arguments.length;\n    for (let idx = 0; idx < length; idx++) {\n        let entry = arguments[idx];\n        if (entry.main) {\n            let locale = Object.keys(entry.main)[0];\n            let info = entry.main[locale];\n            let localeInfo = cldr[locale] = cldr[locale] || {};\n\n            if (info.units) {\n                loadUnits(localeInfo, info.units);\n            } else {\n                localeInfo.name = localeInfo.name || locale;\n                localeInfo.identity = localeInfo.identity || info.identity;\n\n                localeTerritory(localeInfo);\n                loadLocale(locale, info);\n            }\n        } else if (entry.supplemental) {\n            if (entry.supplemental.weekData) {\n                cldr.supplemental.weekData = {\n                    firstDay: entry.supplemental.weekData.firstDay,\n                    weekendStart: entry.supplemental.weekData.weekendStart,\n                    weekendEnd: entry.supplemental.weekData.weekendEnd\n                };\n            } else if (entry.supplemental.likelySubtags) {\n                cldr.supplemental.likelySubtags = Object.assign(cldr.supplemental.likelySubtags, entry.supplemental.likelySubtags);\n            } else if (entry.supplemental.currencyData) {\n                const currencyData = cldr.supplemental.currencyData;\n                currencyData.region = Object.assign(currencyData.region || {}, entry.supplemental.currencyData.region);\n                currencyData.fractions = Object.assign(currencyData.fractions || {}, entry.supplemental.currencyData.fractions);\n            }\n        }\n    }\n}\n","import { cldr } from './info';\n\nexport default function setData(data) {\n    const locale = data.name;\n    const info = cldr[locale] = cldr[locale] || {};\n    const supplemental = cldr.supplemental = cldr.supplemental || {};\n\n    if (data.likelySubtags) {\n        supplemental.likelySubtags = Object.assign(supplemental.likelySubtags || {}, data.likelySubtags);\n    }\n\n    if (data.currencyData) {\n        supplemental.currencyData = supplemental.currencyData || {};\n        supplemental.currencyData.fractions = Object.assign(supplemental.currencyData.fractions || {}, data.currencyData);\n    }\n\n    const numbers = info.numbers;\n\n    Object.assign(info, data);\n\n    if (numbers && data.numbers) {\n        info.numbers = Object.assign({}, numbers, data.numbers);\n    }\n}","import { localeInfo } from './info';\nimport { errors } from '../errors';\nimport { DEFAULT_LOCALE } from '../common/constants';\n\nexport default function dateFieldName(options, locale = DEFAULT_LOCALE) {\n    const info = localeInfo(locale);\n    const dateFields = info.calendar.dateFields;\n    if (!dateFields) {\n        throw errors.NoDateFieldNames.error();\n    }\n\n    const fieldNameInfo = dateFields[options.type] || {};\n\n    return fieldNameInfo[options.nameType] || fieldNameInfo['wide'];\n}\n","import { getLocaleInfo } from './info';\nimport { EMPTY } from '../common/constants';\n\nfunction lowerArray(arr) {\n    const result = [];\n    for (let idx = 0; idx < arr.length; idx++) {\n        result.push(arr[idx].toLowerCase());\n    }\n    return result;\n}\n\nfunction lowerObject(obj) {\n    const result = {};\n    for (let field in obj) {\n        result[field] = obj[field].toLowerCase();\n    }\n    return result;\n}\n\nfunction cloneLower(obj) {\n    let result = Array.isArray(obj) ? lowerArray(obj) : lowerObject(obj);\n    return result;\n}\n\nexport default function dateFormatNames(locale, options) {\n    const { type, nameType, standAlone, lower } = options;\n    const info = getLocaleInfo(locale);\n    const formatType = standAlone ? \"stand-alone\" : \"format\";\n    const lowerNameType = (lower ? \"lower-\" : EMPTY) + nameType;\n    const formatNames = info.calendar[type][formatType];\n    let result = formatNames[lowerNameType];\n    if (!result && lower) {\n        result = formatNames[lowerNameType] = cloneLower(formatNames[nameType]);\n    }\n    return result;\n}","export default function parseRangeDate(value) {\n    const parts = value.split('-');\n    const year = parseInt(parts[0], 10);\n    const month = parseInt(parts[1], 10) - 1;\n    const day = parseInt(parts[2], 10);\n\n    return new Date(year, month, day);\n}\n","import { cldr, getLocaleInfo } from './info';\nimport { errors } from '../errors';\nimport localeTerritory from './territory';\nimport parseRangeDate from './parse-range-date';\n\n \n\nconst {\n    NoCurrency,\n    NoCurrencyDisplay,\n    NoSupplementalCurrency,\n    NoCurrencyRegion,\n    NoValidCurrency\n} = errors;\n\nconst DEFAULT_CURRENCY_FRACTIONS = 2;\nconst SYMBOL = \"symbol\";\nconst INVALID_CURRENCY_CODE = 'XXX';\n\nconst GLOBAL_CURRENCIES = {\n    '001': 'USD', // 001 refers to world. not sure if it is correct to assume USD but seems better than throw an error\n    '150': 'EUR' // 150 territory for Europe\n\n};\n\nfunction getCurrencyInfo(locale, currency, throwIfNoValid) {\n    const info = getLocaleInfo(locale);\n    const currencies = info.numbers.currencies;\n    if (!currencies) {\n        if (throwIfNoValid) {\n            throw NoCurrency.error();\n        }\n\n        return;\n    }\n\n    const currencyDisplayInfo = currencies[currency];\n\n    if (!currencyDisplayInfo) {\n        if (throwIfNoValid) {\n            throw NoCurrencyDisplay.error();\n        }\n\n        return;\n    }\n\n    return currencyDisplayInfo;\n}\n\nfunction lengthComparer(a, b) {\n    return b.length - a.length;\n}\n\nfunction regionCurrency(regionCurrencies) {\n    let latestValidUntil, latestValidUntilRange;\n    let latestStillValid, latestStillValidDate;\n\n    for (let idx = 0; idx < regionCurrencies.length; idx++) {\n        const currency = regionCurrencies[idx];\n        const code = Object.keys(currency)[0];\n        const info = currency[code];\n        if (code !== INVALID_CURRENCY_CODE && info._tender !== 'false' && info._from) {\n            if (!info._to) {\n                const stillValidDate = parseRangeDate(info._from);\n                if (!latestStillValidDate || latestStillValidDate < stillValidDate) {\n                    latestStillValid = code;\n                    latestStillValidDate = stillValidDate;\n                }\n            } else if (!latestStillValid) {\n                const validFrom = parseRangeDate(info._from);\n                const validTo = parseRangeDate(info._to);\n                if (!latestValidUntilRange || latestValidUntilRange.to < validTo || latestValidUntilRange.from < validFrom) {\n                    latestValidUntil = code;\n                    latestValidUntilRange = {\n                        from: validFrom,\n                        to: validTo\n                    };\n                }\n            }\n        }\n    }\n\n    return latestStillValid || latestValidUntil;\n}\n\nexport function currencyDisplays(locale, currency, throwIfNoValid = true) {\n    const currencyInfo = getCurrencyInfo(locale, currency, throwIfNoValid);\n    if (!currencyInfo) {\n        return;\n    }\n\n    if (!currencyInfo.displays) {\n        const displays = [ currency ];\n        for (let field in currencyInfo) {\n            displays.push(currencyInfo[field]);\n        }\n        displays.sort(lengthComparer);\n        currencyInfo.displays = displays;\n    }\n\n    return currencyInfo.displays;\n}\n\nexport function currencyDisplay(locale, options) {\n    const { value, currency, currencyDisplay = SYMBOL } = options;\n\n    if (currencyDisplay === \"code\") {\n        return currency;\n    }\n\n    const currencyInfo = getCurrencyInfo(locale, currency, true);\n    let result;\n\n    if (currencyDisplay === SYMBOL) {\n        result = currencyInfo[\"symbol-alt-narrow\"] || currencyInfo[SYMBOL] || currency;\n    } else {\n        if (typeof value === \"undefined\" || value !== 1) {\n            result = currencyInfo[\"displayName-count-other\"];\n        } else {\n            result = currencyInfo[\"displayName-count-one\"];\n        }\n    }\n\n    return result;\n}\n\nexport function currencyFractionOptions(code) {\n    let minimumFractionDigits = DEFAULT_CURRENCY_FRACTIONS;\n    let maximumFractionDigits = DEFAULT_CURRENCY_FRACTIONS;\n\n    const fractions = ((cldr.supplemental.currencyData || {}).fractions || {})[code];\n\n    if (fractions && fractions._digits) {\n        maximumFractionDigits = minimumFractionDigits = parseInt(fractions._digits, 10);\n    }\n\n    return {\n        minimumFractionDigits: minimumFractionDigits,\n        maximumFractionDigits: maximumFractionDigits\n    };\n}\n\nexport function territoryCurrencyCode(territory, throwIfNoValid = true) {\n    if (GLOBAL_CURRENCIES[territory]) {\n        return GLOBAL_CURRENCIES[territory];\n    }\n\n    const currencyData = cldr.supplemental.currencyData;\n    if (!currencyData) {\n        if (throwIfNoValid) {\n            throw NoSupplementalCurrency.error();\n        }\n\n        return;\n    }\n\n    const regionCurrencies = currencyData.region[territory];\n\n    if (!regionCurrencies) {\n        if (throwIfNoValid) {\n            throw NoCurrencyRegion.error(territory);\n        }\n\n        return;\n    }\n\n    const currencyCode = regionCurrency(regionCurrencies);\n\n    return currencyCode;\n}\n\nexport function localeCurrency(locale, throwIfNoValid) {\n    const info = getLocaleInfo(locale);\n    const numbers = info.numbers;\n\n    if (!numbers.localeCurrency) {\n        const currency = territoryCurrencyCode(localeTerritory(info), throwIfNoValid);\n\n        if (!currency && throwIfNoValid) {\n            throw NoValidCurrency.error(info.name);\n        }\n\n        numbers.localeCurrency = currency;\n    }\n\n    return numbers.localeCurrency;\n}\n","\nexport const DAYS_OF_WEEK = [ \"sun\", \"mon\", \"tue\", \"wed\", \"thu\", \"fri\", \"sat\" ];\n\nexport const DEFAULT_TERRITORY = '001';\n","import { cldr, getLocaleInfo } from './info';\nimport localeTerritory from './territory';\n\nimport { DAYS_OF_WEEK, DEFAULT_TERRITORY } from './constants';\nimport { errors } from '../errors';\n\nconst { NoWeekData, NoFirstDay } = errors;\n\nexport default function firstDay(locale) {\n    const info = getLocaleInfo(locale);\n\n    if (!isNaN(info.firstDay)) {\n        return info.firstDay;\n    }\n\n    const weekData = cldr.supplemental.weekData;\n    if (!weekData) {\n        throw NoWeekData.error();\n    }\n\n    const firstDay = weekData.firstDay[localeTerritory(info)] || weekData.firstDay[DEFAULT_TERRITORY];\n\n    if (!firstDay) {\n        throw NoFirstDay.error();\n    }\n\n    info.firstDay = DAYS_OF_WEEK.indexOf(firstDay);\n\n    return info.firstDay;\n}\n","import { cldr, getLocaleInfo } from './info';\nimport localeTerritory from './territory';\n\nimport { DAYS_OF_WEEK, DEFAULT_TERRITORY } from './constants';\nimport { errors } from '../errors';\n\nconst { NoWeekData } = errors;\n\nexport default function weekendRange(locale) {\n    const info = getLocaleInfo(locale);\n\n    if (info.weekendRange) {\n        return info.weekendRange;\n    }\n\n    const weekData = cldr.supplemental.weekData;\n    if (!weekData) {\n        throw NoWeekData.error();\n    }\n\n    const territory = localeTerritory(info);\n    const start = weekData.weekendStart[territory] || weekData.weekendStart[DEFAULT_TERRITORY];\n    const end = weekData.weekendEnd[territory] || weekData.weekendEnd[DEFAULT_TERRITORY];\n\n    info.weekendRange = {\n        start: DAYS_OF_WEEK.indexOf(start),\n        end: DAYS_OF_WEEK.indexOf(end)\n    };\n\n    return info.weekendRange;\n}\n","import { getLocaleInfo } from './info';\n\nexport default function numberSymbols(locale) {\n    const info = getLocaleInfo(locale);\n\n    return info.numbers.symbols;\n}","export default function isNegativeZero(value) {\n    return (1 / value === -Infinity);\n}\n","import { currencyDisplay, localeCurrency } from '../cldr';\n\nexport default function formatCurrencySymbol(info, options = {}) {\n    if (!options.currency) {\n        options.currency = localeCurrency(info, true);\n    }\n\n    const display = currencyDisplay(info, options);\n\n    return display;\n}\n","export default function groupInteger(number, start, end, options, info) {\n    const symbols = info.numbers.symbols;\n    const decimalIndex = number.indexOf(symbols.decimal);\n    const groupSizes = options.groupSize.slice();\n    let groupSize = groupSizes.shift();\n\n    let integerEnd = decimalIndex !== -1 ? decimalIndex : end + 1;\n\n    let integer = number.substring(start, integerEnd);\n    let result = number;\n    const integerLength = integer.length;\n\n    if (integerLength >= groupSize) {\n        let idx = integerLength;\n        let parts = [];\n\n        while (idx > -1) {\n            let value = integer.substring(idx - groupSize, idx);\n            if (value) {\n                parts.push(value);\n            }\n            idx -= groupSize;\n            let newGroupSize = groupSizes.shift();\n            groupSize = newGroupSize !== undefined ? newGroupSize : groupSize;\n\n            if (groupSize === 0) {\n                value = integer.substring(0, idx);\n                if (value) {\n                    parts.push(value);\n                }\n                break;\n            }\n        }\n\n        integer = parts.reverse().join(symbols.group);\n        result = number.substring(0, start) + integer + number.substring(integerEnd);\n    }\n\n    return result;\n}","import { CURRENCY, ACCOUNTING } from '../common/constants';\n\nexport default function isCurrencyStyle(style) {\n    return style === CURRENCY || style === ACCOUNTING;\n}","export default function pad(number, digits = 2, right = false) {\n    const count = digits - String(number).length;\n    let result = number;\n\n    if (count > 0) {\n        const padString = new Array(count + 1).join(\"0\");\n        result = right ? number + padString : padString + number;\n    }\n\n    return result;\n}","const MAX_PRECISION = 20;\n\nexport default function round(value, precision) {\n    let result = value;\n    let decimals = precision || 0;\n\n    result = result.toString().split('e');\n    result = Math.round(Number(result[0] + 'e' + (result[1] ? (Number(result[1]) + decimals) : decimals)));\n\n    result = result.toString().split('e');\n    result = Number(result[0] + 'e' + (result[1] ? (Number(result[1]) - decimals) : -decimals));\n\n    return result.toFixed(Math.min(decimals, MAX_PRECISION));\n}","import { PERCENT, SCIENTIFIC, NUMBER_PLACEHOLDER, CURRENCY_PLACEHOLDER, PERCENT_PLACEHOLDER, EMPTY, POINT } from '../common/constants';\nimport isNegativeZero from '../common/is-negative-zero';\nimport formatCurrencySymbol from './format-currency-symbol';\nimport groupInteger from './group-integer';\nimport isCurrencyStyle from './is-currency-style';\nimport pad from '../common/pad';\nimport round from '../common/round';\nimport { currencyFractionOptions } from '../cldr';\n\nconst DEFAULT_DECIMAL_ROUNDING = 3;\nconst DEFAULT_PERCENT_ROUNDING = 0;\n\nconst trailingZeroRegex = /0+$/;\n\nfunction fractionOptions(options) {\n    let { minimumFractionDigits, maximumFractionDigits, style } = options;\n    const isCurrency = isCurrencyStyle(style);\n    let currencyFractions;\n    if (isCurrency) {\n        currencyFractions = currencyFractionOptions(options.currency);\n    }\n\n    if (minimumFractionDigits === undefined) {\n        minimumFractionDigits = isCurrency ? currencyFractions.minimumFractionDigits : 0;\n    }\n\n    if (maximumFractionDigits === undefined) {\n        if (style === PERCENT) {\n            maximumFractionDigits = Math.max(minimumFractionDigits, DEFAULT_PERCENT_ROUNDING);\n        } else if (isCurrency) {\n            maximumFractionDigits = Math.max(minimumFractionDigits, currencyFractions.maximumFractionDigits);\n        } else {\n            maximumFractionDigits = Math.max(minimumFractionDigits, DEFAULT_DECIMAL_ROUNDING);\n        }\n    }\n\n    return {\n        minimumFractionDigits: minimumFractionDigits,\n        maximumFractionDigits: maximumFractionDigits\n    };\n}\n\nfunction applyPattern(value, pattern, symbol) {\n    let result = EMPTY;\n    for (let idx = 0, length = pattern.length; idx < length; idx++) {\n        let ch = pattern.charAt(idx);\n\n        if (ch === NUMBER_PLACEHOLDER) {\n            result += value;\n        } else if (ch === CURRENCY_PLACEHOLDER || ch === PERCENT_PLACEHOLDER) {\n            result += symbol;\n        } else {\n            result += ch;\n        }\n    }\n    return result;\n}\n\nfunction currencyUnitPattern(info, value) {\n    const currencyInfo = info.numbers.currency;\n    let pattern = value !== 1 ? currencyInfo[\"unitPattern-count-other\"] : currencyInfo[\"unitPattern-count-one\"];\n    if (value < 0) {\n        pattern = pattern.replace(NUMBER_PLACEHOLDER, `-${ NUMBER_PLACEHOLDER }`);\n    }\n\n    return pattern;\n}\n\n\nexport default function standardNumberFormat(number, options, info) {\n    const symbols = info.numbers.symbols;\n    const { style } = options;\n    const isCurrency = isCurrencyStyle(style);\n\n    //return number in exponential format\n    if (style === SCIENTIFIC) {\n        let exponential = options.minimumFractionDigits !== undefined ? number.toExponential(options.minimumFractionDigits) : number.toExponential();\n        return exponential.replace(POINT, symbols.decimal);\n    }\n\n    let value = number;\n    let symbol;\n\n    if (isCurrency) {\n        options.value = value;\n        symbol = formatCurrencySymbol(info, options);\n    }\n\n    if (style === PERCENT) {\n        value *= 100;\n        symbol = symbols.percentSign;\n    }\n\n    const { minimumFractionDigits, maximumFractionDigits } = fractionOptions(options);\n\n    value = round(value, maximumFractionDigits);\n\n    const negative = value < 0;\n    const negativeZero = isNegativeZero(number);\n\n    const parts = value.split(POINT);\n\n    let integer = parts[0];\n    let fraction = pad(parts[1] ? parts[1].replace(trailingZeroRegex, EMPTY) : EMPTY, minimumFractionDigits, true);\n\n    //exclude \"-\" if number is negative.\n    if (negative) {\n        integer = integer.substring(1);\n    }\n\n    if (options.minimumIntegerDigits) {\n        integer = pad(integer, options.minimumIntegerDigits);\n    }\n\n    let formattedValue = options.useGrouping !== false ? groupInteger(integer, 0, integer.length, options, info) : integer;\n\n    if (fraction) {\n        formattedValue += symbols.decimal + fraction;\n    }\n\n    let pattern;\n\n    if (isCurrency && options.currencyDisplay === \"name\") {\n        pattern = currencyUnitPattern(info, number);\n    } else {\n        const patterns = options.patterns;\n        pattern = (negative || negativeZero) ? patterns[1] || (\"-\" + patterns[0]) : patterns[0];\n    }\n\n    if (pattern === NUMBER_PLACEHOLDER && !negative) {\n        return formattedValue;\n    }\n\n    const result = applyPattern(formattedValue, pattern, symbol);\n\n    return result;\n}","import { PERCENT_PLACEHOLDER, CURRENCY_PLACEHOLDER, CURRENCY, PERCENT, EMPTY } from '../common/constants';\nimport formatCurrencySymbol from './format-currency-symbol';\n\nconst literalRegExp = /(\\\\.)|(['][^']*[']?)|([\"][^\"]*[\"]?)/g;\nconst PLACEHOLDER = \"__??__\";\n\nexport function setStyleOptions(formatOptions, info) {\n    const format = formatOptions.format;\n\n    //multiply number if the format has percent\n    if (format.indexOf(PERCENT_PLACEHOLDER) !== -1) {\n        formatOptions.style = PERCENT;\n        formatOptions.symbol = info.numbers.symbols.percentSign;\n        formatOptions.number *= 100;\n    }\n\n    if (format.indexOf(CURRENCY_PLACEHOLDER) !== -1) {\n        formatOptions.style = CURRENCY;\n        formatOptions.symbol = formatCurrencySymbol(info);\n    }\n}\n\nexport function setFormatLiterals(formatOptions) {\n    let format = formatOptions.format;\n    if (format.indexOf(\"'\") > -1 || format.indexOf(\"\\\"\") > -1 || format.indexOf(\"\\\\\") > -1) {\n        const literals = formatOptions.literals = [];\n        formatOptions.format = format.replace(literalRegExp, function(match) {\n            const quoteChar = match.charAt(0).replace(\"\\\\\", EMPTY);\n            const literal = match.slice(1).replace(quoteChar, EMPTY);\n\n            literals.push(literal);\n\n            return PLACEHOLDER;\n        });\n    }\n}\n\nexport function replaceLiterals(number, literals) {\n    let result = number;\n    if (literals) {\n        const length = literals.length;\n        for (let idx = 0; idx < length; idx++) {\n            result = result.replace(PLACEHOLDER, literals[idx]);\n        }\n    }\n    return result;\n}","import { CURRENCY, PERCENT, LIST_SEPARATOR, GROUP_SEPARATOR, CURRENCY_PLACEHOLDER, PERCENT_PLACEHOLDER, POINT, EMPTY } from '../common/constants';\nimport isNegativeZero from '../common/is-negative-zero';\nimport groupInteger from './group-integer';\nimport round from '../common/round';\nimport { setStyleOptions, setFormatLiterals, replaceLiterals } from './utils';\n\nconst SHARP = \"#\";\nconst ZERO = \"0\";\n\nconst trailingZerosRegExp = /(\\.(?:[0-9]*[1-9])?)0+$/g;\nconst trailingPointRegExp = /\\.$/;\nconst commaRegExp = /,/g;\n\nfunction trimTrailingZeros(value, lastZero) {\n    let trimRegex;\n\n    if (lastZero === 0) {\n        trimRegex = trailingZerosRegExp;\n    } else {\n        trimRegex = new RegExp(`(\\\\.[0-9]{${ lastZero }}[1-9]*)0+$`, 'g');\n    }\n\n    return value.replace(trimRegex, '$1').replace(trailingPointRegExp, EMPTY);\n}\n\nfunction roundNumber(formatOptions) {\n    let { number, format } = formatOptions;\n    let decimalIndex = format.indexOf(POINT);\n\n    if (decimalIndex !== -1) {\n        const zeroIndex = format.lastIndexOf(ZERO) - decimalIndex;\n        const sharpIndex = format.lastIndexOf(SHARP) - decimalIndex;\n        const hasZero = zeroIndex > -1;\n        const hasSharp = sharpIndex > -1;\n        let fraction = number.toString().split(\"e\");\n\n        if (fraction[1]) {\n            fraction = round(number, Math.abs(fraction[1]));\n        } else {\n            fraction = fraction[0];\n        }\n        fraction = fraction.split(POINT)[1] || EMPTY;\n\n        let precision = fraction.length;\n        let trailingZeros = -1;\n\n        if (!hasZero && !hasSharp) {\n            formatOptions.format = format.substring(0, decimalIndex) + format.substring(decimalIndex + 1);\n            decimalIndex = -1;\n            precision = 0;\n        } else if (hasZero && zeroIndex > sharpIndex) {\n            precision = zeroIndex;\n        } else if (sharpIndex > zeroIndex) {\n            if (hasSharp && precision > sharpIndex) {\n                precision = sharpIndex;\n            } else if (hasZero && precision < zeroIndex) {\n                precision = zeroIndex;\n            }\n\n            trailingZeros = hasZero ? zeroIndex : 0;\n        }\n\n        if (precision > -1) {\n            number = round(number, precision);\n            if (trailingZeros > -1) {\n                number = trimTrailingZeros(number, trailingZeros);\n            }\n        }\n    } else {\n        number = round(number);\n    }\n\n    if (formatOptions.negative && (number * -1) >= 0 && !formatOptions.negativeZero) {\n        formatOptions.negative = false;\n    }\n\n    formatOptions.number = number;\n    formatOptions.decimalIndex = decimalIndex;\n}\n\nfunction isConstantFormat(format) {\n    return format.indexOf(SHARP) === -1 && format.indexOf(ZERO) === -1;\n}\n\nfunction setValueSpecificFormat(formatOptions) {\n    let { number, format } = formatOptions;\n    format = format.split(LIST_SEPARATOR);\n    if ((formatOptions.negative || formatOptions.negativeZero) && format[1]) {\n        format = format[1];\n        formatOptions.hasNegativeFormat = true;\n    } else if (number === 0) {\n        const zeroFormat = format[2];\n        format = zeroFormat || format[0];\n        if (zeroFormat && isConstantFormat(zeroFormat)) {\n            formatOptions.constant = zeroFormat;\n        }\n    } else {\n        format = format[0];\n    }\n\n    formatOptions.format = format;\n}\n\nfunction setGroupOptions(formatOptions) {\n    formatOptions.hasGroup = formatOptions.format.indexOf(GROUP_SEPARATOR) > -1;\n    if (formatOptions.hasGroup) {\n        formatOptions.format = formatOptions.format.replace(commaRegExp, EMPTY);\n    }\n}\n\nfunction placeholderIndex(index1, index2, start) {\n    let index;\n    if (index1 === -1 && index2 !== -1) {\n        index = index2;\n    } else if (index1 !== -1 && index2 === -1) {\n        index = index1;\n    } else {\n        index = start ? Math.min(index1, index2) : Math.max(index1, index2);\n    }\n    return index;\n}\n\nfunction setPlaceholderIndices(formatOptions) {\n    const format = formatOptions.format;\n    let sharpIndex = format.indexOf(SHARP);\n    let zeroIndex = format.indexOf(ZERO);\n\n    let start = placeholderIndex(sharpIndex, zeroIndex, true);\n\n    sharpIndex = format.lastIndexOf(SHARP);\n    zeroIndex = format.lastIndexOf(ZERO);\n\n    let end = placeholderIndex(sharpIndex, zeroIndex);\n\n    if (start === format.length) {\n        end = start;\n    }\n\n    formatOptions.start = start;\n    formatOptions.end = end;\n    formatOptions.lastZeroIndex = zeroIndex;\n}\n\nfunction replaceStyleSymbols(number, style, symbol) {\n    let result = number;\n    if (style === CURRENCY || style === PERCENT) {\n        result = EMPTY;\n        for (let idx = 0, length = number.length; idx < length; idx++) {\n            let ch = number.charAt(idx);\n            result += (ch === CURRENCY_PLACEHOLDER || ch === PERCENT_PLACEHOLDER) ? symbol : ch;\n        }\n    }\n    return result;\n}\n\nfunction replacePlaceHolders(formatOptions, info) {\n    const { start, end, negative, negativeZero, format, decimalIndex, lastZeroIndex, hasNegativeFormat, hasGroup } = formatOptions;\n    let number = formatOptions.number;\n    const value = number.toString().split(POINT);\n    const length = format.length;\n    const integer = value[0];\n    const fraction = value[1] || EMPTY;\n    const integerLength = integer.length;\n    let replacement = EMPTY;\n\n    number = format.substring(0, start);\n\n    if ((negative || negativeZero) && !hasNegativeFormat) {\n        number += \"-\";\n    }\n\n    for (let idx = start; idx < length; idx++) {\n        let ch = format.charAt(idx);\n\n        if (decimalIndex === -1) {\n            if (end - idx < integerLength) {\n\n                number += integer;\n                break;\n            }\n        } else {\n            if (lastZeroIndex !== -1 && lastZeroIndex < idx) {\n                replacement = EMPTY;\n            }\n\n            if ((decimalIndex - idx) <= integerLength && decimalIndex - idx > -1) {\n                number += integer;\n                idx = decimalIndex;\n            }\n\n            if (decimalIndex === idx) {\n                number += (fraction ? info.numbers.symbols.decimal : EMPTY) + fraction;\n                idx += end - decimalIndex + 1;\n                continue;\n            }\n        }\n\n        if (ch === ZERO) {\n            number += ch;\n            replacement = ch;\n        } else if (ch === SHARP) {\n            number += replacement;\n        }\n    }\n\n    if (hasGroup) {\n        number = groupInteger(number, start + (negative && !hasNegativeFormat ? 1 : 0), Math.max(end, (integerLength + start)), info.numbers.decimal, info);\n    }\n\n    if (end >= start) {\n        number += format.substring(end + 1);\n    }\n\n    return number;\n}\n\nfunction applyCustomFormat(formatOptions, info) {\n    let number = formatOptions.number;\n    if (formatOptions.start !== -1) {\n        number = replacePlaceHolders(formatOptions, info);\n        number = replaceStyleSymbols(number, formatOptions.style, formatOptions.symbol);\n        number = replaceLiterals(number, formatOptions.literals);\n    }\n\n    return number;\n}\n\nexport default function customNumberFormat(number, format, info) {\n    const formatOptions = {\n        negative: number < 0,\n        number: Math.abs(number),\n        negativeZero: isNegativeZero(number),\n        format: format\n    };\n\n    setValueSpecificFormat(formatOptions);\n\n    if (formatOptions.constant) {\n        return formatOptions.constant;\n    }\n\n    setFormatLiterals(formatOptions);\n    setStyleOptions(formatOptions, info);\n    setGroupOptions(formatOptions);\n    roundNumber(formatOptions);\n    setPlaceholderIndices(formatOptions);\n\n    return applyCustomFormat(formatOptions, info);\n}","import { CURRENCY, ACCOUNTING, DECIMAL, PERCENT, SCIENTIFIC } from '../common/constants';\nimport isString from '../common/is-string';\n\nconst standardFormatRegExp = /^(n|c|p|e|a)(\\d*)$/i;\n\nfunction standardFormatOptions(format) {\n    const formatAndPrecision = standardFormatRegExp.exec(format);\n\n    if (formatAndPrecision) {\n        const options = {\n            style: DECIMAL\n        };\n\n        let style = formatAndPrecision[1].toLowerCase();\n\n        if (style === \"c\") {\n            options.style = CURRENCY;\n        } else if (style === \"a\") {\n            options.style = ACCOUNTING;\n        } else if (style === \"p\") {\n            options.style = PERCENT;\n        } else if (style === \"e\") {\n            options.style = SCIENTIFIC;\n        }\n\n        if (formatAndPrecision[2]) {\n            options.minimumFractionDigits = options.maximumFractionDigits = parseInt(formatAndPrecision[2], 10);\n        }\n\n        return options;\n    }\n}\n\nexport default function formatOptions(format) {\n    let options;\n    if (isString(format)) {\n        options = standardFormatOptions(format);\n    } else {\n        options = format;\n    }\n\n    return options;\n}","import { localeInfo } from '../cldr';\nimport { DECIMAL, DEFAULT_LOCALE, NUMBER_PLACEHOLDER, EMPTY } from '../common/constants';\nimport standardNumberFormat from './standard-number-format';\nimport customNumberFormat from './custom-number-format';\nimport formatOptions from './format-options';\n\nexport default function formatNumber(number, format = NUMBER_PLACEHOLDER, locale = DEFAULT_LOCALE) {\n    if (number === undefined || number === null) {\n        return EMPTY;\n    }\n\n    if (!isFinite(number)) {\n        return String(number);\n    }\n\n    const info = localeInfo(locale);\n    const options = formatOptions(format);\n\n    let result;\n    if (options) {\n        const style = options.style || DECIMAL;\n        result = standardNumberFormat(number, Object.assign({}, info.numbers[style], options), info);\n    } else {\n        result = customNumberFormat(number, format, info);\n    }\n\n    return result;\n}\n","export default function isNumber(value) {\n    return typeof value === \"number\";\n}","import { localeInfo, localeCurrency, currencyDisplays } from '../cldr';\nimport { PERCENT, NUMBER_PLACEHOLDER, CURRENCY_PLACEHOLDER, DEFAULT_LOCALE, EMPTY, POINT } from '../common/constants';\nimport { setStyleOptions, setFormatLiterals } from './utils';\nimport isNumber from '../common/is-number';\nimport isCurrencyStyle from './is-currency-style';\nimport formatOptions from './format-options';\nimport isString from '../common/is-string';\n\nconst exponentRegExp = /[eE][-+]?[0-9]+/;\nconst nonBreakingSpaceRegExp = /\\u00A0/g;\n\nfunction cleanNegativePattern(number, patterns) {\n    if (patterns.length > 1) {\n        const parts = (patterns[1] || EMPTY).replace(CURRENCY_PLACEHOLDER, EMPTY).split(NUMBER_PLACEHOLDER);\n        if (number.indexOf(parts[0]) > -1 && number.indexOf(parts[1]) > -1) {\n            return number.replace(parts[0], EMPTY).replace(parts[1], EMPTY);\n        }\n    }\n}\n\nfunction cleanCurrencyNumber(value, info, format) {\n    const options = formatOptions(format) || {};\n    let isCurrency = isCurrencyStyle(options.style);\n    let number = value;\n    let negative;\n\n    const currency = options.currency || localeCurrency(info, isCurrency);\n\n    if (currency) {\n        const displays = currencyDisplays(info, currency, isCurrency);\n        if (displays) {\n            for (let idx = 0; idx < displays.length; idx++) {\n                let display = displays[idx];\n                if (number.includes(display)) {\n                    number = number.replace(display, EMPTY);\n                    isCurrency = true;\n                    break;\n                }\n            }\n        }\n\n        if (isCurrency) {\n            const cleanNumber = cleanNegativePattern(number, info.numbers.currency.patterns) ||\n                cleanNegativePattern(number, info.numbers.accounting.patterns);\n\n            if (cleanNumber) {\n                negative = true;\n                number = cleanNumber;\n            }\n\n        }\n    }\n\n    return {\n        number: number,\n        negative: negative\n    };\n}\n\nfunction cleanLiterals(number, formatOptions) {\n    const literals = formatOptions.literals;\n    let result = number;\n\n    if (literals) {\n        for (let idx = 0; idx < literals.length; idx++) {\n            result = result.replace(literals[idx], EMPTY);\n        }\n    }\n\n    return result;\n}\n\nfunction divideBy100(number) {\n    const strNumber = String(number);\n    const pointIndex = strNumber.indexOf(POINT);\n    const zeroesCount = 2;\n    let result = number / Math.pow(10, zeroesCount);\n\n    if (pointIndex === -1 || String(result).length <= strNumber.length + zeroesCount) {\n        return result;\n    }\n\n    const fractionDigits = strNumber.length - pointIndex + 1 + zeroesCount;\n    return parseFloat(result.toFixed(fractionDigits));\n}\n\nexport default function parseNumber(value, locale = DEFAULT_LOCALE, format = {}) {\n    if (!value && value !== 0) {\n        return null;\n    }\n\n    if (isNumber(value)) {\n        return value;\n    }\n\n    const info = localeInfo(locale);\n    const symbols = info.numbers.symbols;\n\n    let number = value.toString();\n    let formatOptions = format || {};\n    let isPercent;\n\n    if (isString(format)) {\n        formatOptions = { format: format };\n        setFormatLiterals(formatOptions);\n        number = cleanLiterals(number, formatOptions);\n\n        setStyleOptions(formatOptions, info);\n    }\n\n    if (formatOptions.style === PERCENT || number.indexOf(symbols.percentSign) > -1) {\n        number = number.replace(symbols.percentSign, EMPTY);\n        isPercent = true;\n    }\n\n    if (exponentRegExp.test(number)) {\n        number = parseFloat(number.replace(symbols.decimal, POINT));\n        return isNaN(number) ? null : number;\n    }\n\n    const { negative: negativeCurrency, number: currencyNumber } = cleanCurrencyNumber(number, info, formatOptions);\n    number = String(currencyNumber).trim();\n\n    const negativeSignIndex = number.indexOf(\"-\");\n    if (negativeSignIndex > 0) {\n        return null;\n    }\n\n    let isNegative = negativeSignIndex > -1;\n\n    isNegative = negativeCurrency !== undefined ? negativeCurrency : isNegative;\n\n    number = number.replace(\"-\", EMPTY)\n          .replace(nonBreakingSpaceRegExp, \" \")\n          .split(symbols.group.replace(nonBreakingSpaceRegExp, \" \")).join(EMPTY)\n          .replace(symbols.decimal, POINT);\n\n    number = parseFloat(number);\n\n    if (isNaN(number)) {\n        number = null;\n    } else if (isNegative) {\n        number *= -1;\n    }\n\n    if (number && isPercent) {\n        number = divideBy100(number);\n    }\n\n    return number;\n}\n","const formatRegExp = /\\{(\\d+)}/g;\n\nexport default function formatString(format) {\n    const values = arguments;\n\n    return format.replace(formatRegExp, (match, index) => {\n        const value = values[parseInt(index, 10) + 1];\n\n        return value;\n    });\n}","import formatString from '../common/format-string';\nimport isString from '../common/is-string';\nimport { EMPTY } from '../common/constants';\n\nconst REMOVAL_PENALTY = 120;\nconst ADDITION_PENALTY = 20;\nconst LENGHT_DELTA = [ 2, 1, 5, 3, 4 ];\nconst LONG_LESS_PENALTY_DELTA = -2;\nconst SHORT_LESS_PENALTY_DELTA = -1;\nconst SHORT_MORE_PENALTY_DELTA = 1;\nconst LONG_MORE_PENALTY_DELTA = 2;\n\nconst PENALTIES = {\n    [LONG_LESS_PENALTY_DELTA.toString()]: 8,\n    [SHORT_LESS_PENALTY_DELTA.toString()]: 6,\n    [LONG_MORE_PENALTY_DELTA.toString()]: 6,\n    [SHORT_MORE_PENALTY_DELTA.toString()]: 3\n};\n\nconst VALUE_FORMAT_LENGTH = {\n    numeric: 1,\n    \"2-digit\": 2,\n    short: 3,\n    long: 4,\n    narrow: 5\n};\n\nconst TIME_SPECIFIERS_REGEX = /[hHmsSzZoOvVxX]/;\n\nfunction getHourSpecifier(options) {\n    return options.hour12 ? \"h\" : \"H\";\n}\n\nconst DATE_OPTIONS_MAP = [ {\n    key: \"era\",\n    specifier: \"G\"\n}, {\n    key: \"year\",\n    specifier: \"y\"\n}, {\n    key: \"month\",\n    specifier: \"M\"\n}, {\n    key: \"day\",\n    specifier: \"d\"\n}, {\n    key: \"weekday\",\n    specifier: \"E\"\n}, {\n    key: \"hour\",\n    getSpecifier: getHourSpecifier\n}, {\n    key: \"minute\",\n    specifier: \"m\"\n}, {\n    key: \"second\",\n    specifier: \"s\"\n}, {\n    key: \"timeZoneName\",\n    specifier: \"z\"\n} ];\n\nconst STAND_ALONE_SPECIFIERS = {\n    e: 'c',\n    E: 'c',\n    M: 'L',\n    Q: 'q'\n};\n\nconst specifiersRegex = {};\nconst resolvedFormats = {};\n\nfunction getSpecifierRegex(specifier) {\n    if (!specifiersRegex[specifier]) {\n        specifiersRegex[specifier] = new RegExp(specifier + \"+\");\n    }\n    return specifiersRegex[specifier];\n}\n\nfunction skeletonSpecifiers(skeleton) {\n    const result = [];\n    let current = skeleton.charAt(0);\n    let specifier = current;\n    for (let idx = 1; idx < skeleton.length; idx++) {\n        let character = skeleton.charAt(idx);\n        if (character === specifier) {\n            current += character;\n        } else {\n            result.push(current);\n            current = specifier = character;\n        }\n    }\n\n    result.push(current);\n\n    return result;\n}\n\nfunction findBestMatch(specifiers, availableFormats) {\n    const specifiersLength = specifiers.length;\n    let maxScore = -Number.MAX_VALUE;\n    let bestMatches, result;\n    for (let format in availableFormats) {\n        const matches = [];\n        let currentFormat = format.replace(\"v\", \"z\");\n        let score = 0;\n        for (let idx = 0; idx < specifiersLength; idx++) {\n            const specifier = specifiers[idx];\n            let specifierRegex = getSpecifierRegex(specifier[0]);\n            let match = (specifierRegex.exec(currentFormat) || [])[0];\n\n            if (!match) {\n                score -= REMOVAL_PENALTY;\n            } else {\n                currentFormat = currentFormat.replace(match, EMPTY);\n                if (match.length !== specifier.length) {\n                    let delta = Math.max(Math.min(LENGHT_DELTA[match.length] - LENGHT_DELTA[specifier.length], 2), -2);\n                    score -= PENALTIES[delta];\n                }\n            }\n\n            matches.push(match);\n\n            if (score < maxScore) {\n                break;\n            }\n        }\n\n        if (currentFormat.length) {\n            score -= skeletonSpecifiers(currentFormat).length * ADDITION_PENALTY;\n        }\n\n        if (score > maxScore) {\n            maxScore = score;\n            bestMatches = matches;\n            result = availableFormats[format];\n        }\n    }\n\n    result = result.replace(\"v\", \"z\");\n\n    for (let idx = 0; idx < specifiersLength; idx++) {\n        const bestMatch = bestMatches[idx];\n        if (bestMatch && bestMatch !== specifiers[idx]) {\n            const matchSpecifier = bestMatches[idx][0];\n            result = result.replace(getSpecifierRegex(matchSpecifier), specifiers[idx]);\n            if (STAND_ALONE_SPECIFIERS[matchSpecifier]) {\n                result = result.replace(getSpecifierRegex(STAND_ALONE_SPECIFIERS[matchSpecifier]), specifiers[idx]);\n            }\n        }\n    }\n\n    return result;\n}\n\nfunction cacheFormat(skeleton, format, locale) {\n    if (!resolvedFormats[locale]) {\n        resolvedFormats[locale] = {};\n    }\n    resolvedFormats[locale][skeleton] = format;\n}\n\n\nfunction skeletonFormat(skeleton, info) {\n    const availableFormats = info.calendar.dateTimeFormats.availableFormats;\n    if (availableFormats[skeleton]) {\n        return availableFormats[skeleton];\n    }\n    if (resolvedFormats[info.name] && resolvedFormats[info.name][skeleton]) {\n        return resolvedFormats[info.name][skeleton];\n    }\n    const timeStartIndex = skeleton.search(TIME_SPECIFIERS_REGEX);\n    let result;\n    if (timeStartIndex > 0) {\n        const dateSkeleton = skeleton.substr(0, timeStartIndex);\n        const timeSkeleton = skeleton.substr(timeStartIndex);\n\n        result = formatString(info.calendar.dateTimeFormats.short, //should be deterimed based on specifiers\n            availableFormats[timeSkeleton] || findBestMatch(skeletonSpecifiers(timeSkeleton), availableFormats),\n            availableFormats[dateSkeleton] || findBestMatch(skeletonSpecifiers(dateSkeleton), availableFormats));\n    } else {\n        result = findBestMatch(skeletonSpecifiers(skeleton), availableFormats);\n    }\n\n    cacheFormat(skeleton, result, info.name);\n    return result;\n}\n\nfunction skeletonFromOptions(options) {\n    let result = [];\n    for (let idx = 0; idx < DATE_OPTIONS_MAP.length; idx++) {\n        let option = DATE_OPTIONS_MAP[idx];\n        let field = option.key;\n        let value = options[field];\n        if (value) {\n            let spcifier = option.specifier || option.getSpecifier(options);\n            result.push(spcifier.repeat(VALUE_FORMAT_LENGTH[value]));\n        }\n    }\n\n    return result.join(EMPTY);\n}\n\nexport default function datePattern(format, info) {\n    const calendar = info.calendar;\n    let result;\n    if (isString(format)) {\n        if (calendar.patterns[format]) {\n            result = calendar.patterns[format];\n        } else {\n            result = format;\n        }\n    } else if (format) {\n        if (format.pattern) {\n            return format.pattern;\n        }\n\n        let skeleton = format.skeleton;\n        if (!skeleton) {\n            if (format.datetime) {\n                result = formatString(calendar.dateTimeFormats[format.datetime], calendar.timeFormats[format.datetime], calendar.dateFormats[format.datetime]);\n            } else if (format.date) {\n                result = calendar.dateFormats[format.date];\n            } else if (format.time) {\n                result = calendar.timeFormats[format.time];\n            } else {\n                skeleton = skeletonFromOptions(format);\n            }\n        }\n\n        if (skeleton) {\n            result = skeletonFormat(skeleton, info);\n        }\n    }\n\n    if (!result) {\n        result = calendar.patterns.d;\n    }\n\n    return result;\n}\n","export default function dateNameType(formatLength) {\n    let nameType;\n    if (formatLength <= 3) {\n        nameType = \"abbreviated\";\n    } else if (formatLength === 4) {\n        nameType = \"wide\";\n    } else if (formatLength === 5) {\n        nameType = \"narrow\";\n    } else if (formatLength === 6) {\n        nameType = \"short\";\n    }\n\n    return nameType;\n}","import dateFormatNames from '../cldr/date-format-names';\nimport dateNameType from './date-name-type';\n\nexport default function formatNames(locale, type, formatLength, standAlone, lower) {\n    return dateFormatNames(locale, {\n        type: type,\n        nameType: dateNameType(formatLength),\n        standAlone: standAlone,\n        lower: lower\n    });\n}","function isFunction(fun) {\n    return typeof(fun) === 'function';\n}\n\nexport default function isDate(value) {\n    return Boolean(value) && isFunction(value.getTime) && isFunction(value.getMonth);\n}\n","const MONTH = 'month';\nconst HOUR = 'hour';\nconst ZONE = 'zone';\nconst WEEKDAY = 'weekday';\nconst QUARTER = 'quarter';\n\nconst DATE_FIELD_MAP = {\n    'G': 'era',\n    'y': 'year',\n    'q': QUARTER,\n    'Q': QUARTER,\n    'M': MONTH,\n    'L': MONTH,\n    'd': 'day',\n    'E': WEEKDAY,\n    'c': WEEKDAY,\n    'e': WEEKDAY,\n    'h': HOUR,\n    'H': HOUR,\n    'k': HOUR,\n    'K': HOUR,\n    'm': 'minute',\n    's': 'second',\n    'S': 'millisecond',\n    'a': 'dayperiod',\n    'x': ZONE,\n    'X': ZONE,\n    'z': ZONE,\n    'Z': ZONE\n};\n\nconst dateFormatRegExp = /d{1,2}|E{1,6}|e{1,6}|c{3,6}|c{1}|M{1,5}|L{1,5}|y{1,4}|H{1,2}|h{1,2}|k{1,2}|K{1,2}|m{1,2}|a{1,5}|s{1,2}|S{1,3}|z{1,4}|Z{1,5}|x{1,5}|X{1,5}|G{1,5}|q{1,5}|Q{1,5}|\"[^\"]*\"|'[^']*'/g;\n\nexport { dateFormatRegExp, DATE_FIELD_MAP };","import { localeInfo, firstDay } from '../cldr';\nimport { DEFAULT_LOCALE, EMPTY } from '../common/constants';\nimport formatString from '../common/format-string';\nimport datePattern from './date-pattern';\nimport formatNames from './format-names';\nimport pad from '../common/pad';\nimport isDate from '../common/is-date';\nimport { dateFormatRegExp } from './constants';\n\nfunction formatDayOfWeekIndex(day, formatLength, localeInfo) {\n    const firstDayIndex = firstDay(localeInfo);\n    let dayIndex;\n    if (day < firstDayIndex) {\n        dayIndex = 7 - firstDayIndex + day;\n    } else {\n        dayIndex = day - firstDayIndex;\n    }\n\n    return dayIndex + 1;\n}\n\nfunction formatMonth(month, formatLength, info, standAlone) {\n    if (formatLength <= 2) {\n        return pad(month + 1, formatLength);\n    }\n    return formatNames(info, \"months\", formatLength, standAlone)[month];\n}\n\nfunction formatQuarter(date, formatLength, info, standAlone) {\n    const quarter = Math.floor(date.getMonth() / 3);\n    if (formatLength < 3) {\n        return quarter + 1;\n    }\n\n    return formatNames(info, \"quarters\", formatLength, standAlone)[quarter];\n}\n\n\nfunction formatTimeZone(date, info, options) {\n    const { shortHours, optionalMinutes, separator, localizedName, zZeroOffset } = options;\n    const offset = date.getTimezoneOffset() / 60;\n    if (offset === 0 && zZeroOffset) {\n        return \"Z\";\n    }\n    const sign = offset <= 0 ? \"+\" : \"-\";\n    const hoursMinutes = Math.abs(offset).toString().split(\".\");\n    const minutes = hoursMinutes[1] || 0;\n    let result = sign + (shortHours ? hoursMinutes[0] : pad(hoursMinutes[0], 2));\n    if (minutes || !optionalMinutes) {\n        result += (separator ? \":\" : EMPTY) + pad(minutes, 2);\n    }\n\n    if (localizedName) {\n        const localizedFormat = offset === 0 ? info.calendar.gmtZeroFormat : info.calendar.gmtFormat;\n        result = formatString(localizedFormat, result);\n    }\n\n    return result;\n}\n\nfunction formatDayOfWeek(date, formatLength, info, standAlone) {\n    let result;\n    if (formatLength < 3) {\n        result = formatDayOfWeekIndex(date.getDay(), formatLength, info);\n    } else {\n        result = formatNames(info, \"days\", formatLength, standAlone)[date.getDay()];\n    }\n    return result;\n}\n\nconst formatters = {};\n\nformatters.d = function(date, formatLength) {\n    return pad(date.getDate(), formatLength);\n};\n\nformatters.E = function(date, formatLength, info) {\n    return formatNames(info, \"days\", formatLength)[date.getDay()];\n};\n\nformatters.M = function(date, formatLength, info) {\n    return formatMonth(date.getMonth(), formatLength, info, false);\n};\n\nformatters.L = function(date, formatLength, info) {\n    return formatMonth(date.getMonth(), formatLength, info, true);\n};\n\nformatters.y = function(date, formatLength) {\n    let year = date.getFullYear();\n    if (formatLength === 2) {\n        year = year % 100;\n    }\n    return pad(year, formatLength);\n};\n\nformatters.h = function(date, formatLength) {\n    const hours = date.getHours() % 12 || 12;\n    return pad(hours, formatLength);\n};\n\nformatters.H = function(date, formatLength) {\n    return pad(date.getHours(), formatLength);\n};\n\nformatters.k = function(date, formatLength) {\n    return pad(date.getHours() || 24, formatLength);\n};\n\nformatters.K = function(date, formatLength) {\n    return pad(date.getHours() % 12, formatLength);\n};\n\nformatters.m = function(date, formatLength) {\n    return pad(date.getMinutes(), formatLength);\n};\n\nformatters.s = function(date, formatLength) {\n    return pad(date.getSeconds(), formatLength);\n};\n\nformatters.S = function(date, formatLength) {\n    const milliseconds = date.getMilliseconds();\n    let result;\n    if (milliseconds !== 0) {\n        result = pad(String(milliseconds / 1000).split(\".\")[1].substr(0, formatLength), formatLength, true);\n    } else {\n        result = pad(EMPTY, formatLength);\n    }\n    return result;\n};\n\nformatters.a = function(date, formatLength, info) {\n    return formatNames(info, \"dayPeriods\", formatLength)[date.getHours() < 12 ? \"am\" : \"pm\"];\n};\n\nformatters.z = function(date, formatLength, info) {\n    return formatTimeZone(date, info, {\n        shortHours: formatLength < 4,\n        optionalMinutes: formatLength < 4,\n        separator: true,\n        localizedName: true\n    });\n};\n\nformatters.Z = function(date, formatLength, info) {\n    return formatTimeZone(date, info, {\n        separator: formatLength > 3,\n        localizedName: formatLength === 4,\n        zZeroOffset: formatLength === 5\n    });\n};\n\nformatters.x = function(date, formatLength, info) {\n    return formatTimeZone(date, info, {\n        optionalMinutes: formatLength === 1,\n        separator: formatLength === 3 || formatLength === 5\n    });\n};\n\nformatters.X = function(date, formatLength, info) {\n    return formatTimeZone(date, info, {\n        optionalMinutes: formatLength === 1,\n        separator: formatLength === 3 || formatLength === 5,\n        zZeroOffset: true\n    });\n};\n\nformatters.G = function(date, formatLength, info) {\n    let era = date.getFullYear() >= 0 ? 1 : 0;\n    return formatNames(info, \"eras\", formatLength)[era];\n};\n\nformatters.e = formatDayOfWeek;\n\nformatters.c = function(date, formatLength, info) {\n    return formatDayOfWeek(date, formatLength, info, true);\n};\n\nformatters.q = function(date, formatLength, info) {\n    return formatQuarter(date, formatLength, info, true);\n};\n\nformatters.Q = formatQuarter;\n\nexport default function formatDate(date, format, locale = DEFAULT_LOCALE) {\n    if (!isDate(date)) {\n        if (date === undefined || date === null) {\n            return EMPTY;\n        }\n        return date;\n    }\n\n    const info = localeInfo(locale);\n    const pattern = datePattern(format, info);\n\n    return pattern.replace(dateFormatRegExp, function(match) {\n        let formatLength = match.length;\n        let result;\n\n        if (match.includes(\"'\") || match.includes(\"\\\"\")) {\n            result = match.slice(1, formatLength - 1);\n        } else {\n            result = formatters[match[0]](date, formatLength, info);\n        }\n\n        return result;\n    });\n}\n","export function convertTimeZone(date, fromOffset, toOffset) {\n    const fromLocalOffset = date.getTimezoneOffset();\n\n    const offsetDate = new Date(date.getTime() + (fromOffset - toOffset) * 60000);\n\n    const toLocalOffset = offsetDate.getTimezoneOffset();\n\n    return new Date(offsetDate.getTime() + (toLocalOffset - fromLocalOffset) * 60000);\n}\n\nexport function adjustDST(date, hours) {\n    if (!hours && date.getHours() === 23) {\n        date.setHours(date.getHours() + 2);\n    }\n}","import { adjustDST, convertTimeZone } from './time-utils';\nimport { localeInfo } from '../cldr';\nimport { DEFAULT_LOCALE, EMPTY } from '../common/constants';\nimport { errors } from '../errors';\nimport formatNames from './format-names';\nimport datePattern from './date-pattern';\nimport round from '../common/round';\nimport isDate from '../common/is-date';\n\nconst timeZoneOffsetRegExp = /([+|-]\\d{1,2})(:?)(\\d{2})?/;\nconst dateRegExp = /^\\/Date\\((.*?)\\)\\/$/;\nconst offsetRegExp = /[+-]\\d*/;\nconst numberRegExp = {\n    2: /^\\d{1,2}/,\n    3: /^\\d{1,3}/,\n    4: /^\\d{4}/\n};\nconst numberRegex = /\\d+/;\nconst PLACEHOLDER = \"{0}\";\n\nconst leadingSpacesRegex = /^ */;\nconst trailingSpacesRegex = / *$/;\n\nconst standardDateFormats = [\n    \"yyyy/MM/dd HH:mm:ss\",\n    \"yyyy/MM/dd HH:mm\",\n    \"yyyy/MM/dd\",\n    \"E MMM dd yyyy HH:mm:ss\",\n    \"yyyy-MM-ddTHH:mm:ss.SSSSSSSXXX\",\n    \"yyyy-MM-ddTHH:mm:ss.SSSXXX\",\n    \"yyyy-MM-ddTHH:mm:ss.SSXXX\",\n    \"yyyy-MM-ddTHH:mm:ssXXX\",\n    \"yyyy-MM-ddTHH:mm:ss.SSSSSSS\",\n    \"yyyy-MM-ddTHH:mm:ss.SSS\",\n    \"yyyy-MM-ddTHH:mmXXX\",\n    \"yyyy-MM-ddTHH:mmX\",\n    \"yyyy-MM-ddTHH:mm:ss\",\n    \"yyyy-MM-ddTHH:mm\",\n    \"yyyy-MM-dd HH:mm:ss\",\n    \"yyyy-MM-dd HH:mm\",\n    \"yyyy-MM-dd\",\n    \"HH:mm:ss\",\n    \"HH:mm\"\n];\nconst FORMATS_SEQUENCE = [ \"G\", \"g\", \"F\", \"Y\", \"y\", \"M\", \"m\", \"D\", \"d\", \"y\", \"T\", \"t\" ];\nconst TWO_DIGIT_YEAR_MAX = 2029;\n\nfunction outOfRange(value, start, end) {\n    return !(value >= start && value <= end);\n}\n\nfunction lookAhead(match, state) {\n    let { format, idx } = state;\n    let i = 0;\n    while (format[idx] === match) {\n        i++;\n        idx++;\n    }\n    if (i > 0) {\n        idx -= 1;\n    }\n    state.idx = idx;\n    return i;\n}\n\nfunction getNumber(size, state) {\n    let regex = size ? (numberRegExp[size] || new RegExp('^\\\\d{1,' + size + '}')) : numberRegex,\n        match = state.value.substr(state.valueIdx, size).match(regex);\n\n    if (match) {\n        match = match[0];\n        state.valueIdx += match.length;\n        return parseInt(match, 10);\n    }\n    return null;\n}\n\nfunction getIndexByName(names, state, lower) {\n    let i = 0,\n        length = names.length,\n        name, nameLength,\n        matchLength = 0,\n        matchIdx = 0,\n        subValue;\n\n    for (; i < length; i++) {\n        name = names[i];\n        nameLength = name.length;\n        subValue = state.value.substr(state.valueIdx, nameLength);\n\n        if (lower) {\n            subValue = subValue.toLowerCase();\n        }\n\n        if (subValue === name && nameLength > matchLength) {\n            matchLength = nameLength;\n            matchIdx = i;\n        }\n    }\n\n    if (matchLength) {\n        state.valueIdx += matchLength;\n        return matchIdx + 1;\n    }\n\n    return null;\n}\n\nfunction checkLiteral(state) {\n    let result = false;\n    const valueChar = state.value.charAt(state.valueIdx);\n    const formatChar = state.format[state.idx];\n    const exactMatch = valueChar === formatChar;\n    const whitespaceMatch = /\\s/.test(formatChar) && /\\s/.test(valueChar);\n    if (exactMatch || whitespaceMatch) {\n        state.valueIdx++;\n        result = true;\n    }\n    return result;\n}\n\nfunction calendarGmtFormats(calendar) {\n    const { gmtFormat, gmtZeroFormat } = calendar;\n    if (!gmtFormat) {\n        throw errors.NoGMTInfo.error();\n    }\n\n    return [ gmtFormat.replace(PLACEHOLDER, EMPTY).toLowerCase(), gmtZeroFormat.replace(PLACEHOLDER, EMPTY).toLowerCase() ];\n}\n\nfunction parseTimeZoneOffset(state, info, options) {\n    const { shortHours, noSeparator, optionalMinutes, localizedName, zLiteral } = options;\n    state.UTC = true;\n\n    if (zLiteral && state.value.charAt(state.valueIdx) === \"Z\") {\n        state.valueIdx++;\n        return false;\n    }\n\n    if (localizedName && !getIndexByName(calendarGmtFormats(info.calendar), state, true)) {\n        return true;\n    }\n\n    const matches = timeZoneOffsetRegExp.exec(state.value.substr(state.valueIdx, 6));\n    if (!matches) {\n        return !localizedName;\n    }\n\n    const hoursMatch = matches[1];\n    const minutesMatch = matches[3];\n    const hoursOffset = parseInt(hoursMatch, 10);\n    const separator = matches[2];\n    let minutesOffset = parseInt(minutesMatch, 10);\n\n    if (isNaN(hoursOffset) || (!shortHours && hoursMatch.length !== 3) || (!optionalMinutes && isNaN(minutesOffset)) || (noSeparator && separator)) {\n        return true;\n    }\n\n    if (isNaN(minutesOffset)) {\n        minutesOffset = null;\n    }\n\n    if (outOfRange(hoursOffset, -12, 13) || (minutesOffset && outOfRange(minutesOffset, 0, 59))) {\n        return true;\n    }\n\n    state.valueIdx += matches[0].length;\n    state.hoursOffset = hoursOffset;\n    state.minutesOffset = minutesOffset;\n}\n\nfunction parseMonth(ch, state, info) {\n    const count = lookAhead(ch, state);\n    const names = formatNames(info, \"months\", count, ch === \"L\", true);\n\n    const month = count < 3 ? getNumber(2, state) : getIndexByName(names, state, true);\n\n    if (month === null || outOfRange(month, 1, 12)) {\n        return true;\n    }\n    state.month = month - 1;\n}\n\nfunction parseDayOfWeek(ch, state, info) {\n    const count = lookAhead(ch, state);\n    const names = formatNames(info, \"days\", count, ch === \"c\", true);\n    let dayOfWeek = count < 3 ? getNumber(1, state) : getIndexByName(names, state, true);\n    if ((!dayOfWeek && dayOfWeek !== 0) || outOfRange(dayOfWeek, 1, 7)) {\n        return true;\n    }\n}\n\nconst parsers = {};\n\nparsers.d = function(state) {\n    lookAhead(\"d\", state);\n    const day = getNumber(2, state);\n\n    if (day === null || outOfRange(day, 1, 31)) {\n        return true;\n    }\n\n    if (state.day === null) {\n        state.day = day;\n    }\n};\n\nparsers.E = function(state, info) {\n    const count = lookAhead(\"E\", state);\n    //validate if it matches the day?\n    let dayOfWeek = getIndexByName(formatNames(info, \"days\", count, false, true), state, true);\n    if (dayOfWeek === null) {\n        return true;\n    }\n};\n\nparsers.M = function(state, info) {\n    return parseMonth(\"M\", state, info);\n};\n\nparsers.L = function(state, info) {\n    return parseMonth(\"L\", state, info);\n};\n\nparsers.y = function(state) {\n    const count = lookAhead(\"y\", state);\n    let year = getNumber(count === 1 ? undefined : count, state);\n\n    if (year === null) {\n        return true;\n    }\n\n    if (count === 2) {\n        const currentYear = new Date().getFullYear();\n        year = (currentYear - currentYear % 100) + year;\n        if (year > TWO_DIGIT_YEAR_MAX) {\n            year -= 100;\n        }\n    }\n\n    state.year = year;\n};\n\nparsers.h = function(state) {\n    lookAhead(\"h\", state);\n\n    let hours = getNumber(2, state);\n    if (hours === 12) {\n        hours = 0;\n    }\n\n    if (hours === null || outOfRange(hours, 0, 11)) {\n        return true;\n    }\n\n    state.hours = hours;\n};\n\nparsers.K = function(state) {\n    lookAhead(\"K\", state);\n\n    let hours = getNumber(2, state);\n\n    if (hours === null || outOfRange(hours, 0, 11)) {\n        return true;\n    }\n\n    state.hours = hours;\n};\n\nparsers.a = function(state, info) {\n    const count = lookAhead(\"a\", state);\n    let periodFormats = formatNames(info, \"dayPeriods\", count, false, true);\n\n    const pmHour = getIndexByName([ periodFormats.pm ], state, true);\n    if (!pmHour && !getIndexByName([ periodFormats.am ], state, true)) {\n        return true;\n    }\n\n    state.pmHour = pmHour;\n};\n\nparsers.H = function(state) {\n    lookAhead(\"H\", state);\n    const hours = getNumber(2, state);\n    if (hours === null || outOfRange(hours, 0, 23)) {\n        return true;\n    }\n    state.hours = hours;\n};\n\nparsers.k = function(state) {\n    lookAhead(\"k\", state);\n\n    let hours = getNumber(2, state);\n\n    if (hours === null || outOfRange(hours, 1, 24)) {\n        return true;\n    }\n\n    state.hours = hours === 24 ? 0 : hours;\n};\n\nparsers.m = function(state) {\n    lookAhead(\"m\", state);\n    const minutes = getNumber(2, state);\n\n    if (minutes === null || outOfRange(minutes, 0, 59)) {\n        return true;\n    }\n\n    state.minutes = minutes;\n};\n\nparsers.s = function(state) {\n    lookAhead(\"s\", state);\n    const seconds = getNumber(2, state);\n    if (seconds === null || outOfRange(seconds, 0, 59)) {\n        return true;\n    }\n    state.seconds = seconds;\n};\n\nparsers.S = function(state) {\n    const count = lookAhead(\"S\", state);\n    const match = state.value.substr(state.valueIdx, count);\n    let milliseconds = null;\n\n    if (!isNaN(parseInt(match, 10))) {\n        milliseconds = parseFloat(\"0.\" + match, 10);\n        milliseconds = round(milliseconds, 3);\n        milliseconds *= 1000;\n        state.valueIdx += count;\n    }\n\n    if (milliseconds === null || outOfRange(milliseconds, 0, 999)) {\n        return true;\n    }\n\n    state.milliseconds = milliseconds;\n};\n\nparsers.z = function(state, info) {\n    const count = lookAhead(\"z\", state);\n\n    const shortFormat = count < 4;\n\n    const invalid = parseTimeZoneOffset(state, info, {\n        shortHours: shortFormat,\n        optionalMinutes: shortFormat,\n        localizedName: true\n    });\n\n    if (invalid) {\n        return invalid;\n    }\n};\n\nparsers.Z = function(state, info) {\n    const count = lookAhead(\"Z\", state);\n\n    const invalid = parseTimeZoneOffset(state, info, {\n        noSeparator: count < 4,\n        zLiteral: count === 5,\n        localizedName: count === 4\n    });\n\n    if (invalid) {\n        return invalid;\n    }\n};\n\nparsers.x = function(state, info) {\n    const count = lookAhead(\"x\", state);\n\n    const invalid = parseTimeZoneOffset(state, info, {\n        noSeparator: count !== 3 && count !== 5,\n        optionalMinutes: count === 1\n    });\n    if (invalid) {\n        return invalid;\n    }\n};\n\nparsers.X = function(state, info) {\n    const count = lookAhead(\"X\", state);\n\n    const invalid = parseTimeZoneOffset(state, info, {\n        noSeparator: count !== 3 && count !== 5,\n        optionalMinutes: count === 1,\n        zLiteral: true\n    });\n    if (invalid) {\n        return invalid;\n    }\n};\n\nparsers.G = function(state, info) {\n    const count = lookAhead(\"G\", state);\n    const eras = formatNames(info, \"eras\", count, false, true);\n    const era = getIndexByName([ eras[0], eras[1] ], state, true);\n\n    if (era === null) {\n        return true;\n    }\n};\n\nparsers.e = function(state, info) {\n    return parseDayOfWeek(\"e\", state, info);\n};\n\nparsers.c = function(state, info) {\n    return parseDayOfWeek(\"c\", state, info);\n};\n\nfunction createDate(state) {\n    let { year, month, day, hours, minutes, seconds, milliseconds, pmHour, UTC, hoursOffset, minutesOffset } = state;\n    const hasTime = hours !== null || minutes !== null || seconds || null;\n    const date = new Date();\n    let result;\n\n    if (year === null && month === null && day === null && hasTime) {\n        year = date.getFullYear();\n        month = date.getMonth();\n        day = date.getDate();\n    } else {\n        if (year === null) {\n            year = date.getFullYear();\n        }\n\n        if (day === null) {\n            day = 1;\n        }\n    }\n\n    if (pmHour && hours < 12) {\n        hours += 12;\n    }\n\n    if (UTC) {\n        if (hoursOffset) {\n            hours += -hoursOffset;\n        }\n\n        if (minutesOffset) {\n            minutes += -minutesOffset * (hoursOffset < 0 ? -1 : 1);\n        }\n\n        result = new Date(Date.UTC(year, month, day, hours, minutes, seconds, milliseconds));\n    } else {\n        result = new Date(year, month, day, hours, minutes, seconds, milliseconds);\n        adjustDST(result, hours);\n    }\n\n    if (year < 100) {\n        result.setFullYear(year);\n    }\n\n    if (result.getDate() !== day && UTC === undefined) {\n        return null;\n    }\n\n    return result;\n}\n\nfunction addFormatSpaces(value, format) {\n    const leadingSpaces = leadingSpacesRegex.exec(format)[0];\n    const trailingSpaces = trailingSpacesRegex.exec(format)[0];\n\n    return `${ leadingSpaces }${ value }${ trailingSpaces }`;\n}\n\nfunction parseExact(value, format, info) {\n    const pattern = datePattern(format, info).split(EMPTY);\n\n    const state = {\n        format: pattern,\n        idx: 0,\n        value: addFormatSpaces(value, format),\n        valueIdx: 0,\n        year: null,\n        month: null,\n        day: null,\n        hours: null,\n        minutes: null,\n        seconds: null,\n        milliseconds: null\n    };\n\n    const length = pattern.length;\n    let literal = false;\n\n    for (; state.idx < length; state.idx++) {\n        let ch = pattern[state.idx];\n\n        if (literal) {\n            if (ch === \"'\") {\n                literal = false;\n            }\n\n            checkLiteral(state);\n        } else {\n            if (parsers[ch]) {\n                let invalid = parsers[ch](state, info);\n                if (invalid) {\n                    return null;\n                }\n            } else if (ch === \"'\") {\n                literal = true;\n                checkLiteral(state);\n            } else if (!checkLiteral(state)) {\n                return null;\n            }\n        }\n    }\n\n    if (state.valueIdx < value.length) {\n        return null;\n    }\n\n    return createDate(state) || null;\n}\n\nfunction parseMicrosoftDateOffset(offset) {\n    const sign = offset.substr(0, 1) === \"-\" ? -1 : 1;\n\n    let result = offset.substring(1);\n    result = (parseInt(result.substr(0, 2), 10) * 60) + parseInt(result.substring(2), 10);\n\n    return sign * result;\n}\n\nfunction parseMicrosoftDateFormat(value) {\n    if (value && value.indexOf(\"/D\") === 0) {\n        let date = dateRegExp.exec(value);\n        if (date) {\n            date = date[1];\n            let tzoffset = offsetRegExp.exec(date.substring(1));\n\n            date = new Date(parseInt(date, 10));\n\n            if (tzoffset) {\n                tzoffset = parseMicrosoftDateOffset(tzoffset[0]);\n                date = convertTimeZone(date, date.getTimezoneOffset(), 0);\n                date = convertTimeZone(date, 0, -1 * tzoffset);\n            }\n\n            return date;\n        }\n    }\n}\n\nfunction defaultFormats(calendar) {\n    const formats = [];\n    const patterns = calendar.patterns;\n    const length = FORMATS_SEQUENCE.length;\n\n    for (let idx = 0; idx < length; idx++) {\n        formats.push(patterns[FORMATS_SEQUENCE[idx]]);\n    }\n\n    return formats.concat(standardDateFormats);\n}\n\nexport default function parseDate(value, formats, locale = DEFAULT_LOCALE) {\n    if (!value) {\n        return null;\n    }\n\n    if (isDate(value)) {\n        return value;\n    }\n\n    let parseValue = String(value).trim();\n    let date = parseMicrosoftDateFormat(parseValue);\n    if (date) {\n        return date;\n    }\n\n    const info = localeInfo(locale);\n    let parseFormats = formats || defaultFormats(info.calendar);\n    parseFormats = Array.isArray(parseFormats) ? parseFormats : [ parseFormats ];\n\n    const length = parseFormats.length;\n\n    for (let idx = 0; idx < length; idx++) {\n        date = parseExact(parseValue, parseFormats[idx], info);\n        if (date) {\n            return date;\n        }\n    }\n\n    return date;\n}\n","import { DEFAULT_LOCALE } from '../common/constants';\nimport isNumber from '../common/is-number';\nimport datePattern from './date-pattern';\nimport dateNameType from './date-name-type';\nimport { dateFormatRegExp, DATE_FIELD_MAP } from './constants';\nimport { localeInfo } from '../cldr';\n\nconst NAME_TYPES = {\n    month: {\n        type: 'months',\n        minLength: 3,\n        standAlone: 'L'\n    },\n\n    quarter: {\n        type: 'quarters',\n        minLength: 3,\n        standAlone: 'q'\n    },\n\n    weekday: {\n        type: 'days',\n        minLength: {\n            E: 0,\n            c: 3,\n            e: 3\n        },\n        standAlone: 'c'\n    },\n\n    dayperiod: {\n        type: 'dayPeriods',\n        minLength: 0\n    },\n\n    era: {\n        type: 'eras',\n        minLength: 0\n    }\n};\n\nconst LITERAL = 'literal';\n\nfunction addLiteral(parts, value) {\n    const lastPart = parts[parts.length - 1];\n    if (lastPart && lastPart.type === LITERAL) {\n        lastPart.pattern += value;\n    } else {\n        parts.push({\n            type: LITERAL,\n            pattern: value\n        });\n    }\n}\n\nfunction isHour12(pattern) {\n    return pattern === 'h' || pattern === 'K';\n}\n\nexport default function splitDateFormat(format, locale = DEFAULT_LOCALE) {\n    const info = localeInfo(locale);\n    const pattern = datePattern(format, info);\n    const parts = [];\n    let lastIndex = dateFormatRegExp.lastIndex = 0;\n    let match = dateFormatRegExp.exec(pattern);\n\n    while (match) {\n        let value = match[0];\n\n        if (lastIndex < match.index) {\n            addLiteral(parts, pattern.substring(lastIndex, match.index));\n        }\n\n        if (value.startsWith('\"') || value.startsWith(\"'\")) {\n            addLiteral(parts, value);\n        } else {\n            const specifier = value[0];\n            const type = DATE_FIELD_MAP[specifier];\n            const part = {\n                type: type,\n                pattern: value\n            };\n\n            if (type === 'hour') {\n                part.hour12 = isHour12(value);\n            }\n\n            const names = NAME_TYPES[type];\n\n            if (names) {\n                const minLength = isNumber(names.minLength) ? names.minLength : names.minLength[specifier];\n                const patternLength = value.length;\n\n                if (patternLength >= minLength) {\n                    part.names = {\n                        type: names.type,\n                        nameType: dateNameType(patternLength),\n                        standAlone: names.standAlone === specifier\n                    };\n                }\n            }\n\n            parts.push(part);\n        }\n\n        lastIndex = dateFormatRegExp.lastIndex;\n        match = dateFormatRegExp.exec(pattern);\n    }\n\n    if (lastIndex < pattern.length) {\n        addLiteral(parts, pattern.substring(lastIndex));\n    }\n\n    return parts;\n}\n","import { formatDate } from './dates';\nimport { formatNumber } from './numbers';\nimport { EMPTY } from './common/constants';\nimport isDate from './common/is-date';\nimport isNumber from './common/is-number';\n\nconst formatRegExp = /\\{(\\d+)(:[^}]+)?\\}/g;\n\nexport function toString(value, format, locale) {\n    if (format) {\n        if (isDate(value)) {\n            return formatDate(value, format, locale);\n        } else if (isNumber(value)) {\n            return formatNumber(value, format, locale);\n        }\n    }\n\n    return value !== undefined && value !== null ? value : EMPTY;\n}\n\nexport function format(format, values, locale) {\n    return format.replace(formatRegExp, function(match, index, placeholderFormat) {\n        let value = values[parseInt(index, 10)];\n\n        return toString(value, placeholderFormat ? placeholderFormat.substring(1) : EMPTY, locale);\n    });\n}\n"],"names":["const","formatRegExp","let","pattern","arguments","NoWeekData","PLACEHOLDER","idx"],"mappings":"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"}