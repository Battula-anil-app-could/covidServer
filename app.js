const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const app = express();
app.use(express.json());

let dbPath = path.join(__dirname, "covid19India.db");
let db = null;

let getDbAndRunServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (e) {
    console.log(`Error: ${e.massage}`);
    process.exit(1);
  }
};

getDbAndRunServer();

let stateObj = (obj) => {
  return {
    stateId: obj.state_id,
    stateName: obj.state_name,
    population: obj.population,
  };
};

app.get("/states/", async (request, response) => {
  let query = `select * from state`;
  let list = await db.all(query);
  response.send(
    list.map((eachState) => {
      return stateObj(eachState);
    })
  );
});

app.get("/states/:stateId/", async (request, response) => {
  let { stateId } = request.params;
  let query = `select * from state where state_id = ${stateId};`;
  let state = await db.get(query);
  response.send(stateObj(state));
});

app.post("/districts/", async (request, response) => {
  let data = request.body;
  let { districtName, stateId, cases, cured, active, deaths } = data;
  let query = `
            insert into district 
                (district_name, state_id, cases, cured, active, deaths)
                VALUES
                (
                    ${districtName},
                    ${stateId},
                    ${cases},
                    ${cured},
                    ${active},
                    ${deaths}
                )`;

  let db = await db.run(query);
  response.send("District Successfully Added");
});

let getDistricts = (obj) => {
  return {
    districtId: obj.district_id,
    districtName: obj.district_name,
    stateId: obj.state_id,
    cases: obj.cases,
    cured: obj.cured,
    active: obj.active,
    deaths: obj.deaths,
  };
};

app.get("/districts/:districtId/", async (request, response) => {
  let { districtId } = request.params;
  let query = `select * from district where district_id = ${districtId}`;
  let district = await db.get(query);
  response.send(getDistricts(district));
});

app.delete("/districts/:districtId/", async (request, response) => {
  let { districtId } = request.params;
  let query = `delete from district where district_id = ${districtId}
    `;
  let update = await db.run(query);
  response.send("District Removed");
});

// after put
let dataSend = (data) => {
  return {
    totalCases: data.cases,
    totalCured: data.cured,
    totalActive: data.active,
    totalDeaths: data.deaths,
  };
};

app.get("/states/:stateId/stats/", async (request, response) => {
  let { stateId } = request.params;
  let query = `select * from state where state_id = ${stateId}`;
  let data = await db.get(query);
  response.send(dataSend(data));
});
module.exports = app;
