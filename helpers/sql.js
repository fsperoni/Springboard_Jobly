const { BadRequestError } = require("../expressError");

// THIS NEEDS SOME GREAT DOCUMENTATION.

/**
 * Helper function for UPDATE queries. Its return value contains the data to be
 * used in the SET clause of the query.
 * 
 * @param {Object} dataToUpdate {fieldName1: fieldNewVal, fieldName2: fieldNewVal, ...}
 * @param {Object} jsToSql converted JavaScript field name conventions to SQL
 * column names.
 * @returns {Object} {setCols, dataArray} where setCols is a string in CSV 
 * format containing the SQL column names and corresponding hidden values to be
 * updated, and dataArray contains the data to be updated, such as: 
 * {firstName: 'Aliya', age: 32} => 
 *    { 
 *    setCols: '"first_name"=$1, "age"=$2',
 *    values: ['Aliya', 32]
 *    }
 */
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

module.exports = { sqlForPartialUpdate };
