<script>
    import { Button } from "@sveltestrap/sveltestrap";
    import {deleteCar} from './../api/api.js';
    import {fetchCarId} from './../api/api.js';

    export let make;
    export let model;
    export let year;

    export let getCars;

    const handleDelete = async (event) => {
        event.preventDefault();
        const userId = sessionStorage.getItem('userId');
        const carId = await fetchCarId(make, model, parseInt(year), userId);
        console.log(carId);
        const response = await deleteCar(carId);
        getCars();
        console.log(response);
        // send data to the api
    }
</script>

<Button color="danger" on:click= {handleDelete} size = "lg">Delete</Button>
