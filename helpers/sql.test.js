const { sqlForPartialUpdate, sqlForCompanyFilter } = require("./sql");
const { BadRequestError } = require("../expressError");

describe("sqlForPartialUpdate", function () {
  test("works", function () {
    const { setCols, values} = sqlForPartialUpdate(
      { 
        name: 'Microsoft', 
        description: 'Tech company with services across many industries', 
        numEmployees: 50000
      }, 
      {
        numEmployees: "num_employees",
        logoUrl: "logo_url"
      });
    expect(setCols).toEqual('"name"=$1, "description"=$2, "num_employees"=$3');
    expect(values).toEqual(['Microsoft', 'Tech company with services across many industries', 50000]);
  });

  it('throws BadRequestError if no data is provided', () => {
    expect(() => {
      sqlForPartialUpdate({},
      {
        numEmployees: "num_employees",
        logoUrl: "logo_url"
      });
    }).toThrow(BadRequestError);
  });
});

describe("sqlForCompanyFilter", function () {
  test("works: no filter", function () {
    const whereClause = sqlForCompanyFilter({});
    expect(whereClause).toEqual("");
  });
  test("works: filter", function () {
    const whereClause = sqlForCompanyFilter({ nameLike: "1", minEmployees: "5000", maxEmployees: "10000" });
    expect(whereClause).toEqual(`WHERE name ILIKE '%1%' AND num_employees >= 5000 AND num_employees <= 10000`);
  });
  test("works: partial filter", function () {
    const whereClause = sqlForCompanyFilter({ nameLike: "1" });
    expect(whereClause).toEqual(`WHERE name ILIKE '%1%'`);
  });

  it('throws BadRequestError if minEmployees > maxEmployees', () => {
    expect(() => {
      sqlForCompanyFilter({maxEmployees: "1000", minEmployees: "5000" });
    }).toThrow(BadRequestError);
  });
});