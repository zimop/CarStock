<script>

    import { Table, Button } from '@sveltestrap/sveltestrap';
    import DeleteAction from './DeleteAction.svelte';
    import EditAction from './EditAction.svelte';

    export let cars = [];
    export let getCars;

</script>

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
                <EditAction make = {car.make} model = {car.model} year = {parseInt(car.year, 10)} stocklevel = {car.stockLevel} getCars = {getCars}></EditAction>
                <DeleteAction make = {car.make} model = {car.model} year = {parseInt(car.year, 10)} getCars = {getCars}/>
            </td>
        </tr>
        {/each}
        </tbody>
    </Table>
</div>
<style>
    @import 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css';

</style>