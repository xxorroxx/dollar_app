const axios = require('axios');
const {Client} = require('pg');

const timeExecution = 60000;

const client = new Client({
	user: process.env.PGUSER,
	host: process.env.PGHOST,
	database: process.env.PGDATABASE,
	password: process.env.PGPASSWORD,
	port: process.env.PGPORT,
  });

client.connect();

const createTableQuery = `
    CREATE TABLE IF NOT EXISTS quotation
    (
        id
        SERIAL
        PRIMARY
        KEY,
        purchase_value
        NUMERIC,
        sale_value
        NUMERIC,
        date
        TIMESTAMP
        DEFAULT
        CURRENT_TIMESTAMP
    );
`;

client.query(createTableQuery)
	.then(() => {
		console.log('Created or existing table.');
	})
	.catch((error) => {
		console.error('Error creating table:', error.message);
		client.end();
		process.exit(1);
	});

const urlProveedor = 'https://ticker.transfero.com/quote/ars/4bb43';

const fetchAndStoreQuote = async () => {
	try {
		const response = await axios.get(urlProveedor);

		const purchaseValue = response.data.buy;
		const saleValue = response.data.sell;

		if (!purchaseValue || !saleValue) {
			throw Error('Invalid data received from the provider.');
		}

		await client.query('INSERT INTO quotation (purchase_value, sale_value) VALUES ($1, $2)', [purchaseValue, saleValue]);

		console.log(`Stored Quote: BUY: ${purchaseValue} and SALE: ${saleValue}`);
	} catch (error) {

		let message = 'Error getting quote:';

		if (error.response.status === 404) {
			message = 'You should send the correct parameters';
		} else if (error.response.status === 500){
			message = 'Server conection host failed';
		}
		
		console.error(message, error.message);
	}
};

fetchAndStoreQuote();

setInterval(fetchAndStoreQuote, timeExecution);