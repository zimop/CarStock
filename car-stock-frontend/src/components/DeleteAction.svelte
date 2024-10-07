<script>
    import { Button } from "@sveltestrap/sveltestrap";
    import {deleteCar} from './../api/api.js';
    import {fetchCarId} from './../api/api.js';

    export let make;
    export let model;
    export let year;

    const handleDelete = async (event) => {
        event.preventDefault();
        const carId = await fetchCarId(make, model, parseInt(year));
        console.log(carId);
        const response = await deleteCar(carId);
        console.log(response);
        // send data to the api
    }
</script>

<Button color="danger" on:click= {handleDelete}>Delete</Button>
