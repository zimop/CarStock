<script>
	import {deleteCar} from './../api/api.js';
    import {fetchCarId} from './../api/api.js';
    let year = 0;
    let make = '';
    let model = '';

    const handleDelete = async (event) => {
        event.preventDefault();
        const carId = await fetchCarId(make, model, year);
        console.log(carId);
        const response = await deleteCar(carId);
        console.log(response);
        year = "";
        make = "";
        model = "";
        // send data to the api
    }
</script>

<h1>Delete a Car</h1>
<form on:submit = {handleDelete}>
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
    <button type="submit">Submit</button>
</form>