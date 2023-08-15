const mysql = require("mysql");
const db = require("../sql/connection");
const { handleSQLError } = require("../sql/error");

const getAllUsers = (req, res) => {
  // SELECT ALL USERS
  let sql =
    "select first_name, last_name, address, city, county, state, zip, phone1, phone2, email ";
  sql +=
    "from users u join usersAddress ua on u.id = ua.user_id join usersContact uc on u.id = uc.user_id";

  // new format
  db.query(sql, (err, rows) => {
    if (err) {
      console.log("getAllUsers query failed", err);
      res.sendStatus(500); //it was a server's fault
    } else {
      return res.json(rows);
    }
  });

  // older syntax
  // db.query("SELECT * FROM users", (err, rows) => {
  //   if (err) return handleSQLError(res, err)
  //   return res.json(rows);
  // })
};

const getUserById = (req, res) => {
  // SELECT USERS WHERE ID = <REQ PARAMS ID>
  // users/id:
  //put the requested path id into a variable

  let id = req.params.id; //this will get whatever is sent from the front-end form in the id text field

  let params = [id]; // you can have more than one ? in your query, and they have to be in order of use in the query

  //check for valid id
  if (!id) {
    res.sendStatus(400); //their fault. didn't send a valid id
    return; //and stop. no reason to execute any more code
  }

  // this is a bad way to do a query!!! - with the id (or any request param) concatenated to the string
  // why?
  // and what if i add and drop table users
  // this is called a sql injection attack
  // let sql =
  //   "select first_name, last_name, address, city, county, state, zip, phone1, phone2, email ";
  // sql +=
  //   "from users u join usersAddress ua on u.id = ua.user_id join usersContact uc on u.id = uc.user_id";
  // sql += "where u.id = " + id + " and drop table users"

  // instead we use parameterized sql statements

  let sql =
    "select first_name, last_name, address, city, county, state, zip, phone1, phone2, email ";
  // don't forget space at the very end before the quote close
  sql +=
    "from users u join usersAddress ua on u.id = ua.user_id join usersContact uc on u.id = uc.user_id ";
  // like this if we had more than one param sql += "where u.id = ? and first_name = ?" remember always in order of use in query
  sql += "where u.id = ?";

  // the ? is a dynamic value that is restricted to a query parameter
  // the query parameter isn't combined with the main query until AFTER the query has been parsed
  //so there's no way the parameter can introduce unintended syntax

  db.query(sql, params, (err, rows) => {
    if (err) {
      console.log("getUserById query failed", err);
      res.sendStatus(500); // it was our fault
    } else {
      // we got results, but we got more than one row
      if (rows.length > 1) {
        console.log("Returned more than 1 row for id ", id);
        res.sendStatus(500); // server's fault, data integrity error
      } else if (rows.length === 0) {
        //res.send(null) // don't send anything back
        // OR
        res.status(404).send("User not found");
      } else {
        // success! we got one row
        res.json(rows[0]); // if return just res.json(rows), it returns an array with one object
        // if I want to return just the array, In need to reference the index
      }
    }
  });

  // WHAT GOES IN THE BRACKETS
  // sql = mysql.format(sql, [])

  // pool.query(sql, (err, rows) => {
  //   if (err) return handleSQLError(res, err)
  //   return res.json(rows);
  // })
};

// we're never calling this back since we're using the promise
const createUserCallback = (req, res) => {
  // INSERT INTO USERS FIRST AND LAST NAME - need to have this first, before you can make another entry to other tables bc you have foreign keys references
  //      when id is created that we need for the user_id columns in the other two tables
  //      so the first insert MUST complete before we can execute the other 2 queries
  // INSERT IN usersContact user_id, phone1, phone2, email
  // INSEERT INTO usersAddress, user_id address, city, county, state, zip
  // asynchronus: run something until it finishes whenever, and goes on to run other stuff while that first thing may or may not be finished
  // sometimes you need code to run in a certain order, like fetch and promises
  // we call this blocking code sometimes

  //here's the kicker: mysql doesn't have built-in methods to create blocking code out of the box

  // one way we handle this is to create nested callbacks that execute query one at a time
  //this can get complicated. we call this scenario callback hell

  // CALLBACK HELL VERSION

  //FIRST QUERY
  let first = req.body.first_name;
  let last = req.body.last_name;

  let params = [first, last];
  // I could also do this, but sometimes it gets long
  //let params = [req.body.first_name, req.body.last_name]
  let sql = "insert into users (first_name, last_name) values (?, ?)";

  db.query(sql, params, (err, rows) => {
    if(err) {
      console.log("createUser query failed", err);
      res.sendStatus(500)
    } else {
      // if we got the first query executed 
      // postman check
      //res.json(rows)
      
      // SECOND QUERY
      // I need the id of the record of the user we just inserted. For this example, might have to use MAX(id) to get the id
      let getId = rows.insertId;

      let address = req.body.address;
      let city = req.body.city;
      let county = req.body.county;
      let state = req.body.state;
      let zip = req.body.zip;

      params = [getId, address, city, county, state, zip]

      sql = "insert into usersAddress (user_id, address, city, county, state, zip) ";

      sql += "values (?, ?, ?, ?, ?, ?)";

      //nest it 
      db.query(sql, params, (err, rows) => {
        if(err) {
          console.log("insert into usersAddress query failed ", err)
          res.sendStatus(500)
        } else {
          // second query worked
          //postman check
          // res.json(rows)

          //THIRD QUERY usersContact info
          let phone1 = req.body.phone1
          let phone2 = req.body.phone2
          let email = req.body.email

          params = [getId, phone1, phone2, email]

          sql = "insert into usersContact (user_id, phone1, phone2, email) values (?, ?, ?, ?)";
          
          //still inside else of 2nd query
          db.query(sql, params, (err, rows) => {
            if(err) {
              console.log("insert into usersContact failed", err)
              res.sendStatus(500);
            } else {
              //it worked
              res.json(rows) //this is final result
            }
          })
        }
      })
    }
  })
};

//PROMISE VERSION
//my sql doesnt execute code in order is asynchronus
const createUser = async (req, res) => {
  // sync uses promises (async/await)
  let first = req.body.first_name;
  let last = req.body.last_name;

  let params = [first, last];

  let sql = "insert into users (first_name, last_name) values (?, ?)";

  let results;

  //use try/catch block

  try {
    results = await db.querySync(sql, params)
    //postman check
    // res.json(results);
  } catch(err) {
    console.log("insert into users failed ", err);
    res.sendStatus(500);
    return; //if the query didn't work, stop
  }

  // SECOND QUERY
  //only working with results
  let getId = results.insertId;

  let address = req.body.address; //from the previous query
  let city = req.body.city;
  let county = req.body.county;
  let state = req.body.state;
  let zip = req.body.zip;

      params = [getId, address, city, county, state, zip]

      sql = "insert into usersAddress (user_id, address, city, county, state, zip) ";
      sql += "values (?, ?, ?, ?, ?, ?)";

      try {
        results = await db.querySync(sql, params);
        // postman check
        //res.json(results);
      } catch(err) {
        console.log("insert into usersAddress failed ", err);
        res.sendStatus(500)
        return; //stop if there's an error
      }

      // THIRD QUERY
      let phone1 = req.body.phone1
      let phone2 = req.body.phone2
      let email = req.body.email

      params = [getId, phone1, phone2, email]

      sql = "insert into usersContact (user_id, phone1, phone2, email) values (?, ?, ?, ?)";

      try {
        results = await db.querySync(sql, params);
        res.send("User created successfully");
        // postman check
        res.json(results);
      } catch(err) {
        console.log("insert into usersContact failed ", err);
        res.sendStatus(500)
        return; //stop if there's an error
      }
} //end createUser

const updateUserById = (req, res) => {
  // UPDATE USERS AND SET FIRST AND LAST NAME WHERE ID = <REQ PARAMS ID>
  // PUT /users/:id
  /** test case
   * 503 Ashley Brooks
   * 
   * {
   *  "first_name": "Melinda",
   *  "last_name": "Miller"
   * }
   */
  let id = req.params.id;
  let first = req.body.first_name;
  let last = req.body.last_name;

  let params = [first, last, id];  // order matters

  // no comma needed after second ?. comma only needed between rows
  let sql = "update users set first_name = ?, last_name = ? where id = ?"

  if(!id) {
    res.sendStatus(400);
    return; // no matching id, so stop
  }

  db.query(sql, params, (err, rows) => {
    if(err) {
      console.log("update failed ", err)
      res.sendStatus(500)
    } else {
      res.json(rows)
    }
  })
}


const deleteUserByFirstName = (req, res) => {
  // DELETE FROM USERS WHERE FIRST NAME = <REQ PARAMS FIRST_NAME>
  let params = [req.params.first_name];
  let sql = "delete from users where first_name = ?"

  db.query(sql, params, (err, rows) => {
    if(err) {
      console.log("delete failed ", err)
      res.sendStatus(500)
    } else {
      res.json({ message: `Deleted ${rows.affectedRows} users`})
      
    }
  })
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUserById,
  deleteUserByFirstName,
};
