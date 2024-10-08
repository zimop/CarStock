<script>
	import { max } from './../../node_modules/@popperjs/core/dist/esm/utils/math.js';
    import { InputGroup, InputGroupText, Input, Button, Table } from '@sveltestrap/sveltestrap';
    import { searchCars } from './../api/api.js';
    import { fetchCars } from '../api/api'
    import { onMount } from 'svelte';
    import AddUsersForm from './AddUsersForm.svelte';
  import CarsList from './CarsList.svelte';

    let make = ""
    let model = ""
    let cars = []

    const handleSubmit = async () => {
        //event.preventDefault();
        const result = await searchCars(make, model);
        cars = result;
        make = "";
        model = "";
        // send data to the api
        open = false;
        console.log(cars);
    }

    const getCars = async () => {
        cars = await fetchCars();
        console.log(cars); // Log the fetched data
    };

    onMount(async () => {
        getCars();
        // Optionally fetch all cars on mount
        //cars = await fetchCars(); // Fetch all cars initially
        //console.log(cars); // Log initial data
    });

</script>
<div class = "wide">
    <div class = "header">
        <div class = "add">
            <AddUsersForm getCars={getCars}/>
        </div>
        <div class = "search-bar">
            <h2>Search:</h2>
            <InputGroup>
                <InputGroupText>
                    Make
                </InputGroupText>
                <Input placeholder="Enter a car make" min={0} max={100} type="text" step="1" bind:value = {make}/>
            </InputGroup>
            <InputGroup>
                <InputGroupText>
                    Model
                </InputGroupText>
                <Input placeholder="Enter a car model" min={0} max={100} type="text" step="1" bind:value = {model}/>
            </InputGroup>
            <Button color = "primary" on:click = {handleSubmit}>
                Submit
            </Button>
        </div>
    </div>
    <div>
        <CarsList cars = {cars} getCars = {getCars}/>
    </div>
</div>

<style>
    .header{
        display:flex;
        flex-direction: row;
        justify-content: space-between;
        padding-top:50px;
        padding-bottom: 20px;
    }
    .search-bar{
        padding-right: 40px;
        display:flex;
        flex-direction: row;
        gap:20px;
    }
    @media (max-width: 1060px) { /* Adjust the max-width as needed */
        .header{
            /* Smaller font size */
        }
        .search-bar{
            flex-direction: column;
        }
    }
    .add{
        display: flex;
        flex-direction: column;
        justify-content: flex-end;
    }
    

    .wide{
        max-width:2000px;
    }
</style>