import { normalize } from "@web/core/l10n/utils";

/**
 * @param {string} pattern
 * @param {string|string[]} strs
 * @returns {number}
 */
function match(pattern, strs) {
    if (!Array.isArray(strs)) {
        strs = [strs];
    }
    let globalScore = 0;
    for (const str of strs) {
        globalScore = Math.max(globalScore, _match(pattern, str));
    }
    return globalScore;
}

/**
 * This private function computes a score that represent the fact that the
 * string contains the pattern, or not
 *
 * - If the score is 0, the string does not contain the letters of the pattern in
 *   the correct order.
 * - if the score is > 0, it actually contains the letters.
 *
 * Better matches will get a higher score: consecutive letters are better,
 * and a match closer to the beginning of the string is also scored higher.
 *
 * @param {string} pattern
 * @param {string} str
 * @returns {number}
 */
function _match(pattern, str) {
    let totalScore = 0;
    let currentScore = 0;
    const len = str.length;
    let patternIndex = 0;

    pattern = normalize(pattern);
    str = normalize(str);

    for (let i = 0; i < len; i++) {
        if (str[i] === pattern[patternIndex]) {
            patternIndex++;
            currentScore += 100 + currentScore - i / 200;
        } else {
            currentScore = 0;
        }
        totalScore = totalScore + currentScore;
    }

    return patternIndex === pattern.length ? totalScore : 0;
}

/**
 * Return a list of things that matches a pattern, ordered by their 'score' (
 * higher score first). An higher score means that the match is better. For
 * example, consecutive letters are considered a better match.
 *
 * @template T
 * @param {string} pattern
 * @param {T[]} list
 * @param {(element: T) => (string|string[])} fn
 * @returns {T[]}
 */
export function fuzzyLookup(pattern, list, fn) {
    const results = [];
    list.forEach((data) => {
        const score = match(pattern, fn(data));
        if (score > 0) {
            results.push({ score, elem: data });
        }
    });

    // we want better matches first
    results.sort((a, b) => b.score - a.score);

    return results.map((r) => r.elem);
}

// Does `pattern` fuzzy match `string`?
/**
 * @param {string} pattern
 * @param {string} string
 * @returns {boolean}
 */
export function fuzzyTest(pattern, string) {
    return _match(pattern, string) !== 0;
}
