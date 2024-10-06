<script>
	import { onMount } from 'svelte';
    import { fetchCars } from '../api/api'
    let cars = []
    onMount(async () => {
        cars = await fetchCars();
        console.log(cars)
        console.log("i am zimo")
    });
</script>


<h1>Cars List</h1>
<ul>
    {#each cars as car}
        <li>Car Make: {car.make}</li>
        <li>Car Model: {car.model}</li>
        <li>Car Year: {car.year}</li>
        <li>Stock Level: {car.stockLevel}</li>
    {/each}
</ul>