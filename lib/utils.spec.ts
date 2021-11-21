import * as utils from './utils';

describe('toSeconds()', () => {
	test('should convert milliseconds to seconds', () => {
		const seconds = utils.toSeconds(3500);
		expect(seconds).toBe(3.5);
	});
});

describe('parseType()', () => {
	test('should return a card type when available', () => {
		const type = utils.parseType({
			type: 'card@1.0.0',
		});
		expect(type).toEqual('card');
	});

	test('should return "unknown" when card type is unavailable', () => {
		const type = utils.parseType({
			data: {},
		});
		expect(type).toEqual('unknown');
	});
});
