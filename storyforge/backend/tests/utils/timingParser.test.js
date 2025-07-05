const { parseTimingToMinutes } = require('../../src/utils/timingParser');

describe('timingParser', () => {
    describe('parseTimingToMinutes', () => {
        describe('Act parsing', () => {
            it('should parse Act 1', () => {
                expect(parseTimingToMinutes('Act 1')).toEqual({ start: 0, end: 60 });
                expect(parseTimingToMinutes('act 1')).toEqual({ start: 0, end: 60 });
                expect(parseTimingToMinutes('ACT 1')).toEqual({ start: 0, end: 60 });
                expect(parseTimingToMinutes('  Act 1  ')).toEqual({ start: 0, end: 60 });
            });

            it('should parse Act 2', () => {
                expect(parseTimingToMinutes('Act 2')).toEqual({ start: 60, end: 90 });
                expect(parseTimingToMinutes('act 2')).toEqual({ start: 60, end: 90 });
                expect(parseTimingToMinutes('ACT 2')).toEqual({ start: 60, end: 90 });
            });
        });

        describe('Game phase parsing', () => {
            it('should parse Early Game', () => {
                expect(parseTimingToMinutes('Early Game')).toEqual({ start: 0, end: 30 });
                expect(parseTimingToMinutes('early game')).toEqual({ start: 0, end: 30 });
                expect(parseTimingToMinutes('EARLY GAME')).toEqual({ start: 0, end: 30 });
            });

            it('should parse Mid Game', () => {
                expect(parseTimingToMinutes('Mid Game')).toEqual({ start: 30, end: 60 });
                expect(parseTimingToMinutes('mid game')).toEqual({ start: 30, end: 60 });
                expect(parseTimingToMinutes('MID GAME')).toEqual({ start: 30, end: 60 });
            });

            it('should parse Late Game', () => {
                expect(parseTimingToMinutes('Late Game')).toEqual({ start: 60, end: 90 });
                expect(parseTimingToMinutes('late game')).toEqual({ start: 60, end: 90 });
                expect(parseTimingToMinutes('LATE GAME')).toEqual({ start: 60, end: 90 });
            });
        });

        describe('Minute range parsing', () => {
            it('should parse minute ranges', () => {
                expect(parseTimingToMinutes('15-30')).toEqual({ start: 15, end: 30 });
                expect(parseTimingToMinutes('0-15')).toEqual({ start: 0, end: 15 });
                expect(parseTimingToMinutes('45-90')).toEqual({ start: 45, end: 90 });
            });

            it('should handle spaces in ranges', () => {
                expect(parseTimingToMinutes('15 - 30')).toEqual({ start: 15, end: 30 });
                expect(parseTimingToMinutes('15  -  30')).toEqual({ start: 15, end: 30 });
                expect(parseTimingToMinutes(' 15-30 ')).toEqual({ start: 15, end: 30 });
            });
        });

        describe('Single minute parsing', () => {
            it('should parse single minutes with default duration', () => {
                expect(parseTimingToMinutes('45')).toEqual({ start: 45, end: 50 });
                expect(parseTimingToMinutes('0')).toEqual({ start: 0, end: 5 });
                expect(parseTimingToMinutes('90')).toEqual({ start: 90, end: 95 });
            });

            it('should parse "Minute X" format', () => {
                expect(parseTimingToMinutes('Minute 45')).toEqual({ start: 45, end: 50 });
                expect(parseTimingToMinutes('minute 45')).toEqual({ start: 45, end: 50 });
                expect(parseTimingToMinutes('MINUTE 45')).toEqual({ start: 45, end: 50 });
            });

            it('should parse "X minutes" format', () => {
                expect(parseTimingToMinutes('45 minutes')).toEqual({ start: 45, end: 50 });
                expect(parseTimingToMinutes('45minutes')).toEqual({ start: 45, end: 50 });
            });

            it('should use custom default duration', () => {
                expect(parseTimingToMinutes('45', 10)).toEqual({ start: 45, end: 55 });
                expect(parseTimingToMinutes('Minute 30', 15)).toEqual({ start: 30, end: 45 });
            });
        });

        describe('Invalid input handling', () => {
            it('should return null for null/undefined/empty', () => {
                expect(parseTimingToMinutes(null)).toBeNull();
                expect(parseTimingToMinutes(undefined)).toBeNull();
                expect(parseTimingToMinutes('')).toBeNull();
            });

            it('should return null for non-string input', () => {
                expect(parseTimingToMinutes(123)).toBeNull();
                expect(parseTimingToMinutes({})).toBeNull();
                expect(parseTimingToMinutes([])).toBeNull();
            });

            it('should return null for unparsable strings', () => {
                expect(parseTimingToMinutes('random text')).toBeNull();
                expect(parseTimingToMinutes('Act 3')).toBeNull(); // Only Act 1 and 2 are defined
                expect(parseTimingToMinutes('minute')).toBeNull();
                expect(parseTimingToMinutes('15-')).toBeNull();
                expect(parseTimingToMinutes('-30')).toBeNull();
            });

            it('should return null for ISO date strings', () => {
                expect(parseTimingToMinutes('2025-01-15T10:30:00')).toBeNull();
                expect(parseTimingToMinutes('2025-01-15T10:30:00.000Z')).toBeNull();
            });
        });

        describe('Edge cases', () => {
            it('should handle various capitalizations and whitespace', () => {
                expect(parseTimingToMinutes('  aCt 1  ')).toEqual({ start: 0, end: 60 });
                expect(parseTimingToMinutes('  eArLy GaMe  ')).toEqual({ start: 0, end: 30 });
                expect(parseTimingToMinutes('  15  -  30  ')).toEqual({ start: 15, end: 30 });
                expect(parseTimingToMinutes('  mInUtE 45  ')).toEqual({ start: 45, end: 50 });
            });

            it('should parse zero minute correctly', () => {
                expect(parseTimingToMinutes('0')).toEqual({ start: 0, end: 5 });
                expect(parseTimingToMinutes('Minute 0')).toEqual({ start: 0, end: 5 });
                expect(parseTimingToMinutes('0-10')).toEqual({ start: 0, end: 10 });
            });

            it('should handle large minute values', () => {
                expect(parseTimingToMinutes('120')).toEqual({ start: 120, end: 125 });
                expect(parseTimingToMinutes('100-150')).toEqual({ start: 100, end: 150 });
            });
        });
    });
});