using CarStockApi.Models;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Numerics;
using System.Reflection.Metadata.Ecma335;
using System.Threading.Tasks;

namespace CarStockApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CarsController : ControllerBase {
        private readonly CarRepository _carRepository;

        public CarsController(CarRepository carRepository) {
            
            _carRepository = carRepository;
        }

        [HttpGet]
        public async Task<ActionResult <IEnumerable<Car>>> GetCars([FromQuery] string userId)
        {
            try{
                int id= int.Parse(userId);
                var cars = await _carRepository.GetAllCarsAsync(id);

                if (cars == null || !cars.Any())
                {
                    return NotFound("No Cars found");
                }

                return Ok(cars);
            }
            catch (Exception ex){
                return StatusCode(500, $"Internal server error (get): {ex.Message}");
            }
        }

        [HttpGet("searchById")]
        public async Task<ActionResult <int>> GetCarId([FromQuery] string make, [FromQuery] string model, [FromQuery] int year, [FromQuery] string userId)
        {
            try{
                int userID= int.Parse(userId);
                int id = await _carRepository.SearchByCar(make, model, year, userID);
                return Ok(id);
            }
            catch (Exception ex){
                return StatusCode(500, $"Internal server error (get): {ex.Message}");
            }
        } 

        [HttpPost]
        public async Task<ActionResult> InsertCar([FromBody] CarRequest request)
        {
            try{
                int id= int.Parse(request.UserId);
                Car car = request.Car;
                await _carRepository.AddCarAsync(car, id);
                return CreatedAtAction(nameof(GetCars), car);
            }
            catch (Exception ex) {
                return StatusCode(500, $"Internal server error (insert): {ex.Message}");
            }
        }

        [HttpDelete("{id}")]

        public async Task<ActionResult> DeleteCar(int id)
        {
            try{
                await _carRepository.RemoveCarAsync(id);
                return NoContent();
            }
            catch (Exception ex) {
                return StatusCode(500, $"Internal server error (delete): {ex.Message}");
            }
        }

        [HttpPut("{id}")]
        public async Task<ActionResult> UpdateCar(int id, [FromBody] int stockLevel)
        {
            try{
                var response = await _carRepository.UpdateCarAsync(id, stockLevel);
                
                if (response == 0)
                {
                    return NotFound($"Car with id {id} not found");
                }
                
                return Ok(response);
            }
            catch (Exception ex) {
                return StatusCode(500, $"Internal server error (update): {ex.Message}");
            }
        }

        [HttpGet("search")]
        public async Task<ActionResult <IEnumerable<Car>>> Search([FromQuery] string make = "", [FromQuery] string model = "", [FromQuery] string userId = "")
        {
            try{
                Console.WriteLine("Hello, world!");
                int id= int.Parse(userId);
                var cars = await _carRepository.Search(make, model, id);
                Console.WriteLine("im back baby");
                foreach (var car in cars)
                {
                    // Assuming Car has properties: Id, Make, Model, and Year
                    Console.WriteLine($"ID: {car.Id}, Make: {car.Make}, Model: {car.Model}, Year: {car.Year}");
                }

                return Ok(cars);
            }
            catch (Exception ex){
                return StatusCode(500, $"Internal server error (get): {ex.Message}");
            }
        } 
    }
    public class CarRequest
{
    public Car Car { get; set; }
    public string UserId { get; set; }
}
}
