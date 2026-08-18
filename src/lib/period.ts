/**
 * Interpreting a project's engagement span and its system's production status.
 *
 * These are two independent facts and the site kept conflating them. Tigo is
 * the case that separated them: the engagement finished years ago, the portal
 * is still serving customers. Rendering one from the other made the site claim
 * David was still working there.
 */

/** As stored in front matter: a date, still ongoing, or ended with no date. */
export type EndValue = Date | 'present' | null;

export type EndState =
	/** Ongoing engagement. */
	| { kind: 'present' }
	/** Ended, and we know when. */
	| { kind: 'dated'; date: Date }
	/** Ended, but no date is on record. Never rendered as "Present". */
	| { kind: 'undated' };

export function endState(end: EndValue): EndState {
	if (end === 'present') return { kind: 'present' };
	if (end === null) return { kind: 'undated' };
	return { kind: 'dated', date: end };
}

/** True only while the engagement itself is current. */
export function isOngoing(end: EndValue) {
	return end === 'present';
}

/**
 * Where the engagement bar stops on the axis, as a fraction 0–1 of the domain.
 *
 * An undated end is drawn to the last date we can actually defend — the start —
 * and the chart marks it as indeterminate rather than guessing a length.
 */
export function hasKnownEnd(end: EndValue) {
	return end instanceof Date;
}
