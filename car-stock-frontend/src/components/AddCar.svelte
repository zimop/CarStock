<script>
	import { addCar } from './../api/api.js';
    let year = 0;
    let make = '';
    let model = '';
    let stocklevel = 0;

    const handleSubmit = async (event) => {
        event.preventDefault();
        const newCar = {year, make, model, stocklevel:parseInt(stocklevel)};
        const response = await addCar(newCar);
        year = "";
        make = "";
        model = "";
        stocklevel = "";
        // send data to the api
    }
</script>

<form on:submit = {handleSubmit}>
    <div>
        <label for = "year">Year:</label>
        <input type="number" id="year" name ="year" bind:value = {year}/>
    </div>
    <div>
        <label for = "make">Make:</label>
        <input type="text" id="make" name ="make" bind:value = {make}/>
    </div>
    <div>
        <label for = "model">Model:</label>
        <input type="text" id="model" name ="model" bind:value = {model}/>
    </div>
    <div>
        <label for = "stocklevel">Stock Level:</label>
        <input type="number" id="stocklevel" name ="stocklevel" bind:value = {stocklevel}/>
    </div>
    <button type="submit">Submit</button>
</form>