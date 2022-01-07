"use strict";

const db = require("../db");
const { NotFoundError} = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");


/** Related functions for companies. */

class Job {
  /** Create a job (from data), update db, return new job data.
   *
   * data should be { title, salary, equity, companyHandle }
   *
   * Returns { id, title, salary, equity, companyHandle }
   **/

  static async create(data) {
    const result = await db.query(
          `INSERT INTO jobs (title,
                             salary,
                             equity,
                             company_handle)
           VALUES ($1, $2, $3, $4)
           RETURNING id, title, salary, equity, company_handle AS "companyHandle"`,
        [
          data.title,
          data.salary,
          data.equity,
          data.companyHandle,
        ]);
    const job = result.rows[0];

    return job;
  }

  
  /** 
   * Find all jobs (optional filter on filters)
   *
   * @param {Object} filters (optional query filter)
   * 
   * filters (optional):
   * - minSalary
   * - hasEquity (true whenever value of equity column > 0)
   * - title (case-insensitive, partial match)
   * 
   * Returns [{ id, title, salary, equity, companyHandle, companyName }, ...]
   * */

  static async findAll(filters = {}) {
    let query = `SELECT jobs.id,
                        jobs.title,
                        jobs.salary,
                        jobs.equity,
                        jobs.company_handle AS "companyHandle",
                        c.name AS "companyName"
                 FROM jobs 
                   LEFT JOIN companies AS c ON c.handle = jobs.company_handle`;
    let whereExpArr = [];
    let queryValArr = [];
    const { minSalary, hasEquity, title } = filters;

    // prepare WHERE clause with respective values array by checking each
    // possible search criteria.
    if (minSalary !== undefined) {
      queryValArr.push(minSalary);
      whereExpArr.push(`salary >= $${queryValArr.length}`);
    }

    if (hasEquity === true) {
      whereExpArr.push(`equity > 0`);
    }

    if (title !== undefined) {
      queryValArr.push(`%${title}%`);
      whereExpArr.push(`title ILIKE $${queryValArr.length}`);
    }

    if (whereExpArr.length > 0) {
      query += " WHERE " + whereExpArr.join(" AND ");
    }

    // Finalize query and return results

    query += " ORDER BY title";
    const jobs = await db.query(query, queryValArr);
    return jobs.rows;
  }

  /** Return data about job, given a job id.
   *
   * Returns { id, title, salary, equity, companyHandle, company }
   *   where company is { handle, name, description, numEmployees, logoUrl }
   *
   * Throws NotFoundError if not found.
   **/

  static async get(id) {
    const results = await db.query(
          `SELECT id,
                  title,
                  salary,
                  equity,
                  company_handle AS "companyHandle"
           FROM jobs
           WHERE id = $1`, [id]);

    const job = results.rows[0];

    if (!job) throw new NotFoundError(`No job with id: ${id}`);

    const companiesRes = await db.query(
          `SELECT handle,
                  name,
                  description,
                  num_employees AS "numEmployees",
                  logo_url AS "logoUrl"
           FROM companies
           WHERE handle = $1`, [job.companyHandle]);
    
    //get rid of handle
    delete job.companyHandle; 
    // add company data to the job
    job.company = companiesRes.rows[0]; 

    return job;
  }

  /** Update job data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain
   * all the fields; this only changes provided ones.
   *
   * Data can include: { title, salary, equity }
   *
   * Returns { id, title, salary, equity, companyHandle }
   *
   * Throws NotFoundError if not found.
   */

  static async update(id, data) {
    const { setCols, values } = sqlForPartialUpdate(
        data,
        {});
    const idVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE jobs 
                      SET ${setCols} 
                      WHERE id = ${idVarIdx} 
                      RETURNING id, 
                                title, 
                                salary, 
                                equity,
                                company_handle AS "companyHandle"`;
    const result = await db.query(querySql, [...values, id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job with id: ${id}`);

    return job;
  }

  /** Delete given job from database; returns undefined.
   *
   * Throws NotFoundError if company not found.
   **/

  static async remove(id) {
    const result = await db.query(
          `DELETE
           FROM jobs
           WHERE id = $1
           RETURNING id`, [id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job with id: ${id}`);
  }
}

module.exports = Job;
