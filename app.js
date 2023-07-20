const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const app = express();
const isValid = require("date-fns/isValid");
const format = require("date-fns/format");

const dbPath = path.join(__dirname, "todoApplication.db");
app.use(express.json());

let db = null;
const initializeDBANDServer = async () => {
  try {
    db = await open({ filename: dbPath, driver: sqlite3.Database });
    app.listen(3000, () => {
      console.log("Server is Running");
    });
  } catch (e) {
    console.log(`DB Error:${e.message}`);
    process.exit(-1);
  }
};
initializeDBANDServer();

//snakeToCame conversion
const snakeToCamel = (each) => {
  return {
    id: each.id,
    todo: each.todo,
    priority: each.priority,
    status: each.status,
    category: each.category,
    dueDate: each.due_date,
  };
};

//checkDate
const checkDate = (dateObject) => {
  return isValid(dateObject);
};

//dateFormatting
const formattingDate = (newDate) => {
  return format(
    new Date(newDate.getFullYear(), newDate.getMonth(), newDate.getDate()),
    "yyyy-MM-dd"
  );
};

//Invalid Response of Status
const checkStatus = (statusObject) => {
  let result = false;
  if (
    statusObject === "TO DO" ||
    statusObject === "IN PROGRESS" ||
    statusObject === "DONE"
  ) {
    result = true;
  }
  return result;
};

//Invalid Response of Priority
const checkPriority = (priorityObject) => {
  let result = false;
  if (
    priorityObject === "HIGH" ||
    priorityObject === "MEDIUM" ||
    priorityObject === "LOW"
  ) {
    result = true;
  }
  return result;
};

//Invalid Response of Category
const checkCategory = (categoryObject) => {
  let result = false;
  if (
    categoryObject === "WORK" ||
    categoryObject === "HOME" ||
    categoryObject === "LEARNING"
  ) {
    result = true;
  }
  return result;
};

//get todo based on query parameters
app.get("/todos/", async (request, response) => {
  const { category, status, priority, search_q } = request.query;
  if (
    status !== undefined &&
    priority === undefined &&
    category === undefined
  ) {
    if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
      const statusQuery = `SELECT * FROM todo WHERE status = '${status}';`;
      const statusResult = await db.all(statusQuery);
      const finalResult = statusResult.map((each) => {
        return snakeToCamel(each);
      });
      response.send(finalResult);
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
    }
  } else if (
    status === undefined &&
    priority !== undefined &&
    category === undefined
  ) {
    if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
      const priorityQuery = `SELECT * FROM todo WHERE priority = '${priority}';`;
      const priorityResult = await db.all(priorityQuery);
      const finalResult = priorityResult.map((each) => {
        return snakeToCamel(each);
      });
      response.send(finalResult);
    } else {
      response.status(400);
      response.send(`Invalid Todo Priority`);
    }
  } else if (status === "IN PROGRESS" && priority === "HIGH") {
    const query = `SELECT * FROM todo WHERE priority = '${priority}' AND status = '${status}';`;
    const result = await db.all(query);
    if (result.length === 0) {
      response.status(400);
      response.send(`Invalid Query
      `);
    } else {
      const finalResult = result.map((each) => {
        return snakeToCamel(each);
      });
      response.send(finalResult);
    }
  } else if (search_q === "Buy") {
    const query = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%';`;
    const result = await db.all(query);
    const finalResult = result.map((each) => {
      return snakeToCamel(each);
    });
    response.send(finalResult);
  } else if (category === "WORK" && status === "DONE") {
    const query = `SELECT * FROM todo WHERE category = '${category}' AND status = '${status}';`;
    const result = await db.all(query);
    const finalResult = result.map((each) => {
      return snakeToCamel(each);
    });
    response.send(finalResult);
  } else if (
    status === undefined &&
    priority === undefined &&
    category !== undefined
  ) {
    if (category === "WORK" || category === "HOME" || category === "LEARNING") {
      const categoryQuery = `SELECT * FROM todo WHERE category = '${category}';`;
      const categoryResult = await db.all(categoryQuery);
      const finalResult = categoryResult.map((each) => {
        return snakeToCamel(each);
      });
      response.send(finalResult);
    } else {
      response.status(400);
      response.send(`Invalid Todo Category`);
    }
  } else if (category === "LEARNING" && priority === "HIGH") {
    const query = `SELECT * FROM todo WHERE category = '${category}' AND priority = '${priority}';`;
    const result = await db.all(query);
    const finalResult = result.map((each) => {
      return snakeToCamel(each);
    });
    response.send(finalResult);
  }
});

//Returns a specific todo based on the todo ID
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `SELECT * FROM todo WHERE id = ${todoId};`;
  const getTodo = await db.get(getTodoQuery);
  response.send(snakeToCamel(getTodo));
});

//Returns a list of all todos with a specific due date in the query parameter /agenda/?date=2021-12-12
app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  const newDate = new Date(date);
  const condition = checkDate(newDate);
  if (condition === true) {
    const formatDate = formattingDate(newDate);
    const getDateQuery = `SELECT * FROM todo WHERE due_date = '${formatDate}';`;
    const getDate = await db.all(getDateQuery);
    const finalResult = getDate.map((each) => {
      return snakeToCamel(each);
    });
    response.send(finalResult);
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
});

//Create a todo in the todo table
app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  const statusCondition = checkStatus(status);
  const priorityCondition = checkPriority(priority);
  const categoryCondition = checkCategory(category);
  const newDate = new Date(dueDate);
  const dueDateCondition = checkDate(newDate);
  if (statusCondition === false) {
    response.status(400);
    response.send("Invalid Todo Status");
  }
  if (priorityCondition === false) {
    response.status(400);
    response.send("Invalid Todo Priority");
  }
  if (categoryCondition === false) {
    response.status(400);
    response.send("Invalid Todo Category");
  }
  if (dueDateCondition === false) {
    response.status(400);
    response.send("Invalid Due Date");
  }
  if (
    statusCondition === true &&
    priorityCondition === true &&
    categoryCondition === true &&
    dueDateCondition === true
  ) {
    const formatDate = formattingDate(newDate);
    const createTodoQuery = `INSERT INTO todo(id,todo,priority,status,category,due_date)
        VALUES (${id},'${todo}','${priority}','${status}','${category}','${formatDate}');`;
    await db.run(createTodoQuery);
    response.send("Todo Successfully Added");
  }
});

//Updates the details of a specific todo based on the todo ID

app.put("/todos/:todoId/", async (request, response) => {
  const {
    todo = "",
    priority = "",
    status = "",
    category = "",
    dueDate = "",
  } = request.body;
  const { todoId } = request.params;
  if (todo !== "") {
    const todoUpdate = `UPDATE todo SET todo = '${todo}' WHERE id = ${todoId};`;
    await db.run(todoUpdate);
    response.send("Todo Updated");
  } else if (priority !== "") {
    if (checkPriority(priority) === true) {
      const priorityUpdate = `UPDATE todo SET priority = '${priority}' WHERE id = ${todoId};`;
      await db.run(priorityUpdate);
      response.send("Priority Updated");
    } else {
      response.status(400);
      response.send("Invalid Todo Priority");
    }
  } else if (status !== "") {
    if (checkStatus(status) === true) {
      const statusUpdate = `UPDATE todo SET status = '${status}' WHERE id = ${todoId};`;
      await db.run(statusUpdate);
      response.send("Status Updated");
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
    }
  } else if (category !== "") {
    if (checkCategory(category) === true) {
      const categoryUpdate = `UPDATE todo SET category = '${category}' WHERE id = ${todoId};`;
      await db.run(categoryUpdate);
      response.send("Category Updated");
    } else {
      response.status(400);
      response.send("Invalid Todo Category");
    }
  } else if (dueDate !== "") {
    const date = new Date(dueDate);
    if (checkDate(date) === true) {
      const formatDate = formattingDate(date);
      const dueDateUpdate = `UPDATE todo SET due_date = '${formatDate}' WHERE id = ${todoId};`;
      await db.run(dueDateUpdate);
      response.send("Due Date Updated");
    } else {
      response.status(400);
      response.send("Invalid Due Date");
    }
  }
});

//Deletes a todo from the todo table based on the todo ID
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteQuery = `DELETE FROM todo WHERE id = ${todoId};`;
  await db.run(deleteQuery);
  response.send("Todo Deleted");
});

module.exports = app;
