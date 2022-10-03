import { toSeconds } from '../../lib/utils';

describe('toSeconds()', () => {
	test('should convert milliseconds to seconds', () => {
		const seconds = toSeconds(3500);
		expect(seconds).toBe(3.5);
	});
});
