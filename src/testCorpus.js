/**
 * Frontend test corpus — paste order matters for update/conflict cases.
 * Load via "Load test corpus" in the UI, then Ingest.
 *
 * Tags: noise | new_known | unknown | correction | conflict | confirmation | multi | cancelled
 */

export const FRONTEND_TEST_CORPUS = [
  // ── 1. NOISE (should create no tasks) ──────────────────────────────────
  { n: 1, tag: "noise", text: "hey guys anyone up for football at 6?" },
  { n: 2, tag: "noise", text: "where are we meeting for lunch?" },
  { n: 3, tag: "noise", text: "lol same, my brain is fried after that lecture" },
  { n: 4, tag: "noise", text: "thanks for sharing the notes!" },
  { n: 5, tag: "noise", text: "can someone send the Science notes pdf?" },
  { n: 6, tag: "noise", text: "good luck everyone for the weekend" },
  { n: 7, tag: "noise", text: "who is coming for the movie tonight?" },
  { n: 8, tag: "noise", text: "that quiz was brutal yesterday" },
  { n: 9, tag: "noise", text: "assignment due tomorrow lol kill me" },
  { n: 10, tag: "noise", text: "see you in class" },

  // ── 2. NEW TASK — known date ───────────────────────────────────────────
  {
    n: 11,
    tag: "new_known",
    text: "Science lab report submission on 28th August, worth 20% of grade.",
    expect: "Science · Lab report · 28 Aug · Confirmed",
  },
  {
    n: 12,
    tag: "new_known",
    text: "Maths worksheet 3 is due this Friday.",
    expect: "Maths · Worksheet · this Friday · Confirmed",
  },
  {
    n: 13,
    tag: "new_known",
    text: "English quiz tomorrow, chapters 1-3. Closed book.",
    expect: "English · Quiz · tomorrow · Confirmed",
  },
  {
    n: 14,
    tag: "new_known",
    text: "English essay draft due 30 August, 15% weightage.",
    expect: "English · Essay · 30 Aug · Confirmed",
  },
  {
    n: 15,
    tag: "new_known",
    text: "Maths midterm on 2 September. Syllabus: algebra + geometry.",
    expect: "Maths · Midterm · 2 Sep · Confirmed",
  },
  {
    n: 16,
    tag: "new_known",
    text: "Science Quiz 2 moved to 26 August, 10%.",
    expect: "Science · Quiz 2 · 26 Aug · Confirmed",
  },
  {
    n: 17,
    tag: "new_known",
    text: "English mid-sem exam 5 September, 30%.",
    expect: "English · Mid-sem exam · 5 Sep · Confirmed",
  },
  {
    n: 18,
    tag: "new_known",
    text: "Physics practical report due 1 September.",
    expect: "Physics · Practical report · 1 Sep · Confirmed",
  },
  {
    n: 19,
    tag: "new_known",
    text: "Chemistry assignment due 27 August.",
    expect: "Chemistry · Assignment · 27 Aug · Confirmed",
  },
  {
    n: 20,
    tag: "new_known",
    text: "History project submission on 31 August.",
    expect: "History · Project · 31 Aug · Confirmed",
  },

  // ── 3. NEW TASK — unknown date ─────────────────────────────────────────
  {
    n: 21,
    tag: "unknown",
    text: "Science fair registration closes soon, don't miss it!!!",
    expect: "Science · Registration · Date unknown · Needs confirmation",
  },
  {
    n: 22,
    tag: "unknown",
    text: "Hackathon registration closes soon, don't miss it",
    expect: "Registration · Date unknown · Needs confirmation",
  },
  {
    n: 23,
    tag: "unknown",
    text: "English debate club signup deadline coming up",
    expect: "English · Signup · Date unknown · Needs confirmation",
  },

  // ── 4. EXPLICIT CORRECTION (updates existing — no duplicate) ───────────
  {
    n: 24,
    tag: "correction",
    text: "Science report due 25th not 28th",
    expect: "Updates Science lab report → 25 Aug (not a new task)",
  },
  {
    n: 25,
    tag: "correction",
    text: "Science lab report due date updated to 29th",
    expect: "Updates Science lab report → 29 Aug",
  },
  {
    n: 26,
    tag: "correction",
    text: "English essay moved to 1 September",
    expect: "Updates English essay → 1 Sep",
  },
  {
    n: 27,
    tag: "correction",
    text: "Maths worksheet rescheduled to 27 August",
    expect: "Updates Maths worksheet → 27 Aug",
  },
  {
    n: 28,
    tag: "correction",
    text: "Chemistry assignment actually due 29 August not 27th",
    expect: "Updates Chemistry assignment → 29 Aug",
  },

  // ── 5. CONFLICTING REPORT (different date, no override words) ──────────
  {
    n: 29,
    tag: "conflict",
    text: "Maths worksheet due next Friday",
    expect: "Conflicting date on Maths worksheet · Needs confirmation",
  },
  {
    n: 30,
    tag: "conflict",
    text: "Science lab report due next Monday",
    expect: "Conflicting date on Science lab · Needs confirmation",
  },
  {
    n: 31,
    tag: "conflict",
    text: "English quiz is on Wednesday not tomorrow",
    expect: "May conflict or correct English quiz date",
  },

  // ── 6. CONFIRMATION (same date restated) ───────────────────────────────
  {
    n: 32,
    tag: "confirmation",
    text: "Maths worksheet deadline: this Friday",
    expect: "Confirms Maths worksheet · status may stay needs_confirmation if conflict open",
  },
  {
    n: 33,
    tag: "confirmation",
    text: "Reminder — Science lab report due 29th August",
    expect: "Confirms Science lab report date",
  },
  {
    n: 34,
    tag: "confirmation",
    text: "English essay still due 1 September",
    expect: "Confirms English essay date",
  },

  // ── 7. RELATIVE DATES (anchored on today) ──────────────────────────────
  {
    n: 35,
    tag: "new_known",
    text: "Computer Science coding assignment due tomorrow.",
    expect: "CS · Assignment · tomorrow",
  },
  {
    n: 36,
    tag: "new_known",
    text: "Biology lab due next Tuesday.",
    expect: "Biology · Lab · next Tuesday",
  },
  {
    n: 37,
    tag: "new_known",
    text: "Geography map work due Friday.",
    expect: "Geography · Map work · nearest Friday",
  },

  // ── 8. BARE DAY (month from today) ─────────────────────────────────────
  {
    n: 38,
    tag: "new_known",
    text: "Economics case study due on the 15th.",
    expect: "Economics · Case study · 15th this/next month",
  },
  {
    n: 39,
    tag: "correction",
    text: "Economics case study updated to the 18th",
    expect: "Updates Economics case study → 18th",
  },

  // ── 9. MULTI-TASK (one message, two deadlines) ─────────────────────────
  {
    n: 40,
    tag: "multi",
    text: "Science quiz on 26 August AND English worksheet due 28 August.",
    expect: "Two tasks extracted from one message",
  },
  {
    n: 41,
    tag: "multi",
    text: "Maths HW due Friday. Also English reading log due Monday.",
    expect: "Two tasks: Maths HW + English reading log",
  },

  // ── 10. WEIGHTAGE ──────────────────────────────────────────────────────
  {
    n: 42,
    tag: "new_known",
    text: "Statistics assignment due 3 September, worth 25% of final grade.",
    expect: "Statistics · 25% weightage",
  },
  {
    n: 43,
    tag: "new_known",
    text: "Political Science presentation on 4 September, 10 marks.",
    expect: "Pol Sci · Presentation · 4 Sep",
  },

  // ── 11. TASK TYPES ─────────────────────────────────────────────────────
  {
    n: 44,
    tag: "new_known",
    text: "French oral exam on 6 September.",
    expect: "French · Exam",
  },
  {
    n: 45,
    tag: "new_known",
    text: "Art studio portfolio review due 7 September.",
    expect: "Art · Portfolio review",
  },
  {
    n: 46,
    tag: "new_known",
    text: "Music theory quiz due 8 September.",
    expect: "Music · Quiz",
  },

  // ── 12. CANCELLED / POSTPONED ──────────────────────────────────────────
  {
    n: 47,
    tag: "cancelled",
    text: "Music theory quiz cancelled until further notice",
    expect: "Music quiz · date cleared · Needs confirmation",
  },
  {
    n: 48,
    tag: "correction",
    text: "Music theory quiz now due 10 September",
    expect: "Updates Music quiz → 10 Sep",
  },

  // ── 13. FILL UNKNOWN DATE LATER ────────────────────────────────────────
  {
    n: 49,
    tag: "correction",
    text: "Science fair registration closes 20 September",
    expect: "Fills date on Science fair registration task",
  },
  {
    n: 50,
    tag: "correction",
    text: "Hackathon registration deadline is 15 September",
    expect: "Fills date on Hackathon registration",
  },

  // ── 14. MORE NOISE (mid-run) ───────────────────────────────────────────
  { n: 51, tag: "noise", text: "bro did you finish the lab?" },
  { n: 52, tag: "noise", text: "anyone free for coffee after class?" },
  { n: 53, tag: "noise", text: "haha that meme was accurate" },

  // ── 15. EDGE CASES ─────────────────────────────────────────────────────
  {
    n: 54,
    tag: "unknown",
    text: "Library book return deadline approaching",
    expect: "Date unknown · Needs confirmation",
  },
  {
    n: 55,
    tag: "new_known",
    text: "PE fitness test on 9 September.",
    expect: "PE · Fitness test · 9 Sep",
  },
  {
    n: 56,
    tag: "conflict",
    text: "PE fitness test moved to 12 September",
    expect: "Conflicting or correction on PE test",
  },
  {
    n: 57,
    tag: "correction",
    text: "PE fitness test confirmed for 12 September",
    expect: "Explicit update PE → 12 Sep",
  },

  // ── 16. ISO DATE FORMAT ──────────────────────────────────────────────────
  {
    n: 58,
    tag: "new_known",
    text: "Robotics club project due 2026-09-14.",
    expect: "Robotics · 14 Sep · ISO date parsed",
  },

  // ── 17. COURSE VARIATIONS ──────────────────────────────────────────────
  {
    n: 59,
    tag: "new_known",
    text: "Mathematics olympiad prep due 10 September.",
    expect: "Maths/Mathematics course",
  },
  {
    n: 60,
    tag: "new_known",
    text: "Computer lab exercise 4 due 11 September.",
    expect: "Computer Science · Lab exercise",
  },

  // ── 18. LATE CORRECTIONS ON EXISTING ───────────────────────────────────
  {
    n: 61,
    tag: "correction",
    text: "Physics practical report due 3 September not 1 September",
    expect: "Updates Physics report → 3 Sep",
  },
  {
    n: 62,
    tag: "correction",
    text: "History project extended to 2 September",
    expect: "Updates History project → 2 Sep",
  },

  // ── 19. CONFIRMATION AFTER CONFLICTS ───────────────────────────────────
  {
    n: 63,
    tag: "confirmation",
    text: "Just confirming Maths worksheet is due this Friday",
    expect: "Confirms Maths worksheet",
  },
  {
    n: 64,
    tag: "confirmation",
    text: "Science lab report deadline remains 29 August",
    expect: "Confirms Science lab",
  },

  // ── 20. MORE NEW TASKS ─────────────────────────────────────────────────
  {
    n: 65,
    tag: "new_known",
    text: "Drama rehearsal script due 12 September.",
    expect: "Drama · Script · 12 Sep",
  },
  {
    n: 66,
    tag: "new_known",
    text: "Philosophy essay due 13 September, 20%.",
    expect: "Philosophy · Essay · 13 Sep · 20%",
  },
  {
    n: 67,
    tag: "unknown",
    text: "Coding club hackathon signup closing soon",
    expect: "Date unknown · Needs confirmation",
  },

  // ── 21. NOISE BATCH ────────────────────────────────────────────────────
  { n: 68, tag: "noise", text: "lets grab biryani after submission" },
  { n: 69, tag: "noise", text: "no way im waking up for 8am class" },
  { n: 70, tag: "noise", text: "sent you the drive link" },

  // ── 22. FINAL CORRECTIONS & CONFLICTS ──────────────────────────────────
  {
    n: 71,
    tag: "correction",
    text: "Philosophy essay due 14 September not 13th",
    expect: "Updates Philosophy essay → 14 Sep",
  },
  {
    n: 72,
    tag: "conflict",
    text: "Drama rehearsal script due next week Friday",
    expect: "Possible conflict on Drama script",
  },
  {
    n: 73,
    tag: "confirmation",
    text: "Drama script submission is 12 September as planned",
    expect: "Confirms Drama script",
  },

  // ── 23. REGISTRATION & SPECIAL ─────────────────────────────────────────
  {
    n: 74,
    tag: "new_known",
    text: "University sports day registration due 16 September.",
    expect: "Registration · 16 Sep",
  },
  {
    n: 75,
    tag: "new_known",
    text: "Scholarship application deadline 17 September.",
    expect: "Scholarship · 17 Sep",
  },

  // ── 24. WRAP-UP NOISE ──────────────────────────────────────────────────
  { n: 76, tag: "noise", text: "finally done with all submissions 🎉" },
  { n: 77, tag: "noise", text: "who has the answer key?" },
  { n: 78, tag: "noise", text: "class cancelled tomorrow?" },

  // ── 25. LAST EDGE CASES ────────────────────────────────────────────────
  {
    n: 79,
    tag: "correction",
    text: "Scholarship application moved to 20 September",
    expect: "Updates Scholarship → 20 Sep",
  },
  {
    n: 80,
    tag: "multi",
    text: "Reminder: Statistics assignment 3 Sep (25%) and French oral 6 Sep.",
    expect: "Two reminders in one message",
  },
  {
    n: 81,
    tag: "confirmation",
    text: "Statistics assignment still due 3 September",
    expect: "Confirms Statistics assignment",
  },
  {
    n: 82,
    tag: "unknown",
    text: "Annual day costume submission deadline TBD",
    expect: "Date unknown · Needs confirmation",
  },
  {
    n: 83,
    tag: "new_known",
    text: "Annual day costume submission due 18 September.",
    expect: "Fills Annual day costume date",
  },
  { n: 84, tag: "noise", text: "ttyl see you Monday" },
  {
    n: 85,
    tag: "confirmation",
    text: "All set — Annual day costumes due 18 September confirmed",
    expect: "Final confirmation on Annual day task",
  },
];

/** Plain text: one message per line (for copy-paste). */
export const FRONTEND_TEST_CORPUS_TEXT = FRONTEND_TEST_CORPUS.map((m) => m.text).join("\n");

export const CORPUS_STATS = {
  total: FRONTEND_TEST_CORPUS.length,
  byTag: FRONTEND_TEST_CORPUS.reduce((acc, m) => {
    acc[m.tag] = (acc[m.tag] || 0) + 1;
    return acc;
  }, {}),
};
