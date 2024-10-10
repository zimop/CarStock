import axios from 'axios';
import {jwtDecode} from 'jwt-decode';

const API_URL = "http://localhost:5269/api/Auth/login";

export const login = async (username, password) => {
    try{

    
    const response = await axios.post(API_URL, {
        username,
        password
    });

    const token = response.data.token;

    const decodedToken = jwtDecode(token);

    //console.log(decodedToken);

    sessionStorage.setItem('token', token);
    sessionStorage.setItem('username', decodedToken.unique_name);
    sessionStorage.setItem('userId', decodedToken.sub);

    return { token, username: decodedToken.unique_name, userId: decodedToken.sub };

    } catch(error){
        if (error.response && error.response.status === 401) {
            // Handle unauthorized error (status 401)
            console.error("Unauthorized: Invalid credentials");
            return { error: "Invalid credentials" }; // You can return an error message here
        } else {
            // Handle other errors (network errors, server errors, etc.)
            console.error("An error occurred:", error);
            return { error: "An error occurred. Please try again later." };
        }
     }
}