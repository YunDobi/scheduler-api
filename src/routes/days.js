const router = require("express").Router();

module.exports = db => {
  router.get("/days", (request, response) => {
    db.query(
      `
      SELECT
        days.id,
        days.name,
        count(day_id) as spots
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


//select count(events.day_id) as spots from days left join events on events.day_id = days.id group by days.id;