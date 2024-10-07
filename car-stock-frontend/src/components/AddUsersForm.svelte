<script>
    import { Button, Modal, Input} from "@sveltestrap/sveltestrap";
    import { addCar } from './../api/api.js';

    let open = false;
    const toggle = () => (open = !open);

    let year = '';
    let make = '';
    let model = '';
    let stocklevel = 0;

    const handleSubmit = async (event) => {
        event.preventDefault();
        const newCar = {year:parseInt(year), make, model, stocklevel:parseInt(stocklevel)};
        const response = await addCar(newCar);
        year = "";
        make = "";
        model = "";
        stocklevel = "";
        // send data to the api
        open = false;
    }
</script>

<div>
    <Button on:click= {toggle} color = "secondary" >Add A New Car</Button>
    <Modal body header="Add A New Car" isOpen={open} {toggle}>
        <div>
            <div class = "make">
                <span>Make:</span>
                <Input type="email" placeholder="make" bind:value = {make}/>
            </div>
            <div class = "make">
                <span>Model:</span>
                <Input type="email" placeholder="model" bind:value = {model}/>
            </div>
            <div class = "make">
                <span>Year:</span>
                <Input type="email" placeholder="year" bind:value = {year}/>
            </div>
            <div class = "make">
                <span>Stock Number:</span>
                <Input type="email" placeholder="stock (optional field)" bind:value = {stocklevel}/>
            </div>
            <Button on:click = {handleSubmit} color="primary">Submit</Button>
        </div>
    </Modal>
</div>


<style>
    .make{
        display:flex;
        flex-direction: row;
        justify-content:center;
        align-items:center;
        gap:10px;
    }
</style>
