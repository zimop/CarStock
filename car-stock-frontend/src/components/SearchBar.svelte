<script>
    import { InputGroup, InputGroupText, Input, Button, Table } from '@sveltestrap/sveltestrap';
    import { searchCars } from './../api/api.js';
    import EditAction from './EditAction.svelte';
    import DeleteAction from './DeleteAction.svelte';
    let make = ""
    let model = ""
    let cars = []

    const handleSubmit = async (event) => {
        cars = []
        event.preventDefault();
        const response = await searchCars(make, model);
        make = "";
        model = "";
        // send data to the api
        open = false;
        console.log(response);
    }
</script>

<div>
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
<div>
    <Table bordered>
        <thead>
          <tr>
            <th>Make</th>
            <th>Model</th>
            <th>Year</th>
            <th>Stock Level</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {#each cars as car}
          <tr>
            <td>{car.make}</td>
            <td>{car.model}</td>
            <td>{car.year}</td>
            <td>{car.stockLevel}</td>
            <td>
                <EditAction make = {car.make} model = {car.model} year = {parseInt(car.year, 10)} stocklevel = {car.stockLevel}></EditAction>
                <DeleteAction make = {car.make} model = {car.model} year = {parseInt(car.year, 10)}/>
            </td>
          </tr>
          {/each}
        </tbody>
      </Table>
</div>
