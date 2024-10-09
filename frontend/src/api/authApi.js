import axios from 'axios';
import {jwtDecode} from 'jwt-decode';

const API_URL = "http://localhost:5269/api/Auth/login";

export const login = async (username, password) => {
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
}