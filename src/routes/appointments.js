const router = require("express").Router();

module.exports = (db, updateAppointment) => {
  router.get("/appointments", (request, response) => {
    db.query(
      `
      SELECT
        timeslots.id,
        timeslots.time,
        timeslots.day_id,
        CASE WHEN events.id IS NULL
        THEN NULL
        ELSE json_build_object('volunteers', 
        events.volunteers_id, 'waitlist', events.waitlist)
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
    console.log(request.body);
    if (process.env.TEST_ERROR) {
      setTimeout(() => response.status(500).json({}), 1000);
      return;
    }

    const { volunteers, waitlist } = request.body.volunteer;

    db.query(
      `
      INSERT INTO events (volunteers_id, waitlist, day_id, timeslots_id)
       VALUES 
       ($1::integer[], $2::integer[], $3, $4)
      ON CONFLICT (id) DO
      UPDATE SET volunteers_id = $1::integer[], waitlist = $2::integer[]
    `,
      [volunteers, waitlist, request.body.day_id, request.body.id ]
    )
      .then(() => {
        setTimeout(() => {
          response.status(204).json({});
          updateAppointment(Number(request.params.id), request.body.interview);
        }, 1000);
      })
      .catch(error => console.log(error));
  });


  // router.post("/appointments/:id", (request, response) => {
  //   console.log("post",request.body);
  //   if (process.env.TEST_ERROR) {
  //     setTimeout(() => response.status(500).json({}), 1000);
  //     return;
  //   }

  //   const { volunteers, waitlist } = request.body.volunteer;

  //   db.query(
  //     `
  //     INSERT INTO events (volunteers_id, waitlist, day_id, timeslots_id)
  //      VALUES ;
  //      ($1::integer[], $2::integer[], $3, $4)
  //     ON CONFLICT (id) DO
  //     UPDATE SET volunteers_id = $1::integer[], waitlist = $2::integer[]
  //   `,
  //     [volunteers, waitlist, request.body.day_id, request.body.id ]
  //   )
  //     .then(() => {
  //       setTimeout(() => {
  //         response.status(204).json({});
  //         updateAppointment(Number(request.params.id), request.body.interview);
  //       }, 1000);
  //     })
  //     .catch(error => console.log(error));
  // });





  router.delete("/appointments/:id", (request, response) => {
    if (process.env.TEST_ERROR) {
      setTimeout(() => response.status(500).json({}), 1000);
      return;
    }

    db.query(`DELETE FROM events WHERE events.timeslots_id = $1::integer`, [
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
