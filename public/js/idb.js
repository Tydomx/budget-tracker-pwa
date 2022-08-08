// create variable to hold db connection
let db;

// establish connection to IndexedDB database called 'budget_tracker' and set it to version 1
const request = indexedDB.open('budget_tracker', 1);

// this event will emit if database version changes (nonexistant to version 1, v1 to v2, etc.)
request.onupgradeneeded = function (event) {
	// save a reference to the database
	const db = event.target.result;
	// create an object store (table) called `new_budget`, set it to have an auto incrementing primary key of sorts
	db.createObjectStore('new_budget', { autoIncrement: true });
};

// upon a successful request
request.onsuccess = function (event) {
	// when db is successfully created with its object store(from onupgradedneeded event above) or simply established a connection, save reference to db in global variable
	db = event.target.result;

	// check if app is online, if yes run uploadTransaction() function to send all local db data to api
	if (navigator.onLine) {
		// checks to see if we're online everytime this app opens and uploads any remnant data
		// just in case we left app with items still in local indexedDB database
		uploadTransaction();
	}
};

request.onerror = function (event) {
	// log error here
	console.log(event.target.errorCode);
};

// this function will be executed if we attempt to submit new data and there's no internet connection
// will be used in api.js file's form submission function if fetch() function's catch() method is executed
function saveRecord(record) {
	// open new transaction with db with read and write permissions
	const transaction = db.transaction(['new_budget'], 'readwrite');

	// access the object store from 'new_budget'
	const transactionObjectStore = transaction.objectStore('new_budget');

	// add record to your store with add method
	transactionObjectStore.add(record);
};

function uploadTransaction() {
	// open transaction on db
	const transaction = db.transaction(['new_budget'], 'readwrite');

	// access object store
	const transactionObjectStore = transaction.objectStore('new_budget');

	// get all records from store and set to a variable
	const getAll = transactionObjectStore.getAll();

	// more to come...
	// upon a successful .getAll() execution, run this function
	getAll.onsuccess = function () {
		// if there was data in indexedDb's store, let's send it to the api server
		if (getAll.result.length > 0) {
			fetch('/api/transaction', {
				method: 'POST',
				body: JSON.stringify(getAll.result),
				headers: {
					Accept: 'application/json, text/plain, */*',
					'Content-Type': 'application/json'
				}
			})
				.then(response => response.json())
				.then(serverResponse => {
					if (serverResponse.message) {
						throw new Error(serverResponse);
					}
					// open one more transaction
					const transaction = db.transaction(['new_budget'], 'readwrite');
					// access the new_pizza object store
					const transactionObjectStore = transaction.objectStore('new_budget');
					// clear all items in your store
					transactionObjectStore.clear();

					alert('All saved transactions has been submitted into the system!');
				})
				.catch(err => {
					console.log(err);
				});
		}
	}
};

// listen for app coming back online
// listen for internet connection using online event, if online execute uploadTransaction()
window.addEventListener('online', uploadTransaction);