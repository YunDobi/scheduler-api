const router = require("express").Router();

module.exports = db => {
  router.get("/days", (request, response) => {
    db.query(
      `
      SELECT
        days.id,
        days.name
      FROM days
      JOIN timeslots ON timeslots.day_id = days.id
      GROUP BY days.id
      ORDER BY days.id
    `
    ).then(({ rows: days }) => {
      response.json(days);
    });
  });

  return router;
};
