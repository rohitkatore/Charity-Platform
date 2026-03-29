const test = require("node:test");
const assert = require("node:assert/strict");
const { addScore, listScores, editScore } = require("./score.service");
const { resetStore } = require("../data/store");

test.beforeEach(() => {
  resetStore();
});

test("retains only latest 5 scores and replaces oldest when adding sixth", () => {
  const userId = "usr_test_1";

  addScore(userId, { scoreValue: 10, scoreDate: "2026-01-01" });
  addScore(userId, { scoreValue: 11, scoreDate: "2026-01-02" });
  addScore(userId, { scoreValue: 12, scoreDate: "2026-01-03" });
  addScore(userId, { scoreValue: 13, scoreDate: "2026-01-04" });
  addScore(userId, { scoreValue: 14, scoreDate: "2026-01-05" });
  const six = addScore(userId, { scoreValue: 15, scoreDate: "2026-01-06" });

  assert.equal(six.length, 5);
  assert.deepEqual(
    six.map((item) => item.scoreDate),
    ["2026-01-06", "2026-01-05", "2026-01-04", "2026-01-03", "2026-01-02"]
  );
  assert.ok(!six.some((item) => item.scoreDate === "2026-01-01"));
});

test("returns scores in reverse chronological order", () => {
  const userId = "usr_test_2";

  addScore(userId, { scoreValue: 20, scoreDate: "2026-02-10" });
  addScore(userId, { scoreValue: 21, scoreDate: "2026-02-08" });
  addScore(userId, { scoreValue: 22, scoreDate: "2026-02-12" });

  const scores = listScores(userId);
  assert.deepEqual(
    scores.map((item) => item.scoreDate),
    ["2026-02-12", "2026-02-10", "2026-02-08"]
  );
});

test("edit updates score and keeps record count within 5", () => {
  const userId = "usr_test_3";
  const created = addScore(userId, { scoreValue: 5, scoreDate: "2026-03-01" });
  const target = created[0];

  const updated = editScore(userId, target.id, {
    scoreValue: 30,
    scoreDate: "2026-03-02",
  });

  assert.equal(updated.length, 1);
  assert.equal(updated[0].scoreValue, 30);
  assert.equal(updated[0].scoreDate, "2026-03-02");
});