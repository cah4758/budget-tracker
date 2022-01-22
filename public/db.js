let db;
let budgetVersion;

// New request for "budget" DB
const request = indexedDB.open("BudgetDB", budgetVersion || 21);

request.onupgradeneeded = function (e) {
  // Showing updated db version, if needed
  const { oldVersion } = e;
  const newVersion = e.newVersion || db.version;
  console.log(`DB updated from ${oldVersion} to ${newVersion}`);

  db = e.target.result;

  if (db.objectStoreNames.length === 0) {
    db.createObjectStore("BudgetStore", { autoIncrement: true });
  }
};

request.onerror = function (e) {
  console.log(`ERROR! ${e.target.errorCode}`);
};

function checkDatabase() {
  console.log("checkDatabase() started up");

  // Open transaction in BudgetStore
  let transaction = db.transaction(["BudgetStore"], "readwrite");

  // Accessing BudgetStore object
  const store = transaction.objectStore("BudgetStore");

  // Getting all store records into a variable
  const getAll = store.getAll();

  getAll.onsuccess = function () {
    // IF items are in store, bulk add will happen once back online
    if (getAll.result.length > 0) {
      fetch("/api/transaction/bulk", {
        method: "POST",
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json",
        },
      })
        .then((response) => response.json())
        .then((res) => {
          if (res.length !== 0) {
            // Open another transaction with read/write ability
            transaction = db.transaction(["BudgetStore"], "readwrite");

            // Set current store to variable for cleaning
            const currentStore = transaction.objectStore("BudgetStore");

            // Clear out store because bulk add workedd
            currentStore.clear();
            console.log("Cleaning out the store!");
          }
        });
    }
  };
}

request.onsuccess = function (e) {
  console.log("success!");
  db = e.target.result;

  // Check if app is online before reading db
  if (navigator.onLine) {
    console.log("Backend is now online!");
    checkDatabase();
  }
};

const saveRecord = (record) => {
  console.log("saveRecord() started up");

  const transaction = db.transaction(["BudgetStore"], "readwrite");

  const store = transaction.objectStore("BudgetStore");

  store.add(record);
};

window.addEventListener("online", checkDatabase);
