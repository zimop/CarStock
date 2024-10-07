import axios from 'axios';

const API_URL = "http://localhost:5269/api/Cars";

export const fetchCars = async () => {
    const response = await axios.get(API_URL);
    console.log(response);
    return response.data;
}

export const addCar = async (car) => {
    const response = await axios.post(API_URL, car);
    return response.data;
}

export const fetchCarId = async (make, model, year) => {
    const response = await axios.get(`${API_URL}/search`, {
        params:{
            make,
            model,
            year
        }
    });
    console.log(response.data)
    return response.data;
}

export const deleteCar = async (id) => {
    const response = await axios.delete(`${API_URL}/${id}`);
    return response.data;
}