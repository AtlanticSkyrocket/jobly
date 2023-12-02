"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  a1Token
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /jobs */

describe("POST /jobs", function () {
  const newjob = {
    title: "j4",
    salary: 400,
    equity: 0.04,
    companyHandle: "c1",
  };

  test("not authed for users", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send(newjob)
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("works for admin", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send(newjob)
        .set("authorization", `Bearer ${a1Token}`);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      job: {
        id: 4,
        title: "j4",
        salary: 400,
        equity: "0.04",
        companyHandle: "c1",
      },
    });
  });

  test("bad request with missing data", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send({
          title: "c5"
        })
        .set("authorization", `Bearer ${a1Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request with invalid data", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send({
          ...newjob,
          logoUrl: "not-a-url",
        })
        .set("authorization", `Bearer ${a1Token}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** GET /jobs */

describe("GET /jobs", function () {
  test("ok for anon", async function () {
    const resp = await request(app).get("/jobs");
    expect(resp.body).toEqual({
      jobs:
          [
            {
              id: 1,
              title: "j1",
              salary: 100,
              equity: "0.1",
              companyHandle: "c1",
            },
            {
              id: 2,
              title: "j2",
              salary: 200,
              equity: "0.2",
              companyHandle: "c2",
            },
            {
              id: 3,
              title: "j3",
              salary: 300,
              equity: "0",
              companyHandle: "c2",
            },
          ],
    });
  });
  test("works: full filter", async function () {
    const resp = await request(app).get("/jobs/?titleLike=j&minSalary=100&hasEquity=true");
    expect(resp.body).toEqual({
      jobs:
          [
            {
              id: 1,
              title: "j1",
              salary: 100,
              equity: "0.1",
              companyHandle: "c1",
            },
            {
              id: 2,
              title: "j2",
              salary: 200,
              equity: "0.2",
              companyHandle: "c2",
            }
          ],
    });
  });
  test("works: partial filter", async function () {
    const resp = await request(app).get("/jobs/?titleLike=1");
    expect(resp.body).toEqual({
      jobs:
          [
            {
              id: 1,
              title: "j1",
              salary: 100,
              equity: "0.1",
              companyHandle: "c1",
            },
          ],
    });
  });
  test("fails: bad parameter value filter", async function () {
    const resp = await request(app).get("/jobs/?minSalary=test");
    expect(resp.statusCode).toBe(400);
  });

  test("fails: test next() handler", async function () {
    // there's no normal failure event which will cause this route to fail ---
    // thus making it hard to test that the error-handler works with it. This
    // should cause an error, all right :)
    await db.query("DROP TABLE jobs CASCADE");
    const resp = await request(app)
        .get("/jobs")
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(500);
  });
});

/************************************** GET /jobs/:handle */

describe("GET /jobs/:id", function () {
  test("works for anon", async function () {
    const resp = await request(app).get(`/jobs/1`);
    expect(resp.body).toEqual({
      job: {
        id: 1,
        title: "j1",
        salary: 100,
        equity: "0.1",
        companyHandle: "c1",
      },
    });
  });

  test("works for anon: job w/o jobs", async function () {
    const resp = await request(app).get(`/jobs/2`);
    expect(resp.body).toEqual({
      job: {
        id: 2,
        title: "j2",
        salary: 200,
        equity: "0.2",
        companyHandle: "c2",
      },
    });
  });

  test("not found for no such job", async function () {
    const resp = await request(app).get(`/jobs/200`);
    expect(resp.statusCode).toEqual(404);
  });
});

/************************************** PATCH /jobs/:id */

describe("PATCH /jobs/:id", function () {
  test("works for admin", async function () {
    const resp = await request(app)
        .patch(`/jobs/1`)
        .send({
          title: "J1-new",
        })
        .set("authorization", `Bearer ${a1Token}`);
    expect(resp.body).toEqual({
      job: {
        id: 1,
        title: "J1-new",
        salary: 100,
        equity: "0.1",
        companyHandle: "c1",
      },
    });
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
        .patch(`/jobs/1`)
        .send({
          title: "C1-new",
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });
  
  test("unauth for anon", async function () {
    const resp = await request(app)
        .patch(`/jobs/1`)
        .send({
          title: "C1-new",
        });
    expect(resp.statusCode).toEqual(401);
  });

  test("not found on no such job", async function () {
    const resp = await request(app)
        .patch(`/jobs/200`)
        .send({
          title: "new nope",
        })
        .set("authorization", `Bearer ${a1Token}`);
    expect(resp.statusCode).toEqual(404);
  });

  test("bad request on salary change attempt", async function () {
    const resp = await request(app)
        .patch(`/jobs/1`)
        .send({
          id: "2",
        })
        .set("authorization", `Bearer ${a1Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request on invalid data", async function () {
    const resp = await request(app)
        .patch(`/jobs/1`)
        .send({
          salary: "not-a-number",
        })
        .set("authorization", `Bearer ${a1Token}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** DELETE /jobs/:id */

describe("DELETE /jobs/:id", function () {
  test("works for admin", async function () {
    const resp = await request(app)
        .delete(`/jobs/1`)
        .set("authorization", `Bearer ${a1Token}`);
    expect(resp.body).toEqual({ deleted: "1" });
  });

  test("unauth for users", async function () {
    const resp = await request(app)
        .delete(`/jobs/1`)
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
        .delete(`/jobs/1`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found for no such job", async function () {
    const resp = await request(app)
        .delete(`/jobs/2000`)
        .set("authorization", `Bearer ${a1Token}`);
    expect(resp.statusCode).toEqual(404);
  });
});
