<script>
    import { Button, Modal, Input} from "@sveltestrap/sveltestrap";
    import { addCar, fetchCarId } from './../api/api.js';

    export let getCars;

    let open = false;
    const toggle = () => (open = !open);

    let year = '';
    let make = '';
    let model = '';
    let stocklevel = 0;

    let errors = {
        year: '',
        make: '',
        model: '',
        stocklevel: '',
        duplicate: '',
    };

    const validateInputs = () => {
        let isValid = true;
        const currentYear = new Date().getFullYear();
        // Reset error messages
        errors = { year: '', make: '', model: '', stocklevel: '', duplicate: ''};

        if (!year || isNaN(year) || parseInt(year) < 1886 || parseInt(year) > currentYear) {
            errors.year = `Please enter a valid year (between 1886 and ${currentYear})`;
            isValid = false;
        }
        if (!make) {
            errors.make = 'Please enter a car make';
            isValid = false;
        }
        if (!model) {
            errors.model = 'Please enter a car model';
            isValid = false;
        }
        if ((stocklevel && isNaN(stocklevel)) || parseInt(stocklevel) < 0) {
            errors.stocklevel = 'Stock level must be a number';
            isValid = false;
        }
        return isValid;
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (validateInputs()){
            const userId = sessionStorage.getItem('userId');
            const carId = await fetchCarId(make, model, parseInt(year), userId);
            if (carId == 0) {
                const newCar = {year:parseInt(year), make, model, stocklevel:parseInt(stocklevel)};
                const response = await addCar(newCar, userId);
                getCars();
                year = "";
                make = "";
                model = "";
                stocklevel = "";
                // send data to the api
                open = !open;
            }
            else{
                errors.duplicate = 'Car already exists';
            }
        }
    }
</script>

<div>
    <Button on:click= {toggle} color = "success" size = "lg">Add A New Car</Button>
    <Modal body header="Add A New Car" isOpen={open} {toggle}>
        <div>
            <div class = "input">
                <span>Make:</span>
                <Input type="text" placeholder="Make" bind:value = {make}/>
                {#if errors.make}
                    <span class = "error">{errors.make}</span>
                {/if}
            </div>
            <div class = "input">
                <span>Model:</span>
                <Input type="text" placeholder="Model" bind:value = {model}/>
                {#if errors.model}
                    <span class = "error">{errors.model}</span>
                {/if}
            </div>
            <div class = "input">
                <span>Year:</span>
                <Input type="text" placeholder="Year" bind:value = {year}/>
                {#if errors.year}
                    <span class = "error">{errors.year}</span>
                {/if}
            </div>
            <div class = "input">
                <span>Stock Number:</span>
                <Input type="text" placeholder="stock (optional field)" bind:value = {stocklevel}/>
                {#if errors.stocklevel}
                    <span class = "error">{errors.stocklevel}</span>
                {/if}
            </div>
            {#if errors.duplicate}
                <p class = "error">{errors.duplicate}</p>
            {/if}
            <Button on:click = {handleSubmit} color="primary">Submit</Button>
        </div>
    </Modal>
</div>

<style>
    .input{
        padding-bottom: 10px;
    }
    .error{
        color:red;
    }
</style>
