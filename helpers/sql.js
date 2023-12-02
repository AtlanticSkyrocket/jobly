const { BadRequestError } = require("../expressError");

/**
 * Takes a JS object of column:value pairs for company updates and a JS object with js property to sql column mapping
 * and returns an object containing csv string of '"columnName"=$idx,...' and an array of 
 * $idx values to be inserted for all columns passed in first parameter.
 * 
 * Ex:
 * ({name: 'Microsoft', description: 'Tech company with services across many industries',numEmployees: 50000}, 
 *        {numEmployees: "num_employees", logoUrl: "logo_url"}) => 
 *    
 *        { setCols: '"name"=$1, "description"=$2, "num_employees"=$3', values: ['Microsoft', 'Tech company with services across many industries', 50000]}
 *  */ 

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

/**
 * Takes a JS object of filter parameters and returns a string of the WHERE clause for a SQL query.
 * Ex: ({nameLike: 'Micro', minEmployees: 5000, maxEmployees: 10000}) =>
 *     "WHERE name ILIKE '%Micro%' AND num_employees >= 5000 AND num_employees <= 10000"
 **/
function sqlForCompanyFilter(filter) {
  let whereClause = "";
  if(Object.keys(filter).length != 0) {
    if (typeof filter.minEmployees === 'string' && typeof filter.maxEmployees === 'string' && parseInt(filter.minEmployees) > parseInt(filter.maxEmployees)) {
      throw new BadRequestError("Min employees cannot be greater than max employees");
    }
    let filterArr = Object.keys(filter).map((key, idx) => {
      if (key === 'nameLike') {
        return `name ILIKE '%${filter[key]}%'`;
      } else if (key === 'minEmployees') {
        return `num_employees >= ${parseInt(filter[key])}`;
      } else if (key === 'maxEmployees') {
        return `num_employees <= ${parseInt(filter[key])}`;
      }
    });
    whereClause = "WHERE " + filterArr.join(" AND ");
  }
  return whereClause;
}
/**
 * Takes a JS object of filter parameters and returns a string of the WHERE clause for a SQL query.
 * Ex: ({titleLike: 'Micro', minSalary: 5000, hasEquity: true}) =>
 *     "WHERE name ILIKE '%Micro%' AND num_employees >= 5000 AND num_employees <= 10000"
 **/
function sqlForJobFilter(filter) {
  let whereClause = "";
  if(Object.keys(filter).length != 0) {
    let filterArr = Object.keys(filter).map((key) => {
      if (key === 'titleLike') {
        return `title ILIKE '%${filter[key]}%'`;
      } else if (key === 'minSalary') {
        return `salary >= ${parseInt(filter[key])}`;
      } else if (key === 'hasEquity') {
        if(filter[key] === "true") {
          return `equity > 0`;
        } else {
          return `equity = 0`;
        }
      }
    });
    whereClause = "WHERE " + filterArr.join(" AND ");
  }
  return whereClause;
}
module.exports = { 
  sqlForPartialUpdate, 
  sqlForCompanyFilter,
  sqlForJobFilter
 };
