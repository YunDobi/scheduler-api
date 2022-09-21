const router = require("express").Router();

module.exports = (db, updateAppointment) => {
  router.get("/appointments", (request, response) => {
    db.query(
      `
      SELECT
        timeslots.id,
        timeslots.time,
        CASE WHEN events.id IS NULL
        THEN NULL
        ELSE json_build_object( events.volunteers_id, 'volunteers', events.waitlist)
        END AS volunteer
      FROM timeslots
      LEFT JOIN events ON events.timeslots_id = timeslots.id
      GROUP BY timeslots.id, events.id
      ORDER BY timeslots.id
    `
    ).then(({ rows: appointments }) => {
      response.json(
        appointments.reduce(
          (previous, current) => ({ ...previous, [current.id]: current }),
          {}
        )
      );
    });
  });

  router.put("/appointments/:id", (request, response) => {
    if (process.env.TEST_ERROR) {
      setTimeout(() => response.status(500).json({}), 1000);
      return;
    }

    const { student, interviewer } = request.body.interview;

    db.query(
      `
      INSERT INTO interviews (student, interviewer_id, appointment_id) VALUES ($1::text, $2::integer, $3::integer)
      ON CONFLICT (appointment_id) DO
      UPDATE SET student = $1::text, interviewer_id = $2::integer
    `,
      [student, interviewer, Number(request.params.id)]
    )
      .then(() => {
        setTimeout(() => {
          response.status(204).json({});
          updateAppointment(Number(request.params.id), request.body.interview);
        }, 1000);
      })
      .catch(error => console.log(error));
  });

  router.delete("/appointments/:id", (request, response) => {
    if (process.env.TEST_ERROR) {
      setTimeout(() => response.status(500).json({}), 1000);
      return;
    }

    db.query(`DELETE FROM interviews WHERE appointment_id = $1::integer`, [
      request.params.id
    ]).then(() => {
      setTimeout(() => {
        response.status(204).json({});
        updateAppointment(Number(request.params.id), null);
      }, 1000);
    });
  });

  return router;
};
