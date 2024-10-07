<script>
	import { onMount } from 'svelte';
    import { fetchCars } from '../api/api'
    import { Table, Button } from '@sveltestrap/sveltestrap';
    import DeleteAction from './DeleteAction.svelte';
    
    let cars = []
    onMount(async () => {
        cars = await fetchCars();
        console.log(cars)
        console.log("i am zimo")
    });

</script>

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
            <Button color="primary">Edit</Button>
            <DeleteAction make = {car.make} model = {car.model} year = {parseInt(car.year, 10)}/>
        </td>
      </tr>
      {/each}
    </tbody>
  </Table>

<style>
    @import 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css';
</style>